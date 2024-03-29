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
const IntegrationUser = require("../models/integrations/integration_objects/IntegrationUser");
const IntegrationBoard = require("../models/integrations/integration_objects/IntegrationBoard");
const IntegrationColumn = require("../models/integrations/integration_objects/IntegrationColumn");
const IntegrationLabel = require("../models/integrations/integration_objects/IntegrationLabel");
const IntegrationAttachment = require("../models/integrations/integration_objects/IntegrationAttachment");
const IntegrationInterval = require("../models/integrations/integration_objects/IntegrationInterval");
const IntegrationTicket = require("../models/integrations/integration_objects/IntegrationTicket");
const Association = require("../models/associations/Association");
const Workspace = require("../models/Workspace");
const Branch = require("../models/Branch");
const Commit = require("../models/Commit");
const PullRequest = require("../models/PullRequest");

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

    process.env.TEST_TRELLOLC_WORKSPACE_1 = JSON.stringify(workspace);

    const workspace2 = await createWorkspace(["kgodara-testing/brodal_queue"]);

    workspace2.workspaceId = workspace2.createdWorkspaceId;

    process.env.TEST_TRELLOLC_WORKSPACE_2 = JSON.stringify(workspace2);

    const workspace3 = await createWorkspace(["kgodara-testing/issue-scrape"]);

    workspace3.workspaceId = workspace3.createdWorkspaceId;

    process.env.TEST_TRELLOLC_WORKSPACE_3 = JSON.stringify(workspace3);

    const workspace4 = await createWorkspace([
        "kgodara-testing/brodal_queue",
        "kgodara-testing/issue-scrape",
    ]);

    workspace4.workspaceId = workspace4.createdWorkspaceId;

    process.env.TEST_TRELLOLC_WORKSPACE_4 = JSON.stringify(workspace4);
});

afterAll(async () => {
    const storeVars = [
        "TEST_TRELLOLC_WORKSPACE_1",
        "TEST_TRELLOLC_WORKSPACE_2",
        "TEST_TRELLOLC_WORKSPACE_3",
    ];

    //console.log("VAR2", process.env.TEST_TRELLOLC_WORKSPACE_2);

    /*
    let workspaceId = JSON.parse(process.env.TEST_TRELLOLC_WORKSPACE_1)
        .workspaceId;

    await deleteWorkspace(workspaceId);
    */

    const workspaces = await Workspace.find({
        memberUsers: { $in: [process.env.TEST_USER_ID] },
    });

    const workspaceIds = workspaces.map((space) => space._id);

    /*
    let workspaceId2 = JSON.parse(process.env.TEST_TRELLOLC_WORKSPACE_2)
        .workspaceId;

    const workspaceIds = [workspaceId, workspaceId2];
    */

    for (let i = 0; i < workspaceIds.length; i++) {
        await deleteWorkspace(workspaceIds[i]);
    }
});

acquireTrelloCounts = async (createdBoard, repositoryIds) => {
    const boardCount = await IntegrationBoard.count({
        _id: createdBoard._id,
    });

    const columnCount = await IntegrationColumn.count({
        board: createdBoard._id,
    });

    const labelCount = await IntegrationLabel.count({
        board: createdBoard._id,
    });

    const attachmentCount = await IntegrationAttachment.count({
        board: createdBoard._id,
    });

    const intervalCount = await IntegrationInterval.count({
        board: createdBoard._id,
    });

    const ticketCount = await IntegrationTicket.count({
        board: createdBoard._id,
    });

    const associationCount = await Association.count({
        board: createdBoard._id,
        repository: { $in: repositoryIds },
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
    Object.keys(counts).map((key) => {
        const count = counts[key];

        expect(count).toBeGreaterThan(0);
    });
};

checkCountZero = (counts) => {
    Object.keys(counts).map((key) => {
        const count = counts[key];

        expect(count).toEqual(0);
    });
};

checkCountsEqual = (counts1, counts2) => {
    Object.keys(counts1).map((key) => {
        expect(counts1[key]).toEqual(counts2[key]);
    });
};

checkAssocs = async (board, repositoryIds, expectedAssocs, check) => {
    const associations = await Association.find({
        board: board._id,
        repository: { $in: repositoryIds },
    });

    let tickets = await IntegrationTicket.find({
        _id: {
            $in: associations.map((assoc) => {
                const { firstElement } = assoc;

                return firstElement;
            }),
        },
    });

    tickets = _.mapKeys(tickets, "_id");

    const finalAssocs = {};

    associations.map((assoc, i) => {
        const { firstElement, secondElementModelType } = assoc;

        const name = tickets[firstElement].name;

        if (!(name in finalAssocs)) {
            finalAssocs[name] = {
                PullRequest: 0,
                Commit: 0,
                Branch: 0,
            };
        }

        finalAssocs[name][secondElementModelType] += 1;
    });

    if (check) {
        expect(Object.values(expectedAssocs).length).toEqual(
            Object.values(finalAssocs).length
        );

        Object.keys(expectedAssocs).map((key) => {
            const codeObjectKeys = ["PullRequest", "Commit", "Branch"];

            const ticketCO = expectedAssocs[key];

            codeObjectKeys.map((key2) => {
                if (ticketCO[key2]) {
                    expect(finalAssocs[key][key2]).toEqual(ticketCO[key2]);
                } else {
                    expect(finalAssocs[key][key2]).toEqual(0);
                }
            });
        });
    }
};

createIntegration = async (
    testBoard,
    workspace,
    backendClient,
    expectedBoardLength,
    expectedRepositoryLength
) => {
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

    expect(resultWorkspace.boards.length).toEqual(expectedBoardLength);

    expect(boards.length).toEqual(expectedBoardLength);

    const createdBoard = boards[0];

    expect(createdBoard.repositories.length).toEqual(expectedRepositoryLength);

    const assocResponse = await backendClient.post(
        `/associations/${workspaceId}/generate_associations`,
        {
            boards,
        }
    );

    expect(assocResponse.data.success).toEqual(true);

    return createdBoard;
};

describe("Test Trello Integration Removal", () => {
    let backendClient;

    beforeEach(() => {
        backendClient = api.requestTestingUserBackendClient();
    });

    test("removeTrelloIntegration: Remove Board -- Single Workspace", async () => {
        const { workspaceId, repositoryIds } = JSON.parse(
            process.env.TEST_TRELLOLC_WORKSPACE_1
        );

        let externalBoards = JSON.parse(
            process.env.TEST_TRELLO_EXTERNAL_BOARDS
        );

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

        const assocResponse = await backendClient.post(
            `/associations/${workspaceId}/generate_associations`,
            {
                boards,
            }
        );

        expect(assocResponse.data.success).toEqual(true);

        let counts = await acquireTrelloCounts(createdBoard, repositoryIds);

        checkCountGreater(counts);

        const deleteResponse = await backendClient.delete(
            `/integrations/${workspaceId}/${TEST_USER_ID}/trello/remove_integration/${createdBoard._id}`
        );

        expect(deleteResponse.data.success).toEqual(true);

        counts = await acquireTrelloCounts(createdBoard, repositoryIds);

        checkCountZero(counts);

        const workspaceAfter = await Workspace.findById(workspaceId)
            .lean()
            .select("boards")
            .exec();

        expect(workspaceAfter.boards.length).toEqual(0);
    });

    test("removeTrelloIntegration: Remove Board -- Multiple Workspace", async () => {
        let externalBoards = JSON.parse(
            process.env.TEST_TRELLO_EXTERNAL_BOARDS
        );

        let testBoard = externalBoards.filter(
            (board) => board.name === "Quilt Test Trello Board"
        )[0];

        const { sourceId } = testBoard;

        // FIRST WORKSPACE
        const createdWorkspace1 = JSON.parse(
            process.env.TEST_TRELLOLC_WORKSPACE_1
        );

        const { workspaceId, repositoryIds } = createdWorkspace1;

        testBoard = {
            sourceId,
            repositoryIds: createdWorkspace1.repositoryIds,
        };

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

        const assocResponse = await backendClient.post(
            `/associations/${workspaceId}/generate_associations`,
            {
                boards,
            }
        );

        expect(assocResponse.data.success).toEqual(true);

        const counts1 = await acquireTrelloCounts(createdBoard, repositoryIds);

        checkCountGreater(counts1);

        // SECOND WORKSPACE
        const createdWorkspace2 = JSON.parse(
            process.env.TEST_TRELLOLC_WORKSPACE_2
        );

        const { workspaceId: workspace2Id } = createdWorkspace2;

        const response2 = await backendClient.post(
            `/integrations/${workspace2Id}/${TEST_USER_ID}/trello/trigger_scrape`,
            { boards: [testBoard] }
        );

        const { success: success2, result: result2 } = response2.data;

        expect(success2).toEqual(true);

        const { boards: boards2, workspace: workspace2 } = result2;

        expect(boards2[0]._id).toEqual(createdBoard._id);

        expect(workspace2.boards.length).toEqual(1);

        const counts2 = await acquireTrelloCounts(boards2[0], repositoryIds);

        checkCountsEqual(counts1, counts2);

        // REMOVE FIRST INTEGRATION
        await backendClient.delete(
            `/integrations/${workspaceId}/${TEST_USER_ID}/trello/remove_integration/${createdBoard._id}`
        );

        const updatedWorkspace = await Workspace.findById(workspaceId);

        expect(updatedWorkspace.boards.length).toEqual(0);

        const counts3 = await acquireTrelloCounts(createdBoard, repositoryIds);

        checkCountsEqual(counts1, counts3);

        // REMOVE SECOND INTEGRATION
        await backendClient.delete(
            `/integrations/${workspace2Id}/${TEST_USER_ID}/trello/remove_integration/${createdBoard._id}`
        );

        const updatedWorkspace2 = await Workspace.findById(workspace2Id);

        expect(updatedWorkspace2.boards.length).toEqual(0);

        const counts4 = await acquireTrelloCounts(createdBoard, repositoryIds);

        checkCountZero(counts4);
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
        let externalBoards = JSON.parse(
            process.env.TEST_TRELLO_EXTERNAL_BOARDS
        );

        let testBoard = externalBoards.filter(
            (board) => board.name === "Quilt Test Trello Board"
        )[0];

        const { sourceId } = testBoard;

        // create first workspace
        const createdWorkspace = JSON.parse(
            process.env.TEST_TRELLOLC_WORKSPACE_1
        );

        const { workspaceId, repositoryIds } = createdWorkspace;

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

        expect(createdBoard.repositories.length).toEqual(1);

        const assocResponse = await backendClient.post(
            `/associations/${workspaceId}/generate_associations`,
            {
                boards,
            }
        );

        expect(assocResponse.data.success).toEqual(true);

        // extract count of objects created
        const counts1 = await acquireTrelloCounts(createdBoard, repositoryIds);

        // expect counts to be greater than 0
        checkCountGreater(counts1);

        // create second workspace (same repository)
        const createdWorkspace2 = JSON.parse(
            process.env.TEST_TRELLOLC_WORKSPACE_2
        );

        const { workspaceId: workspace2Id } = createdWorkspace2;

        // create second integration with same board
        const response2 = await backendClient.post(
            `/integrations/${workspace2Id}/${TEST_USER_ID}/trello/trigger_scrape`,
            { boards: [testBoard] }
        );

        const { success: success2, result: result2 } = response2.data;

        expect(success2).toEqual(true);

        // expect the board to not be duplicated
        expect(result2.boards[0]._id).toEqual(createdBoard._id);

        expect(result2.boards[0].repositories.length).toEqual(0);

        const assocResponse2 = await backendClient.post(
            `/associations/${workspaceId}/generate_associations`,
            {
                boards: result2.boards,
            }
        );

        expect(assocResponse2.data.success).toEqual(true);

        const counts2 = await acquireTrelloCounts(
            result2.boards[0],
            repositoryIds
        );

        // expect the counts of both integrations to be exactly the same
        checkCountsEqual(counts1, counts2);

        // delete resources
        await backendClient.delete(
            `/integrations/${workspaceId}/${TEST_USER_ID}/trello/remove_integration/${createdBoard._id}`
        );

        // delete resources
        await backendClient.delete(
            `/integrations/${workspace2Id}/${TEST_USER_ID}/trello/remove_integration/${createdBoard._id}`
        );
    });

    /*
    test("handleTrelloReintegration: Board integrated with different repositories across two workspaces", async () => {
        let externalBoards = JSON.parse(
            process.env.TEST_TRELLO_EXTERNAL_BOARDS
        );

        let testBoard = externalBoards.filter(
            (board) => board.name === "Quilt Test Trello Board 2"
        )[0];

        const workspace1 = JSON.parse(process.env.TEST_TRELLOLC_WORKSPACE_1);

        const createdBoard1 = await createIntegration(
            testBoard,
            workspace1,
            backendClient,
            1,
            1
        );

        const countsWrapper = async (board, repoIds, expectedAssocCount) => {
            const counts = await acquireTrelloCounts(board, repoIds);

            const associationCount = counts["associationCount"];

            expect(associationCount).toEqual(expectedAssocCount);

            const rawCounts = _.omit(counts, ["associationCount"]);

            return rawCounts;
        };

        const rawCounts1 = await countsWrapper(
            createdBoard1,
            workspace1.repositoryIds,
            12
        );

        const expected1 = {
            Card8: { PullRequest: 1, Commit: 1, Branch: 1 },
            Card5: { PullRequest: 2, Commit: 0, Branch: 0 },
            Card7: { PullRequest: 4, Commit: 0, Branch: 1 },
            Card1: { PullRequest: 0, Commit: 2, Branch: 0 },
        };

        checkAssocs(createdBoard1, workspace1.repositoryIds, expected1, true);

        // second workspace with different repository spec
        const workspace2 = JSON.parse(process.env.TEST_TRELLOLC_WORKSPACE_3);

        const createdBoard2 = await createIntegration(
            testBoard,
            workspace2,
            backendClient,
            1,
            1
        );

        expect(createdBoard2._id).toEqual(createdBoard1._id);

        const rawCounts2 = await countsWrapper(
            createdBoard2,
            workspace2.repositoryIds,
            6
        );

        const expected2 = {
            Card1: {
                Commit: 1,
            },
            Card5: {
                Branch: 1,
                PullRequest: 1,
            },
            Card8: {
                PullRequest: 1,
            },
            Card7: {
                Commit: 1,
                PullRequest: 1,
            },
        };

        checkAssocs(createdBoard2, workspace2.repositoryIds, expected2, true);

        await countsWrapper(
            createdBoard2,
            [...workspace2.repositoryIds, ...workspace1.repositoryIds],
            18
        );

        checkCountsEqual(rawCounts1, rawCounts2);

        // delete resources
        await backendClient.delete(
            `/integrations/${workspace1.workspaceId}/${TEST_USER_ID}/trello/remove_integration/${createdBoard1._id}`
        );

        // delete resources
        await backendClient.delete(
            `/integrations/${workspace2.workspaceId}/${TEST_USER_ID}/trello/remove_integration/${createdBoard2._id}`
        );
    });*/
});

/*
// Need to delete all resources
describe("Test Trello Integration General", () => {
    let backendClient;

    beforeEach(() => {
        backendClient = api.requestTestingUserBackendClient();
    });

    test("triggerScrape: Workspace successfully integrates with multiple boards at once.", async () => {
        const createdWorkspace = JSON.parse(
            process.env.TEST_TRELLOLC_WORKSPACE_1
        );

        let externalBoards = JSON.parse(
            process.env.TEST_TRELLO_EXTERNAL_BOARDS
        );

        const { workspaceId, repositoryIds } = createdWorkspace;

        const testBoards = externalBoards.slice(0, 3).map((board) => {
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

        const { result, success } = response.data;

        expect(success).toEqual(true);

        const { boards, workspace } = result;

        expect(workspace.boards.length).toEqual(3);

        expect(boards.length).toEqual(3);

        const board0 = boards.filter(
            (board) => board.name == "Quilt Test Trello Board"
        )[0];

        const counts1 = await acquireTrelloCounts(board0);

        expect(counts1).toEqual({
            boardCount: 1,
            columnCount: 5,
            labelCount: 6,
            attachmentCount: 9,
            intervalCount: 12,
            ticketCount: 10,
            associationCount: 0,
        });

        expect(counts1["ticketCount"]).toEqual(10);

        const board1 = boards.filter(
            (board) => board.name == "Quilt Test Trello Board 2"
        )[0];

        const counts2 = await acquireTrelloCounts(board1);

        expect(counts2).toEqual({
            boardCount: 1,
            columnCount: 4,
            labelCount: 6,
            attachmentCount: 15,
            intervalCount: 0,
            ticketCount: 11,
            associationCount: 0,
        });

        expect(counts2["ticketCount"]).toEqual(11);

        // delete resources
        await backendClient.delete(
            `/integrations/${workspaceId}/${TEST_USER_ID}/trello/remove_integration/${boards[0]._id}`
        );

        // delete resources
        await backendClient.delete(
            `/integrations/${workspaceId}/${TEST_USER_ID}/trello/remove_integration/${boards[1]._id}`
        );

        // delete resources
        await backendClient.delete(
            `/integrations/${workspaceId}/${TEST_USER_ID}/trello/remove_integration/${boards[2]._id}`
        );
    });

    test("triggerScrape: Workspace successfully integrates with a board associated with multiple repositories.", async () => {
        let externalBoards = JSON.parse(
            process.env.TEST_TRELLO_EXTERNAL_BOARDS
        );

        let testBoard = externalBoards.filter(
            (board) => board.name === "Quilt Test Trello Board 2"
        )[0];

        const workspace = JSON.parse(process.env.TEST_TRELLOLC_WORKSPACE_4);

        const createdBoard = await createIntegration(
            testBoard,
            workspace,
            backendClient,
            1,
            2
        );

        // extract count of objects created
        const counts = await acquireTrelloCounts(
            createdBoard,
            workspace.repositoryIds
        );

        const associationCount = counts["associationCount"];

        expect(associationCount).toEqual(18);

        await backendClient.delete(
            `/integrations/${workspace.workspaceId}/${TEST_USER_ID}/trello/remove_integration/${createdBoard._id}`
        );
    });
});
*/
