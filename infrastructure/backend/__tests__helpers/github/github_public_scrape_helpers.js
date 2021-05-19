//utility
const _ = require("lodash");

// api
const apis = require("../../apis/api");

// backend client
const backendClient = apis.requestTestingUserBackendClient();
const publicClient = apis.requestPublicClient();

// logger
const { logger } = require("../../fs_logging");

const shuffle = (array) => {
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

const sampleGithubRepositories = async (queryFilters) => {
    const func = "sampleGithubRepositories";

    const { stars, repoSize, numRepos } = queryFilters;

    logger.info(`Entered with parameters: ${stars} ${repoSize} ${numRepos}`, {
        func,
    });

    const publicClient = apis.requestPublicClient();

    const repoSizeFilter = repoSize ? `size:${repoSize}` : "";

    const starsFilter = stars ? `stars:${stars}` : "";

    const q = encodeURIComponent(`${repoSizeFilter} ${starsFilter}`);

    const requestUrl = `/search/repositories?q=${q}&per_page=${100}&page=${1}`;

    logger.info(`Encoded requestUrl: ${requestUrl}`, { func });

    let repositories;

    try {
        const response = await publicClient.get(requestUrl);

        repositories = response.data.items.map((repo) => repo.html_url);
    } catch (e) {
        logger.error("Error occurred during call of Github API", {
            func,
            e: e.data ? e.data.message : e,
        });

        return null;
    }

    // HARDCODED REPOS
    //repositories = ["https://github.com/t32k/stylestats"];

    logger.info(`Received ${repositories.length} repositories`, {
        func,
        obj: repositories,
    });

    let arr = [];

    for (let i = 0; i < repositories.length; i++) {
        arr.push(i);
    }

    let indices = shuffle(arr).slice(0, numRepos);

    return indices.map((index) => repositories[index]);
};

const createPublicWorkspace = async (repoUrls, creatorId = process.env.TEST_USER_ID) => {
    const func = "createPublicWorkspace";

    const requests = repoUrls.map((url) => {
        return backendClient.post("/repositories/init", {
            isPublic: true,
            publicHtmlUrl: url,
        });
    });

    let responses;

    try {
        responses = await Promise.all(requests);
    } catch (e) {
        logger.error("Error occurred during initialization of public repos", {
            func,
            e,
        });
    }

    const repositories = responses.map((response) => response.data.result);

    logger.info(`Initialized ${repositories.length} repositories`, {
        func,
        obj: repositories,
    });

    logger.info("Parameters to workspace creation set", {
        func,
        obj: {
            repositoryIds: repositories.map((repo) => repo._id),
            creatorId,
            public: true,
            name: "Bulk Scrape Validation Testing Workspace",
        },
    });

    let response = await backendClient.post("/workspaces/create", {
        repositoryIds: repositories.map((repo) => repo._id),
        creatorId,
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
        response = await backendClient.get(`/workspaces/get/${workspace._id}`);

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

    return { workspace, repositories };
};

const paginateResponse = async (client, baseUrl, queryParams = {}) => {
    const func = "paginateResponse";

    let objects = [];

    let page = 1;

    let loop = true;

    queryParams = _.isEmpty(queryParams)
        ? ""
        : Object.keys(queryParams).map((param) => `&${param}=${queryParams[param]}`);

    // loop through until all objects from each page are retrieved
    while (loop) {
        const route = `${baseUrl}?page=${page}&per_page=100${queryParams}`;

        let response;

        let newObjects;

        try {
            // extract a page
            response = await client.get(route);

            newObjects = response.data;
        } catch (e) {
            logger.error(`Error occured calling Github API with route: ${route}`, {
                e: e.data ? e.data.message : e,
                func,
            });

            throw new Error(e);
        }

        const count = newObjects.length;

        // push page objects to final array
        objects.push(newObjects);

        // break if count of page is either 0 or not full
        if (count == 0 || count != 100) loop = false;

        page += 1;
    }

    return objects.flat();
};

const acquireRepositoryRawCommits = async (repositories) => {
    const func = "acquireRepositoryRawCommits";

    const publicClient = apis.requestPublicClient();

    let allCommits = [];

    logger.info(`Received ${repositories.length} repositories`, {
        func,
        obj: repositories,
    });

    for (let i = 0; i < repositories.length; i++) {
        let repo = repositories[i];

        const branches = await paginateResponse(publicClient, `/repos/${repo.fullName}/branches`);

        logger.info(`Found ${branches.length} branches on ${repo.fullName}`, {
            func,
            obj: branches,
        });

        let commits = [];

        for (let j = 0; j < branches.length; j++) {
            let branch = branches[j];

            let branchCommits = await paginateResponse(
                publicClient,
                `/repos/${repo.fullName}/commits`,
                { sha: branch.name }
            );

            commits.push(branchCommits);
        }

        commits = commits.flat();

        logger.info(`Found ${commits.flat().length} commits across all branches`, {
            func,
        });

        const uniqueShas = Array.from(new Set(commits.flat().map((commit) => commit.sha)));

        logger.info(`Found ${uniqueShas.length} unique commits`, {
            func,
        });

        commits = _.mapKeys(commits, "sha");

        commits = uniqueShas.map((sha) => commits[sha]);

        allCommits.push(commits);
    }

    logger.info(`Pushed all commits for each of ${allCommits.length} repositories`, {
        func,
        obj: allCommits.map((commits) => commits.map((commit) => commit.sha)),
    });

    return allCommits;
};

const acquireRepositoryRawPullRequests = async (repositories) => {
    const func = "acquireRepositoryRawPullRequests";

    logger.info(`Received ${repositories.length} repositories`, {
        func,
        obj: repositories,
    });

    const publicClient = apis.requestPublicClient();

    let allPullRequests = [];

    for (let i = 0; i < repositories.length; i++) {
        const repo = repositories[i];

        let pulls = await paginateResponse(publicClient, `/repos/${repo.fullName}/pulls`, {
            state: "all",
        });

        logger.info(`Received ${pulls.length} pull requests for repository ${repo.fullName}`, {
            func,
            obj: pulls.map((pull) => pull.number),
        });

        allPullRequests.push(pulls);
    }

    return allPullRequests;
};

const acquireRepositoryRawIssues = async (repositories, allPullRequests) => {
    const func = "acquireRepositoryRawIssues";

    logger.info(`Received ${repositories.length} repositories`, {
        func,
        obj: repositories,
    });

    const publicClient = apis.requestPublicClient();

    let allIssues = [];

    for (let i = 0; i < repositories.length; i++) {
        const repo = repositories[i];

        let issues = await paginateResponse(publicClient, `/repos/${repo.fullName}/issues`, {
            state: "all",
        });

        let pulls = allPullRequests[i];

        let pullRequestSet = new Set(pulls.map((pull) => pull.number));

        issues = issues.filter((issue) => !pullRequestSet.has(issue.number));

        logger.info(`Received ${issues.length} issues for repository ${repo.fullName}`, {
            func,
            obj: issues.map((issue) => issue.number),
        });

        allIssues.push(issues);
    }

    return allIssues;
};

const areSetsEqual = (a, b) => a.size === b.size && [...a].every((value) => b.has(value));

const compareSets = async (repo, type, raw, scraped) => {
    const { fullName } = repo;

    let currentResults = JSON.parse(process.env.CURRENT_RESULTS);

    let results = currentResults[fullName][type];

    const identifier = type == "commits" ? "sha" : "number";

    const scrapedSet = new Set(scraped.map((item) => item.sourceId));

    const rawSet = new Set(raw.map((item) => `${item[identifier]}`));

    let hasFailed = false;

    if (!areSetsEqual(scrapedSet, rawSet)) {
        const rawDiff = raw
            .filter((item) => !scrapedSet.has(`${item[identifier]}`))
            .map((item) => item[identifier]);

        const scrapedDiff = scraped
            .filter((item) => !rawSet.has(item.sourceId))
            .map((item) => item.sourceId);

        hasFailed = true;

        if (type == "commits" && Array.from(rawDiff).length === 0) {
            hasFailed = false;

            const shas = Array.from(scrapedDiff);

            const commitRequests = shas.map((sha) =>
                publicClient.get(`/repos/${fullName}/commits/${sha}`)
            );

            const responses = await Promise.all(commitRequests);

            responses.map((response) => {
                const commit = response.data;

                if (!commit.sha) hasFailed = true;
            });
        }

        if (hasFailed) {
            results["length"] = {
                status: "ERROR",
                data: {
                    rawCount: raw.length,
                    scrapedCount: scraped.length,
                    rawDiff,
                    scrapedDiff,
                },
            };

            process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
        }
    }

    expect(!hasFailed).toBe(true);

    results["length"] = "SUCCESS";

    process.env.CURRENT_RESULTS = JSON.stringify(currentResults);

    logger.info(`Validated repository ${repo.fullName} set equality for ${type}`, {
        func: "measureLengths",
        obj: repo,
    });
};

const compareFields = (repo, type, raw, scraped, fieldName) => {
    let currentResults = JSON.parse(process.env.CURRENT_RESULTS);

    const { fullName } = repo;

    const identifier = type == "commits" ? "sha" : "number";

    let results = currentResults[fullName][type];

    raw = _.mapKeys(raw, identifier);

    scraped.map((item) => {
        const { sourceId } = item;

        const rawItem = raw[sourceId];

        if (!rawItem) return;

        const scrapedField = item[fieldName];

        const rawField =
            fieldName == "name"
                ? type == "commits"
                    ? rawItem["commit"]["message"]
                    : rawItem["title"]
                : rawItem["body"];

        if (rawField != scrapedField) {
            results[fieldName] = {
                status: "ERROR",
                data: {
                    sourceId,
                    raw: rawField,
                    scraped: scrapedField,
                },
            };

            process.env.CURRENT_RESULTS = JSON.stringify(currentResults);
        }

        expect(rawField).toEqual(scrapedField);
    });

    results[fieldName] = "SUCCESS";

    process.env.CURRENT_RESULTS = JSON.stringify(currentResults);

    logger.info(`Validated repository ${repo.fullName} ${fieldName}s for ${type}`, {
        func: "compareFields",
        obj: repo,
    });
};

module.exports = {
    sampleGithubRepositories,
    createPublicWorkspace,
    acquireRepositoryRawCommits,
    acquireRepositoryRawPullRequests,
    acquireRepositoryRawIssues,
    compareFields,
    compareSets,
};
