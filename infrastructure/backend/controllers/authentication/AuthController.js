var CLIENT_HOME_PAGE_URL = process.env.LOCALHOST_HOME_PAGE_URL;

if (process.env.IS_PRODUCTION) {
    CLIENT_HOME_PAGE_URL = process.env.PRODUCTION_HOME_PAGE_URL;
}

const cryptoRandomString = require("crypto-random-string");

const CryptoJS = require("crypto-js");

const client = require("../../apis/api").requestGithubClient();

const User = require("../../models/authentication/User");

const querystring = require("querystring");

const { createUserJWTToken } = require("../../utils/jwt");

var mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const axios = require("axios");

const logger = require("../../logging/index").logger;

const jobs = require("../../apis/jobs");

const fs = require("fs");
var jwt = require("jsonwebtoken");
const GithubAuthProfile = require("../../models/authentication/GithubAuthProfile");
const JiraSite = require("../../models/integrations/jira/JiraSite");

const constants = require("../../constants");

const Pusher = require("pusher");

// create pusher instance
const {
    PUSHER_APP_ID,
    PUSHER_KEY,
    PUSHER_SECRET,
    PUSHER_CLUSTER,
} = process.env;

const pusher = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
});

const { checkValid } = require("../../utils/utils");

// TODO: Change just to validate JWT
loginSuccess = async (req, res) => {
    const authHeader = req.headers.authorization;

    // Get token
    var token = undefined;
    if (authHeader) {
        token = authHeader.split(" ")[1];
    } else if (req.cookies["user-jwt"]) {
        token = req.cookies["user-jwt"];
    } else {
        return res.json({
            success: false,
            authenticated: false,
            user: {},
        });
    }

    var publicKey = fs.readFileSync("docapp-test-public.pem", "utf8");
    try {
        var decoded = jwt.verify(token, publicKey, { algorithms: ["RS256"] });

        // console.log(`Decoded JWT: ${decoded}`);

        var user = await User.findById(decoded.userId).lean().exec();

        // Check that User's Github refresh Token has not expired
        var refreshTokenExpireTime = await GithubAuthProfile.findOne({
            user: decoded.userId,
            status: "valid",
        })
            .select("refreshTokenExpireTime")
            .lean()
            .exec();

        // If no GithubAuthProfile found, return false
        if (!refreshTokenExpireTime) {
            return res.json({
                success: false,
                authenticated: false,
                user: {},
            });
        }

        refreshTokenExpireTime = refreshTokenExpireTime.refreshTokenExpireTime;

        const currentMillis = new Date().getTime();
        // Force user to re-login to Github to get a new refresh Token
        if (currentMillis >= refreshTokenExpireTime) {
            return res.json({
                success: false,
                authenticated: false,
                user: {},
            });
        }

        await logger.info({
            source: "backend-api",
            message: `User ${decoded.userId} successfully authenticated.`,
            function: "loginSuccess",
        });

        // res.clearCookie('user-jwt');
        return res.json({
            success: true,
            authenticated: true,
            message: "user has successfully authenticated",
            user,
            cookies: req.cookies,
        });
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error authenticating User`,
            function: "loginSuccess",
        });
        return res.status(403);
    }
};

loginFailed = (req, res) => {
    return res.status(401).json({
        success: false,
        message: "user failed to authenticate.",
    });
};

logout = (req, res) => {
    res.clearCookie("user-jwt", { path: "/" });
    res.json({ success: true, result: true });
    // res.redirect(CLIENT_HOME_PAGE_URL);
};

checkInstallation = async (req, res) => {
    const { userId } = req.body;

    if (!checkValid(userId))
        return res.json({
            success: false,
            error: `No userId provided to checkInstallation method.`,
        });

    var userAccessToken;
    try {
        userAccessToken = await GithubAuthProfile.findOne({
            user: userId,
            status: "valid",
        })
            .select("accessToken")
            .lean()
            .exec();

        console.log("FOUND GITHUB AUTH PROFILE", userAccessToken);

        userAccessToken = userAccessToken.accessToken;
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error fetching GithubAuthProfile - userId: ${userId}`,
            function: "checkInstallation",
        });
        return res.json({ success: false, error: err });
    }

    var installationResponse;
    try {
        installationResponse = await client.get("/user/installations", {
            headers: {
                Authorization: `token ${userAccessToken}`,
                Accept: "application/vnd.github.v3+json",
            },
        });
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error fetching installation - userId: ${req.tokenPayload.userId}`,
            function: "checkInstallation",
        });
        return res.json({ success: false, error: err });
    }

    return res.json({
        success: true,
        result: installationResponse.data.installations,
    });
};

jiraAuthResponse = async (req, res) => {
    const readJiraIssueScope = "read:jira-work";

    /*
    curl --request POST \
        --url 'https://auth.atlassian.com/oauth/token' \
        --header 'Content-Type: application/json' \
        --data '{"grant_type": "authorization_code","client_id": "Y
        OUR_CLIENT_ID","client_secret": "YOUR_CLIENT_SECRET","code": "YOUR_AUTHORIZATION_CODE","redirect_uri": "https://YOUR_APP_CALLBACK_URL"}'
    */

    const { state, code } = req.query;

    console.log(`JIRA QUERY: ${JSON.stringify(req.query)}`);

    console.log(`Code from JIRA: ${code}`);
    console.log(`State from JIRA: ${state}`);

    var workspaceId = state.split("-")[0];
    var userId = state.split("-")[1];

    var jiraClientId = process.env.JIRA_CLIENT_ID;
    var jiraClientSecret = process.env.JIRA_CLIENT_SECRET;
    var jiraRedirectURI = process.env.JIRA_CALLBACK_URL;

    var jiraAuthClient = axios.create({
        baseURL: "https://auth.atlassian.com",
        headers: {
            "Content-Type": "application/json",
        },
    });

    var jiraAccessTokenData = {
        grant_type: "authorization_code",
        client_id: jiraClientId,
        client_secret: jiraClientSecret,
        code,
        redirect_uri: jiraRedirectURI,
    };
    /* 
        {   "grant_type": "refresh_token",
            "client_id": "YOUR_CLIENT_ID",
            "client_secret": "YOUR_CLIENT_SECRET",
            "refresh_token": "YOUR_REFRESH_TOKEN" }

    */
    console.log(`jiraAccessTokenData: ${JSON.stringify(jiraAccessTokenData)}`);

    var jiraTokenResponse;
    try {
        jiraTokenResponse = await jiraAuthClient.post(
            "/oauth/token",
            jiraAccessTokenData
        );
    } catch (err) {
        // console.log(jiraTokenResponse.data);
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error fetching OAuth token - jiraAccessTokenData: ${JSON.stringify(
                jiraAccessTokenData
            )}`,
            function: "jiraAuthResponse",
        });
        return res.json({ success: false, error: err });
    }

    console.log(
        `jiraTokenResponse.data: ${JSON.stringify(jiraTokenResponse.data)}`
    );

    var jiraAPIClient = axios.create({
        baseURL: "https://api.atlassian.com",
        headers: {
            Authorization: `Bearer ${jiraTokenResponse.data.access_token}`,
            Accept: "application/json",
        },
    });

    // Get the cloudid
    /*
    curl --request GET \
        --url https://api.atlassian.com/oauth/token/accessible-resources \
        --header 'Authorization: Bearer ACCESS_TOKEN' \
        --header 'Accept: application/json'
    */

    var jiraCloudIdResponse;
    try {
        jiraCloudIdResponse = await jiraAPIClient.get(
            "/oauth/token/accessible-resources"
        );
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error fetching JIRA cloudId - jiraAccessToken: ${jiraTokenResponse.data.access_token}`,
            function: "jiraAuthResponse",
        });
        return res.json({ success: false, error: err });
    }

    // Get all Jira Site's in cloudId list
    // Need read:jira-work permission
    var validJiraCloudIds = jiraCloudIdResponse.data.filter((siteObj) => {
        return siteObj.scopes.includes("read:jira-work");
    });

    console.log(
        `JIRA cloudId response: ${JSON.stringify(jiraCloudIdResponse.data)}`
    );
    console.log(`JIRA accessToken: ${jiraTokenResponse.data.access_token}`);

    let jiraSite = new JiraSite({
        cloudIds: validJiraCloudIds.map((siteObj) => siteObj.id),
        userId,
        workspace: workspaceId,
        accessToken: jiraTokenResponse.data.access_token,
    });

    // Save new JiraSite
    try {
        jiraSite = await jiraSite.save();
    } catch (err) {
        console.log(err);
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error saving new JiraSite - cloudIds, userId, workspaceId, accessToken: ${JSON.stringify(
                cloudIds
            )}, ${userId}, ${workspaceId}, ${accessToken}`,
            function: "jiraAuthResponse",
        });

        return res.json({ success: false, error: "error creating JiraSite" });
    }

    var runImportJiraIssuesData = {};
    runImportJiraIssuesData["jiraSiteId"] = jiraSite._id.toString();
    runImportJiraIssuesData[
        "jobType"
    ] = constants.jobs.JOB_IMPORT_JIRA_ISSUES.toString();

    try {
        await jobs.dispatchImportJiraIssuesJob(runImportJiraIssuesData);
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error dispatching update import Jira Issues job - jiraSiteId, jobType: ${jiraSite._id.toString()}, ${constants.jobs.JOB_IMPORT_JIRA_ISSUES.toString()}`,
            function: "jiraAuthResponse",
        });
        return res.json({
            success: false,
            error: `Error dispatching update import Jira Issues job - jiraSiteId, jobType: ${jiraSite._id.toString()}, ${constants.jobs.JOB_IMPORT_JIRA_ISSUES.toString()}`,
        });
    }

    await logger.info({
        source: "backend-api",
        message: `Successfully began importing Jira issues - jiraSiteId, jobType: ${jiraSite._id.toString()}, ${constants.jobs.JOB_IMPORT_JIRA_ISSUES.toString()}`,
        function: "jiraAuthResponse",
    });

    // https://api.atlassian.com/ex/jira/11223344-a1b2-3b33-c444-def123456789/rest/api/2/project

    // To Refresh the Access Token
    /*
    curl --request POST \
        --url 'https://auth.atlassian.com/oauth/token' \
        --header 'Content-Type: application/json' \
        --data '{ "grant_type": "refresh_token", "client_id": "YOUR_CLIENT_ID", "client_secret": "YOUR_CLIENT_SECRET", "refresh_token": "YOUR_REFRESH_TOKEN" }'
    */

    return res.json({ success: true, result: true });
};

/*
retrieveDomainRepositories = async (req, res) => {
    var userRepositoriesResponse;
    try {
        userRepositoriesResponse = await client.get("/user/repos",  
        { headers: {
                Authorization: `token ${req.body.accessToken}`,
                Accept: 'application/vnd.github.machine-man-preview+json'
            }
        })
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error Retrieving Repositories - userId: ${req.tokenPayload.userId}`, function: 'retrieveDomainRepositories'});
        return res.json({success: false, error: err});
    }

    filteredResponse = userRepositoriesResponse.data.filter(item => item.permissions.admin === true);
    // KARAN TODO: Format this result properly
    return res.json(filteredResponse)
}
*/
encryptIDEToken = (req, res) => {
    const ideToken = cryptoRandomString({ length: 10 });

    // Encrypt
    const encryptedToken = CryptoJS.AES.encrypt(
        ideToken,
        process.env.IDE_AUTHENTICATION_SECRET
    ).toString();

    return res.json({ success: true, result: { encryptedToken, ideToken } });
};

authorizeIDEClient = (initialIDEToken, user) => {
    initialIDEToken = decodeURIComponent(initialIDEToken);

    let ideToken = initialIDEToken.replace(" ", "+");

    const { _id: userId, role } = user;

    const jwtToken = createUserJWTToken(userId, role);

    // Decrypt
    const bytes = CryptoJS.AES.decrypt(
        ideToken,
        process.env.IDE_AUTHENTICATION_SECRET
    );

    console.log("USER", user);

    console.log("IDE TOKEN", ideToken);

    ideToken = bytes.toString(CryptoJS.enc.Utf8);

    console.log("IDE TOKEN", ideToken);
    pusher.trigger(`private-${ideToken}`, "vscode-user-authorized", {
        jwt: jwtToken,
        user: user,
        isAuthorized: true,
    });

    return;
};

module.exports = {
    loginSuccess,
    loginFailed,
    logout,
    checkInstallation,
    jiraAuthResponse, // , retrieveDomainRepositories
    authorizeIDEClient,
    encryptIDEToken,
};
