const Token = require('../models/Token');
const logger = require('../logging/index').logger;

// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'us-east-1'});


const requestGithubClient = () => {
    const axios = require('axios');
    return axios.create({
        baseURL: process.env.GITHUB_API_URL,
    });
}

const requestSQSServiceObject = () => {
    // Create an SQS service object
    var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
    return sqs;
}


// Only token Manager will create / update App tokens
const fetchAppToken = async () => {

    var token;
    try {
        token = await Token.findOne({'type': 'APP'});
        if (!token) {
            await logger.error({source: 'backend-api', message: Error(`Error finding 'APP' Token`),
                                errorDescription: "Could not find the App Token", function: "fetchAppToken"});
            throw new Error(`Error finding 'APP' Token`);
        }
        return token;
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: "Error finding the App Token", function: "fetchAppToken"});
        throw err;
    }
}

const requestNewInstallationToken = async (installationId) => {
    var lambda = new AWS.Lambda();

    var params = {
        FunctionName: 'token-manager', /* required */
        Payload: JSON.stringify({ action: 'create', installationId })
    };
    var lambdaResponse;


    try {
        lambdaResponse = await lambda.invoke(params).promise();
    }
    catch(err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: "Error Calling token-manager lambda", function: "requestNewInstallationToken"});
        throw err;
    }

    if (lambdaResponse.body.success == 'true') {
        return lambdaResponse.body.result;
    }

    else {
        await logger.error({source: 'backend-api', message: Error(lambdaResponse.body.error),
                            errorDescription: "Error token-manager lambda success != true", function: "requestNewInstallationToken"});
        throw Error(lambdaResponse.body.error);
    }
}



const requestInstallationToken = async (appToken, installationId) => {

    var tokenFetch;
    try {
        // console.log('requestInstallationToken tokenFetch: ');
        // console.log(tokenFetch);
        tokenFetch = await Token.findOne({ installationId });
    }
    catch(err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error finding installationToken with installationId: ${installationId}`, function: "requestInstallationToken"});
        throw err;
    }

    if (tokenFetch) {
        return tokenFetch
    }

    else {
        try {
            var newToken = await requestNewInstallationToken(installationId);
            return newToken;
        }
        catch (err) {
            await logger.error({source: 'backend-api', message: err,
                                errorDescription: "Error: requestNewInstallationToken", function: "requestInstallationToken"});
            throw err;
        }
    }
}

const requestInstallationClient = async (installationId) => {
    const axios = require('axios');

    var appToken = await fetchAppToken();
    var installationToken;
    try {
       installationToken = await requestInstallationToken(appToken, installationId);
    }
    catch(err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: "Error: requestInstallationToken", function: "requestInstallationClient"});
        throw err;
    }


    var installationApi = axios.create({
        baseURL: process.env.GITHUB_API_URL + "/",
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