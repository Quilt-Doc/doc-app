require("dotenv").config();

const axios = require("axios");

const mongoose = require("mongoose");

// models
const InsertHunk = require('../models/InsertHunk');


const api = require("../apis/api");

// test data
const { insertHunkFilePathLookup: hamechaHunkData } = require("../__tests__data/insert_hunk_creation_data/hamecha");
const { insertHunkFilePathLookup: brodalHunkData } = require("../__tests__data/insert_hunk_creation_data/brodal_queue");

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
        } = await createWorkspace(["kgodara-testing/brodal_queue", "kgodara-testing/hamecha"]);

        const workspace = { workspaceId, repositoryIds };

        console.log("Saving Workspace: ");
        console.log(JSON.stringify(workspace));

        process.env.TEST_INSERT_HUNK_CREATE_WORKSPACE = JSON.stringify(workspace);
    }
    catch (err) {
        console.log(err);
    }
});

describe ("Test InsertHunk Creation", () => {
    let backendClient;

    beforeEach(() => {
        backendClient = api.requestTestingUserBackendClient();
    });
    
    test("createInsertHunksForRepository: correct number of InsertHunks created for each file path in Repositories ", async () => {

        const workspace = JSON.parse(process.env.TEST_INSERT_HUNK_CREATE_WORKSPACE);

        var foundDocumentNum;

        for (const [key, value] of Object.entries(hamechaHunkData)) {
            foundDocumentNum = await InsertHunk.countDocuments({repository: workspace.repositoryIds[1],filePath: key});
            expect(foundDocumentNum).toEqual(value.count);
        }

        for (const [key, value] of Object.entries(brodalHunkData)) {
            foundDocumentNum = await InsertHunk.countDocuments({repository: workspace.repositoryIds[0], filePath: key});
            expect(foundDocumentNum).toEqual(value.count);
        }

    });



});


afterAll(async () => {
    const workspace = JSON.parse(process.env.TEST_INSERT_HUNK_CREATE_WORKSPACE);

    await deleteWorkspace(workspace.workspaceId);

    // await expect( () => deleteWorkspace(workspace.workspaceId)).not.toThrow();

});