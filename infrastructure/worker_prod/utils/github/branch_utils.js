const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

var LinkHeader = require('http-link-header');
const parseUrl = require("parse-url");
const queryString = require('query-string');

const apis = require("../../apis/api");

const Sentry = require("@sentry/node");


const { serializeError, deserializeError } = require('serialize-error');

const Branch = require('../../models/Branch');


// Uses 'ref' as Branch sourceId
const fetchAllRepoBranchCommitDates = async (foundBranchList, installationClient, fullName) => {

    var commitDateRequestList = foundBranchList.map(async (branchObj) => {

        var commitResponse;

        var sha = branchObj.lastCommit;
        try {
            commitResponse = await installationClient.get(`/repos/${fullName}/commits/${sha}`);
        }
        catch (err) {
            console.log(err);
            return { error: 'Error', userId }
        }

        return { branchRef: branchObj.ref, branchLastCommit: branchObj.lastCommit, commitDate: commitResponse.data.commit.committer.date };
    });

    // Execute all requests
    var results;
    try {
        results = await Promise.allSettled(commitDateRequestList);
    }
    catch (err) {
        console.log(`Error Promise.allSettled getting branch commitDates`);

        throw err;
    }

    // Non-error responses
    validResults = results.filter(resultObj => resultObj.value && !resultObj.value.error);

    // Error responses
    invalidResults = results.filter(resultObj => resultObj.value && resultObj.value.error);

    validResults.map(resultObj => {
        var matchingBranchIndex = -1;

        matchBranchIndex = foundBranchList.findIndex((branchObj) => branchObj.ref == resultObj.branchRef && branchObj.lastCommit == resultObj.branchLastCommit);

        if (matchBranchIndex > 0) {
            foundBranchList[matchBranchIndex].sourceUpdateDate = resultObj.commitDate;
        }

    });

    return foundBranchList;

}



const fetchAllRepoBranchesAPI = async (installationClient, installationId, repositoryId, fullName, public = false) => {

    // Get list of all branches
    // GET /repos/{owner}/{repo}/branches
    // per_page	integer	query - Results per page (max 100)
    // page	integer	query - Page number of the results to fetch.

    var perPage = 100;
    var pageNum = 0;

    var branchListResponse;

    // Default value of 10
    var lastPageNum = 10;

    var foundBranchList = [];

    var searchString;

    var client = (public) ? apis.requestPublicClient() : installationClient;


    while (pageNum < lastPageNum) {
        try {
            branchListResponse = await client.get(`/repos/${fullName}/branches?per_page=${perPage}&page=${pageNum}`);
        }
        catch (err) {

            console.log(err);

            Sentry.setContext("fetchAllRepoBranchesAPI", {
                message: `Github API List Branches failed`,
                installationId: installationId,
                repositoryFullName: fullName,
            });

            Sentry.captureException(err);

            reachedBranchListEnd = true;
            break;
        }

        // We've gotten all results
        if (!branchListResponse.headers.link) {
            pageNum = lastPageNum;
        }

        else {
            var link = LinkHeader.parse(branchListResponse.headers.link);

            console.log(`branchListResponse.headers.link: ${JSON.stringify(link)}`);


            var i;
            for (i = 0; i < link.refs.length; i++) {
                if (link.refs[i].rel == 'last') {
                    searchString = parseUrl(link.refs[i].uri).search;

                    lastPageNum = queryString.parse(searchString).page;
                    break;
                }
            }
        }

        if (branchListResponse.data.length < 1) {
            break;
        }

        console.log(`Adding branchListResponse.data.length: ${JSON.stringify(branchListResponse.data.length)}`);

        pageNum += 1;

        foundBranchList.push(branchListResponse.data);

    }

    foundBranchList = foundBranchList.flat();


    foundBranchList = foundBranchList.map(currentAPIBranch => {

        return Object.assign({}, {
            repository: repositoryId,
            installationId: installationId,

            name: currentAPIBranch.name,
            sourceId: currentAPIBranch.name,
            // sourceUpdateDate: currentAPIBranch.commit.commit.committer.date,


            ref: currentAPIBranch.name,
            // label: , doesn't exist here
            lastCommit: currentAPIBranch.commit.sha,
        });
    });


    return foundBranchList;
}


const insertBranchesFromAPI = async (branchObjectsToInsert, installationId, repositoryId) => {

    branchObjectsToInsert = branchObjectsToInsert.map(branchObj => {
        return Object.assign({}, branchObj, { sourceId: branchObj.ref });
    });



    // Insert Branch Objects and get Ids of inserted Objects
    var bulkInsertResult;
    var newBranchIds;

    try {
        bulkInsertResult = await Branch.insertMany(branchObjectsToInsert, { rawResult: true, });
        newBranchIds = Object.values(bulkInsertResult.insertedIds).map(id => id.toString());
    }
    catch (err) {

        console.log(err);

        Sentry.setContext("insertBranchesFromAPI", {
            message: `Error bulk inserting Branches`,
            installationId: installationId,
            repositoryId: repositoryId,
            branchObjectsToInsertLength: branchObjectsToInsert.length,
        });

        Sentry.captureException(err);

        throw err;
    }
}


module.exports = {
    fetchAllRepoBranchesAPI,
    insertBranchesFromAPI
}