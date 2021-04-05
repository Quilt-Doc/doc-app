require("dotenv").config();

const mongoose = require("mongoose");

const api = require("../../apis/api");

const Workspace = require("../../models/Workspace");
const Commit = require("../../models/Commit");
const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");
const Repository = require("../../models/Repository");
const Association = require("../../models/associations/Association");
const PullRequest = require("../../models/PullRequest");

const _ = require("lodash");

const {
    createWorkspace,
    removeWorkspace,
    deleteWorkspace,
} = require("../../__tests__config/utils");
const IntegrationBoard = require("../../models/integrations/integration_objects/IntegrationBoard");

// env variables
const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

beforeAll(async () => {
    const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

    await mongoose.connect(dbRoute, { useNewUrlParser: true });

    let db = mongoose.connection;

    db.once("open", () => console.log("connected to the database"));

    db.on("error", console.error.bind(console, "MongoDB connection error:"));

    const { createdWorkspaceId, repositoryIds } = await createWorkspace([
        "kgodara-testing/issue-scrape",
    ]);

    process.env.TEST_REPOSITORY_ID = repositoryIds[0];

    process.env.WORKSPACE_ID = createdWorkspaceId;

    process.env.isTesting = true;
});

afterAll(async () => {
    /*
    let workspaces;

    try {
        workspaces = await Workspace.find({
            memberUsers: { $in: [TEST_USER_ID] },
        });
    } catch (e) {
        console.log("ERROR", e);
    }

    console.log("WORKSPACES", workspaces);

    for (let i = 0; i < workspaces.length; i++) {
        await deleteWorkspace(workspaces[i]._id);
    }*/

    console.log("Finished");
});

describe("Issue Scraping Tests", () => {
    test("Board instantiated for repository", async () => {
        const boards = await IntegrationBoard.find({
            repositories: {
                $in: [process.env.TEST_REPOSITORY_ID],
            },
            source: "github",
        });

        expect(boards.length).toEqual(1);

        process.env.TEST_BOARD_ID = boards[0]._id;
    });

    test("Issues scraped correctly", async () => {
        const issues = await IntegrationTicket.find({
            board: process.env.TEST_BOARD_ID,
            source: "github",
        });

        expect(issues.length).toEqual(6);
    });

    test("Issue referenced in commit", async () => {
        const issue = await IntegrationTicket.findOne({
            source: "github",
            githubIssueNumber: 1,
            repositoryId: process.env.TEST_REPOSITORY_ID,
        });

        const commit = await Commit.findOne({
            sourceId: "8b4ef5f68177a5334317a6ffd72f9ff97c287051",
        });

        const associations = await Association.find({
            firstElement: issue._id,
            secondElement: commit._id,
        });

        expect(associations.length).toEqual(1);

        const association = associations[0];

        expect(association).toBeDefined();

        expect(association.repository.toString()).toEqual(
            process.env.TEST_REPOSITORY_ID
        );
    });

    test("Issue referenced in multiple commits", async () => {
        const issue = await IntegrationTicket.findOne({
            source: "github",
            sourceId: 2,
            repositoryId: process.env.TEST_REPOSITORY_ID,
        });
        console.log(
            "🚀 ~ file: issue_scrape_basic.spec.js ~ line 125 ~ test ~ issue",
            issue
        );

        const commit1 = await Commit.findOne({
            sourceId: "6989da1c3c71f0c8d8db0dd57f5508419df9aaec",
        });

        const commit2 = await Commit.findOne({
            sourceId: "e8e23f44ddf2746c964dbfb75257ee6cd8d7c950",
        });

        const commit3 = await Commit.findOne({
            sourceId: "5c50b758ed393466dca02bc8f865ae21e9b71447",
        });

        const associations1 = await Association.find({
            firstElement: issue._id,
            secondElement: commit1._id,
        });

        const associations2 = await Association.find({
            firstElement: issue._id,
            secondElement: commit2._id,
        });

        const associations3 = await Association.find({
            firstElement: issue._id,
            secondElement: commit3._id,
        });

        for (let associations of [
            associations1,
            associations2,
            associations3,
        ]) {
            expect(associations.length).toEqual(1);

            const association = associations[0];

            expect(association).toBeDefined();

            expect(association.repository.toString()).toEqual(
                process.env.TEST_REPOSITORY_ID
            );
        }

        const associations = await Association.find({
            firstElement: issue._id,
        });

        expect(associations.length).toEqual(3);
    });

    test("Issue containing a linked then unlinked PR", async () => {
        const issue = await IntegrationTicket.findOne({
            source: "github",
            sourceId: 3,
            repositoryId: process.env.TEST_REPOSITORY_ID,
        });

        const pullRequest = await PullRequest.findOne({
            source: "github",
            sourceId: "3",
            repositoryId: process.env.TEST_REPOSITORY_ID,
        });

        const associations = Association.find({
            firstElement: issue._id,
        });
        console.log(
            "🚀 ~ file: issue_scrape_basic.spec.js ~ line 199 ~ test ~ associations",
            associations
        );

        const association = await Association.findOne({
            firstElement: issue._id,
            secondElement: pullRequest._id,
        });

        expect(association).toBeUndefined();
    });
});