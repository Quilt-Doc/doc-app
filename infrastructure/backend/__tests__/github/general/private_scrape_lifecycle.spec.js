require("dotenv").config();

//utility
const fs = require("fs");

// mongoose
const mongoose = require("mongoose");

// models
const Workspace = require("../../../models/Workspace");
const Repository = require("../../../models/Repository");

// logger
const { logger } = require("../../../fs_logging");

// util helpers
const { deleteWorkspace, createWorkspace } = require("../../../__tests__config/utils");
const {
    acquireCounts,
} = require("../../../__tests__helpers/github/public_scrape_lifecycle_helpers");

// env variables
const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

// set up mongodb connection
beforeAll(async () => {
    const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

    await mongoose.connect(dbRoute, { useNewUrlParser: true });

    let db = mongoose.connection;

    db.once("open", () => console.log("connected to the database"));

    db.on("error", console.error.bind(console, "MongoDB connection error:"));

    process.env.isTesting = true;
});

// clean up and store results
afterAll(async () => {
    const workspaces = await Workspace.find({ creator: TEST_USER_ID });

    for (let i = 0; i < workspaces.length; i++) {
        await deleteWorkspace(workspaces[i]._id);
    }
});

describe("Basic private repository scrape lifecycle validation", () => {
    test("Workspaces with same repos do not have duplicate resources", async () => {
        const { createWorkspaceId: workspaceId1, repositoryIds: repoIds1 } = await createWorkspace([
            "kgodara-testing/brodal_queue",
            "kgodara-testing/issue-scrape",
            "Quilt-Doc/doc-app",
        ]);

        const { createWorkspaceId: workspaceId2, repositoryIds: repoIds2 } = await createWorkspace([
            "kgodara-testing/brodal_queue",
            "kgodara-testing/issue-scrape",
            "Quilt-Doc/doc-app",
        ]);

        expect(new Set(repoIds1.map((id) => id.toString()))).toEqual(
            new Set(repoIds2.map((id) => id.toString()))
        );

        const repositories1 = await Repository.find({
            _id: { $in: repoIds1 },
        });

        const repositories2 = await Repository.find({
            _id: { $in: repoIds2 },
        });

        const counts1 = await Promise.all(
            repositories1.map((repo) => {
                const { fullName } = repo;

                return acquireCounts(fullName);
            })
        );

        const counts2 = await Promise.all(
            repositories2.map((repo) => {
                const { fullName } = repo;

                return acquireCounts(fullName);
            })
        );

        expect(counts1).toEqual(counts2);

        process.env.EXPECTED_COUNTS = JSON.stringify(counts1);

        process.env.TEST_WORKSPACE_IDS = JSON.stringify([workspaceId1, workspaceId2]);

        process.env.TEST_REPOSITORIES = JSON.stringify([repositories1, repositories2]);
    });

    test("Deleting single shared-repo workspaces does not delete shared resources", async () => {
        const workspaces = JSON.parse(process.env.TEST_WORKSPACES);

        const workspace = workspaces[0];

        const [repositories, repositories2] = JSON.parse(process.env.TEST_REPOSITORIES);

        const expectedCounts = JSON.parse(process.env.EXPECTED_COUNTS);

        await deleteWorkspace(workspace._id);

        const counts1 = await Promise.all(
            repositories.map((repo) => {
                const { fullName } = repo;

                return acquireCounts(fullName);
            })
        );

        const counts2 = await Promise.all(
            repositories2.map((repo) => {
                const { fullName } = repo;

                return acquireCounts(fullName);
            })
        );

        expect(counts1).toEqual(counts2);

        expect(counts1).toEqual(expectedCounts);
    });
});
