require("dotenv").config();

// mongoose
const mongoose = require("mongoose");

// models
const Workspace = require("../../../models/Workspace");
const Repository = require("../../../models/Repository");

// util helpers
const {
    deleteWorkspace,
    createWorkspace,
} = require("../../../__tests__config/utils");

// test helpers

const {
    validateTicketBoards,
    validateIntegrationAttachments,
    validateAssociations,
} = require("../../../__tests__helpers/github/association_generation_validation_helpers");

// env variables
const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

const runPrivateScrape = async () => {
    const { createdWorkspaceId, repositoryIds } = await createWorkspace([
        "kgodara-testing/brodal_queue",
        "kgodara-testing/issue-scrape",
        "Quilt-Doc/doc-app",
    ]);

    const [workspace, repositories] = await Promise.all([
        Workspace.findById(createdWorkspaceId),
        Repository.find({
            _id: { $in: repositoryIds },
        }),
    ]);

    process.env.TEST_WORKSPACE = JSON.stringify(workspace);

    process.env.TEST_REPOSITORIES = JSON.stringify(repositories);
};

// set up mongodb connection
beforeAll(async () => {
    const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

    await mongoose.connect(dbRoute, { useNewUrlParser: true });

    let db = mongoose.connection;

    db.once("open", () => console.log("connected to the database"));

    db.on("error", console.error.bind(console, "MongoDB connection error:"));

    await runPrivateScrape();

    process.env.isTesting = true;
});

// clean up and store results
afterAll(async () => {
    const workspaces = await Workspace.find({ creator: TEST_USER_ID });

    for (let i = 0; i < workspaces.length; i++) {
        await deleteWorkspace(workspaces[i]._id);
    }
});

describe("Basic public association generation validation", () => {
    test("Validate board for all tickets in each repository", async () => {
        await validateTicketBoards();
    });

    test("Validate attachments for each repository", async () => {
        await validateIntegrationAttachments();
    });

    test("Validate association length and content", async () => {
        await validateAssociations();
    });
});
