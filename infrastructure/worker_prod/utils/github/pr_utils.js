
const { serializeError, deserializeError } = require('serialize-error');

const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

var LinkHeader = require('http-link-header');
const parseUrl = require("parse-url");
const queryString = require('query-string');

const api = require("../../apis/api");

const Sentry = require("@sentry/node");

const PullRequest = require('../../models/PullRequest');

const { GraphQLClient, gql, rawRequest, request } = require('graphql-request');


const generatePRQuery = () => {
    const PR_NUM = 100;
    const FILE_NUM = 100;
    const LABEL_NUM = 100;

    return gql`
    query fetchPRsWithFiles($repoName: String!, $repoOwner: String!, $cursor: String) { 
      repository(name: $repoName, owner:$repoOwner) { 
        pullRequests(first: ${PR_NUM}, after: $cursor) {
          nodes {
            files(first: ${FILE_NUM}) {
              totalCount
              nodes {
                path
              }
            }
            title
            bodyText
            number
            
            createdAt
            updatedAt
            closedAt
            
            id
            
            url
            state
            locked
            labels(first: ${LABEL_NUM}) {
              nodes {
                name
              }
            }
            mergedAt
            mergeCommit {
              oid
            }
            
            headRefName
            headRef {
              prefix
            }
            headRefOid
            
            baseRefName
            baseRef {
              prefix
            }
            baseRefOid
            
            isDraft
            merged
            comments {
              totalCount
            }
            commits {
              totalCount
            }
            additions
            deletions        
            
          }
          pageInfo{
            endCursor
            hasNextPage
          }
        }
      }
    }
    `;
};


const fetchAllRepoPRsAPIGraphQL = async (installationId, repositoryId, fullName, public = false) => {
    // Get GraphQL client to use
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
            Sentry.setContext("fetchAllRepoPRsAPIGraphQL", {
                message: `Failed to get installation GraphQL client`,
                installationId: installationId,
            });

            Sentry.captureException(err);

            throw err;
        }
    }

    var repoName = fullName.split("/")[1];
    var repoOwner = fullName.split("/")[0];

    var query = generatePRQuery();

    var hasNextPage = true;
    var queryResponse;
  
    var variables = { "repoName": repoName, "repoOwner": repoOwner };

    var cursor = undefined;

    var found_pr_list = [];
    var total_prs_scraped = 0;

    while (hasNextPage) {
        if (cursor) {
            variables.cursor = cursor;
        }
        queryResponse = await client.request(query, variables);
  
        total_prs_scraped += queryResponse.repository.pullRequests.nodes.length;
  
  
        // Iterate over list of PRs
        for (i = 0; i < queryResponse.repository.pullRequests.nodes.length; i++) {
            var pr = queryResponse.repository.pullRequests.nodes[i];
        
            found_pr_list.push({
                    installationId: installationId,
                    repository: repositoryId,
                    fileList: pr.files.nodes.map(fileObj => fileObj.path),
        
                    name: pr.title,
                    description: pr.bodyText,
                    sourceId: pr.number,
        
        
                    sourceCreationDate: pr.createdAt,
                    sourceUpdateDate: pr.updatedAt,
                    sourceCloseDate: pr.closedAt,
        
                    pullRequestId: pr.id,
                    number: pr.number,
        
                    htmlUrl: pr.url,
                    state: pr.state,
                    locked: pr.locked,
                    title: pr.title,
                    body: pr.bodyText,
                    labels: pr.labels.nodes.map(labelObj => labelObj.name),
                    createdAt: pr.createdAt,
                    updatedAt: pr.updatedAt,
                    closedAt: pr.closedAt,
                    mergedAt: pr.mergedAt,
                    mergeCommitSha: (pr.mergeCommit != null) ? pr.mergeCommit.oid : null,
        
                    headRef: pr.headRefName,
                    headPrefix: (pr.headRef != null) ? pr.headRef.prefix : null,
                    headSha: pr.headRefOid,
        
                    baseRef: pr.baseRefName,
                    basePrefix: (pr.baseRef != null) ? pr.baseRef.prefix : null,
                    baseSha: pr.baseRefOid,
        
                    draft: pr.isDraft,
                    merged: pr.merged,
                    commentNum: pr.comments.totalCount,
                    commitNum: pr.commits.totalCount,
                    additionNum: pr.additions,
                    deletionNum: pr.deletions,
                    changedFileNum: pr.files.totalCount,
                
            });
        }
  
        hasNextPage = queryResponse.repository.pullRequests.pageInfo.hasNextPage;
        if (hasNextPage) {
            cursor = queryResponse.repository.pullRequests.pageInfo.endCursor;
        }
        console.log(`cursor is ${cursor}`);
        console.log(`total_prs_scraped: ${total_prs_scraped}`);
    }
  
  
    console.log(`Total PRs Scraped: ${total_prs_scraped}`);

    return found_pr_list;

}

const insertPRsFromAPI = async (foundPRList) => {


    if (foundPRList.length < 1) {
        return [];
    }

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


    var bulkInsertResult;
    var newPRIds;
    try {
        bulkInsertResult = await PullRequest.insertMany(foundPRList, { rawResult: true });
        newPRIds = Object.values(bulkInsertResult.insertedIds).map(id => id.toString());
    }
    catch (err) {

        console.log(err);

        Sentry.setContext("insertPRsFromAPI", {
            message: `Error bulk inserting PullRequests`,
            foundPRListLength: foundPRList.length,
        });

        Sentry.captureException(err);

        throw err;
    }

    console.log(`InsertPRsFromAPI finding created PR objects - newPRIds.length: ${newPRIds.length}`);
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
    fetchAllRepoPRsAPIGraphQL,
    insertPRsFromAPI,
    fetchAllPRsFromDB,
}