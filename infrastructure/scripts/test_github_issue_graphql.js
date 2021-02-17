
const { GraphQLClient, gql, rawRequest, request } = require('graphql-request');

const INSTALLATION_TOKEN="v1.05703c36c379d7e0179d7f0652ed14295430a926";


const requestInstallationGraphQLClient = () => {

    var installationToken = INSTALLATION_TOKEN


    const prismaClient = new GraphQLClient("https://api.github.com/graphql", {
        credentials: 'include',
        mode: 'cors',
        headers: {
          Authorization: `bearer ${installationToken}`,
        },
      });
    return prismaClient
}


const generateIssueQuery = (repositoryObj, issueNumber) => {

   // var queryString = `query {resource(url: "${repositoryObj.htmlUrl}/issues/${issueNumber}") { ... on Issue { timelineItems(itemTypes: [CONNECTED_EVENT, DISCONNECTED_EVENT], first: 100) { nodes {... on ConnectedEvent {id subject { ... on Issue { number } } } } } } } }`;

   // return queryString;

    return gql`
     {
        resource(url: \"${repositoryObj.htmlUrl}/issues/${issueNumber}\") {
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

    console.log('queryResponse: ');
    console.log(queryResponse);

    console.log('queryResponse.resource.timelineItems.nodes: ');
    console.log(queryResponse.resource.timelineItems.nodes);

}


getGithubIssueLinkages({githubIssueNumber: 9}, {htmlUrl: `https://github.com/kgodara-testing/brodal_queue`})