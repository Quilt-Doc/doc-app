
const { GraphQLClient, gql, rawRequest, request } = require('graphql-request');

const INSTALLATION_TOKEN="v1.ad5f62eb9ed5150b65abfc91fb535561938b75a0";


const requestInstallationGraphQLClient = () => {

    var installationToken = INSTALLATION_TOKEN


    const prismaClient = new GraphQLClient("https://api.github.com/graphql/", {
        credentials: 'include',
        mode: 'cors',
        headers: {
          Authorization: `token ${installationToken}`,
        },
      });
    return prismaClient
}


const generateIssueQuery = (repositoryObj, issueNumber) => {

    var queryString = `{resource(url: "${repositoryObj.htmlUrl}/issues/${issueNumber}") { ... on Issue { timelineItems(itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT], first: 100) { nodes {... on ConnectedEvent {id subject { ... on Issue { number } } } } } } } }`;

   return queryString;

    return gql`
     {
        resource(url: "${repositoryObj.htmlUrl}/issues/${issueNumber}") {
            ... on Issue {
                timelineItems(itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT], first: 100) {
                  nodes {
                    ... on ConnectedEvent {
                      id
                      subject {
                        ... on Issue {
                          number
                        }
                        ... on PullRequest {
                          number
                        }
                      }
                    }
                  }
                }
              }
            }
      }
    `
}




const getGithubIssueLinkages = async (issueObj, repositoryObj ) => {

    var prismaQuery = generateIssueQuery(repositoryObj, issueObj.githubIssueNumber);

    var prismaClient;
    
    try {
        prismaClient = requestInstallationGraphQLClient();
    }
    catch (err) {
        console.log(`Error requesting installation GraphQL Client - installationId: ${installationId}`);
        console.log(err);

        throw new Error(
            `Error requesting installation GraphQL Client - installationId: ${installationId}`
        );
    }

    // console.log("PRISMA QUERY: ");
    // console.log(prismaQuery)

    var queryResponse;
    try {
        queryResponse = await prismaClient.request(prismaQuery, {});
    }
    catch (err) {
        console.log(`Error fetching Issue timelineItems - repositoryObj.htmlUrl, issueObj.githubIssueNumber: ${repositoryObj.htmlUrl}, ${issueObj.githubIssueNumber}`);
        console.log(err);

        throw new Error(
            `Error fetching Issue timelineItems - repositoryObj.htmlUrl, issueObj.githubIssueNumber: ${repositoryObj.htmlUrl}, ${issueObj.githubIssueNumber}`
        );
    }

    console.log('queryResponse.data: ');
    console.log(queryResponse.data);

}


getGithubIssueLinkages({githubIssueNumber: 9}, {htmlUrl: `https://github.com/kgodara-testing/brodal_queue`})