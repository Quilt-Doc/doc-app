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
const Association = require("../../../models/associations/Association");
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
    deleteTrelloWebhook,
    verifyTrelloWebhookRequest,
    handleWebhookUpdateBoard,
    handleWebhookCreateList,
    handleWebhookDeleteList,
    handleWebhookUpdateList,
    handleWebhookCreateLabel,
    handleWebhookDeleteLabel,
    handleWebhookUpdateLabel,
    handleWebhookCreateMember,
    handleWebhookUpdateMember,
    handleWebhookCreateCard,
    handleWebhookUpdateCard,
    handleWebhookDeleteCard,
    handleWebhookAddAttachment,
    handleWebhookAddLabel,
    handleWebhookRemoveLabel,
    handleWebhookAddMember,
    handleWebhookRemoveMember,
} = require("./TrelloWebhookHelpers");

triggerTrelloScrape = async (req, res) => {
    const { userId, workspaceId } = req.params;

    // boards is [{ sourceId, repositoryIds }]
    let { boards } = req.body;

    let profile;

    try {
        profile = await acquireTrelloConnectProfile(userId);
    } catch (e) {
        console.log("FAILURE 1", e);

        Sentry.captureException(e);

        return res.json({ success: false, error: e });
    }

    let reintegratedBoards;

    try {
        const output = await handleTrelloReintegration(boards);

        boards = output.boards;

        reintegratedBoards = output.reintegratedBoards;
    } catch (e) {
        console.log("FAILURE 2", e);

        Sentry.captureException(e);

        return res.json({ success: false, error: e });
    }

    /*
    console.log(
        "\ntriggerScrape: already Integrated Boards: ",
        reintegratedBoards
    );

    console.log("\ntriggerScrape: new Boards: ", boards);
    */

    let result;

    try {
        result = await bulkScrapeTrello(profile, boards, workspaceId);
    } catch (e) {
        console.log("FAILURE 3", e);

        Sentry.captureException(e);

        return res.json({ success: false, error: e });
    }

    result = result.map((board) => _.omit(board, ["tickets"]));

    // set up webhooks
    if (result.length > 0) {
        try {
            await setupTrelloWebhook(profile, result, userId);
        } catch (e) {
            console.log("FAILURE WEBHOOK", e);

            Sentry.captureException(e);

            return res.json({ success: false, error: e });
        }
    }

    // need to finally mutate workspace to add boards
    let workspace;

    try {
        workspace = await Workspace.findById(workspaceId)
            .select("boards")
            .exec();
    } catch (e) {
        console.log("FAILURE 4", e);

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
        workspace = await workspace.save();
    } catch (e) {
        Sentry.captureException(e);
    }

    return res.json({
        success: true,
        result: { workspace, boards: [...result, ...reintegratedBoards] },
    });
};

bulkScrapeTrello = async (profile, boards, workspaceId) => {
    const { accessToken, user: userId } = profile;

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
            repositoryIds,
            userId
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

removeTrelloIntegration = async (req, res) => {
    //console.log("\nremoveTrelloIntegration: Entered removeTrelloIntegration");

    const { boardId, workspaceId } = req.params;

    /*
    console.log(
        `\nremoveTrelloIntegration: req.params -- boardId: ${boardId} workspaceId: ${workspaceId}`
    );*/
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

    //console.log("\nremoveTrelloIntegration: shouldDelete: ", shouldDelete);

    // delete all integrations associated with board and finally board
    if (shouldDelete) {
        // delete board webhook
        try {
            /*
            console.log(
                "\nremoveTrelloIntegration: deleteTrelloWebhook will be called"
            );*/

            await deleteTrelloWebhook(boardId);
        } catch (e) {
            /*
            console.log(
                "\nremoveTrelloIntegration: deleteTrelloWebhook Failed: ",
                e
            );*/

            Sentry.captureException(e);

            return res.json({ success: false, error: e });
        }

        const nonBoardsModels = [
            IntegrationAttachment,
            IntegrationColumn,
            IntegrationInterval,
            IntegrationLabel,
            IntegrationTicket,
            Association,
        ];

        const requests = nonBoardsModels.map((model) =>
            model.deleteMany({ board: boardId })
        );

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

affirmTrelloWebhook = async (req, res) => {
    return res.sendStatus(200);
};

handleTrelloWebhook = async (req, res) => {
    //console.log("\nhandleTrelloWebhook: Entered in handleTrelloWebhook");

    const { userId, boardId } = req.params;

    const isVerified = verifyTrelloWebhookRequest(req);

    //console.log("\nhandleTrelloWebhook: Verification of Webhook: ", isVerified);

    if (!isVerified) return;

    let profile;

    try {
        profile = await acquireTrelloConnectProfile(userId);
    } catch (e) {
        Sentry.captureException(e);
    }

    const { action } = req.body;

    if (action["type"] == "removeLabelFromCard") {
        console.log("\nhandleTrelloWebhook: Webhook Action: ", action["type"]);
    }

    const { type, data, member } = action;

    const actionMethods = {
        // board
        updateBoard: async () =>
            await handleWebhookUpdateBoard(boardId, profile, data),

        // lists
        createList: async () => await handleWebhookCreateList(boardId, data),

        moveListToBoard: async () =>
            await handleWebhookCreateList(boardId, data),

        moveListFromBoard: async () => await handleWebhookDeleteList(data),

        updateList: async () => await handleWebhookUpdateList(data),

        // labels
        createLabel: async () =>
            await handleWebhookCreateLabel(boardId, profile, data),

        deleteLabel: async () => await handleWebhookDeleteLabel(data),

        updateLabel: async () => await handleWebhookUpdateLabel(data),

        // users
        addMemberToBoard: async () => await handleWebhookCreateMember(member),

        updateMember: async () => await handleWebhookUpdateMember(member),

        // need to handle removeMemberToBoard: async () =>

        createCard: async () =>
            await handleWebhookCreateCard(boardId, profile, data),

        moveCardToBoard: async () =>
            await handleWebhookCreateCard(boardId, profile, data),

        updateCard: async () =>
            await handleWebhookUpdateCard(boardId, profile, data),

        deleteCard: async () => await handleWebhookDeleteCard(data),

        moveCardFromBoard: async () => await handleWebhookDeleteCard(data),

        addAttachmentToCard: async () =>
            await handleWebhookAddAttachment(boardId, data),

        addLabelToCard: async () => await handleWebhookAddLabel(data),

        removeLabelFromCard: async () => await handleWebhookRemoveLabel(data),

        addMemberToCard: async () => await handleWebhookAddMember(data),

        removeMemberFromCard: async () => await handleWebhookRemoveMember(data),

        //deleteAttachmentFromCard: async () =>
        //   await handleWebhookDeleteAttachment(boardId, data),
    };

    //console.log(`\nhandleTrelloWebhook: data: `, data);

    try {
        if (actionMethods[type]) {
            await actionMethods[type]();
        }
    } catch (e) {
        console.log("handleTrelloWebhook: error occurred: ", e);

        Sentry.captureException(e);
    }

    res.sendStatus(200);
};

module.exports = {
    beginTrelloConnect,
    handleTrelloConnectCallback,
    getExternalTrelloBoards,
    triggerTrelloScrape,
    bulkScrapeTrello,
    removeTrelloIntegration,
    handleTrelloWebhook,
    affirmTrelloWebhook,
};
