require("dotenv").config();

const axios = require("axios");

const mongoose = require("mongoose");

// models

const api = require("../apis/api");

// util helpers
const { createWorkspace, deleteWorkspace, removeWorkspaces } = require("../__tests__config/utils");

// env variables
const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

beforeAll(async () => {
    try {
        const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

        await mongoose.connect(dbRoute, { useNewUrlParser: true });

        let db = mongoose.connection;

        db.once("open", () => console.log("connected to the database"));

        db.on("error", console.error.bind(console, "MongoDB connection error:"));

        const { createdWorkspaceId: workspaceId, repositoryIds } = await createWorkspace([
            "kgodara-testing/doc-app",
        ]);

        const workspace = { workspaceId, repositoryIds };

        console.log("Saving Workspace: ");
        console.log(JSON.stringify(workspace));

        process.env.TEST_LARGE_REPOSITORY_WORKSPACE = JSON.stringify(workspace);
    } catch (err) {
        console.log(err);
    }
});

describe("Test Workspace Large Repository Creation", () => {
    let backendClient;

    beforeEach(() => {
        backendClient = api.requestTestingUserBackendClient();
    });

    test("beforeAll worked", async () => {
        expect(1).toEqual(1);
    });
});

afterAll(async () => {
    const workspace = JSON.parse(process.env.TEST_LARGE_REPOSITORY_WORKSPACE);

    await deleteWorkspace(workspace.workspaceId);

    // await expect( () => deleteWorkspace(workspace.workspaceId)).not.toThrow();
});
