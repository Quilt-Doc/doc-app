require("dotenv").config();

const axios = require("axios");

const mongoose = require("mongoose");

const api = require("../../apis/api");

const _ = require("lodash");

// util helpers
const {
    createWorkspace,
    deleteWorkspace,
    removeWorkspaces,
} = require("../../__tests__config/utils");

// trello helpers
const {
    acquireTrelloConnectProfile,
    acquireExternalTrelloBoards,
} = require("../../controllers/integrations/trello/TrelloControllerHelpers");
const IntegrationBoard = require("../../models/integrations/integration_objects/IntegrationBoard");
const IntegrationColumn = require("../../models/integrations/integration_objects/IntegrationColumn");
const IntegrationLabel = require("../../models/integrations/integration_objects/IntegrationLabel");
const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");
const IntegrationInterval = require("../../models/integrations/integration_objects/IntegrationInterval");
const IntegrationUser = require("../../models/integrations/integration_objects/IntegrationUser");

// env variables
const {
    TRELLO_API_KEY,
    TEST_USER_ID,
    EXTERNAL_DB_PASS,
    EXTERNAL_DB_USER,
} = process.env;

const trelloAPI = axios.create({
    baseURL: "https://api.trello.com",
});

beforeAll(async () => {
    const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

    await mongoose.connect(dbRoute, { useNewUrlParser: true });

    let db = mongoose.connection;

    db.once("open", () => console.log("connected to the database"));

    db.on("error", console.error.bind(console, "MongoDB connection error:"));

    const profile = await acquireTrelloConnectProfile(TEST_USER_ID);

    let externalBoards = await acquireExternalTrelloBoards(profile);

    externalBoards = externalBoards.map(({ id, name }) => {
        return { sourceId: id, name };
    });

    process.env.TEST_TRELLO_EXTERNAL_BOARDS = JSON.stringify(externalBoards);

    const { createdWorkspaceId, repositoryIds } = await createWorkspace([
        "kgodara-testing/brodal_queue",
    ]);

    const workspace = { workspaceId: createdWorkspaceId, repositoryIds };

    process.env.TEST_TRELLO_WEBHOOK_WORKSPACE = JSON.stringify(workspace);

    let testBoard = externalBoards.filter(
        (board) => board.name === "Quilt Test Trello Board"
    )[0];

    const { sourceId } = testBoard;

    testBoard = { sourceId, repositoryIds };

    await backendClient.post(
        `/integrations/${workspaceId}/${TEST_USER_ID}/trello/trigger_scrape`,
        { boards: [testBoard] }
    );

    process.env.TEST_TRELLO_WEBHOOK_BOARD = JSON.stringify(boards[0]);

    process.env.TEST_TRELLO__WEBHOOK_TOKEN =
        "a4157b7d13a520947b353b46d9b0df390ab9d27a4277639810587c6b143316b1";
});

afterAll(async () => {});

// TO BE FURTHER TESTED MANUALLY: moveListToBoard, moveListFromBoard --- can use moveListToBoard to reset
describe("Test Trello Integration Removal", () => {
    let backendClient;

    beforeEach(() => {
        backendClient = api.requestTestingUserBackendClient();
    });

    test("handleWebhookUpdateBoard: Trello updateBoard name and link action change accounted for.", async () => {
        let board = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_BOARD);

        const originalName = board.name;

        const accessToken = process.env.TEST_TRELLO__WEBHOOK_TOKEN;

        // updateBoard
        const nameUpdate = "TEST_TRELLO_WEBHOOK_NAME_CHANGE";

        await trelloAPI.put(
            `/1/boards/${board.sourceId}?key=${TRELLO_API_KEY}&token=${accessToken}&name=${nameUpdate}'`
        );

        // check board was updated
        board = await IntegrationBoard.findById(board._id);

        expect(board.name).toEqual(nameUpdate);

        expect(board.link.split("/").pop()).toEqual(nameUpdate);

        // updateBoard Back
        await trelloAPI.put(
            `/1/boards/${board._id}?key=${TRELLO_API_KEY}&token=${accessToken}&name=${originalName}'`
        );

        // check board was updated
        board = await IntegrationBoard.findById(board._id);

        expect(board.name).toEqual(originalName);

        expect(board.link.split("/").pop()).toEqual(originalName);
    });

    test("handleWebhookCreateList: Trello createList creates column object.", async () => {
        let board = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_BOARD);

        let columnCount = await IntegrationColumn.count({ board: board._id });

        let createdListName = "TEST_TRELLO_WEBHOOK_CREATED_LIST";

        const accessToken = process.env.TEST_TRELLO__WEBHOOK_TOKEN;

        // create list
        await trelloAPI.post(
            `/1/boards/${board.sourceId}/lists?key=${TRELLO_API_KEY}&token=${accessToken}&name=${createdListName}`
        );

        // check if list was created
        let newColumnCount = await IntegrationColumn.count({
            board: board._id,
        });

        expect(newColumnCount).toEqual(columnCount + 1);

        let column = await IntegrationColumn.findOne({
            board: board._id,
            name: createdListName,
        });

        process.env.TEST_TRELLO_WEBHOOK_COLUMN = JSON.stringify(column);

        expect(column).toBeDefined();
    });

    test("handleWebhookUpdateList: Trello updateList updates column name.", async () => {
        let column = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_LIST);

        let updatedListName = "TEST_TRELLO_WEBHOOK_UPDATED_LIST";

        // update list
        await trelloAPI.put(
            `/1/lists/${column.sourceId}/lists?key=${TRELLO_API_KEY}&token=${accessToken}&name=${updatedListName}`
        );

        // check list
        let column = await IntegrationColumn.findById(column._id);

        expect(column).toBeDefined();

        expect(column.name).toEqual(updatedListName);
    });

    test("handleWebhookCreateLabel: Trello createLabel creates label.", async () => {
        let board = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_BOARD);

        let createdLabelName = "TEST_TRELLO_WEBHOOK_CREATED_LABEL";

        let createdLabelColor = "blue";

        let labelCount = await IntegrationLabel.count({ board: board._id });

        // update list
        await trelloAPI.post(
            `/1/labels?key=${TRELLO_API_KEY}&token=${accessToken}&name=${createdLabelName}&color=${createdLabelColor}&idBoard=${board.sourceId}`
        );

        // check if label was created
        let newLabelCount = await IntegrationLabel.count({
            board: board._id,
        });

        expect(newLabelCount).toEqual(labelCount + 1);

        let label = await IntegrationLabel.findOne({
            board: board._id,
            name: createdLabelName,
            color: createdLabelColor,
        });

        process.env.TEST_TRELLO_WEBHOOK_LABEL = JSON.stringify(label);

        expect(label).toBeDefined();
    });

    test("handleWebhookUpdateLabel: Trello updateLabel updates label name and color.", async () => {
        let label = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_LABEL);

        let updatedLabelName = "TEST_TRELLO_WEBHOOK_UPDATED_LABEL_NAME";

        let updatedLabelColor = "blue";

        // update list
        await trelloAPI.put(
            `/1/labels/${label.sourceId}?key=${TRELLO_API_KEY}&token=${accessToken}&name=${updatedLabelName}&color=${updatedLabelColor}`
        );

        label = await IntegrationLabel.findById(label._id);

        expect(label).toBeDefined();

        expect(label.name).toEqual(updatedLabelName);

        expect(label.color).toEqual(updatedLabelColor);

        process.env.TEST_TRELLO_WEBHOOK_LABEL = JSON.stringify(label);
    });

    test("handleWebhookDeleteLabel: Trello deleteLabel deletes label.", async () => {
        let label = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_LABEL);

        let labelCount = await IntegrationLabel.count({ board: board._id });

        // update list
        await trelloAPI.delete(
            `/1/labels/${label.sourceId}?key=${TRELLO_API_KEY}&token=${accessToken}`
        );

        let newLabelCount = await IntegrationLabel.count({ board: board._id });

        expect(labelCount).toEqual(newLabelCount + 1);

        label = await IntegrationLabel.findById(label._id);

        expect(label).toBeUndefined();
    });

    test("handleWebhookCreateMember: Trello addMemberToBoard creates member.", async () => {
        let board = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_BOARD);

        // need to get another memberId
        const memberSourceId = "FIELD";

        await trelloAPI.put(
            `/1/boards/${board.sourceId}/members/${memberSourceId}?key=${TRELLO_API_KEY}&token=${accessToken}&type=normal`
        );

        let doesExist = await IntegrationUser.exists({
            sourceId,
        });

        expect(doesExist).toEqual(true);

        let count = await IntegrationUser.count({
            sourceId,
        });

        expect(count).toEqual(1);

        //clean up
        await trelloAPI.delete(
            `/1/boards/${board.sourceId}/members/${memberSourceId}?key=${TRELLO_API_KEY}&token=${accessToken}`
        );

        await IntegrationUser.findOneAndDelete({ sourceId: memberSourceId });
    });

    // check update member -- is update member deprecated? else how do we deal with member changes?
    /*
    updateMember: async () => await handleWebhookUpdateMember(member),
        test("handleWebhookUpdateMember: Trello updateMember updates member fields.", async () => {
            const updatedMemberName = "TEST_TRELLO_WEBHOOK_UPDATED_MEMBER_NAME";

            const updatedMemberUserName =
                "TEST_TRELLO_WEBHOOK_UPDATED_USER_NAME";

            // need to get another memberAccessToken
            const memberAccessToken = "";

            // need to get another memberSourceId
            const memberSourceId = "FIELD";

            await trelloAPI.put(
                `/1/members/${memberSourceId}?key=${TRELLO_API_KEY}&token=${memberAccessToken}&fullName=${updatedMemberName}&username=${updatedMemberUserName}`
            );
        });
    */

    test("handleWebhookCreateCard: Trello createCard creates card/ticket.", async () => {
        const createdCardName = "TEST_TRELLO_WEBHOOK_CREATED_NAME";

        const createdCardDesc =
            "Here is a description: https://github.com/kgodara-testing/brodal_queue/pull/3";

        const createdCardDue = new Date();

        const createdCardDueComplete = true;

        const column = await IntegrationColumn.findOne({
            board: board._id,
        });

        const createdCardIdList = column.sourceId;

        const column = await IntegrationColumn.findOne({
            board: board._id,
        });

        const labels = await IntegrationColumn.find({
            board: board._id,
        });

        const createdCardIdLabels = labels
            .map((label) => label.sourceId)
            .join(",");

        const user = await IntegrationUser.find({
            user: process.env.TEST_USER_ID,
        });

        const createdCardIdMembers = user.sourceId;

        const parameters = `&name=${createdCardName}&desc=${createdCardDesc}&due=${createdCardDue}`;

        const parameters2 = `&dueComplete=${createdCardDueComplete}&idList=${createdCardIdList}`;

        const parameters3 = `&idLabels=${createdCardIdLabels}&idMembers=${createdCardIdMembers}`;

        const cardCount = await IntegrationTicket.count({ board: board._id });

        await trelloAPI.post(
            `/1/cards?key=${TRELLO_API_KEY}&token=${accessToken}${parameters}${parameters2}${parameters3}`
        );

        const newCardCount = await IntegrationTicket.count({
            board: board._id,
        });

        expect(cardCount).toEqual(newCardCount - 1);

        const soloCount = await IntegrationTicket.count({
            board: board._id,
            name: createdCardName,
        });

        expect(soloCount).toEqual(1);

        const card = await IntegrationTicket.findOne({
            board: board._id,
            name: createdCardName,
            description: createdCardDesc,
        }).populate("attachments");

        expect(card).toBeDefined();

        expect(card.trelloCardDue).toEqual(createdCardDue);

        expect(card.trelloCardDueComplete).toEqual(createdCardDueComplete);

        expect(card.column).toEqual(column._id);

        expect(card.labels).toEqual(labels.map((label) => label._id));

        expect(card.members).toEqual([process.env.TEST_USER_ID]);

        expect(card.intervals.length).toEqual(0);

        const repository = await Repository.findOne({
            fullName: "kgodara-testing/brodal_queue",
        });

        expect(card.attachments.length).toEqual(1);

        expect(card.attachments[0].modelType).toEqual("pullRequest");

        expect(card.attachments[0].sourceId).toEqual("3");

        expect(card.attachments[0].repository).toEqual(repository);

        const pullRequest = await PullRequest.findOne({
            repository: repository._id,
            sourceId: "3",
        });

        const assoc = await Association.findOne({
            firstElement: card._i,
            secondElement: pullRequest._id,
        });

        expect(assoc).toBeDefined();

        process.env.TEST_TRELLO_WEBHOOK_CARD = JSON.stringify(card);
    });

    test("handleWebhookUpdateCard: Trello updateCard updates fields of card.", async () => {
        const card = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_CARD);

        const board = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_BOARD);

        const updatedCardName = "TEST_TRELLO_WEBHOOK_UPDATED_NAME";

        const updatedCardDesc =
            "https://github.com/kgodara-testing/brodal_queue/commit/4dce4772f37e74e7f05077d2c29c17ed1ba1d41a https://soundcloud.com/onthehouse/popular-tracks";

        const updatedCardMembers = "";

        const otherColumns = await IntegrationColumn.find({ board: board._id });

        const updatedCardColumn = otherColumns.filter((column) => {
            column._id != card.column;
        })[0];

        const otherLabels = await IntegrationLabel.find({ board: board._id });

        const updatedCardLabels = otherLabels
            .slice(0, 2)
            .map((label) => label.sourceId)
            .join(",");

        const updatedCardDue = new Date();

        const updatedCardDueComplete = false;

        const parameters = `&name=${updatedCardName}&desc=${updatedCardDesc}&idMembers=${updatedCardMembers}`;

        const parameters2 = `&idList=${updatedCardColumn.sourceId}&idLabels=${updatedCardLabels}&due=${updatedCardDue}&dueComplete=${updatedCardDueComplete}`;

        await trelloAPI.put(
            `/1/cards/${card.sourceId}?key=${TRELLO_API_KEY}&token=${accessToken}${parameters}${parameters2}`
        );

        const updatedCard = await IntegrationTicket.findById(card._id);

        expect(updatedCard.name).toEqual(updatedCardName);

        expect(updatedCard.description).toEqual(updatedCardDesc);

        expect(updatedCard).toBeDefined();

        expect(updatedCard.trelloCardDue).toEqual(updatedCardDue);

        expect(updatedCard.trelloCardDueComplete).toEqual(
            updatedCardDueComplete
        );

        expect(updatedCard.column).toEqual(updatedCardColumn._id);

        expect(updatedCard.labels).toEqual(
            otherLabels.slice(0, 2).map((label) => label._id)
        );

        expect(updatedCard.members.length).toEqual(0);

        const repository = await Repository.findOne({
            fullName: "kgodara-testing/brodal_queue",
        });

        expect(card.attachments.length).toEqual(2);

        const updatedAttachment = card.attachments.filter(
            (att) => att.modelType == "commit"
        )[0];

        expect(updatedAttachment).toBeDefined();

        expect(updatedAttachment.sourceId).toEqual(
            "4dce4772f37e74e7f05077d2c29c17ed1ba1d41a"
        );

        expect(updatedAttachment.repository).toEqual(repository);

        const commit = await Commit.findOne({
            repository: repository._id,
            sourceId: "4dce4772f37e74e7f05077d2c29c17ed1ba1d41a",
        });

        const assoc = await Association.findOne({
            firstElement: card._id,
            secondElement: commit._id,
        });

        expect(assoc).toBeDefined();

        expect(updatedCard.intervals.length).toEqual(1);

        process.env.TEST_TRELLO_WEBHOOK_CARD = JSON.stringify(updatedCard);
    });

    test("handleWebhookAddAttachment: Trello addAttachmentToCard creates attachment on card", async () => {
        const card = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_CARD);

        const attachmentURL =
            "https://github.com/kgodara-testing/brodal_queue/commit/c245dc7c137c2c9f8dca55999fd94e1bd3165464";

        await trelloAPI.post(
            `/1/cards/${card.sourceId}/attachments?key=${TRELLO_API_KEY}&token=${accessToken}&url=${attachmentURL}`
        );

        const updatedCard = IntegrationTicket.find({ _id: card._id }).populate(
            "attachments"
        );

        expect(updatedCard.attachments.length).toEqual(3);

        const repository = await Repository.findOne({
            fullName: "kgodara-testing/brodal_queue",
        });

        const expectedAtt = updatedCard.attachments.filter(
            (att) => att.sourceId == "c245dc7c137c2c9f8dca55999fd94e1bd3165464"
        )[0];

        expect(expectedAtt).toBeDefined();

        expect(expectedAtt.modelType).toEqual("commit");

        expect(expectedAtt.repository).toEqual(repository._id);

        process.env.TEST_TRELLO_WEBHOOK_CARD = JSON.stringify(updatedCard);
    });

    test("handleWebhookAddLabel: Trello addLabelToCard adds label on card", async () => {
        const card = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_CARD);

        const otherLabels = await IntegrationLabel.find({ board: board._id });

        const newLabel = otherLabels.slice(2, 3)[0];

        await trelloAPI.post(
            `/1/cards/idLabels?key=${TRELLO_API_KEY}&token=${accessToken}&value=${newLabel.sourceId}`
        );

        const updatedCard = IntegrationTicket.find({ _id: card._id });

        expect(updatedCard.labels.length).toEqual(3);

        expect(updatedCard.labels.includes(newLabel._id)).toEqual(true);

        process.env.TEST_TRELLO_WEBHOOK_CARD = JSON.stringify(updatedCard);
    });

    test("handleWebhookRemoveLabel: Trello removeLabelToCard removes label on card", async () => {
        const card = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_CARD);

        const removedLabelId = cards.labels[1];

        const removedLabel = await IntegrationLabel.findById(removedLabelId);

        await trelloAPI.delete(
            `/1/cards/idLabels/${removedLabel.sourceId}?key=${TRELLO_API_KEY}&token=${accessToken}`
        );

        const updatedCard = IntegrationTicket.find({ _id: card._id });

        expect(updatedCard.labels.length).toEqual(2);

        expect(updatedCard.labels.includes(removedLabelId)).toEqual(true);

        process.env.TEST_TRELLO_WEBHOOK_CARD = JSON.stringify(updatedCard);
    });

    test("handleWebhookAddMember: Trello addMemberToCard adds member on card", async () => {
        const card = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_CARD);

        const user = IntegrationUser.find({ user: TEST_USER_ID });

        await trelloAPI.post(
            `/1/cards/idMembers?key=${TRELLO_API_KEY}&token=${accessToken}&value=${user.sourceId}`
        );

        const updatedCard = IntegrationTicket.find({ _id: card._id });

        expect(updatedCard.members.length).toEqual(1);

        expect(updatedCard.members.includes(user._id)).toEqual(true);

        process.env.TEST_TRELLO_WEBHOOK_CARD = JSON.stringify(updatedCard);
    });

    test("handleWebhookRemoveMember: Trello removeMemberToCard removes member on card", async () => {
        const card = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_CARD);

        const user = IntegrationUser.find({ user: TEST_USER_ID });

        await trelloAPI.delete(
            `/1/cards/${card.sourceId}/idMembers/${user.sourceId}?key=${TRELLO_API_KEY}&token=${accessToken}`
        );

        const updatedCard = IntegrationTicket.find({ _id: card._id });

        expect(updatedCard.members.length).toEqual(0);

        process.env.TEST_TRELLO_WEBHOOK_CARD = JSON.stringify(updatedCard);
    });

    test("handleWebhookDeleteCard: Trello deleteCard deletes card and any specific subsidiaries", async () => {
        const card = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_CARD);

        const attachmentIds = card.attachments.map((att) => att._id);

        const intervalIds = card.intervals.map((interval) => interval._id);

        await trelloAPI.delete(
            `/1/cards/${card.sourceId}?key=${TRELLO_API_KEY}&token=${accessToken}`
        );

        const doesExist = IntegrationTicket.exists({ _id: card._id });

        const doesExist2 = IntegrationAttachment.exists({
            _id: { $in: attachmentIds },
        });

        const doesExist3 = IntegrationInterval.exists({
            _id: { $in: intervalIds },
        });

        const doesExist4 = Association.exists({
            firstElement: card._id,
        });

        expect(doesExist).toEqual(false);

        expect(doesExist2).toEqual(false);

        expect(doesExist3).toEqual(false);

        expect(doesExist4).toEqual(false);
    });
});
