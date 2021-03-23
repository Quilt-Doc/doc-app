require("dotenv").config();

const axios = require("axios");

const mongoose = require("mongoose");

// models
const InsertHunk = require('../models/InsertHunk');


const api = require("../apis/api");

// test data
const { prInsertHunkLookup: hamechaPRHunkData } = require("../__tests__data/insert_hunk_creation_data/hamecha");
const { prInsertHunkLookup: brodalPRHunkData } = require("../__tests__data/insert_hunk_creation_data/brodal_queue");
const { prInsertHunkLookup: issueScrapePRHunkData } = require("../__tests__data/insert_hunk_creation_data/issue-scrape");

// util helpers
const {
    createWorkspace,
    deleteWorkspace,
    removeWorkspaces,
} = require("../__tests__config/utils");


// env variables
const {
    TEST_USER_ID,
    EXTERNAL_DB_PASS,
    EXTERNAL_DB_USER,
} = process.env;


beforeAll(async () => {
    const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

    await mongoose.connect(dbRoute, { useNewUrlParser: true });

    let db = mongoose.connection;

    db.once("open", () => console.log("connected to the database"));

    db.on("error", console.error.bind(console, "MongoDB connection error:"));

    const {
        createdWorkspaceId: workspaceId,
        repositoryIds,
    } = await createWorkspace(["kgodara-testing/brodal_queue", "kgodara-testing/hamecha", "kgodara-testing/issue-scrape"]);

    const workspace = { workspaceId, repositoryIds };

    process.env.TEST_PR_INSERT_HUNK_CREATE_WORKSPACE = JSON.stringify(workspace);
});

describe ("Test PR InsertHunk Creation", () => {
    let backendClient;

    beforeEach(() => {
        backendClient = api.requestTestingUserBackendClient();
    });
    
    test("createPRInsertHunksForRepository: correct number of InsertHunks created for each Pull Request in Repositories ", async () => {

        const workspace = JSON.parse(process.env.TEST_PR_INSERT_HUNK_CREATE_WORKSPACE);

        var foundDocumentNum;

        console.log("HAMECHA");

        // Test for "kgodara-testing/hamecha"
        for (const [key, value] of Object.entries(hamechaPRHunkData)) {
            foundDocumentNum = await InsertHunk.countDocuments({repository: workspace.repositoryIds[1], pullRequestNumber: key});

            // console.log(`PRNumber: ${key} - Expecting: ${value.count} - Received: ${foundDocumentNum} `);
            expect(foundDocumentNum).toEqual(value.count);
        }

        console.log("BRODAL");

        // Test for "kgodara-testing/brodal_queue"
        for (const [key, value] of Object.entries(brodalPRHunkData)) {
            foundDocumentNum = await InsertHunk.countDocuments({repository: workspace.repositoryIds[0], pullRequestNumber: key});

            // console.log(`PRNumber: ${key} - Expecting: ${value.count} - Received: ${foundDocumentNum} `);
            expect(foundDocumentNum).toEqual(value.count);
        }

        console.log("ISSUE SCRAPE");

        // Test for "kgodara-testing/issue-scrape"
        for (const [key, value] of Object.entries(issueScrapePRHunkData)) {
            foundDocumentNum = await InsertHunk.countDocuments({repository: workspace.repositoryIds[2], pullRequestNumber: key});

            // console.log(`PRNumber: ${key} - Expecting: ${value.count} - Received: ${foundDocumentNum} `);
            expect(foundDocumentNum).toEqual(value.count);
        }

    });

});


afterAll(async () => {
    const workspace = JSON.parse(process.env.TEST_PR_INSERT_HUNK_CREATE_WORKSPACE);

    await deleteWorkspace(workspace.workspaceId);

    // await expect( () => deleteWorkspace(workspace.workspaceId)).not.toThrow();
});