const OAuth = require("oauth").OAuth;
const url = require("url");
const axios = require("axios");
const _ = require("lodash");

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const logger = require("../../../logging/index").logger;
const jobs = require("../../../apis/jobs");
const jobConstants = require("../../../constants/index").jobs;

const TrelloConnectProfile = require("../../../models/integrations/trello/TrelloConnectProfile");

const IntegrationTicket = require("../../../models/integrations/integration_objects/IntegrationTicket");
const IntegrationBoard = require("../../../models/integrations/integration_objects/IntegrationBoard");

const BoardWorkspaceContext = require("../../../models/integrations/context/BoardWorkspaceContext");

const {
    TRELLO_API_KEY,
    TRELLO_SECRET,
    IS_PRODUCTION,
    LOCALHOST_HOME_PAGE_URL,
    PRODUCTION_HOME_PAGE_URL,
} = process.env;

const requestURL = "https://trello.com/1/OAuthGetRequestToken";
const accessURL = "https://trello.com/1/OAuthGetAccessToken";
const authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";
const appName = "Quilt";
const scope = "read";
const expiration = "never";

const key = TRELLO_API_KEY;
const secret = TRELLO_SECRET;

const loginCallback = `http://localhost:3001/api/integrations/connect/trello/callback`;
const oauth = new OAuth(
    requestURL,
    accessURL,
    key,
    secret,
    "1.0A",
    loginCallback,
    "HMAC-SHA1"
);

const trelloAPI = axios.create({
    baseURL: "https://api.trello.com",
});

const {
    acquireTrelloConnectProfile,
    acquireExternalTrelloBoards,
    acquireTrelloData,
    extractTrelloMembers,
    extractTrelloBoard,
    extractTrelloLists,
    extractTrelloDirectAttachments,
    getContextRepositories,
    extractTrelloEvent,
    extractTrelloLabels,
    modifyTrelloActions,
    populateExistingTrelloDirectAttachments,
    deleteTrelloBoardComplete,
} = require("./TrelloControllerHelpers");

getExternalTrelloBoards = async (req, res) => {
    const { userId, workspaceId } = req.params;

    let profile;

    try {
        profile = await acquireTrelloConnectProfile(userId);
    } catch (e) {
        return res.json({
            success: false,
            error: "getExternalTrelloBoards Error: Find query failed",
            trace: err,
        });
    }

    if (!profile) return res.json({ success: true, result: null });

    let boards;

    try {
        boards = await acquireExternalTrelloBoards(profile);
    } catch (e) {
        return res.json({
            success: false,
            error:
                "getExternalTrelloBoards Error: trello board API request failed",
            trace: err,
        });
    }

    let boardContexts;

    try {
        boardContexts = await BoardWorkspaceContext.find({
            workspace: workspaceId,
        })
            .lean()
            .select("board")
            .populate("board")
            .exec();
    } catch (err) {
        return res.json({
            success: false,
            error:
                "getExternalTrelloBoards Error: board context response query failed",
            trace: err,
        });
    }

    const integratedBoardIds = new Set(
        boardContexts.map((context) => {
            const { board } = context;

            const { sourceId } = board;

            return sourceId;
        })
    );

    boards = boards.filter((board) => {
        const { id } = board;

        return !integratedBoardIds.has(id);
    });

    return res.json({ success: true, result: boards });
};

beginTrelloConnect = async (req, res) => {
    const { user_id } = req.query;

    const userId = user_id;

    await oauth.getOAuthRequestToken(
        async (error, token, tokenSecret, results) => {
            if (error) {
                console.log("ERROR", error);
            }

            try {
                await TrelloConnectProfile.deleteMany({ user: userId });
            } catch (err) {
                console.log("ERROR", err);
            }

            let trelloConnectProfile = new TrelloConnectProfile({
                authorizeToken: token,
                authorizeTokenSecret: tokenSecret,
                user: ObjectId(userId),
            });

            try {
                trelloConnectProfile = await trelloConnectProfile.save();
            } catch (err) {
                console.log("ERROR", err);
            }

            res.redirect(
                `${authorizeURL}?oauth_token=${token}&name=${appName}&scope=${scope}&expiration=${expiration}`
            );
        }
    );
};

handleTrelloConnectCallback = async (req, res) => {
    const query = url.parse(req.url, true).query;

    const token = query.oauth_token;

    let trelloConnectProfile;

    try {
        trelloConnectProfile = await TrelloConnectProfile.findOne({
            authorizeToken: token,
        });
    } catch (err) {
        console.log("ERROR", err);
    }

    const { authorizeToken, authorizeTokenSecret, user } = trelloConnectProfile;

    // NOT POPULATED SO THEY ARE IDS

    const verifier = query.oauth_verifier;

    oauth.getOAuthAccessToken(
        authorizeToken,
        authorizeTokenSecret,
        verifier,
        async (error, accessToken, accessTokenSecret, results) => {
            if (error) console.log("ERROR", err);

            const response = await trelloAPI.get(
                `/1/members/me/?key=${TRELLO_API_KEY}&token=${accessToken}`
            );

            const {
                data: { id },
            } = response;

            trelloConnectProfile.accessToken = accessToken;
            trelloConnectProfile.accessTokenSecret = accessTokenSecret;
            trelloConnectProfile.sourceId = id;
            trelloConnectProfile.isReady = true;

            try {
                trelloConnectProfile = await trelloConnectProfile.save();
            } catch (err) {
                console.log("ERROR", err);
            }

            return res.redirect("http://getquilt.app");
        }
    );
};

triggerTrelloScrape = async (req, res) => {
    const { userId, workspaceId } = req.params;

    let { contexts } = req.body;

    const profile = await acquireTrelloConnectProfile(userId);

    /*
    const existingBoards = await handleExistingBoards(accessToken, userId, boardWorkspaceContexts);

    boardWorkspaceContexts = boardWorkspaceContexts.filter(context => {
        !existingBoards.has(context.boardId)
    });*/

    let resultMapping;

    try {
        resultMapping = await bulkScrapeTrello(
            profile,
            userId,
            workspaceId,
            contexts
        );
    } catch (e) {
        console.log("ERROR", e);

        return res.json({ success: false, error: e });
    }

    contexts = Object.keys(resultMapping).map((key) => {
        //console.log("RESULT MAPPING TICKETS", resultMapping[key].tickets);

        return resultMapping[key].context;
    });

    return res.json({ success: true, result: contexts });
};

// boardWorkspaceContexts -> (boardId, event: {beginListId, endListId}, repositories: [repositoryIds],
bulkScrapeTrello = async (profile, userId, workspaceId, contexts) => {
    const { accessToken } = profile;

    let resultMapping = {};

    for (let i = 0; i < contexts.length; i++) {
        let context = contexts[i];

        const { board: boardId } = context;

        const boardData = await acquireTrelloData(boardId, accessToken);

        let {
            actions,
            cards,
            lists,
            members,
            labels,
            id,
            name,
            idMemberCreator,
            url,
        } = boardData;

        //create IntegrationUsers for members
        members = await extractTrelloMembers(workspaceId, members, profile);

        // create IntegrationBoard
        const board = await extractTrelloBoard(
            members,
            id,
            name,
            idMemberCreator,
            url
        );

        lists = await extractTrelloLists(lists, board);

        const attachmentResponse = await extractTrelloDirectAttachments(
            cards,
            context
        );

        cards = attachmentResponse.cards;

        cards = _.mapKeys(cards, "id");

        let { event, repositories } = context;

        cards = await modifyTrelloActions(actions, cards, event);

        event = await extractTrelloEvent(board, lists, event);

        context = new BoardWorkspaceContext({
            board: board._id,
            event: event._id,
            workspace: workspaceId,
            repositories: repositories,
            creator: userId,
            source: "trello",
        });

        await context.save();

        const intervalResponse = await extractTrelloIntervals(
            event,
            cards,
            lists
        );

        cards = intervalResponse.cards;

        labels = await extractTrelloLabels(labels);

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

        let tickets;

        try {
            tickets = await IntegrationTicket.insertMany(insertOps);
        } catch (err) {
            console.log("ERROR", err);
        }

        resultMapping[context._id] = { context, tickets };
    }

    return resultMapping;
};

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

module.exports = {
    beginTrelloConnect,
    handleTrelloConnectCallback,
    getExternalTrelloBoards,
    triggerTrelloScrape,
    bulkScrapeTrello,
};

/*
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
