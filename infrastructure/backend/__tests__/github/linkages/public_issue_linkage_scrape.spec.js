require("dotenv").config();

//utility
const fs = require("fs");

// mongoose
const mongoose = require("mongoose");

// models
const Workspace = require("../../../models/Workspace");
const IntegrationTicket = require("../../../models/integrations/integration_objects/IntegrationTicket");

// logger
const { logger } = require("../../../fs_logging");

// util helpers
const { deleteWorkspace } = require("../../../__tests__config/utils");
const {
    sampleGithubRepositories,
    createPublicWorkspace,
} = require("../../../__tests__helpers/github/public_scrape_helpers");

// env variables
const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

// constants:
// parameters to sampling function
const NUM_STARS = "500..3000";
const REPO_SIZE = "1000..2000";
const NUM_REPOS = 5;

// 0 -- sample, 1 -- repeat, 2 -- run all successes, 3 -- run all 4 -- travis
// or array of specific repoUrls
const SAMPLE_OPTION = 0;

// paths of stored json
const CURRENT_PATH = "./__tests__output/public_issue_linkage_scrape/all_output.json";
const RESULTS_PATH =
    "./__tests__output/public_issue_linkage_scrape/results_output.json";

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

        fs.writeFile(RESULTS_PATH, JSON.stringify(testResults), () => {});

        fs.writeFile(CURRENT_PATH, JSON.stringify(currentResults), () => {});
    }
});

describe("Basic public issue linkage validation", () => {
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

        console.log("REPOURLS", repoUrls);

        process.env.TEST_SAMPLE_REPOSITORY_URLS = JSON.stringify(repoUrls);
    });

    test("Linkage counts seem accurate", async () => {
        if (JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS).length == 0) return;

        let currentResults = JSON.parse(process.env.PREVIOUS_RESULTS);

        const repoUrls = JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS);

        const { repositories } = await createPublicWorkspace(repoUrls);

        const repoTickets = await Promise.all(
            repositories.map((repo) =>
                IntegrationTicket.find({
                    repositoryId: repo._id,
                }).populate("attachments")
            )
        );

        let results = {};

        repoTickets.map((tickets, i) => {
            let numAttachments = 0;

            let prAttachments = 0;

            let commitAttachments = 0;

            //let issueAttachments = 0;

            let numIssuesPr = 0;

            let numIssuesCommit = 0;

            tickets.map((ticket) => {
                const { attachments } = ticket;

                let hasPr = false;

                let hasCommit = false;

                numAttachments += attachments.length;

                attachments.map((att) => {
                    const { model } = att;

                    if (model == "pullRequest") {
                        hasPr = true;

                        prAttachments += 1;
                    } else if (model == "commit") {
                        hasCommit = true;

                        commitAttachments += 1;
                    }
                });

                if (hasPr) numIssuesPr += 1;

                if (hasCommit) numIssuesCommit += 1;
            });

            const fullName = repositories[i].fullName;

            const htmlUrl = repositories[i].htmlUrl;

            results[fullName] = currentResults[fullName] = {
                fullName,
                numIssues: tickets.length,
                averagePullRequestAttachments: prAttachments / tickets.length,
                averageCommitAttachments: commitAttachments / tickets.length,
                averageAttachments: numAttachments / tickets.length,
                issuesLinkedToPullRequest: `${
                    (numIssuesPr / tickets.length) * 100
                } %`,
                issuesLinkedToCommit: `${
                    (numIssuesCommit / tickets.length) * 100
                } %`,
                htmlUrl,
                size: REPO_SIZE,
                stars: NUM_STARS,
            };
        });

        process.env.CURRENT_RESULTS = JSON.stringify(currentResults);

        process.env.TEST_RESULTS = JSON.stringify(results);
    });
});
