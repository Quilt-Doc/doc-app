
const {serializeError, deserializeError} = require('serialize-error');

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



const insertAllPRsFromAPI = async (foundPRList, installationId, repositoryId, worker) => {
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

    foundPRList.map(prObj => {

        var labelList = prObj.labels.map(labelObj => labelObj.name);

        prObjectsToInsert.push({
            installationId: installationId,
            repository: repositoryId,

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
            baseRef: prObj.base.ref,
            baseLabel: prObj.base.label,

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
    try {
        bulkInsertResult = await PullRequest.insertMany(prObjectsToInsert);
    }
    catch (err) {

        await worker.send({action: 'log', info: {level: 'error',
                                                    source: 'worker-instance',
                                                    message: serializeError(err),
                                                    errorDescription: `Error bulk inserting PullRequests - prObjectsToInsert.length: ${prObjectsToInsert.length}`,
                                                    function: 'insertAllPRsFromAPI'}});

        throw new Error(`Error bulk inserting PullRequests - prObjectsToInsert.length: ${prObjectsToInsert.length}`);
    }

    return prObjectsToInsert;
}

module.exports = {
    fetchAllRepoPRsAPI,
    insertAllPRsFromAPI,
}