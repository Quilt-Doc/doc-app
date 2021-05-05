// models
const InsertHunk = require("../../models/InsertHunk");
const Commit = require("../../models/Commit");
const PullRequest = require("../../models/PullRequest");

//logging
const { logger } = require("../../fs_logging");

//utility
const { checkValid } = require("../../utils/utils");
const _ = require("lodash");
const sw = require("stopword");

queryPipeline = async (req, res) => {
    const { repositoryId, workspaceId } = req.params;

    let { query } = req.body;

    query = extractQueryKeywords(query);

    const [commits, pullRequests] = searchRepositoryContent(query);

    const hunks = acquireHunks([commits, pullRequests]);

    console.log("Hunks", hunks);
};

extractQueryKeywords = (query) => {
    return sw.removeStopwords(query, sw.en).join(" ");
};

searchRepositoryContent = async (query, repositoryId) => {
    const queries = [Commit, PullRequest].map((model) =>
        model
            .find(
                {
                    $text: {
                        $search: {
                            query,
                            fuzzy: {
                                maxEdits: 2,
                                maxExpansions: 50,
                            },
                        },
                        $language: "english",
                    },
                    repository: repositoryId,
                },
                { score: { $meta: "textScore" } }
            )
            .sort({ score: { $meta: "textScore" } })
            .lean()
    );

    let results;

    try {
        results = await Promise.all(queries);
    } catch (e) {
        throw new Error(e);
    }

    const [commits, pullRequests] = results;

    console.log("Commit Output", commits);

    console.log("PullRequest Output", pullRequests);

    return [commits, pullRequests];
};

acquireHunks = async (repositoryContent) => {
    const queries = ["commitSha", "pullRequestNumber"].map((field, i) => {
        InsertHunk.find({
            [field]: {
                $in: repositoryContent[i].map((item) => item.sourceId),
            },
        });
    });

    let results;

    try {
        results = await Promise.all(queries);
    } catch (e) {
        throw new Error(e);
    }

    const [commitHunks, pullRequestHunks] = results;

    return {
        commitHunks,
        pullRequestHunks,
    };
};

module.exports = {
    queryPipeline,
};
