const { gql } = require("graphql-request");

const PR_FETCH_NUM = 100;


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

const fetchAllRepoPRsAPIGraphQL = async (client, repository) => {


    var fullName = repository.fullName;

    var repoName = fullName.split("/")[1];
    var repoOwner = fullName.split("/")[0];

    var query = generatePRQuery();

    var hasNextPage = true;
    var queryResponse;

    var variables = { "repoName": repoName, "repoOwner": repoOwner };
    variables.prNumber = PR_FETCH_NUM;

    var cursor = undefined;

    var foundPrList = [];

    while (hasNextPage) {

        if (cursor) {
            variables.cursor = cursor;
        }
        queryResponse = await client.request(query, variables);


        // Iterate over list of PRs
        for (var i = 0; i < queryResponse.repository.pullRequests.nodes.length; i++) {
            var pr = queryResponse.repository.pullRequests.nodes[i];
    
            foundPrList.push(pr);
        }

        hasNextPage = queryResponse.repository.pullRequests.pageInfo.hasNextPage;

        if (hasNextPage) {
            cursor = queryResponse.repository.pullRequests.pageInfo.endCursor;
        }
    }

    return foundPrList;

};

module.exports = {
    fetchAllRepoPRsAPIGraphQL,
};