
const { serializeError, deserializeError } = require('serialize-error');

const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

var LinkHeader = require('http-link-header');
const parseUrl = require("parse-url");
const queryString = require('query-string');

const api = require("../../apis/api");

const Sentry = require("@sentry/node");

const PullRequest = require('../../models/PullRequest');


const fetchAllRepoPRsAPI = async (installationClient, installationId, fullName, public = false) => {
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

    var client = (public) ? api.requestPublicClient() : installationClient;


    while (pageNum < lastPageNum) {
        try {
            prListResponse = await client.get(`/repos/${fullName}/pulls?per_page=${perPage}&page=${pageNum}&state=all`);
        }
        catch (err) {
            console.log(`Github API List PRs failed - installationId, fullName: ${installationId}, ${fullName}`);
            break;

            // throw new Error(`Github API List Branches failed - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`);
        }

        // We've gotten all results
        if (!prListResponse.headers.link) {
            pageNum = lastPageNum;
        }

        else {
            var link = LinkHeader.parse(prListResponse.headers.link);

            console.log(`prListResponse.headers.link: ${JSON.stringify(link)}`);


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

        console.log(`Adding prListResponse.data.length: ${prListResponse.data.length}`);

        pageNum += 1;

        foundPRList.push(prListResponse.data);

    }

    // console.log("foundPRList before flat: ");

    foundPRList = foundPRList.flat();
    console.log(`Found ${foundPRList.length} Pull Requests for ${fullName}`);

    return foundPRList;
}

const fetchAllRepoPRsAPIGraphQL = async (installationId, fullName, public = false) => {
    var client;

    if (public) {
        client = api.requestPublicGraphQLClient();
    }
    else {
        try {
            client = await api.requestInstallationGraphQLClient(
                installationId
            );
        } catch (err) {
            Sentry.setContext("getchAllRepoPRsAPIGraphQL", {
                message: `Failed to get installation GraphQL client`,
                installationId: installationId,
            });

            Sentry.captureException(err);

            throw err;
        }
    }

    

    

}


const enrichPRsWithFileList = async (foundPRList, installationClient, installationId, fullName, public = false) => {

    var enrichedPRList = [];

    var fileListAPIRequestList = foundPRList.map(async (prObj) => {
        enrichedPRList.push(await addFileListToPR(prObj, installationClient, installationId, fullName, public));
    });

    try {
        await Promise.all(fileListAPIRequestList);
    }
    catch (err) {

        console.log(err);

        Sentry.setContext("enrichPRsWithFileList", {
            message: `fileListAPIRequestList, addFileListToPR failed`,
            installationId: installationId,
            repositoryFullName: fullName,
            foundPRListLength: foundPRList.length,
        });

        Sentry.captureException(err);

        throw err;
    }



    return enrichedPRList;

}


const addFileListToPR = async (foundPR, installationClient, installationId, fullName, public = false) => {

    var perPage = 100;
    var pageNum = 0;

    var fileListResponse;

    // Default value of 10
    var lastPageNum = 10;

    var foundFileList = [];
    var searchString;

    var client = (public) ? api.requestPublicClient() : installationClient;


    while (pageNum < lastPageNum) {
        try {
            fileListResponse = await client.get(`/repos/${fullName}/pulls/${foundPR.number}/files?per_page=${perPage}&page=${pageNum}`);
        }
        catch (err) {

            console.log(err);

            Sentry.setContext("addFileListToPR", {
                message: `Github API List PR file list failed`,
                installationId: installationId,
                repositoryFullName: fullName,
                foundPRNumber: foundPR.number,
            });

            Sentry.captureException(Error(`Github API List PR file list failed`));

            break;

            // throw new Error(`Github API List Branches failed - installationId, repositoryObj.fullName: ${installationId}, ${repositoryObj.fullName}`);
        }

        // We've gotten all results
        if (!fileListResponse.headers.link) {
            pageNum = lastPageNum;
        }

        else {
            var link = LinkHeader.parse(fileListResponse.headers.link);


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

        console.log(`Adding fileListResponse.data.length: ${fileListResponse.data.length}`);

        pageNum += 1;

        fileListResponse.data = fileListResponse.data.map(fileObj => fileObj.filename);

        foundFileList.push(fileListResponse.data);
    }

    foundFileList = foundFileList.flat();
    foundFileList = [...new Set(foundFileList)];

    return Object.assign({}, foundPR, { fileList: foundFileList });
}



const insertPRsFromAPI = async (foundPRList, branchToPRMappingList, installationId, repositoryId) => {


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

        console.log(err);

        Sentry.setContext("insertPRsFromAPI", {
            message: `Error bulk inserting PullRequests`,
            prObjectsToInsertLength: prObjectsToInsert.length,
        });

        Sentry.captureException(err);

        throw err;
    }

    console.log(`InsertPRsFromAPI finding created PR objects - newPRIds.length: ${newPRIds.length}`);


    // Need to use the insertedIds of the new PRs to get the full, unified object from the DB
    var createdPRObjects;
    try {
        createdPRObjects = await PullRequest.find({ _id: { $in: newPRIds.map(id => ObjectId(id.toString())) } }, '_id pullRequestId branches').lean().exec();
    }
    catch (err) {

        console.log(err);

        Sentry.setContext("insertPRsFromAPI", {
            message: `Branch find failed`,
            newBranchIdsLength: newBranchIds.length,
        });

        Sentry.captureException(err);

        throw err;

    }

    return createdPRObjects;
}

const fetchAllPRsFromDB = async (repositoryId, selectionString) => {

    var foundPRs;

    try {
        foundPRs = await PullRequest.find({ repository: repositoryId }, selectionString).lean().exec();
    }
    catch (err) {
        Sentry.setContext("fetchAllPRsFromDB", {
            message: `Failed to fetch PullRequest Models`,
            repositoryId: repositoryId,
            selectionString: selectionString,
        });

        Sentry.captureException(err);
        throw err;
    }

    return foundPRs;
}

module.exports = {
    fetchAllRepoPRsAPI,
    enrichPRsWithFileList,
    insertPRsFromAPI,
    fetchAllPRsFromDB,
}