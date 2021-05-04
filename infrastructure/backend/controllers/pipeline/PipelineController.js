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
    let { query } = req.body;

    query = extractQueryKeywords(query);

    const [commits, pullRequests] = searchRepositoryContent(query);

    const hunks = acquireHunks([commits, pullRequests]);

    console.log("Hunks", hunks);
};

extractQueryKeywords = (query) => {
    return sw.removeStopwords(query, sw.en).join(" ");
};

searchRepositoryContent = async (query) => {
    const queries = [Commit, PullRequest].map((model) =>
        model
            .find(
                { $text: { $search: query } },
                { score: { $meta: "textScore" } }
            )
            .sort({ score: { $meta: "textScore" } })
            .lean()
    );

    const [commits, pullRequests] = await Promise.all(queries);

    console.log("Commit Output", commits);

    console.log("PullRequest Output", pullRequests);

    return [commits, pullRequests];
};

acquireHunks = (repositoryContent) => {};

module.exports = {
    queryPipeline,
};
