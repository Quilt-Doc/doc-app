const _ = require("lodash");

const Sentry = require("@sentry/node");

const logger = require("../../../logging/index").logger;
const jobs = require("../../../apis/jobs");
const jobConstants = require("../../../constants/index").jobs;

// models
const IntegrationTicket = require("../../../models/integrations/integration_objects/IntegrationTicket");
const IntegrationColumn = require("../../../models/integrations/integration_objects/IntegrationColumn");
const IntegrationBoard = require("../../../models/integrations/integration_objects/IntegrationBoard");
const IntegrationAttachment = require("../../../models/integrations/integration_objects/IntegrationAttachment");
const IntegrationLabel = require("../../../models/integrations/integration_objects/IntegrationLabel");
const IntegrationInterval = require("../../../models/integrations/integration_objects/IntegrationInterval");
const Workspace = require("../../../models/Workspace");

// helper methods
const {
    acquireTrelloConnectProfile,
    acquireExternalTrelloBoards,
    acquireTrelloData,
    extractTrelloMembers,
    extractTrelloBoard,
    extractTrelloLists,
    extractTrelloDirectAttachments,
    extractTrelloLabels,
    modifyTrelloActions,
    extractTrelloIntervals,
} = require("./TrelloControllerHelpers");

const {
    beginTrelloConnect,
    handleTrelloConnectCallback,
} = require("./TrelloAuthorizationController");

handleReintegration = async (boards) => {
    // get the source Ids of the boards
    const boardSourceIds = boards.map((board) => board.sourceId);

    // create a boards object mapping keys
    const boardsObj = _.mapKeys(boards, "sourceId");

    // query for all integration boards that already exist and have a
    // sourceId equal to one of the boards requested for integration
    let query = IntegrationBoard.find();

    query.where("sourceId").in(boardSourceIds);

    let reintegratedBoards = await query.lean().exec();

    // map through existing boards and replace repositories with those
    // that need to be integrated
    reintegratedBoards.map((board) => {
        const { sourceId, repositories } = board;

        // get already integrated repos
        const integratedRepos = new Set(
            repositories.map((repoId) => repoId.toString())
        );

        // replace repositories field with requested repositories that don't include already integrated repos
        board.repositories = boardsObj[sourceId].repositoryIds.map(
            (repoId) => !integratedRepos.has(repoId)
        );
    });

    let integratedSourceIds = new Set(
        reintegratedBoards.map((board) => board.sourceId)
    );

    // new boards only
    boards = boards.filter((board) => !integratedSourceIds.has(board.sourceId));

    return { boards, reintegratedBoards };
};

removeIntegration = async (req, res) => {
    const { boardId, workspaceId } = req.params;

    // remove board from workspace's boards
    let workspace;

    try {
        workspace = await Workspace.findById(workspaceId).exec();
    } catch (e) {
        Sentry.captureException(e);

        return res.json({ success: false, error: e });
    }

    workspace.boards = workspace.boards.filter((id) => id != boardId);

    try {
        await workspace.save();
    } catch (e) {
        Sentry.captureException(e);

        return res.json({ success: false, error: e });
    }

    // if board doesn't exist else where..
    let shouldDelete;

    try {
        shouldDelete = !(await Workspace.exists({
            boards: { $in: [boardId] },
        }));
    } catch (e) {
        Sentry.captureException(e);

        return res.json({ success: false, error: e });
    }

    // delete all integrations associated with board and finally board
    if (shouldDelete) {
        const nonBoardsModels = [
            IntegrationAttachment,
            IntegrationColumn,
            IntegrationInterval,
            IntegrationLabel,
            IntegrationTicket,
            Association,
        ];

        const requests = nonBoardsModels.map((model) => {
            model.deleteMany({ board: boardId });
        });

        requests.push(IntegrationBoard.findOneAndDelete({ _id: boardId }));

        try {
            await Promise.all(requests);
        } catch (e) {
            Sentry.captureException(e);

            return res.json({ success: false, error: e });
        }
    }
};

triggerTrelloScrape = async (req, res) => {
    const { userId, workspaceId } = req.params;

    // boards is [{ sourceId, repositoryIds }]
    let { boards } = req.body;

    let profile;

    try {
        profile = await acquireTrelloConnectProfile(userId);
    } catch (e) {
        Sentry.captureException(e);

        return res.json({ success: false, error: e });
    }

    let reintegratedBoards;

    try {
        const output = await handleReintegration(boards);

        boards = output.boards;

        reintegratedBoards = output.reintegratedBoards;
    } catch (e) {
        Sentry.captureException(e);

        return res.json({ success: false, error: e });
    }

    let result;

    try {
        result = await bulkScrapeTrello(profile, boards, workspaceId);
    } catch (e) {
        Sentry.captureException(e);

        return res.json({ success: false, error: e });
    }

    result = result.map((board) => _.omit(board, ["tickets"]));

    // need to finally mutate workspace to add boards
    let workspace;

    try {
        workspace = Workspace.findById(workspaceId).select("boards").exec();
    } catch (e) {
        Sentry.captureException(e);

        return res.json({ success: false, error: e });
    }

    boardIds = result.map((board) => board._id);

    reintegratedBoardIds = reintegratedBoards.map((board) => board._id);

    workspace.boards = [
        ...workspace.boards,
        ...boardIds,
        ...reintegratedBoardIds,
    ];

    try {
        workspace = workspace.save();
    } catch (e) {
        Sentry.captureException(e);
    }

    return res.json({
        success: true,
        result: { workspace, boards: [...result, ...reintegratedBoards] },
    });
};

bulkScrapeTrello = async (profile, boards, workspaceId) => {
    const { accessToken } = profile;

    const result = [];

    for (let i = 0; i < boards.length; i++) {
        const { sourceId: boardSourceId, repositoryIds } = boards[i];

        const boardData = await acquireTrelloData(boardSourceId, accessToken);

        let {
            actions,
            cards,
            lists,
            members,
            labels,
            name,
            idMemberCreator: boardCreatorSourceId,
            url,
        } = boardData;

        //create IntegrationUsers for members
        members = await extractTrelloMembers(workspaceId, members, profile);

        // create IntegrationBoard
        let board = await extractTrelloBoard(
            members,
            boardSourceId,
            name,
            boardCreatorSourceId,
            url,
            repositoryIds
        );

        lists = await extractTrelloLists(lists, board);

        const attachmentResponse = await extractTrelloDirectAttachments(
            cards,
            repositoryIds,
            board
        );

        cards = attachmentResponse.cards;

        cards = _.mapKeys(cards, "id");

        cards = await modifyTrelloActions(actions, cards);

        const intervalResponse = await extractTrelloIntervals(cards, board);

        cards = intervalResponse.cards;

        labels = await extractTrelloLabels(labels, board);

        let insertOps = [];

        Object.values(cards).map(async (card) => {
            let {
                id,
                idList,
                dateLastActivity,
                desc,
                name,
                attachmentIds,
                intervalIds,
                due,
                dueComplete,
                idMembers,
                url,
            } = card;

            const columnId = lists[idList]._id;

            const assigneeIds = idMembers.map(
                (memberId) => members[memberId]._id
            );

            const labelIds = card.labels
                ? card.labels.map(
                      (label) => labels[`${label.name}-${label.color}`]._id
                  )
                : [];

            let cardParams = {
                name,
                source: "trello",
                sourceId: id,
                description: desc,
                link: url,
                assignees: assigneeIds, // trelloCardMember, // trelloCardListUpdateDates: [{type: Date}],
                members: assigneeIds,
                column: columnId,
                board: board._id,
            };

            if (due) cardParams.trelloCardDue = new Date(due);

            if (dueComplete) cardParams.trelloCardDueComplete = dueComplete;

            if (dateLastActivity)
                cardParams.trelloCardDateLastActivity = new Date(
                    dateLastActivity
                );

            if (attachmentIds && attachmentIds.length > 0)
                cardParams.attachments = attachmentIds;

            if (intervalIds && intervalIds.length > 0)
                cardParams.intervals = intervalIds;

            if (labelIds && labelIds.length > 0) cardParams.labels = labelIds;

            insertOps.push(cardParams);
        });

        const tickets = await IntegrationTicket.insertMany(insertOps);

        board.tickets = tickets;

        result.push(board);
    }

    return result;
};

getExternalTrelloBoards = async (req, res) => {
    const { userId, workspaceId } = req.params;

    let profile;

    try {
        profile = await acquireTrelloConnectProfile(userId);
    } catch (e) {
        Sentry.captureException(e);

        return res.json({ success: false, error: e });
    }

    if (!profile) return res.json({ success: true, result: null });

    let boards;

    try {
        boards = await acquireExternalTrelloBoards(profile);
    } catch (e) {
        Sentry.captureException(e);

        return res.json({ success: true, error: e });
    }

    let workspace;

    try {
        workspace = await Workspace.findById(workspaceId)
            .lean()
            .select("boards")
            .populate("boards")
            .exec();
    } catch (e) {
        Sentry.captureException(e);

        return res.json({ success: true, error: e });
    }

    const workspaceBoardSourceIds = workspace.boards
        ? workspace.boards.map((board) => board.sourceId)
        : [];

    const integratedBoardSourceIds = new Set(workspaceBoardSourceIds);

    boards = boards.filter((board) => {
        const { id } = board;

        return !integratedBoardSourceIds.has(id);
    });

    return res.json({ success: true, result: boards });
};

module.exports = {
    beginTrelloConnect,
    handleTrelloConnectCallback,
    getExternalTrelloBoards,
    triggerTrelloScrape,
    bulkScrapeTrello,
};

/*
handleExistingBoards = async (accessToken, userId, boardWorkspaceContexts) => {
    const boardIds = boardWorkspaceContexts.map((context) => context.boardId);

    let query = IntegrationBoard.find({});

    query.where("sourceId").in(boardIds);

    const existingBoards = await query.select("_id sourceId").lean().exec();

    const contexts = _.mapKeys(boardWorkspaceContexts, "boardId");

    existingBoards.map(async (board) => {
        const tickets = IntegrationTicket.find({
            board: board._id,
        }).exec();

        const lists = IntegrationList.find({
            board: board._id,
        })
            .lean()
            .exec();

        const relevantContext = contexts[board._id];

        await Promise.all(
            tickets.map((ticket) => {
                const { attachments } = ticket;

                return populateExistingTrelloDirectAttachments(
                    relevantContext,
                    attachments
                );
            })
        );

        const mappedTickets = _.mapKeys(tickets, "sourceId");

        const boardData = await acquireTrelloData(board._id, accessToken, true);

        const { actions } = boardData;

        const events = await extractTrelloEvent(
            board,
            lists,
            relevantContext.event
        );

        modifyTrelloActions(actions, mappedTickets);

        await Promise.all(
            tickets.map(async (ticket) => {
                const { sourceId } = ticket;

                const { actions } = mappedTickets[sourceId];

                const { intervals: existingIntervals } = ticket;

                const newIntervals = await extractTrelloIntervals(
                    actions,
                    events,
                    lists
                );

                ticket.intervals = [...newIntervals, ...existingIntervals];

                delete ticket.actions;

                return ticket.save();
            })
        );

        const boardWorkspaceContext = new BoardWorkspaceContext({
            board: board._id,
            events: events.map((event) => event._id),
            workspace: relevantContext.workspaceId,
            repositories: relevantContext.repositoryIds,
            creator: userId,
        });

        await boardWorkspaceContext.save();
    });

    return new Set(existingBoards.map((board) => board._id));
};
*/

/*
            let boardsReponse;

            try {
                boardsReponse = await trelloAPI.get(
                    `/1/members/${memberId}/boards?key=${TRELLO_API_KEY}&token=${accessToken}&fields=id,name`
                );
            } catch (err) {
                return res.json({
                    success: false,
                    error:
                        "handleTrelloConnectCallback Error: trello board API request failed",
                    trace: err,
                });
            }

            let boards = boardsReponse.data;

            return { success: true, result: boards };*/
/*
            let trelloIntegration = new TrelloIntegration({
                boardIds: idBoards,
                profileId: id,
                user: ObjectId(userId),
                workspace: ObjectId(workspaceId),
                repositories: [],
                trelloConnectProfile: ObjectId(trelloConnectProfile._id),
            });

            try {
                trelloIntegration = await trelloIntegration.save();
            } catch (err) {
                console.log("ERROR", err);
            }

            console.log("TRELLO INTEGRATION", trelloIntegration);

            const boardRequests = idBoards.map((boardId) =>
                trelloAPI.get(
                    `/1/boards/${boardId}?key=${TRELLO_API_KEY}&token=${accessToken}`
                )
            );

            const boardResponses = await Promise.all(boardRequests);

            const boards = boardResponses.map((boardResponse) => {
                return boardResponse.data;
            });

            quiltProductBoard = boards.filter(
                (board) => board.name === "Quilt Product"
            )[0];

            // trelloIntegrationId, requiredBoardIdList, relevantLists
            var runTrelloScrapeData = {};
            runTrelloScrapeData[
                "trelloIntegrationId"
            ] = trelloIntegration._id.toString();
            runTrelloScrapeData["requiredBoardIdList"] = [quiltProductBoard.id];
            runTrelloScrapeData["relevantLists"] = [
                { type: "start", name: "In-Progress" },
                { type: "end", name: "Done" },
            ];
            runTrelloScrapeData["jobType"] = jobConstants.JOB_SCRAPE_TRELLO;

            try {
                await jobs.dispatchTrelloScrapeJob(runTrelloScrapeData);
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    message: err,
                    errorDescription: `Error dispatching scrape trello job - trelloIntegrationId, requiredBoardIdList, relevantLists: ${trelloIntegrationId}, ${JSON.stringify(
                        requiredBoardIdList
                    )}, ${JSON.stringify(relevantLists)}`,
                    function: "handleTrelloConnectCallback",
                });

                return res.json({
                    success: false,
                    error: `Error dispatching scrape trello job - trelloIntegrationId, requiredBoardIdList, relevantLists: ${trelloIntegrationId}, ${JSON.stringify(
                        requiredBoardIdList
                    )}, ${JSON.stringify(relevantLists)}`,
                });
            }

            /*
            await bulkScrapeTrello(trelloIntegration, [quiltProductBoard.id], 
                [{type: "start", name: "In-Progress", id}, {type: "end", name: "Done", id}]);

            

           res.redirect(LOCALHOST_HOME_PAGE_URL);
           
           
           
           
           
    if (attachments) {
        attachments = await Promise.all(
            attachments
                .map((attachment) => {
                    const { date, url, name } = attachment;

                    if (!url || !url.includes("https://github.com"))
                        return null;

                    const splitURL = url.split("/");

                    try {
                        let type = splitURL.slice(
                            splitURL.length - 2,
                            splitURL.length - 1
                        )[0];

                        const modelType =
                            type === "tree"
                                ? "branch"
                                : type === "issues"
                                ? "issue"
                                : type === "pull"
                                ? "pullRequest"
                                : type;

                        const sourceId = splitURL.slice(splitURL.length - 1)[0];

                        const fullName = splitURL
                            .slice(splitURL.length - 4, splitURL.length - 2)
                            .join("/");

                        attachment = new IntegrationAttachment({
                            sourceCreationDate: new Date(date),
                            modelType,
                            link: url,
                            sourceId,
                        });

                        if (!currentRepositories[fullName])
                            return attachment.save();

                        attachment.repository =
                            currentRepositories[fullName]._id;

                        return attachment.save();
                    } catch (err) {
                        return null;
                    }
                })
                .filter((request) => request != null)
        );
    } else {
        attachments = [];
    }
           */
