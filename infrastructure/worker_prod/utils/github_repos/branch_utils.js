const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

var LinkHeader = require( 'http-link-header' );
const parseUrl = require("parse-url");
const queryString = require('query-string');


const {serializeError, deserializeError} = require('serialize-error');

const Branch = require('../../models/Branch');



const fetchAllRepoBranchesAPI = async (installationClient, installationId, fullName, worker) => {

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
            await worker.send({action: 'log', info: {level: 'error',
                                                        message: serializeError(err),
                                                        errorDescription: `Github API List Branches failed - installationId, fullName: ${installationId}, ${fullName}`,
                                                        source: 'worker-instance',
                                                        function: 'fetchAllRepoBranchesAPI'}});

            reachedBranchListEnd = true;
            break;

            // throw new Error(`Github API List Branches failed - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`);
        }

        // We've gotten all results
        if (!branchListResponse.headers.link) {
            pageNum = lastPageNum;
        }

        else {
            var link = LinkHeader.parse(branchListResponse.headers.link);

            await worker.send({action: 'log', info: {
                level: 'info',
                message: `branchListResponse.headers.link: ${JSON.stringify(link)}`,
                source: 'worker-instance',
                function: 'fetchAllRepoBranchesAPI',
            }});
    
    
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

        await worker.send({action: 'log', info: {
            level: 'info',
            message: `Adding branchListResponse.data.length: ${JSON.stringify(branchListResponse.data.length)}`,
            source: 'worker-instance',
            function: 'fetchAllRepoBranchesAPI',
        }});

        pageNum += 1;

        foundBranchList.push(branchListResponse.data);

    }

    foundBranchList = foundBranchList.flat();

    return foundBranchList;
}



const enrichBranchesAndPRs = async (foundBranchList, foundPRList, installationId, repositoryId, worker) => {


    // Note: Currently, we will use branch LABELS ('user-name/branch-name') for distinction,
    // if there is a duplication in branch naming, then associations will be made to both branches
    
    var initialBranchNum = foundBranchList.length;
    
    // Create a list of branch objects using the foundPRList

    var distinctBranchLabels = new Set();

    var branchObjectList = [];


    var i = 0;
    var currentPRObj;
    var currentHead;
    var currentBase;

    for (i = 0; i < foundPRList.length; i++) {

        currentPRObj = foundPRList[i];


        currentPRObj.branchLabelList = [];

        // Useful fields in these objects:
        // label - octocat:new-topic
        // ref - new-topic
        // sha: 6dcb09b5b57875f334f61aebed695e2e4193db5e
        // user: {}
        currentHead = currentPRObj.head;
        currentBase = currentPRObj.base;

        currentPRObj.branchLabelList.push(currentHead.label);
        currentPRObj.branchLabelList.push(currentBase.label);

        // If this head label not seen before, create branch object here
        if (!distinctBranchLabels.has(currentHead.label)) {
            distinctBranchLabels.add(currentHead.label);

            branchObjectList.push({
                repository: repositoryId,
                installationId: installationId,
                ref: currentHead.ref,
                label: currentHead.label,
                lastCommit: currentHead.sha,
                pullRequestObjIdList: [currentPRObj.id],
            });

        }
        // Add the pullRequestObjId to the existing branches' pullRequestObjIdList
        else {

            // KARAN TODO: Compare the existing branch here with the new proposed branch, and keep the more recent branch

            // Find the branch object whose label matches this one
            var targetBranchIdx = branchObjectList.findIndex(e => e.label == currentHead.label);

            // Add currentHead.id to pullRequestObjIdList
            branchObjectList[targetBranchIdx].pullRequestObjIdList.push(currentPRObj.id);

        }


        // If this base label not seen before, create branch object here
        if (!distinctBranchLabels.has(currentBase.label)) {
            distinctBranchLabels.add(currentBase.label);

            branchObjectList.push({
                repository: repositoryId,
                installationId: installationId,
                ref: currentBase.ref,
                label: currentBase.label,
                lastCommit: currentBase.sha,
                pullRequestObjIdList: [currentPRObj.id],
            });

        }
        // Add the pullRequestObjId to the existing branches' pullRequestObjIdList
        else {

            // KARAN TODO: Compare the existing branch here with the new proposed branch, and keep the more recent branch

            // Find the branch object whose label matches this one
            var targetBranchIdx = branchObjectList.findIndex(e => e.label == currentBase.label);

            // Add currentPRObj.id.id to pullRequestObjIdList
            branchObjectList[targetBranchIdx].pullRequestObjIdList.push(currentPRObj.id);

        }
    }

    // Merge foundBranchList with branchObjectList
    // We will merge this by iterating over foundBranchList, for each:
        // Identify all objects in branchObjectList with ref = foundBranchList[i].name, for each:
            // If the match has an identical commit sha, it's a duplicate, continue
            // If the match has a different commit sha, it's different, add the branch to the branchObjectList
            // continue
    var k = 0;

    for (k = 0; k < foundBranchList.length; k++) {

        var currentAPIBranch = foundBranchList[k];

        var matchingBranchObjects = [];

        // Get all PR branches that possibly match an API branch into matchingBranchObjects
        var j = 0;
        for (j = 0; j < branchObjectList.length; j++) {
            if (branchObjectList[j].ref == currentAPIBranch.name) {
                matchingBranchObjects.push(branchObjectList[j]);
            }
        }

        // If currentAPIBranch.commit.sha is not in matchingBranchObjects.map(branchObj => branchObj.lastCommit):
            // Add currentAPIBranch to branchObjectList
        if ( !( matchingBranchObjects.map(branchObj => branchObj.lastCommit).includes(currentAPIBranch.commit.sha) ) ) {
            branchObjectList.push({
                repository: repositoryId,
                installationId: installationId,
                ref: currentAPIBranch.name,
                // label: , doesn't exist here
                lastCommit: currentAPIBranch.commit.sha,
            });
        }
    }

    await worker.send({action: 'log', info: {
        level: 'info',
        message: `Enriched foundBranchList - initialBranchNum -> branchObjectList.length: ${initialBranchNum} -> ${branchObjectList.length}`,
        source: 'worker-instance',
        function: 'enrichBranchesAndPRs',
    }});

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


const enhanceBranchesWithPRMongoIds = async (prToBranchMapping, installationId, repositoryId, worker) => {


    await worker.send({action: 'log', info: {
        level: 'info',
        message: `Adding PR ObjectIds to Branch Objects - prToBranchMapping: ${JSON.stringify(prToBranchMapping)}`,
        source: 'worker-instance',
        function: 'enhanceBranchesWithPRMongoIds',
    }});

    var allUpdatePairs = [];

    prToBranchMapping.map(prObj => {
        var i = 0;
        for(i = 0; i < prObj.branches.length; i++) {
            allUpdatePairs.push({ branchId: prObj.branches[i].toString(), pullRequestId: prObj._id.toString() });
        }
    });

    await worker.send({action: 'log', info: {
        level: 'info',
        message: `Adding PR ObjectIds to Branch Objects - allUpdatePairs: ${JSON.stringify(allUpdatePairs)}`,
        source: 'worker-instance',
        function: 'enhanceBranchesWithPRMongoIds',
    }});

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
            await worker.send({action: 'log', info: {
                level: 'error',
                message: serializeError(err),
                errorDescription: `Failed to bulk add PullRequest Ids to Branch Objects -  idPair: ${JSON.stringify(idPair)}`,
                source: 'worker-instance',
                function: 'enhanceBranchesWithPRMongoIds',
            }});
            throw new Error(`Failed to bulk add PullRequest Ids to Branch Objects -  idPair: ${JSON.stringify(idPair)}`);
        }
    }
}


const insertBranchesFromAPI = async (branchObjectsToInsert, installationId, repositoryId, worker) => {



    // Insert Branch Objects and get Ids of inserted Objects
    var bulkInsertResult;
    var newBranchIds;

    try {
        bulkInsertResult = await Branch.insertMany(branchObjectsToInsert, { rawResult: true, });
        newBranchIds = Object.values(bulkInsertResult.insertedIds).map(id => id.toString());
    }
    catch (err) {

        await worker.send({action: 'log', info: {level: 'error',
                                                    source: 'worker-instance',
                                                    message: serializeError(err),
                                                    errorDescription: `Error bulk inserting Branches - branchObjectsToInsert.length: ${branchObjectsToInsert.length}`,
                                                    function: 'insertAllBranchesFromAPI'}});

        throw new Error(`Error bulk inserting Branches - branchObjectsToInsert.length: ${branchObjectsToInsert.length}`);

    }

    // Fetch Branch Objects with specific fields necessary for mapping

    // Need to use the insertedIds of the new GithubProjects to get the full, unified object from the DB
    var createdBranchObjects;
    try {
        createdBranchObjects = await Branch.find({_id: { $in: newBranchIds.map(id => ObjectId(id.toString())) } }, '_id label lastCommit').lean().exec();
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    message: serializeError(err),
                                                    errorDescription: `Branch find failed - newBranchIds: ${JSON.stringify(newBranchIds)}`,
                                                    source: 'worker-instance',
                                                    function: 'insertBranchesFromAPI'}});

        throw new Error(`Branch find failed - newBranchIds: ${JSON.stringify(newBranchIds)}`);
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