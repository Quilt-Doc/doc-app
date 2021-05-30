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
    validateTicketBoards,
    validateIntegrationAttachments,
    validateAssociations,
} = require("../../../__tests__helpers/github/association_generation_validation_helpers");

// env variables
const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

// constants:
// parameters to sampling function
const NUM_STARS = "500..3000";
const REPO_SIZE = "1000..2000";
const NUM_REPOS = 1;

// 0 -- sample, 1 -- repeat, 2 -- run all successes, 3 -- run all 4 -- travis
// or array of specific repoUrls
const SAMPLE_OPTION = 0;

// paths of stored json
const CURRENT_PATH =
    "./__tests__output/public_association_generation_validation/all_output.json";
const RESULTS_PATH =
    "./__tests__output/public_association_generation_validation/results_output.json";

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

        let testResults = JSON.parse(process.env.TEST_RESULTS);

        Object.keys(testResults).map((fullName) => {
            const item = testResults[fullName];

            if (
                item["validateTicketBoards"] &&
                item["validateAttachments"] &&
                item["validateAssociationsContent"] &&
                item["validateAssociationsLength"]
            ) {
                item["success"] = true;

                currentResults[fullName]["success"] = true;
            }
        });

        fs.writeFile(RESULTS_PATH, JSON.stringify(testResults), () => {});

        fs.writeFile(CURRENT_PATH, JSON.stringify(currentResults), () => {});
    }
});

describe("Public association generation validation", () => {
    test("Sample repositories for validation", async () => {
        const previousResults = JSON.parse(fs.readFileSync(CURRENT_PATH, "utf8"));

        process.env.PREVIOUS_RESULTS = JSON.stringify(previousResults);

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

        let testResults = {};

        repoUrls.map(
            (url) => (testResults[url] = "FAILED DURING WORKSPACE CREATION")
        );

        process.env.TEST_RESULTS = JSON.stringify(testResults);

        process.env.TEST_SAMPLE_REPOSITORY_URLS = JSON.stringify(repoUrls);
    });

    test("Scrape repositories before sampling commits/prs", async () => {
        const currentResults = JSON.parse(process.env.PREVIOUS_RESULTS);

        const testResults = {};

        if (JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS).length == 0) return;

        const repoUrls = JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS);

        const { workspace, repositories } = await createPublicWorkspace(repoUrls);

        repositories.map((repo) => {
            currentResults[repo.fullName] = testResults[repo.fullName] = {
                validateTicketBoards: false,
                validateAttachments: false,
                validateAssociationsContent: false,
                validateAssociationsLength: false,
                success: false,
                size: REPO_SIZE,
                stars: NUM_STARS,
                htmlUrl: repo.htmlUrl,
            };
        });

        process.env.TEST_WORKSPACE = JSON.stringify(workspace);

        process.env.TEST_REPOSITORIES = JSON.stringify(repositories);

        process.env.CURRENT_RESULTS = JSON.stringify(currentResults);

        process.env.TEST_RESULTS = JSON.stringify(testResults);
    });

    test("Validate board for all tickets in each repository", async () => {
        await validateTicketBoards(true);
    });

    test("Validate attachments for each repository", async () => {
        await validateIntegrationAttachments(true);
    });

    test("Validate association length and content", async () => {
        await validateAssociations(true);
    });
});
