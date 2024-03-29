

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const { serializeError, deserializeError } = require("serialize-error");

var LinkHeader = require("http-link-header");
const parseUrl = require("parse-url");
const queryString = require("query-string");

const { fetchAllRepoBranchesAPI, insertBranchesFromAPI } = require("./github/branch_utils");
const { fetchAllRepoPRsAPIGraphQL, fetchAllRepoPRsAPIConcurrent, insertPRsFromAPI } = require("./github/pr_utils");
const { fetchAllRepoCommitsCLI, insertAllCommitsFromCLI } = require("./github/commit_utils");

const { printExecTime } = require("./print");

const Sentry = require("@sentry/node");

const { at } = require("lodash");

const { cloneInstallationRepo } = require("./github/cli_utils");

const api = require("../apis/api");




const scrapeGithubRepoCodeObjects = async (installationId, repositoryId, installationClient, repositoryObj, workspaceId, repoDiskPath, public = false) => {


    var client = (public) ? api.requestPublicGraphQLClient() :
        await api.requestInstallationGraphQLClient(installationId);


    // Fetch all PRs from Github
    var start = process.hrtime();
    var foundPRList;


    try {
        foundPRList = await fetchAllRepoPRsAPIGraphQL(client, installationId, repositoryId, repositoryObj.fullName);
        // foundPRList = await fetchAllRepoPRsAPIConcurrent(client, installationId, repositoryId, repositoryObj.fullName);
    } catch (err) {

        console.log(err);

        Sentry.setContext("scrapeGithubRepoCodeObjects", {
            message: "Error fetching all repo PRs",
            installationId: installationId,
            repositoryFullName: repositoryObj.fullName,
        });

        Sentry.captureException(err);

        throw err;
    }
    printExecTime(process.hrtime(start), `fetchAllRepoPRsAPIGraphQL("${repositoryObj.fullName}")`);
    // printExecTime(process.hrtime(start), `fetchAllRepoPRsAPIConcurrent("${repositoryObj.fullName}")`);



    start = process.hrtime();
    var foundBranchList;
    try {
        foundBranchList = await fetchAllRepoBranchesAPI(installationClient, installationId, repositoryId, repositoryObj.fullName, public);
    } catch (err) {

        console.log(err);

        Sentry.setContext("scrapeGithubRepoCodeObjects", {
            message: "Error fetching all repo branches",
            installationId: installationId,
            repositoryFullName: repositoryObj.fullName,
        });

        Sentry.captureException(err);

        throw err;
    }
    printExecTime(process.hrtime(start), `fetchAllRepoBranchesAPI("${repositoryObj.fullName}")`);



    // Only can insert Branches if branches objects were found

    if (foundBranchList.length > 0) {
        var start = process.hrtime();
        try {
            await insertBranchesFromAPI(foundBranchList, installationId, repositoryId);
        } catch (err) {

            console.log(err);

            Sentry.setContext("scrapeGithubRepoCodeObjects", {
                message: "Error inserting Branches from API",
                installationId: installationId,
                repositoryId: repositoryId,
                foundBranchListLength: foundBranchList.length,
            });

            Sentry.captureException(err);

            throw err;
        }
        printExecTime(process.hrtime(start), `insertBranchesFromAPI("${repositoryObj.fullName}")`);
    }

    // Only can insert PRs if PR objects were found
    if (foundPRList.length > 0) {

        var start = process.hrtime();
        try {
            await insertPRsFromAPI(foundPRList);
        } catch (err) {

            console.log(err);

            Sentry.setContext("scrapeGithubRepoCodeObjects", {
                message: "Error inserting PRs from API",
                installationId: installationId,
                repositoryId: repositoryId,
                foundPRListLength: foundPRList.length,
            });

            Sentry.captureException(err);

            throw err;
        }
        printExecTime(process.hrtime(start), `insertPRsFromAPI("${repositoryObj.fullName}")`);
    }


    var start = process.hrtime();
    var foundCommitList;
    try {
        foundCommitList = await fetchAllRepoCommitsCLI(installationId, repositoryObj._id.toString(), repoDiskPath);
    } catch (err) {

        console.log(err);

        Sentry.setContext("scrapeGithubRepoCodeObjects", {
            message: "Error fetching all repo commits",
            installationId: installationId,
            repositoryId: repositoryId,
            repoDiskPath: repoDiskPath,
        });

        Sentry.captureException(err);

        throw err;

    }
    printExecTime(process.hrtime(start), `fetchAllRepoCommitsCLI("${repositoryObj.fullName}")`);


    var start = process.hrtime();
    var insertedCommitsCLI;
    try {
        insertedCommitsCLI = await insertAllCommitsFromCLI(foundCommitList, installationId, repositoryId);
    } catch (err) {

        console.log(err);

        Sentry.setContext("scrapeGithubRepoCodeObjects", {
            message: "Error inserting Commits from CLI",
            installationId: installationId,
            repositoryId: repositoryId,
            foundCommitListLength: foundCommitList.length,
        });

        Sentry.captureException(err);

        throw err;

    }
    printExecTime(process.hrtime(start), `insertAllCommitsFromCLI("${repositoryObj.fullName}")`);


    // git rev-list --all --min-parents=2 --date=iso --format=%H%n%cd%n%T%n%an%n%cn%n%ce%n%s$n%P$%n%D%n



};

module.exports = {
    scrapeGithubRepoCodeObjects,
};