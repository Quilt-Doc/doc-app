
const {serializeError, deserializeError} = require('serialize-error');

const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

var LinkHeader = require( 'http-link-header' );
const parseUrl = require("parse-url");
const queryString = require('query-string');


const PullRequest = require('../../models/PullRequest');

// const { fetchAppToken, requestInstallationToken } = require('../../apis/api');

const fetchAllRepoPRsAPI = async (installationClient, installationId, fullName, worker) => {
    // Get list of all PRs
    // GET /repos/{owner}/{repo}/pulls
    // per_page	integer	query - Results per page (max 100)
    // page	integer	query - Page number of the results to fetch.


    var perPage = 100;
    var pageNum = 0;

    var prListResponse;

    // Default value of 10
    var lastPageNum = 10;

    var foundPRList = [];
    var searchString;
 

    while (pageNum < lastPageNum) {
        try {
            prListResponse = await installationClient.get(`/repos/${fullName}/pulls?per_page=${perPage}&page=${pageNum}&state=all`);
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error',
                                                        message: serializeError(err),
                                                        errorDescription: `Github API List PRs failed - installationId, fullName: ${installationId}, ${fullName}`,
                                                        source: 'worker-instance',
                                                        function: 'fetchAllRepoPRsAPI'}});

            break;

            // throw new Error(`Github API List Branches failed - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`);
        }

        // We've gotten all results
        if (!prListResponse.headers.link) {
            pageNum = lastPageNum;
        }

        else {
            var link = LinkHeader.parse(prListResponse.headers.link);

            await worker.send({action: 'log', info: {
                level: 'info',
                message: `prListResponse.headers.link: ${JSON.stringify(link)}`,
                source: 'worker-instance',
                function: 'fetchAllRepoPRsAPI',
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

        if (prListResponse.data.length < 1) {
            break;
        }

        await worker.send({action: 'log', info: {
            level: 'info',
            message: `Adding prListResponse.data.length: ${prListResponse.data.length}`,
            source: 'worker-instance',
            function: 'fetchAllRepoPRsAPI',
        }});

        pageNum += 1;

        foundPRList.push(prListResponse.data);

    }

    foundPRList = foundPRList.flat();

    return foundPRList;
}


const enrichPRsWithFileList = async (foundPRList, installationClient, installationId, fullName, worker) => {

    var enrichedPRList = [];

    var fileListAPIRequestList = foundPRList.map( async (prObj) => {
        enrichedPRList.push(await addFileListToPR(prObj, installationClient, installationId, fullName, worker));
    });

    try {
        await Promise.all(fileListAPIRequestList);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    message: serializeError(err),
                                                    errorDescription: `fileListAPIRequestList, addFileListToPR failed - fullName, installationId, foundPRList.length: ${fullName}, ${installationId}, ${foundPRList.length}`,
                                                    source: 'worker-instance',
                                                    function: 'enrichPRsWithFileList'}});

        throw new Error(`fileListAPIRequestList, addFileListToPR failed - fullName, installationId, foundPRList.length: ${fullName}, ${installationId}, ${foundPRList.length}`);
    }
    /*
    await worker.send({action: 'log', info: {
        level: 'info',
        message: `enrichPRsWithFileList - enrichedPRList[0]: ${JSON.stringify(enrichedPRList[0])}`,
        source: 'worker-instance',
        function: 'enrichPRsWithFileList',
    }});
    */


    return enrichedPRList;

}


const addFileListToPR = async (foundPR, installationClient, installationId, fullName, worker) => {

    var perPage = 100;
    var pageNum = 0;

    var fileListResponse;

    // Default value of 10
    var lastPageNum = 10;

    var foundFileList = [];
    var searchString;

    while (pageNum < lastPageNum) {
        try {
            fileListResponse = await installationClient.get(`/repos/${fullName}/pulls/${foundPR.number}/files?per_page=${perPage}&page=${pageNum}`);
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error',
                                                        message: serializeError(err),
                                                        errorDescription: `Github API List PR file list failed - installationId, fullName, foundPR.number: ${installationId}, ${fullName}, ${foundPR.number}`,
                                                        source: 'worker-instance',
                                                        function: 'addFileListToPR'}});

            break;
            // throw new Error(`Github API List Branches failed - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`);
        }

        // We've gotten all results
        if (!fileListResponse.headers.link) {
            pageNum = lastPageNum;
        }

        else {
            var link = LinkHeader.parse(fileListResponse.headers.link);
            
            /*
            await worker.send({action: 'log', info: {
                level: 'info',
                message: `fileListResponse.headers.link: ${JSON.stringify(link)}`,
                source: 'worker-instance',
                function: 'fetchAllRepoPRsAPI',
            }});
            */
    
    
            var i;
            for (i = 0; i < link.refs.length; i++) {
                if (link.refs[i].rel == 'last') {
                    searchString = parseUrl(link.refs[i].uri).search;
    
                    lastPageNum = queryString.parse(searchString).page;
                    break;
                }
            }
        }

        if (fileListResponse.data.length < 1) {
            break;
        }

        await worker.send({action: 'log', info: {
            level: 'info',
            message: `Adding fileListResponse.data.length: ${fileListResponse.data.length}`,
            source: 'worker-instance',
            function: 'addFileListToPR',
        }});

        pageNum += 1;

        fileListResponse.data = fileListResponse.data.map(fileObj => fileObj.filename);

        foundFileList.push(fileListResponse.data);
    }

    foundFileList = foundFileList.flat();
    foundFileList = [...new Set(foundFileList)];

    return Object.assign({}, foundPR, {fileList: foundFileList});
}



const insertPRsFromAPI = async (foundPRList, branchToPRMappingList, installationId, repositoryId, worker) => {


    if (foundPRList.length < 1) {
        return [];
    }

    var prObjectsToInsert = [];

    // Insert the following basic id fields:
    /*
        installationId: { type: Number, required: true },
        checks: [{ type: ObjectId, ref: "Check" }],
        repository: { type: ObjectId, ref: "Repository", required: true },

        pullRequestId: { type: Number, required: true },
        number: { type: Number, required: true },

    */

    // Insert the following non Mongo Model fields
    /*
        htmlUrl: { type: String },
        issueUrl: { type: String },
        state: { type: String, enum: ["open", "closed"], required: true },
        locked: { type: Boolean },
        title: { type: String },
        body: { type: String },
        labels: [{ type: String }],
        createdAt: { type: Date },
        updatedAt: { type: Date },
        closedAt: { type: Date },
        mergedAt: { type: Date },
        mergeCommitSha: { type: String },
        labels: [{ type: String }],

        headRef: { type: String, required: true },
        headLabel: { type: String, required: true },
        baseRef: { type: String, required: true },
        baseLabel: { type: String, required: true },

        draft: { type: Boolean },
        merged: { type: Boolean },
        commentNum: { type: Number },
        reviewCommentNum: { type: Number },
        commitNum: { type: Number },
        additionNum: { type: Number },
        deletionNum: { type: Number },
        changedFileNum: { type: Number },
    */

    /*
   await worker.send({action: 'log', info: {
        level: 'info',
        message: `insertPRsFromAPI received - foundPRList[0]: ${JSON.stringify(foundPRList[0])}`,
        source: 'worker-instance',
        function: 'insertPRsFromAPI',
    }});
    */


    // Attach the correct Branch Model ObjectId, if applicable

    foundPRList.map(prObj => {

        var labelList = prObj.labels.map(labelObj => labelObj.name);

        // Get all Branch Objects from branchToPRMappingList, who have labels in branchLabelList
        var branchIdList = [];
        var i = 0;
        for (i = 0; i < branchToPRMappingList.length; i++) {
            if (prObj.branchLabelList.includes(branchToPRMappingList[i].label)) {
                branchIdList.push(branchToPRMappingList[i]._id.toString());
            }
        }

        branchIdList = branchIdList.map(id => ObjectId(id.toString()));

        prObjectsToInsert.push({
            installationId: installationId,
            repository: repositoryId,
            fileList: prObj.fileList,

            name: prObj.title,
            description: prObj.description,
            sourceId: prObj.number,


            sourceCreationDate: prObj.created_at,
            sourceUpdateDate: prObj.updated_at,
            sourceCloseDate: prObj.closed_at,

            branchLabelList: prObj.branchLabelList,
            branches: branchIdList,


            pullRequestId: prObj.id,
            number: prObj.number,

            htmlUrl: prObj.html_url,
            issueUrl: prObj.issue_url,
            state: prObj.state,
            locked: prObj.locked,
            title: prObj.title,
            body: prObj.body,
            labels: prObj.labels,
            createdAt: prObj.created_at,
            updatedAt: prObj.updated_at,
            closedAt: prObj.closed_at,
            mergedAt: prObj.merged_at,
            mergeCommitSha: prObj.merge_commit_sha,
            labels: labelList,

            headRef: prObj.head.ref,
            headLabel: prObj.head.label,
            headSha: prObj.head.sha,

            baseRef: prObj.base.ref,
            baseLabel: prObj.base.label,
            baseSha: prObj.base.sha,

            draft: prObj.draft,
            merged: prObj.merged,
            commentNum: prObj.comments,
            reviewCommentNum: prObj.review_comments,
            commitNum: prObj.commits,
            additionNum: prObj.additions,
            deletionNum: prObj.deletions,
            changedFileNum: prObj.changed_files,
            
        });
    });

    var bulkInsertResult;
    var newPRIds;
    try {
        bulkInsertResult = await PullRequest.insertMany(prObjectsToInsert, { rawResult: true });
        newPRIds = Object.values(bulkInsertResult.insertedIds).map(id => id.toString());
    }
    catch (err) {

        await worker.send({action: 'log', info: {level: 'error',
                                                    source: 'worker-instance',
                                                    message: serializeError(err),
                                                    errorDescription: `Error bulk inserting PullRequests - prObjectsToInsert.length: ${prObjectsToInsert.length}`,
                                                    function: 'insertAllPRsFromAPI'}});

        throw new Error(`Error bulk inserting PullRequests - prObjectsToInsert.length: ${prObjectsToInsert.length}`);
    }

    await worker.send({action: 'log', info: {
        level: 'info',
        message: `InsertPRsFromAPI finding created PR objects - newPRIds.length: ${newPRIds.length}`,
        source: 'worker-instance',
        function: 'insertAllPRsFromAPI',
    }});



    // Need to use the insertedIds of the new PRs to get the full, unified object from the DB
    var createdPRObjects;
    try {
        createdPRObjects = await PullRequest.find({_id: { $in: newPRIds.map(id => ObjectId(id.toString())) } }, '_id pullRequestId branches').lean().exec();
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    message: serializeError(err),
                                                    errorDescription: `Branch find failed - newBranchIds: ${JSON.stringify(newBranchIds)}`,
                                                    source: 'worker-instance',
                                                    function: 'insertBranchesFromAPI'}});

        throw new Error(`Branch find failed - newBranchIds: ${JSON.stringify(newBranchIds)}`);
    }

    return createdPRObjects;
}

module.exports = {
    fetchAllRepoPRsAPI,
    enrichPRsWithFileList,
    insertPRsFromAPI,
}