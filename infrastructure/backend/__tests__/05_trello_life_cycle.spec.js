require("dotenv").config();

const mongoose = require("mongoose");

const api = require("../apis/api");

const _ = require("lodash");

// util helpers
const {
    createWorkspace,
    deleteWorkspace,
    removeWorkspaces,
} = require("../__tests__config/utils");

//trello helpers
const {
    acquireTrelloConnectProfile,
    acquireExternalTrelloBoards,
} = require("../controllers/integrations/trello/TrelloControllerHelpers");

// env variables
const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

// useful models
const IntegrationUser = require("../../../models/integrations/integration_objects/IntegrationUser");
const IntegrationBoard = require("../../../models/integrations/integration_objects/IntegrationBoard");
const IntegrationColumn = require("../../../models/integrations/integration_objects/IntegrationColumn");
const IntegrationLabel = require("../../../models/integrations/integration_objects/IntegrationLabel");
const IntegrationAttachment = require("../../../models/integrations/integration_objects/IntegrationAttachment");
const IntegrationInterval = require("../../../models/integrations/integration_objects/IntegrationInterval");
const IntegrationTicket = require("../../../models/integrations/integration_objects/IntegrationTicket");
const Association = require("../../../models/integrations/integration_objects/Association");

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
});

acquireTrelloCounts = async (createdBoard) => {
    const boardCount = await IntegrationBoard.count({
        _id: createdBoard._id,
    });

    const columnCount = await IntegrationColumn.count({
        _id: createdBoard._id,
    });

    const labelCount = await IntegrationLabel.count({
        _id: createdBoard._id,
    });

    const attachmentCount = await IntegrationAttachment.count({
        _id: createdBoard._id,
    });

    const intervalCount = await IntegrationInterval.count({
        _id: createdBoard._id,
    });

    const ticketCount = await IntegrationTicket.count({
        _id: createdBoard._id,
    });

    const associationCount = await Association.count({
        _id: createdBoard._id,
    });

    return {
        boardCount,
        columnCount,
        labelCount,
        attachmentCount,
        intervalCount,
        ticketCount,
        associationCount,
    };
};

checkCountGreater = (counts) => {
    Object.values(counts).map((count) => {
        expect(count).toBeGreaterThan(0);
    });
};

checkCountZero = (counts) => {
    Object.values(counts).map((count) => {
        expect(count).toEqual(0);
    });
};

checkCountsEqual = (counts1, counts2) => {
    Object.keys(counts1).map((key) => {
        expect(counts1[key].length).toEqual(counts2[key].length);
    });
};

describe("Test Trello Integration Removal", () => {
    let backendClient;

    beforeEach(() => {
        backendClient = api.requestTestingUserBackendClient();
    });

    test("removeTrelloIntegration: Remove Board -- Single Workspace", async () => {
        const createdWorkspace = await createWorkspace([
            "kgodara-testing/brodal_queue",
        ]);

        const {
            createdWorkspaceId: workspaceId,
            repositoryIds,
        } = createdWorkspace;

        let externalBoards = process.env.TEST_TRELLO_EXTERNAL_BOARDS;

        let testBoard = externalBoards.filter(
            (board) => board.name === "Quilt Test Trello Board"
        )[0];

        const { sourceId } = testBoard;

        testBoard = { sourceId, repositoryIds };

        const response = await backendClient.post(
            `/integrations/${workspaceId}/${TEST_USER_ID}/trello/trigger_scrape`,
            { boards: [testBoard] }
        );

        const { success, result } = response.data;

        expect(success).toEqual(true);

        const { workspace, boards } = result;

        expect(workspace.boards.length).toEqual(1);

        expect(boards.length).toEqual(1);

        const createdBoard = boards[0];

        const counts = await acquireTrelloCounts(createdBoard);

        checkCountGreater(counts);

        await backendClient.delete(
            `/integrations/${workspaceId}/${TEST_USER_ID}/trello/remove_integration/${createdBoard._id}`
        );

        checkCountZero(counts);

        deleteWorkspace(workspaceId);
    });

    test("removeTrelloIntegration: Remove Board -- Multiple Workspace", async () => {
        let externalBoards = process.env.TEST_TRELLO_EXTERNAL_BOARDS;

        let testBoard = externalBoards.filter(
            (board) => board.name === "Quilt Test Trello Board"
        )[0];

        const { sourceId } = testBoard;

        // FIRST WORKSPACE
        const createdWorkspace = await createWorkspace([
            "kgodara-testing/brodal_queue",
        ]);

        const {
            createdWorkspaceId: workspaceId,
            repositoryIds,
        } = createdWorkspace;

        testBoard = { sourceId, repositoryIds };

        const response = await backendClient.post(
            `/integrations/${workspaceId}/${TEST_USER_ID}/trello/trigger_scrape`,
            { boards: [testBoard] }
        );

        const { success, result } = response.data;

        expect(success).toEqual(true);

        const { workspace, boards } = result;

        expect(workspace.boards.length).toEqual(1);

        expect(boards.length).toEqual(1);

        const createdBoard = boards[0];

        const counts1 = await acquireTrelloCounts(createdBoard);

        checkCountGreater(counts1);

        // SECOND WORKSPACE
        const createdWorkspace2 = await createWorkspace([
            "kgodara-testing/brodal_queue",
        ]);

        const { createdWorkspaceId: workspace2Id } = createdWorkspace2;

        const response = await backendClient.post(
            `/integrations/${workspace2Id}/${TEST_USER_ID}/trello/trigger_scrape`,
            { boards: [testBoard] }
        );

        const { success2, result2 } = response.data;

        expect(success2).toEqual(true);

        expect(result2.boards[0]._id).toEqual(createdBoard._id);

        const counts2 = await acquireTrelloCounts(result2.boards[0]);

        checkCountsEqual(counts1, counts2);

        // REMOVE FIRST INTEGRATION
        await backendClient.delete(
            `/integrations/${workspaceId}/${TEST_USER_ID}/trello/remove_integration/${createdBoard._id}`
        );

        const counts3 = await acquireTrelloCounts(createdBoard);

        checkCountsEqual(counts1, counts3);

        // REMOVE SECOND INTEGRATION
        await backendClient.delete(
            `/integrations/${workspace2Id}/${TEST_USER_ID}/trello/remove_integration/${createdBoard._id}`
        );

        const counts4 = await acquireTrelloCounts(createdBoard);

        checkCountZero(counts4);

        deleteWorkspace(workspaceId);

        deleteWorkspace(workspace2Id);
    });
});

// Need to delete all resources
describe("Test Trello Integration Reintegration", () => {
    let backendClient;

    beforeEach(() => {
        backendClient = api.requestTestingUserBackendClient();
    });

    test("handleTrelloReintegration: Board integrated with same repository across two workspaces", async () => {
        // extract same external board
        let externalBoards = process.env.TEST_TRELLO_EXTERNAL_BOARDS;

        let testBoard = externalBoards.filter(
            (board) => board.name === "Quilt Test Trello Board"
        )[0];

        const { sourceId } = testBoard;

        // create first workspace
        const createdWorkspace = await createWorkspace([
            "kgodara-testing/brodal_queue",
        ]);

        const {
            createdWorkspaceId: workspaceId,
            repositoryIds,
        } = createdWorkspace;

        // create first integration
        testBoard = { sourceId, repositoryIds };

        const response = await backendClient.post(
            `/integrations/${workspaceId}/${TEST_USER_ID}/trello/trigger_scrape`,
            { boards: [testBoard] }
        );

        const { success, result } = response.data;

        expect(success).toEqual(true);

        const { workspace, boards } = result;

        expect(workspace.boards.length).toEqual(1);

        expect(boards.length).toEqual(1);

        const createdBoard = boards[0];

        // extract count of objects created
        const counts1 = await acquireTrelloCounts(createdBoard);

        // expect counts to be greater than 0
        checkCountGreater(counts1);

        // create second workspace (same repository)
        const createdWorkspace2 = await createWorkspace([
            "kgodara-testing/brodal_queue",
        ]);

        const { createdWorkspaceId: workspace2Id } = createdWorkspace2;

        // create second integration with same board
        const response = await backendClient.post(
            `/integrations/${workspace2Id}/${TEST_USER_ID}/trello/trigger_scrape`,
            { boards: [testBoard] }
        );

        const { success2, result2 } = response.data;

        expect(success2).toEqual(true);

        // expect the board to not be duplicated
        expect(result2.boards[0]._id).toEqual(createdBoard._id);

        const counts2 = await acquireTrelloCounts(result2.boards[0]);

        // expect the counts of both integrations to be exactly the same
        checkCountsEqual(counts1, counts2);

        deleteWorkspace(workspaceId);

        deleteWorkspace(workspace2Id);
    });

    test("handleTrelloReintegration: Board integrated with different repositories across two workspaces", async () => {
        // extract same external board
        let externalBoards = process.env.TEST_TRELLO_EXTERNAL_BOARDS;

        let testBoard = externalBoards.filter(
            (board) => board.name === "Quilt Test Trello Board 2"
        )[0];

        const { sourceId } = testBoard;

        const createdWorkspace = await createWorkspace([
            "kgodara-testing/brodal_queue",
        ]);

        const {
            createdWorkspaceId: workspaceId,
            repositoryIds,
        } = createdWorkspace;

        // create first integration
        testBoard = { sourceId, repositoryIds };

        const response = await backendClient.post(
            `/integrations/${workspaceId}/${TEST_USER_ID}/trello/trigger_scrape`,
            { boards: [testBoard] }
        );

        const { success, result } = response;

        expect(success).toEqual(true);

        const { workspace, boards } = result;

        expect(workspace.boards.length).toEqual(1);

        expect(boards.length).toEqual(1);

        const createdBoard = boards[0];

        // extract count of objects created
        const counts1 = await acquireTrelloCounts(createdBoard);

        const associationCount = counts1["associationCount"];

        expect(associationCount).toEqual(10);

        const rawCounts1 = _.omit(counts1, ["associationCount"]);

        // second workspace with different repository spec
        const createdWorkspace2 = await createWorkspace([
            "kgodara-testing/doc-app",
            "kgodara-testing/brodal_queue",
        ]);

        const {
            createdWorkspaceId: workspace2Id,
            repositoryIds2,
        } = createdWorkspace2;

        // create first integration
        testBoard = { sourceId, repositoryIds2 };

        response = await backendClient.post(
            `/integrations/${workspace2Id}/${TEST_USER_ID}/trello/trigger_scrape`,
            { boards: [testBoard] }
        );

        const { success2, result2 } = response;

        expect(success2).toEqual(true);

        const { workspace2, boards2 } = result2;

        expect(workspace2.boards.length).toEqual(1);

        expect(boards2.length).toEqual(1);

        expect(boards2[0]._id).toEqual(createdBoard._id);

        // extract count of objects created
        const counts2 = await acquireTrelloCounts(boards2[0]);

        const associationCount = counts2["associationCount"];

        expect(associationCount).toEqual(15);

        const rawCounts2 = _.omit(counts2, ["associationCount"]);

        checkCountsEqual(rawCounts1, rawCounts2);
    });
});

// Need to delete all resources
describe("Test Trello Integration General", () => {
    let backendClient;

    beforeEach(() => {
        backendClient = api.requestTestingUserBackendClient();
    });

    test("triggerScrape: Workspace successfully integrates with multiple boards at once.", async () => {
        const workspace = await createWorkspace([
            "kgodara-testing/brodal_queue",
        ]);

        const { createdWorkspaceId: workspaceId, repositoryIds } = workspace;

        const testBoards = externalBoards.map((board) => {
            const { sourceId } = board;
            return {
                sourceId,
                repositoryIds,
            };
        });

        const response = await backendClient.post(
            `/integrations/${workspaceId}/${TEST_USER_ID}/trello/trigger_scrape`,
            { boards: testBoards }
        );

        const { result, success } = response;

        expect(success).toEqual(true);

        const { boards, workspace } = result;

        expect(workspace.boards.length).toEqual(3);

        expect(boards.length).toEqual(3);

        const counts1 = await acquireTrelloCounts(boards[0]);

        expect(counts1["ticketCount"]).toEqual(9);

        const counts2 = await acquireTrelloCounts(boards[1]);

        expect(counts2["ticketCount"]).toEqual(10);
    });

    test("triggerScrape: Workspace successfully integrates with a board associated with multiple repositories.", async () => {
        let externalBoards = process.env.TEST_TRELLO_EXTERNAL_BOARDS;

        let testBoard = externalBoards.filter(
            (board) => board.name === "Quilt Test Trello Board 2"
        )[0];

        const { sourceId } = testBoard;

        const createdWorkspace = await createWorkspace([
            "kgodara-testing/doc-app",
            "kgodara-testing/brodal_queue",
        ]);

        const {
            createdWorkspaceId: workspaceId,
            repositoryIds,
        } = createdWorkspace;

        // create first integration
        testBoard = { sourceId, repositoryIds };

        response = await backendClient.post(
            `/integrations/${workspaceId}/${TEST_USER_ID}/trello/trigger_scrape`,
            { boards: [testBoard] }
        );

        const { success, result } = response;

        expect(success).toEqual(true);

        const { workspace, boards } = result;

        expect(workspace.boards.length).toEqual(1);

        expect(boards.length).toEqual(1);

        // extract count of objects created
        const counts = await acquireTrelloCounts(boards[0]);

        const associationCount = counts["associationCount"];

        expect(associationCount).toEqual(15);
    });
});
/*
   const boardCount = await IntegrationBoard.count({
        _id: createdBoard._id,
    });

    expect(boardCount).toEqual(1);

    const columnCount = await IntegrationColumn.count({
        _id: createdBoard._id,
    });

    expect(columnCount).toBeGreaterThan(0);

    const labelCount = await IntegrationLabel.count({
        _id: createdBoard._id,
    });

    expect(labelCount).toBeGreaterThan(0);

    const attachmentCount = await IntegrationAttachment.count({
        _id: createdBoard._id,
    });

    expect(attachmentCount).toBeGreaterThan(0);

    const intervalCount = await IntegrationInterval.count({
        _id: createdBoard._id,
    });

    expect(intervalCount).toBeGreaterThan(0);

    const ticketCount = await IntegrationTicket.count({
        _id: createdBoard._id,
    });

    expect(ticketCount).toBeGreaterThan(0);*/
