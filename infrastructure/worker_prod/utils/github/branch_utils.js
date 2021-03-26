const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

var LinkHeader = require('http-link-header');
const parseUrl = require("parse-url");
const queryString = require('query-string');

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



const fetchAllRepoBranchesAPI = async (installationClient, installationId, fullName) => {

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


    while (pageNum < lastPageNum) {
        try {
            branchListResponse = await installationClient.get(`/repos/${fullName}/branches?per_page=${perPage}&page=${pageNum}`);
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

    return foundBranchList;
}



const enrichBranchesAndPRs = async (foundBranchList, foundPRList, installationId, repositoryId) => {


    // Note: Currently, we will use branch LABELS ('user-name/branch-name') for distinction,
    // if there is a duplication in branch naming, then associations will be made to both branches

    var initialBranchNum = foundBranchList.length;

    // Create a list of branch objects using the foundPRList

    var distinctBranchLabels = new Set();

    var branchObjectList = [];

    foundBranchList.map(currentAPIBranch => {
        // console.log('currentAPIBranch: ');
        // console.log(currentAPIBranch);

        branchObjectList.push({
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


    foundBranchList.map(branchAPIObj => {
        distinctBranchLabels.add(branchAPIObj.name);
    });


    return [branchObjectList, foundPRList];

    // Create Objects from foundBranchesList

    /*
        repository: { type: ObjectId, ref: 'Repository' },
        installationId: { type: Number, required: true },

        ref: { type: String, required: true },
        label: { type: String },
        lastCommit: { type: ObjectId, ref: 'Commit' },
        commitUser: { type: ObjectId, ref: 'IntegrationUser' },
    

    foundBranchList.map(branchObj => {
        branchObjectsToInsert.push({
            repository: repositoryId,
            installationId: installationId,
            ref: branchObj.name,
            // label: , doesn't exist here
            lastCommit: branchObj.commit.sha,
            // commitUser: ,
        });
    });
    */

}


const enhanceBranchesWithPRMongoIds = async (prToBranchMapping, installationId, repositoryId) => {

    console.log(`Adding PR ObjectIds to Branch Objects - prToBranchMapping: ${JSON.stringify(prToBranchMapping)}`);

    var allUpdatePairs = [];

    prToBranchMapping.map(prObj => {
        var i = 0;
        for (i = 0; i < prObj.branches.length; i++) {
            allUpdatePairs.push({ branchId: prObj.branches[i].toString(), pullRequestId: prObj._id.toString() });
        }
    });

    console.log(`Adding PR ObjectIds to Branch Objects - allUpdatePairs: ${JSON.stringify(allUpdatePairs)}`);

    // create a list of operations for updating many docs with one db call
    let bulkWriteAssociateOps = allUpdatePairs.map((idPair) => {
        return ({
            updateOne: {
                filter: { _id: ObjectId(idPair.branchId) },
                // Where field is the field you want to update
                update: { $push: { pullRequests: ObjectId(idPair.pullRequestId) } },
                upsert: false
            }
        })
    })

    // Update only if associations between branches and PRs were actually found
    if (bulkWriteAssociateOps.length > 0) {
        // mongoose bulkwrite for one many update db call
        try {
            await Branch.bulkWrite(bulkWriteAssociateOps);
        }
        catch (err) {

            console.log(err);

            Sentry.setContext("enhanceBranchesWithPRMongoIds", {
                message: `Failed to bulk add PullRequest Ids to Branch Objects`,
                installationId: installationId,
                repositoryId: repositoryId,
            });

            Sentry.captureException(err);

            throw err;

        }
    }
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

    // Fetch Branch Objects with specific fields necessary for mapping

    // Need to use the insertedIds of the new Branches to get the full, unified object from the DB
    var createdBranchObjects;
    try {
        createdBranchObjects = await Branch.find({ _id: { $in: newBranchIds.map(id => ObjectId(id.toString())) } }, '_id label lastCommit').lean().exec();
    }
    catch (err) {

        console.log(err);

        Sentry.setContext("insertBranchesFromAPI", {
            message: `Branch find failed`,
            installationId: installationId,
            repositoryId: repositoryId,
            newBranchIdsLength: newBranchIds.length,
        });

        Sentry.captureException(err);

        throw err;

    }

    // Filter createdBranchObjects down to Branch Objects that have label fields
    createdBranchObjects = createdBranchObjects.filter(branchObj => branchObj.label);

    return createdBranchObjects;

}


module.exports = {
    fetchAllRepoBranchesAPI,
    enrichBranchesAndPRs,
    enhanceBranchesWithPRMongoIds,
    insertBranchesFromAPI
}