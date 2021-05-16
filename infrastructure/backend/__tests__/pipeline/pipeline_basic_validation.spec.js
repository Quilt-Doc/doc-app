require("dotenv").config();

//utility
const _ = require("lodash");

// mongoose
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

// models
const Commit = require("../../models/Commit");
const Branch = require("../../models/Branch");
const PullRequest = require("../../models/PullRequest");
const Workspace = require("../../models/Workspace");

// api
const apis = require("../../apis/api");

// logger
const { logger } = require("../../fs_logging");

// util helpers
const {
    createWorkspace,
    deleteWorkspace,
    removeWorkspaces,
} = require("../../__tests__config/utils");

const backendClient = apis.requestTestingUserBackendClient();

// env variables
const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

beforeAll(async () => {
    const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

    await mongoose.connect(dbRoute, { useNewUrlParser: true });

    let db = mongoose.connection;

    db.once("open", () => console.log("connected to the database"));

    db.on("error", console.error.bind(console, "MongoDB connection error:"));

    process.env.isTesting = true;
});

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

shuffle = (array) => {
    var currentIndex = array.length,
        temporaryValue,
        randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
};

sampleGithubRepositories = async (queryFilters) => {
    const func = "sampleGithubRepositories";

    const { stars, repoSize, numRepos } = queryFilters;

    logger.info(`Entered with parameters: ${stars} ${repoSize} ${numRepos}`, {
        func,
    });

    const publicClient = apis.requestPublicClient();

    const repoSizeFilter = repoSize ? `size:${repoSize}` : "";

    const starsFilter = stars ? `stars:${stars}` : "";

    const q = encodeURIComponent(`${repoSizeFilter} ${starsFilter}`);

    requestUrl = `/search/repositories?q=${q}&per_page=${100}&page=${1}`;

    logger.info(`Encoded requestUrl: ${requestUrl}`, { func });

    let repositories;

    try {
        const response = await publicClient.get(requestUrl);

        repositories = response.data.items.map((repo) => {
            const { html_url, full_name } = repo;

            return html_url;
        });
    } catch (e) {
        if (e.data) e = e.data.message;

        logger.error("Error occurred during call of Github API", {
            func,
            e,
        });

        return null;
    }

    // HARDCODED REPOS
    //repositories = ["https://github.com/t32k/stylestats"];

    arr = [];

    for (let i = 0; i < repositories.length; i++) {
        arr.push(i);
    }

    indices = shuffle(arr).slice(0, numRepos);

    logger.info(`Received ${repositories.length} repositories`, {
        func,
        obj: repositories,
    });

    return indices.map((index) => repositories[index]);
};

acquireRepositoryRawCommits = async (repositories) => {
    const func = "acquireRepositoryRawCommits";

    const publicClient = apis.requestPublicClient();

    let allCommits = [];

    logger.info(`Received ${repositories.length} repositories`, {
        func,
        obj: repositories,
    });

    for (let i = 0; i < repositories.length; i++) {
        let repo = repositories[i];

        let page = 1;

        let commits = [];

        let branches = [];

        while (true) {
            let newBranches = [];

            try {
                const response = await publicClient.get(
                    `/repos/${
                        repo.fullName
                    }/branches?page=${page}&per_page=${100}`
                );

                newBranches = response.data;
            } catch (e) {
                if (e.data) e = e.data.message;

                logger.error(
                    `Error occurred during call of Github API with repository ${repo.fullName}`,
                    {
                        func,
                        e,
                    }
                );

                throw new Error(e);
            }

            let count = newBranches.length;

            branches.push(newBranches);

            page += 1;

            if (count == 0 || count % 100 != 0) break;
        }

        page = 1;

        branches = branches.flat();

        logger.info(`Found ${branches.length} branches on ${repo.fullName}`, {
            func,
            obj: branches,
        });

        for (let j = 0; j < branches.length; j++) {
            let branch = branches[j];

            while (true) {
                let newCommits;

                try {
                    const response = await publicClient.get(
                        `/repos/${repo.fullName}/commits?page=${page}&per_page=100&sha=${branch.name}`
                    );

                    newCommits = response.data;
                } catch (e) {
                    if (e.data) e = e.data.message;

                    logger.error(
                        `Error occurred during call of Github API with repository ${repo.fullName}`,
                        {
                            func,
                            e,
                        }
                    );

                    throw new Error(e);
                }

                const count = newCommits.length;

                logger.debug(`Found ${count} commits on page ${page}`, {
                    func,
                    obj: newCommits.map((commit) => commit.sha),
                });

                commits.push(newCommits);

                page += 1;

                if (count == 0 || count % 100 != 0) break;
            }
        }

        commits = commits.flat();

        logger.info(
            `Found ${commits.flat().length} commits across all branches`,
            { func }
        );

        const uniqueShas = Array.from(
            new Set(commits.flat().map((commit) => commit.sha))
        );

        logger.info(`Found ${uniqueShas.length} unique commits`, {
            func,
        });

        commits = _.mapKeys(commits, "sha");

        commits = uniqueShas.map((sha) => commits[sha]);

        allCommits.push(commits);
    }

    logger.info(
        `Pushed all commits for each of ${allCommits.length} repositories`,
        {
            func,
            obj: allCommits.map((commits) =>
                commits.map((commit) => commit.sha)
            ),
        }
    );

    return allCommits;
};

acquireRepositoryRawPullRequests = async (repositories) => {
    const func = "acquireRepositoryRawPullRequests";

    logger.info(`Received ${repositories.length} repositories`, {
        func,
        obj: repositories,
    });

    const publicClient = apis.requestPublicClient();

    let allPullRequests = [];

    for (let i = 0; i < repositories.length; i++) {
        const repo = repositories[i];

        let pulls = [];

        let page = 1;

        while (true) {
            let newPulls;

            try {
                const response = await publicClient.get(
                    `/repos/${repo.fullName}/pulls?page=${page}&per_page=100&state=all`
                );

                newPulls = response.data;
            } catch (e) {
                if (e.data) e = e.data.message;

                logger.error(
                    `Error occurred during call of Github API with repository ${repo.fullName}`,
                    {
                        func,
                        e,
                    }
                );

                throw new Error(e);
            }

            pulls.push(newPulls);

            page += 1;

            if (newPulls.length == 0 || newPulls.length % 100 != 0) break;
        }

        pulls = pulls.flat();

        logger.info(
            `Received ${pulls.length} pull requests for repository ${repo.fullName}`,
            {
                func,
                obj: pulls.map((pull) => pull.number),
            }
        );

        console.log(
            "Unique pulls",
            Array.from(new Set(pulls.map((pull) => pull.number))).length
        );

        allPullRequests.push(pulls);
    }

    return allPullRequests;
};

describe("Pipeline Display Simple Query Validation", () => {
    test("Sample repositories for pipeline display validation", async () => {
        const func = "Sample repositories for pipeline display validation";

        const repos = await sampleGithubRepositories({
            stars: "1000..2000",
            repoSize: "300..500",
            numRepos: 3,
        });

        logger.info(`Sampled ${repos.length} repositories`, {
            func,
            obj: repos,
        });

        process.env.TEST_SAMPLE_REPOSITORIES = JSON.stringify(repos);
    });

    test("Scraped repositories successfully", async () => {
        const func = "Scraped repositories successfully";

        const repoUrls = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const requests = repoUrls.map((url) => {
            return backendClient.post(`repositories/init`, {
                isPublic: true,
                publicHtmlUrl: url,
            });
        });

        let responses = await Promise.all(requests);

        const repositories = responses.map((response) => response.data.result);

        logger.info(`Initialized ${repositories.length} repositories`, {
            func,
            obj: repositories,
        });

        logger.info("Parameters to workspace creation set", {
            func,
            obj: {
                repositoryIds: repositories.map((repo) => repo._id),
                creatorId: TEST_USER_ID,
                public: true,
                name: "Bulk Scrape Validation Testing Workspace",
            },
        });

        let response = await backendClient.post("/workspaces/create", {
            repositoryIds: repositories.map((repo) => repo._id),
            creatorId: TEST_USER_ID,
            public: true,
            name: "Bulk Scrape Validation Testing Workspace",
        });

        let workspace = response.data.result;

        logger.info(`Successfully initialized ${workspace.name}`, {
            func,
            obj: workspace,
        });

        response = await backendClient.get(`/workspaces/get/${workspace._id}`);

        workspace = response.data.result;

        while (workspace.setupComplete == false) {
            response = await backendClient.get(
                `/workspaces/get/${workspace._id}`
            );

            workspace = response.data.result;

            logger.info(`Polling workspace "${workspace.name}"`, {
                func,
                obj: workspace,
            });

            await new Promise((r) => setTimeout(r, 3000));
        }

        logger.info(`Workspace "${workspace.name}" setup complete`, {
            func,
            obj: workspace,
        });

        process.env.TEST_WORKSPACE = JSON.stringify(workspace);

        process.env.TEST_SAMPLE_REPOSITORIES = JSON.stringify(repositories);
    });

    /*
    test("Validate commit scraping", async () => {
        const func = "Validate commit scraping";

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const allCommits = await acquireRepositoryRawCommits(repositories);

        for (let i = 0; i < repositories.length; i++) {
            const repo = repositories[i];

            let rawCommits = allCommits[i];

            const repoCommits = await Commit.find({ repository: repo._id })
                .select("_id sourceId name")
                .lean()
                .exec();

            // DEBUGGING PURPOSES
            if (repoCommits.length != rawCommits.length) {
                const isRawGreater = repoCommits.length > rawCommits.length;

                console.log(`isRawGreater: ${isRawGreater}`);

                if (isRawGreater) {
                    const repoCommitsSet = new Set(
                        repoCommits.map((commit) => commit.sourceId)
                    );

                    console.log(
                        "Not Matching Raw Commits",
                        rawCommits.filter(
                            (commit) => !repoCommitsSet.has(commit.sha)
                        )
                    );
                } else {
                    const rawCommitsSet = new Set(
                        rawCommits.map((commit) => commit.sha)
                    );

                    console.log(
                        "Not Matching Repo Commits",
                        repoCommits.filter(
                            (commit) => !rawCommitsSet.has(commit.sourceId)
                        )
                    );
                }
            }

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
    });*/

    /*
    test("Validate pull requests", async () => {
        const func = "Validate pull requests";

        const repositories = JSON.parse(process.env.TEST_SAMPLE_REPOSITORIES);

        const allPullRequests = await acquireRepositoryRawPullRequests(
            repositories
        );

        for (let i = 0; i < repositories.length; i++) {
            const repo = repositories[i];

            let rawPullRequests = allPullRequests[i];

            const repoPullRequests = await PullRequest.find({
                repository: repo._id,
            })
                .select("_id sourceId name")
                .lean()
                .exec();

            expect(repoPullRequests.length).toEqual(rawPullRequests.length);

            rawPullRequests = _.mapKeys(rawPullRequests, "number");

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
    });*/
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
