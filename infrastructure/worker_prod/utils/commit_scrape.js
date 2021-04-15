

const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

const { serializeError, deserializeError } = require('serialize-error');

var LinkHeader = require('http-link-header');
const parseUrl = require("parse-url");
const queryString = require('query-string');

const { fetchAllRepoBranchesAPI, enrichBranchesAndPRs, enhanceBranchesWithPRMongoIds, insertBranchesFromAPI } = require('./github/branch_utils');
const { fetchAllRepoPRsAPI, enrichPRsWithFileList, insertPRsFromAPI } = require('./github/pr_utils');
const { fetchAllRepoCommitsCLI, insertAllCommitsFromCLI } = require('./github/commit_utils');

const Sentry = require("@sentry/node");

const { at } = require("lodash");

const { cloneInstallationRepo } = require('./github/cli_utils');



const scrapeGithubRepoCodeObjects = async (installationId, repositoryId, installationClient, repositoryObj, workspaceId, repoDiskPath, public = false) => {


    // Fetch all branches and PRs from Github
    var foundPRList;
    try {
        foundPRList = await fetchAllRepoPRsAPI(installationClient, installationId, repositoryObj.fullName, public);
    }
    catch (err) {

        console.log(err);

        Sentry.setContext("scrapeGithubRepoCodeObjects", {
            message: `Error fetching all repo PRs`,
            installationId: installationId,
            repositoryFullName: repositoryObj.fullName,
        });

        Sentry.captureException(err);

        throw err;
    }

    var foundBranchList;
    try {
        foundBranchList = await fetchAllRepoBranchesAPI(installationClient, installationId, repositoryObj.fullName, public);
    }
    catch (err) {

        console.log(err);

        Sentry.setContext("scrapeGithubRepoCodeObjects", {
            message: `Error fetching all repo branches`,
            installationId: installationId,
            repositoryFullName: repositoryObj.fullName,
        });

        Sentry.captureException(err);

        throw err;
    }


    // Only can enrich these lists if there are both branches and PRs, still call if there are branches just for formatting
    if (foundBranchList.length > 0) {
        // Enrich Branches and PRs (attach their identifiers to each other, e.g. attach prObjIds to branches) based on each respective list
        try {
            [foundBranchList, foundPRList] = await enrichBranchesAndPRs(foundBranchList, foundPRList, installationId, repositoryId);
        }
        catch (err) {

            console.log(err);

            Sentry.setContext("scrapeGithubRepoCodeObjects", {
                message: `Error enrichingBranchesAndPRs`,
                installationId: installationId,
                repositoryId: repositoryId,
                foundBranchListLength: foundBranchList.length,
                foundPRListLength: foundPRList.length,
            });

            Sentry.captureException(err);

            throw err;
        }
    }

    // Only can find fileLists for PRs if there are PRs
    if (foundPRList.length > 0) {
        // Query from Github & set fileList field on PRs
        try {
            foundPRList = await enrichPRsWithFileList(foundPRList, installationClient, installationId, repositoryObj.fullName, public);
        }
        catch (err) {

            console.log(err);

            Sentry.setContext("scrapeGithubRepoCodeObjects", {
                message: `Error enrichPRsWithFileList failed`,
                installationId: installationId,
                repositoryFullName: repositoryObj.fullName,
                foundPRListLength: foundPRList.length,
            });

            Sentry.captureException(err);

            throw err;
        }
    }


    // Only can insert Branches if branches objects were found

    var branchToPRMappingList = [];
    if (foundBranchList.length > 0) {

        try {
            branchToPRMappingList = await insertBranchesFromAPI(foundBranchList, installationId, repositoryId);
        }
        catch (err) {

            console.log(err);

            Sentry.setContext("scrapeGithubRepoCodeObjects", {
                message: `Error inserting Branches from API`,
                installationId: installationId,
                repositoryId: repositoryId,
                foundBranchListLength: foundBranchList.length,
            });

            Sentry.captureException(err);

            throw err;
        }
    }

    // Only can insert PRs is PR objects were found
    var prToBranchMapping = [];
    if (foundPRList.length > 0) {
        // Insert PRs with Branch ObjectsIds

        try {
            prToBranchMapping = await insertPRsFromAPI(foundPRList, branchToPRMappingList, installationId, repositoryId);
        }
        catch (err) {

            console.log(err);

            Sentry.setContext("scrapeGithubRepoCodeObjects", {
                message: `Error inserting PRs from API`,
                installationId: installationId,
                repositoryId: repositoryId,
                foundPRListLength: foundPRList.length,
            });

            Sentry.captureException(err);

            throw err;
        }
    }

    // Don't do this if there are no PR Objects
    if (prToBranchMapping.length > 0) {
        // Add PullRequest ObjectIds to Branch Objects
        try {
            await enhanceBranchesWithPRMongoIds(prToBranchMapping, installationId, repositoryId);
        }
        catch (err) {

            console.log(err);

            Sentry.setContext("scrapeGithubRepoCodeObjects", {
                message: `Error updating Branch Objects to have PullRequest ids`,
                installationId: installationId,
                repositoryId: repositoryId,
                prToBranchMappingLength: prToBranchMapping.length,
            });

            Sentry.captureException(err);

            throw err;
        }
    }


    var foundCommitList;
    try {
        foundCommitList = await fetchAllRepoCommitsCLI(installationId, repositoryObj._id.toString(), repoDiskPath);
    }
    catch (err) {

        console.log(err);

        Sentry.setContext("scrapeGithubRepoCodeObjects", {
            message: `Error fetching all repo commits`,
            installationId: installationId,
            repositoryId: repositoryId,
            repoDiskPath: repoDiskPath,
        });

        Sentry.captureException(err);

        throw err;

    }

    var insertedCommitsCLI;
    try {
        insertedCommitsCLI = await insertAllCommitsFromCLI(foundCommitList, installationId, repositoryId);
    }
    catch (err) {

        console.log(err);

        Sentry.setContext("scrapeGithubRepoCodeObjects", {
            message: `Error inserting Commits from CLI`,
            installationId: installationId,
            repositoryId: repositoryId,
            foundCommitListLength: foundCommitList.length,
        });

        Sentry.captureException(err);

        throw err;

    }


    // git rev-list --all --min-parents=2 --date=iso --format=%H%n%cd%n%T%n%an%n%cn%n%ce%n%s$n%P$%n%D%n



}

module.exports = {
    scrapeGithubRepoCodeObjects,
}