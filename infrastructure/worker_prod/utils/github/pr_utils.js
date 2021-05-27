
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;


const api = require("../../apis/api");

const Sentry = require("@sentry/node");

const PullRequest = require("../../models/PullRequest");

const { gql } = require("graphql-request");

const { getRequestLists  } = require("../fetch_utils"); 


const generatePRQuery = () => {

    const FILE_NUM = 100;
    const LABEL_NUM = 100;

    return gql`
    query fetchPRsWithFiles($repoName: String!, $repoOwner: String!, $prNumber: Int!, $cursor: String) { 
      repository(name: $repoName, owner:$repoOwner) { 
        pullRequests(first: $prNumber, after: $cursor) {
          nodes {
            files(first: ${FILE_NUM}) {
              totalCount
              nodes {
                path
              }
            }
            title
            body
            number
            
            author {
              login
            }
            
            createdAt
            updatedAt
            closedAt
            
            id
            
            url
            state
            reviewDecision
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

const generatePRBackwardsQuery = () => {

    const FILE_NUM = 100;
    const LABEL_NUM = 100;

    return gql`
    query fetchPRsWithFiles($repoName: String!, $repoOwner: String!, $prNumber: Int!, $cursor: String) { 
      repository(name: $repoName, owner:$repoOwner) { 
        pullRequests(last: $prNumber, before: $cursor) {
          nodes {
            files(first: ${FILE_NUM}) {
              totalCount
              nodes {
                path
              }
            }
            title
            body
            number
            
            author {
              login
            }
            
            createdAt
            updatedAt
            closedAt
            
            id
            
            url
            state
            reviewDecision
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
            startCursor
            hasPreviousPage
          }
        }
      }
    }
    `;
};




const fetchAllRepoPRsAPIGraphQL = async (client, installationId, repositoryId, fullName, req_list=undefined, backwards=false) => {

    if (req_list) {
        if (req_list.length == 0) {
            return [];
        }
    }

    var repoName = fullName.split("/")[1];
    var repoOwner = fullName.split("/")[0];

    var query;
    if (backwards == false) {
        query = generatePRQuery();
    } else {
        query = generatePRBackwardsQuery();
    }

    var hasNextPage = true;
    var queryResponse;
  
    var variables = { "repoName": repoName, "repoOwner": repoOwner };

    if (!req_list) {
        variables.prNumber = 100;
    }


    var cursor = undefined;

    var found_pr_list = [];
    var total_prs_scraped = 0;

    var req_num = 0;

    while (hasNextPage) {

        if (req_list) {
            if (req_num >= req_list.length) {
                break;
            }
            variables.prNumber = req_list[req_num];
        }


        if (cursor) {
            variables.cursor = cursor;
        }
        queryResponse = await client.request(query, variables);
  
        total_prs_scraped += queryResponse.repository.pullRequests.nodes.length;
  
  
        // Iterate over list of PRs
        for (var i = 0; i < queryResponse.repository.pullRequests.nodes.length; i++) {
            var pr = queryResponse.repository.pullRequests.nodes[i];
        
            found_pr_list.push({
                installationId: installationId,
                repository: repositoryId,
                fileList: pr.files.nodes.map(fileObj => fileObj.path),
        
                name: pr.title,
                description: pr.body,
                sourceId: pr.number,
        
        
                sourceCreationDate: pr.createdAt,
                sourceUpdateDate: pr.updatedAt,
                sourceCloseDate: pr.closedAt,
        
                pullRequestId: pr.id,
                number: pr.number,

                creator: (pr.author != null) ? pr.author.login : null,
        
                htmlUrl: pr.url,
                state: pr.state,
                reviewDecision: pr.reviewDecision,
                locked: pr.locked,
                title: pr.title,
                body: pr.body,
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

        if (backwards == false) {
            hasNextPage = queryResponse.repository.pullRequests.pageInfo.hasNextPage;
        } else {
            hasNextPage = queryResponse.repository.pullRequests.pageInfo.hasPreviousPage;
        }
  
        if (hasNextPage) {
            if (backwards == false) {
                cursor = queryResponse.repository.pullRequests.pageInfo.endCursor;
            } else {
                cursor = queryResponse.repository.pullRequests.pageInfo.startCursor;
            }
        }
        // console.log(`cursor is ${cursor}`);
        console.log(`total_prs_scraped: ${total_prs_scraped}`);
        req_num += 1;
    }
  
  
    console.log(`Total PRs Scraped: ${total_prs_scraped}`);

    return found_pr_list;

};


const fetchPRNum = async (client, fullName) => {
    var query = gql`
    query getTotalCounts($repoName: String!, $repoOwner: String!) {
        repository(name: $repoName, owner: $repoOwner) {
          pullRequests {
            totalCount
          }
        }  
      }
    `;

    var repoName = fullName.split("/")[1];
    var repoOwner = fullName.split("/")[0];

    var variables = { "repoName": repoName, "repoOwner": repoOwner };

    var queryResponse = await client.request(query, variables);

    return queryResponse.repository.pullRequests.totalCount;
};


const fetchAllRepoPRsAPIConcurrent = async (client, installationId, repositoryId, fullName) => {

    var prNum = await fetchPRNum(client, fullName);
  
    var req_lists = getRequestLists(prNum);

    var fetchResults;

    try {
        fetchResults = await Promise.allSettled([fetchAllRepoPRsAPIGraphQL(client, installationId, repositoryId, fullName, req_lists.forward, false),
            fetchAllRepoPRsAPIGraphQL(client, installationId, repositoryId, fullName, req_lists.backward, true)]
        );
    } catch (err) {
        console.log(err);

        Sentry.setContext("fetchAllRepoPRsAPIConcurrent", {
            message: "Promise.allSettled([fetchAllRepoPRsAPIConcurrent()]) failed",
            fullName: fullName,
            forward_list: JSON.stringify(req_lists.forward),
            backward_list: JSON.stringify(req_lists.backward),
        });

        Sentry.captureException(err);

        throw err;
    }

    var validResults = fetchResults.filter(resultObj => resultObj.value && !resultObj.value.error);
    validResults = validResults.map(resultObj => resultObj.value);

    validResults = validResults.flat();

    return validResults;
};






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
    } catch (err) {

        console.log(err);

        Sentry.setContext("insertPRsFromAPI", {
            message: "Error bulk inserting PullRequests",
            foundPRListLength: foundPRList.length,
        });

        Sentry.captureException(err);

        throw err;
    }

    console.log(`InsertPRsFromAPI finding created PR objects - newPRIds.length: ${newPRIds.length}`);
};

const fetchAllPRsFromDB = async (repositoryId, selectionString) => {

    var foundPRs;

    try {
        foundPRs = await PullRequest.find({ repository: repositoryId }, selectionString)
            .lean()
            .exec();
    } catch (err) {
        Sentry.setContext("fetchAllPRsFromDB", {
            message: "Failed to fetch PullRequest Models",
            repositoryId: repositoryId,
            selectionString: selectionString,
        });

        Sentry.captureException(err);
        throw err;
    }

    return foundPRs;
};

module.exports = {
    fetchAllRepoPRsAPIGraphQL,
    fetchAllRepoPRsAPIConcurrent,
    insertPRsFromAPI,
    fetchAllPRsFromDB,
};