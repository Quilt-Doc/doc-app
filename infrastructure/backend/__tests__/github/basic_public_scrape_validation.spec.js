require("dotenv").config();

//utility
const _ = require("lodash");
const fs = require("fs");

// mongoose
const mongoose = require("mongoose");

// models
const Commit = require("../../models/Commit");
const PullRequest = require("../../models/PullRequest");
const Workspace = require("../../models/Workspace");
const IntegrationTicket = require("../../models/integrations/integration_objects/IntegrationTicket");

// logger
const { logger } = require("../../fs_logging");

// util helpers
const { deleteWorkspace } = require("../../__tests__config/utils");
const {
    sampleGithubRepositories,
    acquireRepositoryRawCommits,
    acquireRepositoryRawPullRequests,
    acquireRepositoryRawIssues,
    createPublicWorkspace,
} = require("../../__tests__helpers/github/github_scrape_test_helpers");

// env variables
const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

// constants -- parameters to sampling function
const NUM_STARS = "10..2000";
const REPO_SIZE = "100..200";
const NUM_REPOS = 1;
// 0 -- sample, 1 -- repeat, 2 -- run all successes, 3 -- run all
// or array of specific repoUrls
const SAMPLE_OPTION = 1;

// paths of stored json
const PREVIOUS_PATH = "./__tests__output/basic_public_scrape_validation_test_previous_output.json";
const CURRENT_PATH = "./__tests__output/basic_public_scrape_validation_test_output.json";

// set up mongodb connection
beforeAll(async () => {
    const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

    await mongoose.connect(dbRoute, { useNewUrlParser: true });

    let db = mongoose.connection;

    db.once("open", () => console.log("connected to the database"));

    db.on("error", console.error.bind(console, "MongoDB connection error:"));

    process.env.isTesting = true;
});

// remove workspace artifacts
afterAll(async () => {
    console.log("We will still be deleting");
    if (process.env.TEST_WORKSPACE) {
        const workspace = JSON.parse(process.env.TEST_WORKSPACE);

        await deleteWorkspace(workspace._id);
    }

    const workspaces = await Workspace.find({ creator: TEST_USER_ID });

    for (let i = 0; i < workspaces.length; i++) {
        await deleteWorkspace(workspaces[i]._id);
    }

    if (process.env.PREVIOUS_RESULTS) {
        fs.writeFile(PREVIOUS_PATH, process.env.PREVIOUS_RESULTS, () => {});
    }

    if (process.env.CURRENT_RESULTS) {
        fs.writeFile(CURRENT_PATH, process.env.CURRENT_RESULTS, () => {});
    }
});

describe("Basic public github scrape validation", () => {
    test("Sample repositories for validation", async () => {
        const func = "Sample repositories for pipeline display validation";

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
        } else if (SAMPLE_OPTION == 1 && "lastTest" in previousResults) {
            repoUrls = Object.keys(previousResults["lastTest"]).map(
                (fullName) => previousResults["lastTest"][fullName]["htmlUrl"]
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
        }

        logger.info(`Sampled ${repoUrls.length} repositories`, {
            func,
            obj: repoUrls,
        });

        process.env.TEST_SAMPLE_REPOSITORY_URLS = JSON.stringify(repoUrls);
    });

    test("Scrape sample repositories and create workspace successfully", async () => {
        const func = "Scrape sample repositories and create workspace successfully";

        let previousResults = JSON.parse(process.env.PREVIOUS_RESULTS);

        const repoUrls = JSON.parse(process.env.TEST_SAMPLE_REPOSITORY_URLS);

        const { workspace, repositories } = await createPublicWorkspace(repoUrls);

        previousResults["lastTest"] = {};

        repositories.map((repo, i) => {
            const { fullName } = repo;

            if (fullName in previousResults) {
                const results = previousResults[fullName];

                logger.info(`Previous scrape result for ${fullName}: ${results["success"]}`, {
                    func,
                    obj: results,
                });
            }

            previousResults[fullName] = previousResults["lastTest"][fullName] = {
                commits: {
                    length: "PENDING",
                    name: "PENDING",
                },
                pulls: {
                    length: "PENDING",
                    name: "PENDING",
                },
                issues: {
                    length: "PENDING",
                    name: "PENDING",
                    description: "PENDING",
                },
                success: false,
                htmlUrl: repoUrls[i],
            };
        });

        process.env.CURRENT_RESULTS = JSON.stringify(previousResults);

        process.env.TEST_WORKSPACE = JSON.stringify(workspace);

        process.env.TEST_SAMPLE_REPOSITORIES = JSON.stringify(repositories);
    });

    test("Validate commit scraping", async () => {
        const func = "Validate commit scraping";

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        let currentResults = JSON.parse(process.env.CURRENT_RESULTS);

        // acquire commits for each repositories from github API
        const allCommits = await acquireRepositoryRawCommits(repositories);

        for (let i = 0; i < repositories.length; i++) {
            const repo = repositories[i];

            const { fullName } = repo;

            let rawCommits = allCommits[i];

            // acquire scraped commits using git cli
            const repoCommits = await Commit.find({ repository: repo._id })
                .select("_id sourceId name")
                .lean()
                .exec();

            // reveal commit differences
            if (repoCommits.length != rawCommits.length) {
                const isRawGreater = rawCommits.length > repoCommits.length;

                const repoCommitsSet = new Set(repoCommits.map((commit) => commit.sourceId));

                const rawCommitsSet = new Set(rawCommits.map((commit) => commit.sha));

                if (isRawGreater) {
                    currentResults[fullName]["commits"]["length"] = currentResults["lastTest"][
                        fullName
                    ]["commits"]["length"] = {
                        status: "ERROR",
                        data: {
                            isRawGreater,
                            rawCount: rawCommits.length,
                            scrapeCount: repoCommits.length,
                            diff: rawCommits
                                .filter((commit) => !repoCommitsSet.has(commit.sha))
                                .map((commit) => commit.sha),
                            diff2: repoCommits
                                .filter((commit) => !rawCommitsSet.has(commit.sourceId))
                                .map((commit) => commit.sourceId),
                        },
                    };

                    process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
                } else {
                    currentResults[fullName]["commits"]["length"] = currentResults["lastTest"][
                        fullName
                    ]["commits"]["length"] = {
                        status: "ERROR",
                        data: {
                            isRawGreater,
                            rawCount: rawCommits.length,
                            scrapeCount: repoCommits.length,
                            diff: repoCommits
                                .filter((commit) => !rawCommitsSet.has(commit.sourceId))
                                .map((commit) => commit.sourceId),
                            diff2: rawCommits
                                .filter((commit) => !repoCommitsSet.has(commit.sha))
                                .map((commit) => commit.sha),
                        },
                    };

                    process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
                }
            }

            expect(repoCommits.length).toEqual(rawCommits.length);

            currentResults[fullName]["commits"]["length"] = currentResults["lastTest"][fullName][
                "commits"
            ]["length"] = "SUCCESS";

            rawCommits = _.mapKeys(rawCommits, "sha");

            repoCommits.map((commit) => {
                const { sourceId, name } = commit;

                const rawCommit = rawCommits[sourceId];

                expect(rawCommit).toBeDefined();

                expect(rawCommit).not.toBeNull();

                // DEBUGGING PURPOSES
                if (rawCommit["commit"]["message"] != commit.name) {
                    currentResults[fullName]["commits"]["name"] = currentResults["lastTest"][
                        fullName
                    ]["commits"]["name"] = {
                        status: "ERROR",
                        data: {
                            sourceId,
                            rawName: rawCommit["commit"]["message"],
                            scrapedName: name,
                        },
                    };

                    process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
                }

                expect(name).toEqual(rawCommit["commit"]["message"]);
            });

            currentResults[fullName]["commits"]["name"] = currentResults["lastTest"][fullName][
                "commits"
            ]["name"] = "SUCCESS";

            logger.info(`Validated repository ${repo.fullName} commits`, {
                func,
                obj: repo,
            });
        }

        process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
    });

    /*
    test("Validate pull request scraping", async () => {
        const func = "Validate pull request scraping";

        const currentResults = JSON.parse(process.env.CURRENT_RESULTS);

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        // acquire pull requests for every repository
        const allPullRequests = await acquireRepositoryRawPullRequests(repositories);

        for (let i = 0; i < repositories.length; i++) {
            const repo = repositories[i];

            const { fullName } = repo;

            let rawPullRequests = allPullRequests[i];

            // acquire scraped pull requests
            const repoPullRequests = await PullRequest.find({
                repository: repo._id,
            })
                .select("_id sourceId name")
                .lean()
                .exec();

            if (repoPullRequests.length != rawPullRequests.length) {
                const isRawGreater = repoPullRequests.length < rawPullRequests.length;

                if (isRawGreater) {
                    const repoPullsSet = new Set(
                        repoPullRequests.map((pull) => parseInt(pull.sourceId))
                    );

                    currentResults[fullName]["pulls"]["length"] = currentResults["lastTest"][
                        fullName
                    ]["pulls"]["length"] = {
                        status: "ERROR",
                        data: {
                            isRawGreater,
                            rawCount: rawPullRequests.length,
                            scrapeCount: repoPullRequests.length,
                            diff: rawPullRequests
                                .filter((pull) => !repoPullsSet.has(pull.number))
                                .map((pull) => pull.number),
                        },
                    };

                    process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
                } else {
                    const rawPullsSet = new Set(rawPullRequests.map((pull) => pull.number));

                    currentResults[fullName]["pulls"]["length"] = currentResults["lastTest"][
                        fullName
                    ]["pulls"]["length"] = {
                        status: "ERROR",
                        data: {
                            isRawGreater,
                            rawCount: rawPullRequests.length,
                            scrapeCount: repoPullRequests.length,
                            diff: rawPullRequests
                                .filter((pull) => !rawPullsSet.has(parseInt(pull.sourceId)))
                                .map((pull) => parseInt(pull.sourceId)),
                        },
                    };

                    process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
                }
            }

            // validate length
            expect(repoPullRequests.length).toEqual(rawPullRequests.length);

            currentResults[fullName]["pulls"]["length"] = currentResults["lastTest"][fullName][
                "pulls"
            ]["length"] = "SUCCESS";

            rawPullRequests = _.mapKeys(rawPullRequests, "number");

            // validate simple content
            repoPullRequests.map((pull) => {
                let { sourceId, name, description } = pull;

                if (name == undefined) name = "";

                if (description == undefined) description = "";

                const rawPull = rawPullRequests[sourceId];

                const { title, number, body } = rawPull;

                if (name != title) {
                    currentResults[fullName]["pulls"]["name"] = currentResults["lastTest"][
                        fullName
                    ]["pulls"]["name"] = {
                        status: "ERROR",
                        data: {
                            sourceId,
                            rawName: title,
                            scrapedName: name,
                        },
                    };

                    process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
                }

                expect(name).toEqual(title);

                if (number != parseInt(sourceId)) {
                    currentResults[fullName]["pulls"]["sourceId"] = currentResults["lastTest"][
                        fullName
                    ]["pulls"]["sourceId"] = {
                        status: "ERROR",
                        data: {
                            sourceId,
                            rawSourceId: number,
                            scrapedSourceId: parseInt(sourceId),
                        },
                    };

                    process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
                }

                expect(parseInt(sourceId)).toEqual(number);

                if (description != body) {
                    currentResults[fullName]["pulls"]["description"] = currentResults["lastTest"][
                        fullName
                    ]["pulls"]["description"] = {
                        status: "ERROR",
                        data: {
                            sourceId,
                            rawDescription: body,
                            scrapedDescription: description,
                        },
                    };

                    process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
                }

                expect(description).toEqual(body);
            });

            currentResults[fullName]["pulls"]["name"] = currentResults["lastTest"][fullName][
                "pulls"
            ]["name"] = "SUCCESS";

            currentResults[fullName]["pulls"]["sourceId"] = currentResults["lastTest"][fullName][
                "pulls"
            ]["sourceId"] = "SUCCESS";

            currentResults[fullName]["pulls"]["description"] = currentResults["lastTest"][fullName][
                "pulls"
            ]["description"] = "SUCCESS";

            logger.info(`Validated repository ${repo.fullName} pull requests`, {
                func,
                obj: repo,
            });
        }

        process.env.CURRENT_RESULTS = JSON.stringify(currentResults);

        process.env.TEST_PULL_REQUESTS = JSON.stringify(allPullRequests);
    });*/

    /*
    test("Validate issue scraping", async () => {
        const func = "Validate issue scraping";

        const currentResults = JSON.parse(process.env.CURRENT_RESULTS);

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const allPullRequests = JSON.parse(process.env.TEST_PULL_REQUESTS);

        // acquire all issues that are not pull requests from github API
        const allIssues = await acquireRepositoryRawIssues(repositories, allPullRequests);

        for (let i = 0; i < repositories.length; i++) {
            const repo = repositories[i];

            const { fullName } = repo;

            let rawIssues = allIssues[i];

            // find scraped issues
            const repoIssues = await IntegrationTicket.find({
                repositoryId: repo._id,
                source: "github",
            })
                .select("_id sourceId name")
                .lean()
                .exec();

            if (repoIssues.length != rawIssues.length) {
                const isRawGreater = repoIssues.length < rawIssues.length;

                if (isRawGreater) {
                    const repoIssuesSet = new Set(
                        repoIssues.map((issue) => parseInt(issue.sourceId))
                    );

                    currentResults[fullName]["issues"]["length"] = currentResults["lastTest"][
                        fullName
                    ]["issues"]["length"] = {
                        status: "ERROR",
                        data: {
                            isRawGreater,
                             rawCount: rawIssues.length,
                            scrapeCount: repoIssues.length,
                            diff: rawIssues
                                .filter((issue) => !repoIssuesSet.has(issue.number))
                                .map((issue) => issue.number),
                        },
                    };

                    process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
                } else {
                    const rawIssuesSet = new Set(rawIssues.map((issue) => issue.number));

                    currentResults[fullName]["issues"]["length"] = currentResults["lastTest"][
                        fullName
                    ]["issues"]["length"] = {
                        status: "ERROR",
                        data: {
                            isRawGreater,
                            rawCount: rawIssues.length,
                            scrapeCount: repoIssues.length,
                            diff: rawIssues
                                .filter((issue) => !rawIssuesSet.has(parseInt(issue.sourceId)))
                                .map((issue) => parseInt(issue.sourceId)),
                        },
                    };

                    process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
                }
            }

            // validate length
            expect(repoIssues.length).toEqual(rawIssues.length);

            currentResults[fullName]["issues"]["length"] = currentResults["lastTest"][fullName][
                "issues"
            ]["length"] = "SUCCESS";

            rawIssues = _.mapKeys(rawIssues, "number");

            // validate fields
            repoIssues.map((issue) => {
                let { sourceId, name, description } = issue;

                if (name == undefined) name = "";

                if (description == undefined) description = "";

                const rawIssue = rawIssues[sourceId];

                const { title, number, body } = rawIssue;

                if (name != title) {
                    currentResults[fullName]["issues"]["name"] = currentResults["lastTest"][
                        fullName
                    ]["issues"]["name"] = {
                        status: "ERROR",
                        data: {
                            sourceId,
                            rawName: title,
                            scrapedName: name,
                        },
                    };

                    process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
                }

                expect(name).toEqual(title);

                if (number != parseInt(sourceId)) {
                    currentResults[fullName]["issues"]["sourceId"] = currentResults["lastTest"][
                        fullName
                    ]["issues"]["sourceId"] = {
                        status: "ERROR",
                        data: {
                            sourceId,
                            rawSourceId: number,
                            scrapedSourceId: parseInt(sourceId),
                        },
                    };

                    process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
                }

                expect(parseInt(sourceId)).toEqual(number);

                if (description != body) {
                    currentResults[fullName]["issues"]["description"] = currentResults["lastTest"][
                        fullName
                    ]["issues"]["description"] = {
                        status: "ERROR",
                        data: {
                            sourceId,
                            rawDescription: body,
                            scrapedDescription: description,
                        },
                    };

                    process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
                }

                expect(description).toEqual(body);
            });

            currentResults[fullName]["issues"]["name"] = currentResults["lastTest"][fullName][
                "issues"
            ]["name"] = "SUCCESS";

            currentResults[fullName]["issues"]["sourceId"] = currentResults["lastTest"][fullName][
                "issues"
            ]["sourceId"] = "SUCCESS";

            currentResults[fullName]["issues"]["description"] = currentResults["lastTest"][
                fullName
            ]["issues"]["description"] = "SUCCESS";

            logger.info(`Validated repository ${repo.fullName} issues`, {
                func,
                obj: repo,
            });
        }

        process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
    }); */
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
