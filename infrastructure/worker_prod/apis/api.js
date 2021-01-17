
const Token = require('../models/Token');
const fs = require('fs');

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-east-1'});

const { gql, rawRequest, request } = require('graphql-request');

const { GraphQLClient } = require('../mod-graphql-request/dist');


const requestJiraClient = ( cloudId, accessToken ) => {
    const axios = require('axios');
    return axios.create({
        baseURL: `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3`,
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            'Accept': 'application/json',
        }
    });
}


const requestBackendClient = () => {
	const axios = require('axios');
	return axios.create({
        baseURL: process.env.BACKEND_API_URL,
        headers: {
            "Authorization": `Bearer ${process.env.DEV_TOKEN}`
        }
	})
}

const requestGithubClient = () => {
    const axios = require('axios');
    return axios.create({
        baseURL: "https://api.github.com",
    });
}

const requestSQSServiceObject = () => {
    // Create an SQS service object
    var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
    return sqs;
}

// Only token Manager will create / update App tokens
const fetchAppToken = async () => {
    
    var currentTime = new Date().getTime();
    curentTime = Math.round(currentTime  / 1000);

    var token = undefined;
    
    return await Token.findOne({'type': 'APP'}, null)
    .then((foundToken) => {
        token = foundToken;
        return token;
    })
    .catch((err) => {
        console.log("Error finding app access token: ");
        console.log(err);
        return undefined;
    });
}

const requestNewInstallationToken = async (installationId) => {
    var lambda = new AWS.Lambda();

    var params = {
        FunctionName: 'token-manager', /* required */
        Payload: JSON.stringify({ action: 'create', installationId })
    };
    var lambdaResponse = await lambda.invoke(params).promise();
    if (lambdaResponse.body.success == 'true') {
        return lambdaResponse.body.result;
    }
    return undefined;
}



const requestInstallationToken = async (appToken, installationId) => {

    var tokenFetch = await Token.findOne({ installationId }, null);

    if (tokenFetch) {
        return tokenFetch
    }

    else {
        return await requestNewInstallationToken(installationId);
    }
}

const requestInstallationClient = async (installationId) => {
    const axios = require('axios');

    console.log(`Searching for Installation Token for ID: ${installationId}`);

    var appToken = await fetchAppToken();
    var installationToken = await requestInstallationToken(appToken, installationId);

    var installationApi = axios.create({
        baseURL: "https://api.github.com/",
        headers: {
            post: {        // can be common or any other method
                Authorization: 'token ' + installationToken.value
            },
            get: {
                Authorization: 'token ' + installationToken.value
            },
            patch: {
                Authorization: 'token ' + installationToken.value
            }
          }
    });
    return installationApi;
}


const requestInstallationGraphQLClient = async (installationId) => {

    console.log(`Searching for Installation Token for ID: ${installationId}`);

    var appToken = await fetchAppToken();
    var installationToken = await requestInstallationToken(appToken, installationId);


    const prismaClient = new GraphQLClient("https://api.github.com/", {
        credentials: 'include',
        mode: 'cors',
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `token ${installationToken.value}`,
        },
      });
    return prismaClient
}




module.exports = {
    requestJiraClient,
    requestGithubClient,
    requestSQSServiceObject,
    requestBackendClient,

    fetchAppToken,
    requestInstallationToken,
    requestInstallationClient,
    requestInstallationGraphQLClient,
}
