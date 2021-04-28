const Token = require("../models/Token");
const logger = require("../logging/index").logger;

// Load the AWS SDK for Node.js
var AWS = require("aws-sdk");
// Set the region
AWS.config.update({ region: "us-east-1" });

var testingApiEndpoint;

if (process.env.IS_PRODUCTION) {
    testingApiEndpoint = process.env.PRODUCTION_API_URL;
} else {
    testingApiEndpoint = process.env.LOCALHOST_API_URL;
}

const LOCAL_WORKER_PORT = 8080;

const requestLocalWorkerClient = () => {
    const axios = require("axios");

    return axios.create({
        baseURL: `http://localhost:${LOCAL_WORKER_PORT}`,
    });
};

const requestTestingUserBackendClient = () => {
    const axios = require("axios");
    // console.log("TEST_USER_JWT: ");
    // console.log(process.env.TEST_USER_JWT);
    return axios.create({
        baseURL: testingApiEndpoint,
        headers: {
            Authorization: `Bearer ${process.env.TEST_USER_JWT}`,
        },
    });
};

const requestTestingDevBackendClient = () => {
    const axios = require("axios");
    console.log(
        `Creating testing dev client - testingApiEndpoint: ${testingApiEndpoint}`
    );
    return axios.create({
        baseURL: testingApiEndpoint,
        headers: {
            Authorization: `Bearer ${process.env.DEV_TOKEN}`,
        },
    });
};

const requestSendGridClient = () => {
    const axios = require("axios");
    return axios.create({
        baseURL: process.env.SENDGRID_API_URL,
        headers: {
            Authorization: `Bearer ${process.env.SENDGRID_API_KEY.trim()}`,
            "Content-Type": "application/json",
        },
    });
};

const requestGithubClient = () => {
    const axios = require("axios");
    return axios.create({
        baseURL: process.env.GITHUB_API_URL,
    });
};

const requestSQSServiceObject = () => {
    // Create an SQS service object
    var sqs = new AWS.SQS({ apiVersion: "2012-11-05" });
    return sqs;
};

// Only token Manager will create / update App tokens
const fetchAppToken = async () => {
    var token;
    try {
        token = await Token.findOne({ type: "APP" });
        if (!token) {
            await logger.error({
                source: "backend-api",
                message: Error(`Error finding 'APP' Token`),
                errorDescription: "Could not find the App Token",
                function: "fetchAppToken",
            });
            throw new Error(`Error finding 'APP' Token`);
        }
        return token;
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: "Error finding the App Token",
            function: "fetchAppToken",
        });
        throw err;
    }
};

const requestNewInstallationToken = async (installationId) => {
    var lambda = new AWS.Lambda();

    var params = {
        FunctionName: "token-manager" /* required */,
        Payload: JSON.stringify({
            action: "createInstallToken",
            installationId,
        }),
    };
    var lambdaResponse;

    try {
        lambdaResponse = await lambda.invoke(params).promise();
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: "Error Calling token-manager lambda",
            function: "requestNewInstallationToken",
        });
        throw err;
    }

    lambdaResponse = JSON.parse(lambdaResponse.Payload);

    if (lambdaResponse.body.success) {
        return lambdaResponse.body.result;
    } else {
        await logger.error({
            source: "backend-api",
            message: Error(lambdaResponse.body.error),
            errorDescription: "Error token-manager lambda success != true",
            function: "requestNewInstallationToken",
        });
        throw Error(lambdaResponse.body.error);
    }
};

const requestInstallationToken = async (appToken, installationId) => {
    var tokenFetch;
    try {
        // console.log('requestInstallationToken tokenFetch: ');
        // console.log(tokenFetch);
        tokenFetch = await Token.findOne({ installationId });
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error finding installationToken with installationId: ${installationId}`,
            function: "requestInstallationToken",
        });
        throw err;
    }

    if (tokenFetch) {
        return tokenFetch;
    } else {
        try {
            var newToken = await requestNewInstallationToken(installationId);
            return newToken;
        } catch (err) {
            await logger.error({
                source: "backend-api",
                message: err,
                errorDescription: "Error: requestNewInstallationToken",
                function: "requestInstallationToken",
            });
            throw err;
        }
    }
};

const requestInstallationClient = async (installationId) => {
    const axios = require("axios");

    var appToken = await fetchAppToken();
    var installationToken;
    try {
        installationToken = await requestInstallationToken(
            appToken,
            installationId
        );
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: "Error: requestInstallationToken",
            function: "requestInstallationClient",
        });
        throw err;
    }

    var installationApi = axios.create({
        baseURL: process.env.GITHUB_API_URL + "/",
        headers: {
            post: {
                // can be common or any other method
                Authorization: "token " + installationToken.value,
            },
            get: {
                Authorization: "token " + installationToken.value,
            },
            patch: {
                Authorization: "token " + installationToken.value,
            },
        },
    });
    return installationApi;
};

const requestPublicClient = () => {
    const axios = require("axios");
    return axios.create({
        baseURL: process.env.GITHUB_API_URL,
        headers: {
            accept: "application/vnd.github.v3+json",
        },
        auth: {
            username: process.env.GITHUB_PUBLIC_USER_NAME,
            password: process.env.GITHUB_PUBLIC_USER_OAUTH,
        },
    });
};

module.exports = {
    requestLocalWorkerClient,
    requestTestingUserBackendClient,
    requestTestingDevBackendClient,
    requestSendGridClient,
    requestGithubClient,
    requestSQSServiceObject,
    fetchAppToken,
    requestInstallationToken,
    requestInstallationClient,
    requestPublicClient,
};
