require("dotenv").config();

const axios = require("axios");

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

// models
const Commit = require('../models/Commit');
const Branch = require('../models/Branch');
const PullRequest = require('../models/PullRequest');

const InsertHunk = require('../models/InsertHunk');

const api = require("../apis/api");

// test data

const { prNum: brodalPRNum, branchNum: brodalBranchNum, commitNum: brodalCommitNum } = require("../__tests__data/repository_data/brodal_queue");
var { prData: brodalPRData, prEvents: brodalPREvents, prInsertHunkLookup: brodalPRHunkLookup, branchData: brodalBranchData, commitData: brodalCommitData } = require("../__tests__data/repository_data/brodal_queue");

/*
const { prNum: hamechaPRNum, branchNum: hamechaBranchNum, commitNum: hamechaCommitNum } = require("../__tests__data/repository_data/hamecha");
const { prData: hamechaPRData, branchData: hamechaBranchData, commitData: hamechaCommitData } = require("../__tests__data/repository_data/hamecha");


const { prNum: issueScrapePRNum, branchNum: issueScrapeBranchNum, commitNum: issueScrapeCommitNum } = require("../__tests__data/repository_data/issue-scrape");
const { prData: issueScrapePRData, branchData: issueScrapeBranchData, commitData: issueScrapeCommitData } = require("../__tests__data/repository_data/issue-scrape");
*/

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
    try {
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

        console.log("Saving Workspace: ");
        console.log(JSON.stringify(workspace));

        process.env.TEST_PULL_REQUEST_EVENT_WORKSPACE = JSON.stringify(workspace);
    }
    catch (err) {
        console.log(err);
    }
});

describe ("Test Code Object Scrape", () => {
    let backendClient;
    let handler;

    beforeEach(() => {
        backendClient = api.requestTestingUserBackendClient();
        handler = require('../index').handler;
    });


    // PullRequests
    test("PullRequests should be successfully created for Webhook Events for kgodara-testing/brodal_queue", async () => {

        const workspace = JSON.parse(process.env.TEST_PULL_REQUEST_EVENT_WORKSPACE);

        var i = 0;
        for ( i = 0; i < brodalPREvents.length; i++) {
            var prEvent = brodalPREvents[i];
            prEvent = Object.assign({}, { body: JSON.stringify(prEvent) });

            prEvent.headers = {};
            prEvent.headers['x-hub-signature'] = process.env.DEV_TOKEN;
            prEvent.headers['x-github-event'] = 'pull_request';

            await handler(prEvent);
        }

        var foundPullRequestNum = await PullRequest.countDocuments({repository: workspace.repositoryIds[0]});
        // Should be twice as many PullRequests, now that duplicate webhook events have been sent for each
        expect(foundPullRequestNum).toEqual(brodalPRNum * 2);
    });

    // PullRequests
    test("PullRequest InsertHunks should be successfully created for Webhook Events for kgodara-testing/brodal_queue", async () => {

        const workspace = JSON.parse(process.env.TEST_PULL_REQUEST_EVENT_WORKSPACE);

        var totalHunkCount = 0;
        const reducer = (accumulator, currentValue) => accumulator + currentValue;

        totalHunkCount = Object.values(brodalPRHunkLookup).reduce(reducer);

        var foundHunkNum = await InsertHunk.countDocuments({repository: workspace.repositoryIds[0]});
        // Should be twice as many InsertHunks, now that duplicate webhook events have been sent for each
        expect(foundHunkNum).toEqual(totalHunkCount * 2);
    });

});


afterAll(async () => {
    const workspace = JSON.parse(process.env.TEST_PULL_REQUEST_EVENT_WORKSPACE);

    await deleteWorkspace(workspace.workspaceId);

    // await expect( () => deleteWorkspace(workspace.workspaceId)).not.toThrow();

});






