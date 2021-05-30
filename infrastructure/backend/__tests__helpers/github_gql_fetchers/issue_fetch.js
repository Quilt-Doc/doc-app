const { gql } = require("graphql-request");

const ISSUE_FETCH_NUM = 100;


const generateIssueFetchQuery = () => {
    const LABEL_NUM = 100;
    
    return gql`
    query fetchRepoIssues($repoName: String!, $repoOwner: String!, $issueNumber: Int!, $cursor: String) {
        repository(name: $repoName, owner: $repoOwner) { 
          issues(first: $issueNumber, after: $cursor) {
            nodes {
              title
              number
              author {
                  login
              }
              body
              createdAt
              updatedAt
              closedAt
              url
              state
              labels (first: ${LABEL_NUM}) {
                nodes {
                  name
                }
              }
              locked
              comments {
                totalCount
              }
              authorAssociation
            }
            pageInfo {
              endCursor
              hasNextPage
            }
          }
        }
      }
    `;
};

const fetchAllRepoIssuesAPIGraphQL = async (client, repository) => {

    var fullName = repository.fullName;

    var repoName = fullName.split("/")[1];
    var repoOwner = fullName.split("/")[0];

    var query = generateIssueFetchQuery();

    var hasNextPage = true;
    var queryResponse;
  
    var variables = { "repoName": repoName, "repoOwner": repoOwner };

    variables.issueNumber = ISSUE_FETCH_NUM;

    var cursor = undefined;

    var foundIssueList = [];

    while (hasNextPage) {

        if (cursor) {
            variables.cursor = cursor;
        }
        queryResponse = await client.request(query, variables);
   
        // Iterate over list of Issues
        for (var i = 0; i < queryResponse.repository.issues.nodes.length; i++) {
            var issue = queryResponse.repository.issues.nodes[i];
        
            foundIssueList.push(issue);
        }
        
        hasNextPage = queryResponse.repository.issues.pageInfo.hasNextPage;

        if (hasNextPage) {
            cursor = queryResponse.repository.issues.pageInfo.endCursor;
        }
    }
    return foundIssueList;

};

module.exports = {
    fetchAllRepoIssuesAPIGraphQL,
};