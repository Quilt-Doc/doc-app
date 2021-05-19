require("dotenv").config();

//utility
const fs = require("fs");

// mongoose
const mongoose = require("mongoose");

// models
const Workspace = require("../../../models/Workspace");

// logger
const { logger } = require("../../../fs_logging");

// util helpers
const { deleteWorkspace } = require("../../../__tests__config/utils");
const {
    sampleGithubRepositories,
    createPublicWorkspace,
} = require("../../../__tests__helpers/github/public_scrape_helpers");
const {
    acquireCounts,
} = require("../../../__tests__helpers/github/public_scrape_lifecycle_helpers");
// env variables
const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

// constants:
// parameters to sampling function
const NUM_STARS = "10..2000";
const REPO_SIZE = "100..200";
const NUM_REPOS = 1;

// 0 -- sample, 1 -- repeat, 2 -- run all successes, 3 -- run all
// or array of specific repoUrls
const SAMPLE_OPTION = 0;

// paths of stored json
const PREVIOUS_PATH = "./__tests__output/public_scrape_lifecycle/previous_output.json";
const CURRENT_PATH = "./__tests__output/public_scrape_lifecycle/all_output.json";
const RESULTS_PATH = "./__tests__output/public_scrape_lifecycle/results_output.json";

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

    if (process.env.CURRENT_RESULTS) {
        const currentResults = JSON.parse(process.env.CURRENT_RESULTS);

        if (
            currentResults[process.env.TEST_ID]["success1"] &&
            currentResults[process.env.TEST_ID]["success2"] &&
            currentResults[process.env.TEST_ID]["success3"]
        ) {
            currentResults[process.env.TEST_ID]["success"] = true;
        }

        fs.writeFile(RESULTS_PATH, JSON.stringify(currentResults[process.env.TEST_ID]), () => {});

        if (process.env.PREVIOUS_RESULTS) {
            fs.writeFile(PREVIOUS_PATH, process.env.PREVIOUS_RESULTS, () => {});
        }

        if (process.env.CURRENT_RESULTS) {
            fs.writeFile(CURRENT_PATH, process.env.CURRENT_RESULTS, () => {});
        }
    }
});

describe("Basic public repository scrape lifecycle validation", () => {
    test("Sample repositories for validation", async () => {
        const previousResults = JSON.parse(fs.readFileSync(CURRENT_PATH, "utf8"));

        const testId = new Date().getTime();

        previousResults[testId] = {};

        process.env.PREVIOUS_RESULTS = JSON.stringify(previousResults);

        process.env.TEST_ID = testId;

        let repoUrls = [];

        if (SAMPLE_OPTION == 0) {
            // acquire some sample with parameters delineated above
            repoUrls = await sampleGithubRepositories({
                stars: NUM_STARS,
                repoSize: REPO_SIZE,
                numRepos: NUM_REPOS,
            });
        }

        logger.info(`Sampled ${repoUrls.length} repositories`, {
            func: "Sample repositories for validation",
            obj: repoUrls,
        });

        process.env.TEST_SAMPLE_REPOSITORY_URLS = JSON.stringify(repoUrls);
    });

    test("Creating shared-repo workspaces does not create duplicates", async () => {
        let previousResults = JSON.parse(process.env.PREVIOUS_RESULTS);

        const repoUrls = JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS);

        previousResults[process.env.TEST_ID] = {
            repoUrls: repoUrls,
            success1: false,
            success2: false,
            success3: false,
            success: false,
        };

        const { workspace, repositories } = await createPublicWorkspace(repoUrls);

        const counts1 = await Promise.all(
            repositories.map((repo) => {
                const { fullName } = repo;

                return acquireCounts(fullName);
            })
        );

        const { workspace: workspace2, repositories: repositories2 } = await createPublicWorkspace(
            repoUrls
        );

        const counts2 = await Promise.all(
            repositories2.map((repo) => {
                const { fullName } = repo;

                return acquireCounts(fullName);
            })
        );

        expect(new Set(repositories.map((repo) => repo._id.toString()))).toEqual(
            new Set(repositories2.map((repo) => repo._id.toString()))
        );

        expect(counts1).toEqual(counts2);

        previousResults[process.env.TEST_ID]["success1"] = true;

        console.log("PREVIOUS_RESULTS", previousResults);

        process.env.CURRENT_RESULTS = JSON.stringify(previousResults);

        process.env.EXPECTED_COUNTS = JSON.stringify(counts1);

        process.env.TEST_WORKSPACES = JSON.stringify([workspace, workspace2]);

        process.env.TEST_REPOSITORIES = JSON.stringify([repositories, repositories2]);
    });

    test("Deleting single shared-repo workspaces does not delete shared resources", async () => {
        let previousResults = JSON.parse(process.env.PREVIOUS_RESULTS);

        const workspaces = JSON.parse(process.env.TEST_WORKSPACES);

        const workspace = workspaces[0];

        const [repositories, repositories2] = JSON.parse(process.env.TEST_REPOSITORIES);

        const expectedCounts = JSON.parse(process.env.EXPECTED_COUNTS);

        await deleteWorkspace(workspace._id);

        process.env.TEST_REPOSITORIES = JSON.stringify([repositories, repositories2]);

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

        previousResults[process.env.TEST_ID]["success2"] = true;

        process.env.CURRENT_RESULTS = JSON.stringify(previousResults);
    });

    test("Deleting only workspace with repo content deletes content", async () => {
        let previousResults = JSON.parse(process.env.PREVIOUS_RESULTS);

        const workspaces = JSON.parse(process.env.TEST_WORKSPACES);

        const workspace = workspaces[1];

        const [repositories, repositories2] = process.env.TEST_REPOSITORIES;

        const expectedCounts = repositories.map(() => {
            return {
                repositories: 0,
                commits: 0,
                tickets: 0,
                branches: 0,
                pullRequests: 0,
            };
        });

        await deleteWorkspace(workspace._id);

        process.env.TEST_REPOSITORIES = JSON.stringify([repositories, repositories2]);

        const counts = await Promise.all(
            repositories.map((repo) => {
                const { fullName } = repo;

                return acquireCounts(fullName);
            })
        );

        expect(counts).toEqual(expectedCounts);

        previousResults[process.env.TEST_ID]["success3"] = true;

        process.env.CURRENT_RESULTS = JSON.stringify(previousResults);
    });
});
