require("dotenv").config();

//utility
const fs = require("fs");

// mongoose
const mongoose = require("mongoose");

// models
const Commit = require("../../../models/Commit");
const PullRequest = require("../../../models/PullRequest");
const Workspace = require("../../../models/Workspace");
const IntegrationTicket = require("../../../models/integrations/integration_objects/IntegrationTicket");

// logger
const { logger } = require("../../../fs_logging");

// util helpers
const { deleteWorkspace } = require("../../../__tests__config/utils");
const {
    sampleGithubRepositories,
    acquireRepositoryRawCommits,
    acquireRepositoryRawPullRequests,
    acquireRepositoryRawIssues,
    acquireSuccessSample,
    createPublicWorkspace,
    compareFields,
    compareSets,
} = require("../../../__tests__helpers/github/public_scrape_helpers");

// env variables
const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

// constants:
// parameters to sampling function
const NUM_STARS = "100..2000";
const REPO_SIZE = "100..1000";
const NUM_REPOS = 1;

// 0 -- sample, 1 -- repeat, 2 -- run all successes, 3 -- run all 4 -- travis
// or array of specific repoUrls
const SAMPLE_OPTION = 0;

// paths of stored json
const PREVIOUS_PATH = "./__tests__output/public_scrape_validation/previous_output.json";
const CURRENT_PATH = "./__tests__output/public_scrape_validation/all_output.json";
const SUCCESS_PATH = "./__tests__output/public_scrape_validation/success_output.json";
const FAIL_PATH = "./__tests__output/public_scrape_validation/failed_output.json";
const RESULTS_PATH = "./__tests__output/public_scrape_validation/results_output.json";

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
    if (process.env.TEST_WORKSPACE) {
        const workspace = JSON.parse(process.env.TEST_WORKSPACE);

        await deleteWorkspace(workspace._id);
    }

    const workspaces = await Workspace.find({ creator: TEST_USER_ID });

    for (let i = 0; i < workspaces.length; i++) {
        await deleteWorkspace(workspaces[i]._id);
    }

    if (process.env.CURRENT_RESULTS && process.env.TEST_SAMPLE_REPOSITORIES) {
        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const currentResults = JSON.parse(process.env.CURRENT_RESULTS);

        const previousResults = JSON.parse(process.env.PREVIOUS_RESULTS);

        let failedResults = {};

        let successResults = {};

        const testResults = repositories.map((repo) => {
            const result = currentResults[repo.fullName];

            const fields = {
                commits: ["length", "name"],
                pulls: ["length", "name", "description"],
                issues: ["length", "name", "description"],
            };

            let hasFailed = false;

            Object.keys(fields).map((field) => {
                const subfields = fields[field];

                subfields.map((subfield) => {
                    if (result[field][subfield] != "SUCCESS") hasFailed = true;
                });
            });

            if (hasFailed) {
                failedResults[repo.fullName] = result;
            } else {
                result["success"] = true;

                successResults[repo.fullName] = result;
            }

            return result;
        });

        fs.writeFile(SUCCESS_PATH, JSON.stringify(successResults), () => {});

        fs.writeFile(FAIL_PATH, JSON.stringify(failedResults), () => {});

        fs.writeFile(RESULTS_PATH, JSON.stringify(testResults), () => {});

        if (process.env.PREVIOUS_RESULTS) {
            fs.writeFile(PREVIOUS_PATH, JSON.stringify(previousResults), () => {});
        }

        if (process.env.CURRENT_RESULTS) {
            fs.writeFile(CURRENT_PATH, JSON.stringify(currentResults), () => {});
        }
    }
});

describe("Basic public github scrape validation", () => {
    test("Sample repositories for validation", async () => {
        const func = "Sample repositories for pipeline display validation";

        const previousResults = JSON.parse(fs.readFileSync(CURRENT_PATH, "utf8"));

        const recentTestResults = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));

        process.env.PREVIOUS_RESULTS = JSON.stringify(previousResults);

        let repoUrls = [];

        if (SAMPLE_OPTION == 0) {
            // acquire some sample with parameters delineated above
            repoUrls = await sampleGithubRepositories({
                stars: NUM_STARS,
                repoSize: REPO_SIZE,
                numRepos: NUM_REPOS,
            });
        } else if (SAMPLE_OPTION == 1 && recentTestResults) {
            repoUrls = Object.keys(recentTestResults).map(
                (fullName) => recentTestResults[fullName]["htmlUrl"]
            );
        } else if (SAMPLE_OPTION == 2) {
            repoUrls = Object.keys(previousResults)
                .map((fullName) => {
                    const { htmlUrl, success } = previousResults[fullName];

                    if (success) return htmlUrl;

                    return null;
                })
                .filter((item) => item !== null);
        } else if (SAMPLE_OPTION == 3) {
            repoUrls = Object.keys(previousResults)
                .map((fullName) => previousResults[fullName]["htmlUrl"])
                .filter((item) => item !== null && item !== undefined);
        } else if (typeof SAMPLE_OPTION == "object") {
            repoUrls = SAMPLE_OPTION;
        } else if (SAMPLE_OPTION == 4) {
            repoUrls = acquireSuccessSample(previousResults);
        }

        logger.info(`Sampled ${repoUrls.length} repositories`, {
            func,
            obj: repoUrls,
        });

        process.env.TEST_SAMPLE_REPOSITORY_URLS = JSON.stringify(repoUrls);
    });

    test("Scrape sample repositories and create workspace successfully", async () => {
        if (JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS).length == 0) return;

        const func = "Scrape sample repositories and create workspace successfully";

        let previousResults = JSON.parse(process.env.PREVIOUS_RESULTS);

        const repoUrls = JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS);

        const { workspace, repositories } = await createPublicWorkspace(repoUrls);

        repositories.map((repo, i) => {
            const { fullName } = repo;

            if (fullName in previousResults) {
                const results = previousResults[fullName];

                logger.info(`Previous scrape result for ${fullName}: ${results["success"]}`, {
                    func,
                    obj: results,
                });
            } else {
                previousResults[fullName] = {};
            }

            previousResults[fullName] = {
                ...previousResults[fullName],
                commits: {
                    length: "PENDING",
                    name: "PENDING",
                },
                pulls: {
                    length: "PENDING",
                    name: "PENDING",
                    description: "PENDING",
                },
                issues: {
                    length: "PENDING",
                    name: "PENDING",
                    description: "PENDING",
                },
                success: false,
                htmlUrl: repoUrls[i],
            };

            if (SAMPLE_OPTION == 0) {
                previousResults[fullName]["size"] = REPO_SIZE;

                previousResults[fullName]["stars"] = NUM_STARS;
            }
        });

        process.env.CURRENT_RESULTS = JSON.stringify(previousResults);

        process.env.TEST_WORKSPACE = JSON.stringify(workspace);

        process.env.TEST_SAMPLE_REPOSITORIES = JSON.stringify(repositories);
    });

    test("Acquire scraped and raw commits", async () => {
        if (JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS).length == 0) return;

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        // acquire commits for each repository from github API
        process.env.TEST_ALL_COMMITS = JSON.stringify(
            await acquireRepositoryRawCommits(repositories)
        );

        // acquire commits for each repository from database
        process.env.TEST_ALL_SCRAPED_COMMITS = JSON.stringify(
            await Promise.all(
                repositories.map((repo) =>
                    Commit.find({ repository: repo._id }).select("_id sourceId name").lean().exec()
                )
            )
        );
    });

    test("Validate commit scrape and raw set equality", async () => {
        if (JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS).length == 0) return;

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const allCommits = JSON.parse(process.env.TEST_ALL_COMMITS);

        let allScrapedCommits = JSON.parse(process.env.TEST_ALL_SCRAPED_COMMITS);

        repositories.map((repo, i) =>
            compareSets(repo, "commits", allCommits[i], allScrapedCommits[i])
        );
    });

    test("Validate commit names", async () => {
        if (JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS).length == 0) return;

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const allCommits = JSON.parse(process.env.TEST_ALL_COMMITS);

        const allScrapedCommits = JSON.parse(process.env.TEST_ALL_SCRAPED_COMMITS);

        repositories.map((repo, i) =>
            compareFields(repo, "commits", allCommits[i], allScrapedCommits[i], "name")
        );
    });

    test("Acquire scraped and raw pull requests", async () => {
        if (JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS).length == 0) return;

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        // acquire commits for each repository from github API
        process.env.TEST_ALL_PULL_REQUESTS = JSON.stringify(
            await acquireRepositoryRawPullRequests(repositories)
        );

        // acquire commits for each repository from database
        process.env.TEST_ALL_SCRAPED_PULL_REQUESTS = JSON.stringify(
            await Promise.all(
                repositories.map((repo) =>
                    PullRequest.find({
                        repository: repo._id,
                    })
                        .select("_id sourceId name")
                        .lean()
                        .exec()
                )
            )
        );
    });

    test("Validate pull request sets", async () => {
        if (JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS).length == 0) return;

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const allPullRequests = JSON.parse(process.env.TEST_ALL_PULL_REQUESTS);

        const allScrapedPullRequests = JSON.parse(process.env.TEST_ALL_SCRAPED_PULL_REQUESTS);

        repositories.map((repo, i) =>
            compareSets(repo, "pulls", allPullRequests[i], allScrapedPullRequests[i])
        );
    });

    test("Validate pull request names", async () => {
        if (JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS).length == 0) return;

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const allPullRequests = JSON.parse(process.env.TEST_ALL_PULL_REQUESTS);

        const allScrapedPullRequests = JSON.parse(process.env.TEST_ALL_SCRAPED_PULL_REQUESTS);

        repositories.map((repo, i) =>
            compareFields(repo, "pulls", allPullRequests[i], allScrapedPullRequests[i], "name")
        );
    });

    test("Validate pull request descriptions", async () => {
        if (JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS).length == 0) return;

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const allPullRequests = JSON.parse(process.env.TEST_ALL_PULL_REQUESTS);

        const allScrapedPullRequests = JSON.parse(process.env.TEST_ALL_SCRAPED_PULL_REQUESTS);

        repositories.map((repo, i) =>
            compareFields(
                repo,
                "pulls",
                allPullRequests[i],
                allScrapedPullRequests[i],
                "description"
            )
        );
    });

    test("Acquire scraped and raw issues", async () => {
        if (JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS).length == 0) return;

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const allPullRequests = JSON.parse(process.env.TEST_ALL_PULL_REQUESTS);

        process.env.TEST_ALL_ISSUES = JSON.stringify(
            await acquireRepositoryRawIssues(repositories, allPullRequests)
        );

        process.env.TEST_ALL_SCRAPED_ISSUES = JSON.stringify(
            await Promise.all(
                repositories.map((repo) => {
                    return IntegrationTicket.find({
                        repositoryId: repo._id,
                        source: "github",
                    })
                        .select("_id sourceId name")
                        .lean()
                        .exec();
                })
            )
        );
    });

    test("Validate equality of scraped and raw issue sets", async () => {
        if (JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS).length == 0) return;

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const allIssues = JSON.parse(process.env.TEST_ALL_ISSUES);

        const allScrapedIssues = JSON.parse(process.env.TEST_ALL_SCRAPED_ISSUES);

        repositories.map((repo, i) =>
            compareSets(repo, "issues", allIssues[i], allScrapedIssues[i])
        );
    });

    test("Validate issue names", async () => {
        if (JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS).length == 0) return;

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const allIssues = JSON.parse(process.env.TEST_ALL_ISSUES);

        const allScrapedIssues = JSON.parse(process.env.TEST_ALL_SCRAPED_ISSUES);

        repositories.map((repo, i) =>
            compareFields(repo, "issues", allIssues[i], allScrapedIssues[i], "name")
        );
    });

    test("Validate issue descriptions", async () => {
        if (JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS).length == 0) return;

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const allIssues = JSON.parse(process.env.TEST_ALL_ISSUES);

        const allScrapedIssues = JSON.parse(process.env.TEST_ALL_SCRAPED_ISSUES);

        repositories.map((repo, i) =>
            compareFields(repo, "issues", allIssues[i], allScrapedIssues[i], "description")
        );
    });
});

/* 
    Bug -- looks like scraped message is not acquiring message past new lines 
    
    rxi/microui 49 vs 48 commits
    no-Dark/Adult message difference  ---  Update Most Visited Adult Websites in Mainland China.csv "- 2018-12"
    cdarwin/go-koans message difference --- Merge pull request #25 from craigjbass/master
    uber-go/goleak 42 vs 38
    googollee/eviltransform message difference --- Matlab Version & new exact methed mars2wgs
    gawel/pyquery 444 vs 430
*/

// Possible test improvements: batching pages for commits

/* 
    totond/TextPathView 5 vs 0 pulls

    Pull request behavior -- undefined description when it is empty string?
    totond/TextPathView - Description not populated correctly
    t32k/stylestats - Description not populated correctly
*/
