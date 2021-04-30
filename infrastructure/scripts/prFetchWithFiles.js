
const { GraphQLClient, gql, rawRequest, request } = require('graphql-request');

const GITHUB_PUBLIC_USER_OAUTH="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"
const PR_NUM = 100;
const LABEL_NUM = 100;
const FILE_NUM = 100;


/*

  prObj.fileList -> files()
  prObj.title -> title,
  prObj.description -> bodyText,
  prObj.number -> number,


  prObj.created_at -> createdAt,
  prObj.updated_at -> updatedAt,
  prObj.closed_at -> closedAt,

  prObj.branchLabelList -> N/A,

  prObj.id -> id,

  prObj.html_url -> url,
  prObj.issue_url -> N/A,
  prObj.state -> state,
  prObj.locked -> locked,
  prObj.labels -> labels(),
  prObj.merged_at -> mergedAt,
  prObj.merge_commit_sha -> mergeCommit { oid },

  prObj.head.ref -> headRef { name },
  prObj.head.label -> headRef { prefix },
  prObj.head.sha -> headRefOid,

  prObj.base.ref -> baseRef { name },
  prObj.base.label -> baseRef { prefix },
  prObj.base.sha -> baseRefOid,

a
*/

const generatePRQuery = () => {
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
            
            headRef {
              name
              prefix
            }
            headRefOid
            
            baseRef {
              name
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

const requestPublicGraphQLClient = () => {

    const prismaClient = new GraphQLClient("https://api.github.com/graphql", {
        credentials: 'include',
        mode: 'cors',
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `token ${GITHUB_PUBLIC_USER_OAUTH}`,
        },
        /*
        auth: {
            username: process.env.GITHUB_PUBLIC_USER_NAME,
            password: process.env.GITHUB_PUBLIC_USER_OAUTH,
        }
        */       
    });
    return prismaClient
}

const runProcedure = async (repoName, repoOwner) => {
  var client = requestPublicGraphQLClient();

  var query = generatePRQuery(repoName, repoOwner);

  var hasNextPage = true;
  var queryResponse;

  var variables = { "repoName": repoName, "repoOwner": repoOwner };

  var cursor = undefined;

  var total_prs_scraped = 0;

  while (hasNextPage) {
      if (cursor) {
          variables.cursor = cursor;
      }
      queryResponse = await client.request(query, variables);

      total_prs_scraped += queryResponse.repository.pullRequests.nodes.length;


      // Iterate over list of PRs
      for (i = 0; i < queryResponse.repository.pullRequests.nodes.length; i++) {
          var currentPRObj = queryResponse.repository.pullRequests.nodes[i];

      }

      hasNextPage = queryResponse.repository.pullRequests.pageInfo.hasNextPage;
      if (hasNextPage) {
          cursor = queryResponse.repository.pullRequests.pageInfo.endCursor;
      }
      console.log(`cursor is ${cursor}`);
      console.log(`total_prs_scraped: ${total_prs_scraped}`);
  }


  console.log(`Total PRs Scraped: ${total_prs_scraped}`);

}




const optionDefinitions = [
  { name: "name", alias: "n", type: String, defaultOption: false },
  { name: "owner", alias: "o", type: String },
];

const commandLineArgs = require("command-line-args");
const options = commandLineArgs(optionDefinitions);

if (!options.name) {
  console.log("No repository name provided '-n'")
  return;
}

if (!options.owner) {
  console.log("No repository owner provided '-o'")
  return;
}

runProcedure(options.name, options.owner);