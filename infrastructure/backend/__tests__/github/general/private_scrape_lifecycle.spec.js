require("dotenv").config();

// mongoose
const mongoose = require("mongoose");

// models
const Workspace = require("../../../models/Workspace");
const Repository = require("../../../models/Repository");

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
        const {
            createdWorkspaceId: workspaceId1,
            repositoryIds: repoIds1,
        } = await createWorkspace([
            "kgodara-testing/brodal_queue",
            "kgodara-testing/issue-scrape",
            "Quilt-Doc/doc-app",
        ]);

        const {
            createdWorkspaceId: workspaceId2,
            repositoryIds: repoIds2,
        } = await createWorkspace([
            "kgodara-testing/brodal_queue",
            "kgodara-testing/issue-scrape",
            "Quilt-Doc/doc-app",
        ]);

        expect(new Set(repoIds1.map((id) => id.toString()))).toEqual(
            new Set(repoIds2.map((id) => id.toString()))
        );

        const [workspace1, workspace2, repositories1, repositories2] = await Promise.all([
            Workspace.findById(workspaceId1),
            Workspace.findById(workspaceId2),
            Repository.find({
                _id: { $in: repoIds1 },
            }),
            Repository.find({
                _id: { $in: repoIds2 },
            }),
        ]);

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

        process.env.TEST_WORKSPACES = JSON.stringify([workspace1, workspace2]);

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

    test("Deleting only workspace with repo content deletes content", async () => {
        const workspaces = JSON.parse(process.env.TEST_WORKSPACES);

        const workspace = workspaces[1];

        const repos = JSON.parse(process.env.TEST_REPOSITORIES);

        const expectedCounts = repos[0].map(() => {
            return {
                repositories: 1,
                commits: 0,
                tickets: 0,
                branches: 0,
                pullRequests: 0,
            };
        });

        await deleteWorkspace(workspace._id);

        const counts = await Promise.all(
            repos[0].map((repo) => {
                const { fullName } = repo;

                return acquireCounts(fullName);
            })
        );

        expect(counts).toEqual(expectedCounts);
    });
});
