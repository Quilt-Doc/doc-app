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

//models
const IntegrationBoard = require("../../models/integrations/integration_objects/IntegrationBoard");
const IntegrationColumn = require("../../models/integrations/integration_objects/IntegrationColumn");
const IntegrationLabel = require("../../models/integrations/integration_objects/IntegrationLabel");
const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");
const IntegrationInterval = require("../../models/integrations/integration_objects/IntegrationInterval");
const IntegrationAttachment = require("../../models/integrations/integration_objects/IntegrationAttachment");
const IntegrationUser = require("../../models/integrations/integration_objects/IntegrationUser");
const Workspace = require("../../models/Workspace");
const Repository = require("../../models/Repository");
const PullRequest = require("../../models/PullRequest");
const Commit = require("../../models/Commit");
const Association = require("../../models/associations/Association");

// env variables
const {
    TRELLO_API_KEY,
    TEST_USER_ID,
    EXTERNAL_DB_PASS,
    EXTERNAL_DB_USER,
    TEST_USER_TRELLO_ACCESS_TOKEN,
} = process.env;

const trelloAPI = axios.create({
    baseURL: "https://api.trello.com",
});

const tokenString = `?key=${TRELLO_API_KEY}&token=${TEST_USER_TRELLO_ACCESS_TOKEN}`;

createIntegration = async (
    testBoard,
    workspace,
    backendClient,
    expectedWorkspaceBoardLength,
    expectedBoardLength,
    expectedRepositoryLength
) => {
    console.log(
        "PARAMETERS",
        testBoard,
        workspace,
        expectedWorkspaceBoardLength,
        expectedBoardLength,
        expectedRepositoryLength
    );

    const { sourceId } = testBoard;

    const { workspaceId, repositoryIds } = workspace;

    testBoard = { sourceId, repositoryIds };

    let response = await backendClient.post(
        `/integrations/${workspaceId}/${TEST_USER_ID}/trello/trigger_scrape`,
        { boards: [testBoard] }
    );

    const { success, result } = response.data;

    expect(success).toEqual(true);

    const { workspace: resultWorkspace, boards } = result;

    expect(resultWorkspace.boards.length).toEqual(expectedWorkspaceBoardLength);

    expect(boards.length).toEqual(expectedBoardLength);

    const createdBoard = boards[0];

    expect(createdBoard.repositories.length).toEqual(expectedRepositoryLength);

    /*
    const assocResponse = await backendClient.post(
        `/associations/${workspaceId}/generate_associations`,
        {
            boards,
        }
    );

    expect(assocResponse.data.success).toEqual(true);
    */

    return createdBoard;
};

resetAll = async () => {
    await IntegrationBoard.deleteMany();

    await IntegrationAttachment.deleteMany();

    await IntegrationColumn.deleteMany();

    await IntegrationInterval.deleteMany();

    await IntegrationLabel.deleteMany();

    await IntegrationTicket.deleteMany();
};

beforeAll(async () => {
    const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

    await mongoose.connect(dbRoute, { useNewUrlParser: true });

    let db = mongoose.connection;

    db.once("open", () => console.log("connected to the database"));

    db.on("error", console.error.bind(console, "MongoDB connection error:"));

    await resetAll();

    const profile = await acquireTrelloConnectProfile(TEST_USER_ID);

    let externalBoards = await acquireExternalTrelloBoards(profile);

    process.env.TEST_TRELLO_EXTERNAL_BOARDS = JSON.stringify(externalBoards);

    const {
        createdWorkspaceId: workspaceId,
        repositoryIds,
    } = await createWorkspace(["kgodara-testing/brodal_queue"]);

    const workspace = { workspaceId, repositoryIds };

    process.env.TEST_TRELLO_WEBHOOK_WORKSPACE = JSON.stringify(workspace);
});

afterAll(async () => {
    const workspace = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_WORKSPACE);

    let webhookBoard = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_BOARD);

    const trashBoard = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_TRASH_BOARD);

    const backendClient = api.requestTestingUserBackendClient();

    let response = await backendClient.delete(
        `/integrations/${workspace.workspaceId}/${TEST_USER_ID}/trello/remove_integration/${webhookBoard._id}`
    );

    expect(response.data.success).toEqual(true);

    response = await backendClient.delete(
        `/integrations/${workspace.workspaceId}/${TEST_USER_ID}/trello/remove_integration/${trashBoard._id}`
    );

    expect(response.data.success).toEqual(true);

    const workspaces = await Workspace.find({
        memberUsers: { $in: [TEST_USER_ID] },
    });

    const workspaceIds = workspaces.map((space) => space._id);

    for (let i = 0; i < workspaceIds.length; i++) {
        await deleteWorkspace(workspaceIds[i]);
    }
});

// TO BE FURTHER TESTED MANUALLY: moveListToBoard, moveListFromBoard --- can use moveListToBoard to reset
describe("Test Trello Webhooks", () => {
    let backendClient;

    beforeEach(() => {
        backendClient = api.requestTestingUserBackendClient();
    });

    test("Webhook Setup: Make sure boards are created properly", async () => {
        const externalBoards = JSON.parse(
            process.env.TEST_TRELLO_EXTERNAL_BOARDS
        );

        const workspace = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_WORKSPACE);

        const webhookBoards = externalBoards
            .map(({ id, name }) => {
                return { sourceId: id, name };
            })
            .filter((board) =>
                [
                    "Quilt Test Trello Webhook Board",
                    "Quilt Test Trello Webhook Trash",
                ].includes(board.name)
            );

        let webhookBoard = webhookBoards.filter(
            (board) => board.name == "Quilt Test Trello Webhook Board"
        )[0];

        webhookBoard = await createIntegration(
            webhookBoard,
            workspace,
            backendClient,
            1,
            1,
            1
        );

        process.env.TEST_TRELLO_WEBHOOK_BOARD = JSON.stringify(webhookBoard);

        let trashBoard = webhookBoards.filter(
            (board) => board.name == "Quilt Test Trello Webhook Trash"
        )[0];

        trashBoard = await createIntegration(
            trashBoard,
            workspace,
            backendClient,
            2,
            1,
            1
        );

        process.env.TEST_TRELLO_WEBHOOK_TRASH_BOARD = JSON.stringify(
            trashBoard
        );
    });

    test("handleWebhookUpdateBoard: Trello updateBoard name and link action change accounted for.", async () => {
        let board = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_BOARD);

        const originalName = board.name;

        // updateBoard
        const nameUpdate = "TEST_TRELLO_WEBHOOK_NAME_CHANGE";

        const profile = await acquireTrelloConnectProfile(TEST_USER_ID);

        expect(profile.accessToken).toEqual(TEST_USER_TRELLO_ACCESS_TOKEN);

        await trelloAPI.put(
            `/1/boards/${
                board.sourceId
            }${tokenString}&name=${encodeURIComponent(nameUpdate)}`
        );

        let count = 0;

        while (count < 20) {
            board = await IntegrationBoard.findById(board._id);

            if (board.name == nameUpdate) {
                break;
            } else {
                count += 1;
            }
        }

        expect(board.name).toEqual(nameUpdate);

        expect(board.link).toEqual(
            "https://trello.com/b/MShbattO/testtrellowebhooknamechange"
        );

        // updateBoard Back
        await trelloAPI.put(
            `/1/boards/${
                board.sourceId
            }${tokenString}&name=${encodeURIComponent(originalName)}`
        );

        count = 0;

        while (count < 20) {
            board = await IntegrationBoard.findById(board._id);

            if (board.name == originalName) {
                break;
            } else {
                count += 1;
            }
        }

        // check board was updated
        board = await IntegrationBoard.findById(board._id);

        expect(board.name).toEqual(originalName);

        expect(board.link).toEqual(
            "https://trello.com/b/MShbattO/quilt-test-trello-webhook-board"
        );
    });

    test("handleWebhookCreateList: Trello createList creates column object.", async () => {
        let board = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_BOARD);

        let columnCount = await IntegrationColumn.count({ board: board._id });

        let createdListName = "TEST_TRELLO_WEBHOOK_CREATED_LIST";

        // create list
        await trelloAPI.post(
            `/1/boards/${board.sourceId}/lists${tokenString}&name=${createdListName}`
        );

        let count = 0;

        let newColumnCount;

        while (count < 20) {
            newColumnCount = await IntegrationColumn.count({
                board: board._id,
            });

            if (newColumnCount == columnCount + 1) {
                break;
            } else {
                count += 1;
            }
        }

        // check if list was created
        expect(newColumnCount).toEqual(columnCount + 1);

        let column = await IntegrationColumn.findOne({
            board: board._id,
            name: createdListName,
        });

        expect(column).not.toBeNull();

        expect(column).toBeDefined();

        process.env.TEST_TRELLO_WEBHOOK_COLUMN = JSON.stringify(column);
    });

    test("handleWebhookUpdateList: Trello updateList updates column name.", async () => {
        let column = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_COLUMN);

        let updatedListName = "TEST_TRELLO_WEBHOOK_UPDATED_LIST";

        // update list
        await trelloAPI.put(
            `/1/lists/${column.sourceId}${tokenString}&name=${updatedListName}`
        );

        let count = 0;

        while (count < 20) {
            column = await IntegrationColumn.findById(column._id);

            if (column.name == updatedListName) {
                break;
            } else {
                count += 1;
            }
        }

        // check list
        expect(column).not.toBeNull();

        expect(column).toBeDefined();

        expect(column.name).toEqual(updatedListName);
    });

    test("handleWebhookDeleteList: Trello moveListFromBoard deletes column.", async () => {
        let column = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_COLUMN);

        let board = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_BOARD);

        let trashBoard = JSON.parse(
            process.env.TEST_TRELLO_WEBHOOK_TRASH_BOARD
        );

        let columnCount = await IntegrationColumn.count({ board: board._id });

        await trelloAPI.put(
            `/1/lists/${column.sourceId}/idBoard${tokenString}&value=${trashBoard.sourceId}`
        );

        let count = 0;

        let newColumnCount;

        while (count < 20) {
            newColumnCount = await IntegrationColumn.count({
                board: board._id,
            });

            if (newColumnCount == columnCount - 1) {
                break;
            } else {
                count += 1;
            }
        }

        expect(newColumnCount).toEqual(columnCount - 1);
    });

    test("handleWebhookCreateLabel: Trello createLabel creates label.", async () => {
        let board = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_BOARD);

        let createdLabelName = "TEST_TRELLO_WEBHOOK_CREATED_LABEL";

        let createdLabelColor = "green";

        let labelCount = await IntegrationLabel.count({ board: board._id });

        // update list
        await trelloAPI.post(
            `/1/labels${tokenString}&name=${createdLabelName}&color=${createdLabelColor}&idBoard=${board.sourceId}`
        );

        let count = 0;

        let newLabelCount;

        while (count < 20) {
            newLabelCount = await IntegrationLabel.count({
                board: board._id,
            });

            if (newLabelCount == labelCount + 1) {
                break;
            } else {
                count += 1;
            }
        }

        expect(newLabelCount).toEqual(labelCount + 1);

        let label = await IntegrationLabel.findOne({
            board: board._id,
            name: createdLabelName,
            color: createdLabelColor,
        });

        expect(label).not.toBeNull();

        expect(label).toBeDefined();

        process.env.TEST_TRELLO_WEBHOOK_LABEL = JSON.stringify(label);
    });

    test("handleWebhookUpdateLabel: Trello updateLabel updates label name and color.", async () => {
        let label = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_LABEL);

        let updatedLabelName = "TEST_TRELLO_WEBHOOK_UPDATED_LABEL_NAME";

        let updatedLabelColor = "blue";

        // update list
        await trelloAPI.put(
            `/1/labels/${label.sourceId}${tokenString}&name=${updatedLabelName}&color=${updatedLabelColor}`
        );

        let count = 0;

        while (count < 20) {
            label = await IntegrationLabel.findById(label._id);

            if (
                label.name == updatedLabelName &&
                label.color == updatedLabelColor
            ) {
                break;
            } else {
                count += 1;
            }
        }

        expect(label).not.toBeNull();

        expect(label).toBeDefined();

        expect(label.name).toEqual(updatedLabelName);

        expect(label.color).toEqual(updatedLabelColor);

        process.env.TEST_TRELLO_WEBHOOK_LABEL = JSON.stringify(label);
    });

    test("handleWebhookDeleteLabel: Trello deleteLabel deletes label.", async () => {
        let board = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_BOARD);

        let label = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_LABEL);

        let labelCount = await IntegrationLabel.count({ board: board._id });

        // update list
        await trelloAPI.delete(`/1/labels/${label.sourceId}${tokenString}`);

        let count = 0;

        let newLabelCount;

        while (count < 20) {
            newLabelCount = await IntegrationLabel.count({ board: board._id });

            if (newLabelCount == labelCount - 1) {
                break;
            } else {
                count += 1;
            }
        }

        expect(newLabelCount).toEqual(labelCount - 1);

        label = await IntegrationLabel.findById(label._id);

        expect(label).toBeNull();
    });

    /*
    test("handleWebhookCreateMember: Trello addMemberToBoard creates member.", async () => {
        let board = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_BOARD);

        // need to get another memberId
        const memberSourceId = "5b3e259cfab278a1fd812a01";

        await trelloAPI.put(
            `/1/boards/${board.sourceId}/members/${memberSourceId}${tokenString}&type=normal`
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
    });*/

    test("handleWebhookCreateCard: Trello createCard creates card/ticket.", async () => {
        let board = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_BOARD);

        const createdCardName = "TEST_TRELLO_WEBHOOK_CREATED_NAME";

        const createdCardDesc =
            "Here is a description: https://github.com/kgodara-testing/brodal_queue/pull/3";

        const createdCardDue = new Date();

        const createdCardDueComplete = true;

        const column = await IntegrationColumn.findOne({
            board: board._id,
        });

        const createdCardIdList = column.sourceId;

        const labels = await IntegrationLabel.find({
            board: board._id,
        });

        const createdCardIdLabels = labels
            .map((label) => label.sourceId)
            .join(",");

        const user = await IntegrationUser.findOne({
            user: process.env.TEST_USER_ID,
        });

        const createdCardIdMembers = user.sourceId;

        const parameters = `&name=${createdCardName}&desc=${encodeURIComponent(
            createdCardDesc
        )}&due=${createdCardDue.toISOString()}`;

        const parameters2 = `&dueComplete=${createdCardDueComplete}&idList=${createdCardIdList}`;

        const parameters3 = `&idLabels=${createdCardIdLabels}&idMembers=${createdCardIdMembers}`;

        const cardCount = await IntegrationTicket.count({ board: board._id });

        const response = await trelloAPI.post(
            `/1/cards${tokenString}${parameters}${parameters2}${parameters3}`
        );

        const cardSourceId = response.data.id;

        await new Promise((r) => setTimeout(r, 5000));

        let count = 0;

        let newCardCount;

        while (count < 20) {
            newCardCount = await IntegrationTicket.count({
                board: board._id,
            });

            if (newCardCount == cardCount + 1) {
                break;
            } else {
                count += 1;
            }
        }

        expect(newCardCount).toEqual(cardCount + 1);

        const soloCount = await IntegrationTicket.count({
            board: board._id,
            name: createdCardName,
            sourceId: cardSourceId,
        });

        expect(soloCount).toEqual(1);

        const card = await IntegrationTicket.findOne({
            board: board._id,
            name: createdCardName,
            description: createdCardDesc,
            sourceId: cardSourceId,
        }).populate("attachments");

        expect(card).not.toBeNull();

        expect(card).toBeDefined();

        expect(card.trelloCardDue).toEqual(createdCardDue);

        expect(card.trelloCardDueComplete).toEqual(createdCardDueComplete);

        expect(card.column).toEqual(column._id);

        expect(card.labels.map((labelId) => labelId.toString())).toEqual(
            labels.map((label) => label._id.toString())
        );

        const integUser = await IntegrationUser.findOne({
            user: process.env.TEST_USER_ID,
        }).lean();

        expect(card.members.length).toEqual(1);

        expect(card.members[0]).toEqual(integUser._id);

        expect(card.intervals.length).toEqual(0);

        const repository = await Repository.findOne({
            fullName: "kgodara-testing/brodal_queue",
        });

        expect(card.attachments.length).toEqual(1);

        expect(card.attachments[0].modelType).toEqual("pullRequest");

        expect(card.attachments[0].sourceId).toEqual("3");

        expect(card.attachments[0].repository).toEqual(repository._id);

        const pullRequest = await PullRequest.findOne({
            repository: repository._id,
            sourceId: "3",
        });

        const assocs = await Association.find({
            firstElement: card._id,
            secondElement: pullRequest._id,
        });

        expect(assocs.length).toEqual(1);

        expect(assocs[0]).not.toBeNull();

        expect(assocs[0]).toBeDefined();

        process.env.TEST_TRELLO_WEBHOOK_CARD = JSON.stringify(card);
    });

    test("handleWebhookAddAttachment: Trello addAttachmentToCard creates attachment on card", async () => {
        const card = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_CARD);

        const attachmentURL =
            "https://github.com/kgodara-testing/brodal_queue/commit/c245dc7c137c2c9f8dca55999fd94e1bd3165464";

        await trelloAPI.post(
            `/1/cards/${
                card.sourceId
            }/attachments${tokenString}&url=${encodeURIComponent(
                attachmentURL
            )}`
        );

        await new Promise((r) => setTimeout(r, 3000));

        const updatedCard = await IntegrationTicket.findById(card._id).populate(
            "attachments"
        );

        expect(updatedCard).not.toBeNull();

        expect(updatedCard.attachments.length).toEqual(2); //TODO: CHANGE ON UPDATE CARD

        const repository = await Repository.findOne({
            fullName: "kgodara-testing/brodal_queue",
        });

        const expectedAtt = updatedCard.attachments.filter(
            (att) => att.sourceId == "c245dc7c137c2c9f8dca55999fd94e1bd3165464"
        )[0];

        expect(expectedAtt).not.toBeNull();

        expect(expectedAtt).toBeDefined();

        expect(expectedAtt.modelType).toEqual("commit");

        expect(expectedAtt.repository).toEqual(repository._id);

        const commit = await Commit.findOne({
            repository: repository._id,
            sourceId: "c245dc7c137c2c9f8dca55999fd94e1bd3165464",
        });

        const assocs = await Association.find({
            firstElement: card._id,
            firstElementModelType: "IntegrationTicket",
            secondElement: commit._id,
            secondElementModelType: "Commit",
        });

        expect(assocs.length).toEqual(1);

        expect(assocs[0]).toBeDefined();

        process.env.TEST_TRELLO_WEBHOOK_CARD = JSON.stringify(updatedCard);
    });

    test("handleWebhookRemoveLabel: Trello removeLabelToCard removes label on card", async () => {
        const card = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_CARD);

        const removedLabelId = card.labels[1];

        const removedLabel = await IntegrationLabel.findById(removedLabelId);

        await trelloAPI.delete(
            `/1/cards/${card.sourceId}/idLabels/${removedLabel.sourceId}${tokenString}`
        );

        await new Promise((r) => setTimeout(r, 3000));

        const updatedCard = await IntegrationTicket.findById(card._id);

        expect(updatedCard.labels.length).toEqual(5);

        expect(updatedCard.labels.includes(removedLabelId)).toEqual(false);

        process.env.TEST_TRELLO_WEBHOOK_CARD = JSON.stringify(updatedCard);

        process.env.TEST_TRELLO_WEBHOOK_LABEL = JSON.stringify(removedLabel);
    });

    test("handleWebhookAddLabel: Trello addLabelToCard adds label on card", async () => {
        const card = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_CARD);

        const newLabel = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_LABEL);

        await trelloAPI.post(
            `/1/cards/${card.sourceId}/idLabels${tokenString}&value=${newLabel.sourceId}`
        );

        await new Promise((r) => setTimeout(r, 3000));

        const updatedCard = await IntegrationTicket.findById(card._id);

        expect(updatedCard.labels.length).toEqual(6);

        expect(
            updatedCard.labels
                .map((label) => label.toString())
                .includes(newLabel._id.toString())
        ).toEqual(true);

        process.env.TEST_TRELLO_WEBHOOK_CARD = JSON.stringify(updatedCard);
    });

    test("handleWebhookRemoveMember: Trello removeMemberToCard removes member on card", async () => {
        const card = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_CARD);

        const user = await IntegrationUser.findOne({ user: TEST_USER_ID });

        await trelloAPI.delete(
            `/1/cards/${card.sourceId}/idMembers/${user.sourceId}${tokenString}`
        );

        await new Promise((r) => setTimeout(r, 3000));

        const updatedCard = await IntegrationTicket.findById(card._id);

        expect(updatedCard.members.length).toEqual(0);

        process.env.TEST_TRELLO_WEBHOOK_CARD = JSON.stringify(updatedCard);
    });

    test("handleWebhookAddMember: Trello addMemberToCard adds member on card", async () => {
        const card = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_CARD);

        const user = await IntegrationUser.findOne({ user: TEST_USER_ID });

        await trelloAPI.post(
            `/1/cards/${card.sourceId}/idMembers${tokenString}&value=${user.sourceId}`
        );

        await new Promise((r) => setTimeout(r, 3000));

        const updatedCard = await IntegrationTicket.findById(card._id);

        expect(updatedCard.members.length).toEqual(1);

        expect(
            updatedCard.members
                .map((member) => member.toString())
                .includes(user._id.toString())
        ).toEqual(true);

        process.env.TEST_TRELLO_WEBHOOK_CARD = JSON.stringify(updatedCard);
    });

    test("handleWebhookUpdateCard: Trello updateCard updates fields of card.", async () => {
        const card = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_CARD);

        const board = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_BOARD);

        const updatedCardName = "TEST_TRELLO_WEBHOOK_UPDATED_NAME";

        const updatedCardDesc =
            "https://github.com/kgodara-testing/brodal_queue/commit/4dce4772f37e74e7f05077d2c29c17ed1ba1d41a https://soundcloud.com/onthehouse/popular-tracks";

        const updatedCardMembers = "";

        const otherColumns = await IntegrationColumn.find({ board: board._id });

        console.log("OTHER COLUMNS", otherColumns);

        console.log("CARD COLUMN", card.column);

        const updatedCardColumn = otherColumns.filter(
            (column) => column._id.toString() != card.column.toString()
        )[0];

        console.log("UPDATED CARD COLUMN", updatedCardColumn);

        const otherLabels = await IntegrationLabel.find({ board: board._id });

        const updatedCardLabels = otherLabels
            .slice(0, 2)
            .map((label) => label.sourceId)
            .join(",");

        const updatedCardDue = new Date();

        const updatedCardDueComplete = false;

        const parameters = `&name=${updatedCardName}&desc=${encodeURIComponent(
            updatedCardDesc
        )}`;

        const parameters2 = `&idList=${
            updatedCardColumn.sourceId
        }&idLabels=${updatedCardLabels}&due=${updatedCardDue.toISOString()}&dueComplete=${updatedCardDueComplete}`;

        console.log(
            "ROUTE",
            `/1/cards/${card.sourceId}${tokenString}${parameters}${parameters2}`
        );

        const response = await trelloAPI.put(
            `/1/cards/${card.sourceId}${tokenString}${parameters}${parameters2}`
        );

        console.log("THE ACTUAL CARD", response.data);

        await new Promise((r) => setTimeout(r, 20000));

        const updatedCard = await IntegrationTicket.findById(card._id)
            .populate("attachments")
            .lean();

        console.log("UPDATED CARD", updatedCard);

        expect(updatedCard).not.toBeNull();

        expect(updatedCard).toBeDefined();

        expect(updatedCard.name).toEqual(updatedCardName);

        expect(updatedCard.description).toEqual(updatedCardDesc);

        expect(updatedCard.trelloCardDue).toEqual(updatedCardDue);

        expect(updatedCard.trelloCardDueComplete).toEqual(
            updatedCardDueComplete
        );

        expect(updatedCard.column).toEqual(updatedCardColumn._id);

        expect(updatedCard.labels).toEqual(
            otherLabels.slice(0, 2).map((label) => label._id)
        );

        //expect(updatedCard.members.length).toEqual(0);

        const repository = await Repository.findOne({
            fullName: "kgodara-testing/brodal_queue",
        });

        expect(updatedCard.attachments.length).toEqual(3);

        console.log("CARD ATTACHMENTS", updatedCard.attachments);

        const updatedAttachment = updatedCard.attachments.filter(
            (att) => att.sourceId == "4dce4772f37e74e7f05077d2c29c17ed1ba1d41a"
        )[0];

        expect(updatedAttachment).not.toBeNull();

        expect(updatedAttachment).toBeDefined();

        expect(updatedAttachment.modelType).toEqual("commit");

        expect(updatedAttachment.repository.toString()).toEqual(
            repository._id.toString()
        );

        const commit = await Commit.findOne({
            repository: repository._id,
            sourceId: "4dce4772f37e74e7f05077d2c29c17ed1ba1d41a",
        });

        const assoc = await Association.findOne({
            firstElement: card._id,
            secondElement: commit._id,
        });

        expect(assoc).not.toBeNull();

        expect(assoc).toBeDefined();

        expect(updatedCard.intervals.length).toEqual(1);

        process.env.TEST_TRELLO_WEBHOOK_CARD = JSON.stringify(updatedCard);
    });

    test("handleWebhookDeleteCard: Trello deleteCard deletes card and any specific subsidiaries", async () => {
        const card = JSON.parse(process.env.TEST_TRELLO_WEBHOOK_CARD);

        const attachmentIds = card.attachments.map((att) => att._id);

        const intervalIds = card.intervals.map((interval) => interval._id);

        await trelloAPI.delete(`/1/cards/${card.sourceId}${tokenString}`);

        await new Promise((r) => setTimeout(r, 3000));

        const doesExist = await IntegrationTicket.exists({ _id: card._id });

        const doesExist2 = await IntegrationAttachment.exists({
            _id: { $in: attachmentIds },
        });

        const doesExist3 = await IntegrationInterval.exists({
            _id: { $in: intervalIds },
        });

        const doesExist4 = await Association.exists({
            firstElement: card._id,
        });

        expect(doesExist).toEqual(false);

        expect(doesExist2).toEqual(false);

        expect(doesExist3).toEqual(false);

        expect(doesExist4).toEqual(false);
    });
});

/* check update member -- is update member deprecated? else how do we deal with member changes?
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
