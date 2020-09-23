var jwtUtils = require('../utils/jwt');

const Token = require('../models/Token');

const fs = require('fs');

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-east-1'});


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
    
    return await Token.findOne({'type': 'APP'})
    .then((foundToken) => {
        token = foundToken;
        console.log('Token found is: ');
        console.log(token);
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

    var tokenFetch = await Token.findOne({ installationId });
    console.log('requestInstallationToken tokenFetch: ');
    console.log(tokenFetch);

    if (tokenFetch) {
        return tokenFetch
    }

    else {
        console.log('Requesting new installation token');
        return await requestNewInstallationToken(installationId);
    }
}

const requestInstallationClient = async (installationId) => {
    const axios = require('axios');

    var appToken = await fetchAppToken();
    console.log('Received App Token');
    console.log(appToken);
    var installationToken = await requestInstallationToken(appToken, installationId);
    console.log('Received Installation Token');
    console.log(installationToken);

    var installationApi = axios.create({
        baseURL: "https://api.github.com/",
        headers: {
            post: {        // can be common or any other method
                Authorization: 'token ' + installationToken.value
            },
            get: {
                Authorization: 'token ' + installationToken.value
            }
          }
    });
    return installationApi;
}

module.exports = {
    requestGithubClient,
    requestSQSServiceObject,
    fetchAppToken,
    requestInstallationToken,
    requestInstallationClient
}