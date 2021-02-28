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
    handleTrelloReintegration,
} = require("./TrelloControllerHelpers");

const {
    beginTrelloConnect,
    handleTrelloConnectCallback,
} = require("./TrelloAuthorizationController");

const {
    setupTrelloWebhook,
    verifyTrelloWebhookRequest,
    handleWebhookUpdateBoard,
    handleWebhookCreateList,
    handleWebhookDeleteList,
    handleWebhookUpdateList,
} = require("./TrelloWebhookHelpers");

removeTrelloIntegration = async (req, res) => {
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

    return res.json({
        success: true,
    });
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
        const output = await handleTrelloReintegration(boards);

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

    // set up webhooks
    await setupTrelloWebhook(profile, result, workspaceId, userId);

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

handleTrelloWebhook = async (req, res) => {
    const { workspaceId, userId, boardId } = req.params;

    const isVerified = verifyTrelloWebhookRequest(req);

    if (!isVerified) return;

    let profile;

    try {
        profile = await acquireTrelloConnectProfile(userId);
    } catch (e) {
        Sentry.captureException(e);
    }

    const { action } = req.body;

    const { type, data } = action;

    const actionMethods = {
        updateBoard: async () => await handleWebhookUpdateBoard(boardId, data),
        createList: async () => await handleWebhookCreateList(boardId, data),
        moveListToBoard: async () =>
            await handleWebhookCreateList(boardId, data),
        moveListFromBoard: async () =>
            await handleWebhookDeleteList(boardId, data),
        updateList: async () => await handleWebhookUpdateList(boardId, data),
    };

    try {
        await actionMethods[type]();
    } catch (e) {
        Sentry.captureException(e);
    }
};

module.exports = {
    beginTrelloConnect,
    handleTrelloConnectCallback,
    getExternalTrelloBoards,
    triggerTrelloScrape,
    bulkScrapeTrello,
    removeTrelloIntegration,
    handleTrelloWebhook,
};
