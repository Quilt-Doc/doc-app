require("dotenv").config();

//utility
const _ = require("lodash");

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
const NUM_STARS = "1000..2000";
const REPO_SIZE = "300..500";
const NUM_REPOS = 1;

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
    if (process.env.TEST_WORKSPACE) {
        const workspace = JSON.parse(process.env.TEST_WORKSPACE);

        await deleteWorkspace(workspace._id);
    }

    const workspaces = await Workspace.find({ creator: TEST_USER_ID });

    for (let i = 0; i < workspaces.length; i++) {
        await deleteWorkspace(workspaces[i]._id);
    }
});

describe("Basic public github scrape validation", () => {
    test("Sample repositories for validation", async () => {
        const func = "Sample repositories for pipeline display validation";

        // acquire some sample with parameters delineated above
        const repos = await sampleGithubRepositories({
            stars: NUM_STARS,
            repoSize: REPO_SIZE,
            numRepos: NUM_REPOS,
        });

        logger.info(`Sampled ${repos.length} repositories`, {
            func,
            obj: repos,
        });

        process.env.TEST_SAMPLE_REPOSITORIES = JSON.stringify(repos);
    });

    test("Scrape sample repositories and create workspace successfully", async () => {
        const repoUrls = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const { workspace, repositories } = await createPublicWorkspace(repoUrls);

        process.env.TEST_WORKSPACE = JSON.stringify(workspace);

        process.env.TEST_SAMPLE_REPOSITORIES = JSON.stringify(repositories);
    });

    test("Validate commit scraping", async () => {
        const func = "Validate commit scraping";

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        // acquire commits for each repositories from github API
        const allCommits = await acquireRepositoryRawCommits(repositories);

        for (let i = 0; i < repositories.length; i++) {
            const repo = repositories[i];

            let rawCommits = allCommits[i];

            // acquire scraped commits using git cli
            const repoCommits = await Commit.find({ repository: repo._id })
                .select("_id sourceId name")
                .lean()
                .exec();

            // DEBUGGING PURPOSES to reveal commit differences
            /*
            if (repoCommits.length != rawCommits.length) {
                const isRawGreater = repoCommits.length > rawCommits.length;

                console.log(`isRawGreater: ${isRawGreater}`);

                if (isRawGreater) {
                    const repoCommitsSet = new Set(repoCommits.map((commit) => commit.sourceId));

                    console.log(
                        "Not Matching Raw Commits",
                        rawCommits.filter((commit) => !repoCommitsSet.has(commit.sha))
                    );
                } else {
                    const rawCommitsSet = new Set(rawCommits.map((commit) => commit.sha));

                    console.log(
                        "Not Matching Repo Commits",
                        repoCommits.filter((commit) => !rawCommitsSet.has(commit.sourceId))
                    );
                }
            }*/

            expect(repoCommits.length).toEqual(rawCommits.length);

            rawCommits = _.mapKeys(rawCommits, "sha");

            repoCommits.map((commit) => {
                const { sourceId, name } = commit;

                const rawCommit = rawCommits[sourceId];

                expect(rawCommit).toBeDefined();

                expect(rawCommit).not.toBeNull();

                // DEBUGGING PURPOSES
                if (rawCommit["commit"]["message"] != commit.name) {
                    console.log("Raw message", rawCommit["commit"]["message"]);

                    console.log("Scraped message", name);
                }

                expect(name).toEqual(rawCommit["commit"]["message"]);
            });

            logger.info(`Validated repository ${repo.fullName} commits`, {
                func,
                obj: repo,
            });
        }
    });

    test("Validate pull request scraping", async () => {
        const func = "Validate pull request scraping";

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        // acquire pull requests for every repository
        const allPullRequests = await acquireRepositoryRawPullRequests(repositories);

        for (let i = 0; i < repositories.length; i++) {
            const repo = repositories[i];

            let rawPullRequests = allPullRequests[i];

            // acquire scraped pull requests
            const repoPullRequests = await PullRequest.find({
                repository: repo._id,
            })
                .select("_id sourceId name")
                .lean()
                .exec();

            // validate length
            expect(repoPullRequests.length).toEqual(rawPullRequests.length);

            rawPullRequests = _.mapKeys(rawPullRequests, "number");

            // validate simple content
            repoPullRequests.map((pull) => {
                let { sourceId, name, description } = pull;

                if (name == undefined) name = "";

                if (description == undefined) description = "";

                const rawPull = rawPullRequests[sourceId];

                const { title, number, body } = rawPull;

                expect(name).toEqual(title);

                expect(parseInt(sourceId)).toEqual(number);

                expect(description).toEqual(body);
            });

            logger.info(`Validated repository ${repo.fullName} pull requests`, {
                func,
                obj: repo,
            });
        }

        process.env.TEST_PULL_REQUESTS = JSON.stringify(allPullRequests);
    });

    test("Validate issue scraping", async () => {
        const func = "Validate issue scraping";

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const allPullRequests = JSON.parse(process.env.TEST_PULL_REQUESTS);

        // acquire all issues that are not pull requests from github API
        const allIssues = await acquireRepositoryRawIssues(repositories, allPullRequests);

        for (let i = 0; i < repositories.length; i++) {
            const repo = repositories[i];

            let rawIssues = allIssues[i];

            // find scraped issues
            const repoIssues = await IntegrationTicket.find({
                repositoryId: repo._id,
                source: "github",
            })
                .select("_id sourceId name")
                .lean()
                .exec();

            // validate length
            expect(repoIssues.length).toEqual(rawIssues.length);

            rawIssues = _.mapKeys(rawIssues, "number");

            // validate fields
            repoIssues.map((issue) => {
                let { sourceId, name, description } = issue;

                if (name == undefined) name = "";

                if (description == undefined) description = "";

                const rawIssue = rawIssues[sourceId];

                const { title, number, body } = rawIssue;

                expect(name).toEqual(title);

                expect(parseInt(sourceId)).toEqual(number);

                expect(description).toEqual(body);
            });

            logger.info(`Validated repository ${repo.fullName} issues`, {
                func,
                obj: repo,
            });
        }
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
