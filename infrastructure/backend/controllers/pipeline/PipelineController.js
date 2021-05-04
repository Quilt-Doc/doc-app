// models
const InsertHunk = require("../../models/InsertHunk");

//logging
const { logger } = require("../../fs_logging");

//utility
const { checkValid } = require("../../utils/utils");
const _ = require("lodash");
const sw = require("stopword");

queryPipeline = async (req, res) => {
    let { query } = req.body;

    query = extractQueryKeywords(query);
};

extractQueryKeywords = (query) => {
    return sw.removeStopwords(query, sw.en).join(" ");
};

searchRepositoryContent = (query) => {};

acquireHunks = (repositoryContent) => {};

module.exports = {
    queryPipeline,
};
