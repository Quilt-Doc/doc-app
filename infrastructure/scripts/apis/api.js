const Token = require("../models/Token");


var testingApiEndpoint;

if (process.env.IS_PRODUCTION) {
    testingApiEndpoint = process.env.PRODUCTION_API_URL;
} else {
    testingApiEndpoint = process.env.LOCALHOST_API_URL;
}

// Only token Manager will create / update App tokens
const fetchAppToken = async () => {
    var token;
    try {
        token = await Token.findOne({ type: "APP" });
        if (!token) {
            console.log(err);
            throw new Error(`Error finding 'APP' Token`);
        }
        return token;
    } catch (err) {
        console.log(err);
        throw err;
    }
};

const requestInstallationToken = async (appToken, installationId) => {
    var tokenFetch;
    try {
        // console.log('requestInstallationToken tokenFetch: ');
        // console.log(tokenFetch);
        tokenFetch = await Token.findOne({ installationId });
    } catch (err) {
        console.log(err);
        throw err;
    }

    if (tokenFetch) {
        return tokenFetch;
    } else {
        throw new Error(`Installation Token not found for installationId: ${installationId}`);
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
        console.log(err);
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

module.exports = {
    requestInstallationClient,
};
