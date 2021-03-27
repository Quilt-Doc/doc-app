var mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const logger = require("../../../logging/index").logger;

const apis = require("../../../apis/api");

const jobs = require("../../../apis/jobs");
const constants = require("../../../constants/index");

const Workspace = require("../../../models/Workspace");

const JiraSite = require("../../../models/integrations/jira/JiraSite");

const IntegrationBoard = require("../../../models/integrations/integration_objects/IntegrationBoard");

const axios = require("axios");

const Sentry = require("@sentry/node");

const { JIRA_CLIENT_ID } = process.env;

const { checkValid } = require("../../../utils/utils");

beginJiraConnect = async (req, res) => {
    const userId = req.userObj._id.toString(); // req.tokenPayload.userId.toString();

    // const { workspace_id } = req.query;

    const workspaceId = req.workspaceObj._id.toString();

    console.log(`Entered beginJiraConnect, Params: ${workspaceId} ${userId}`);

    const jiraBaseURL = `https://auth.atlassian.com/authorize?audience=api.atlassian.com`;

    const jiraBaseParams = `&client_id=${JIRA_CLIENT_ID}&scope=read%3Ajira-user%20read%3Ajira-work%20offline_access`;

    const jiraCallbackUrl =
        "http://localhost:3001/api/integrations/connect/jira/callback";

    const jiraSpecParams = `&redirect_uri=${encodeURIComponent(
        jiraCallbackUrl
    )}&state=${workspaceId}-${userId}&response_type=code&prompt=consent`;

    const jiraAuthURL = `${jiraBaseURL}${jiraBaseParams}${jiraSpecParams}`;

    // return res.json({success: true, result: jiraAuthURL});

    return res.redirect(jiraAuthURL);
};

getWorkspaceJiraSites = async (req, res) => {
    console.log(req.params);
    const workspaceId = req.workspaceObj._id.toString();

    console.log("Getting workspace Jira Sites");

    var workspaceJiraSite;
    try {
        workspaceJiraSite = await JiraSite.findOne({
            workspaceId: ObjectId(workspaceId),
        })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error fetching JiraSite Objects - workspaceId: ${workspaceId}`,
            function: "getWorkspaceJiraSites",
        });
        return res.json({ success: false, result: false });
    }

    console.log(
        `Returning workspace Jira Sites: ${JSON.stringify(workspaceJiraSite)}`
    );

    return res.json({ success: true, result: workspaceJiraSite });
};

getJiraSiteIssues = async (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();
    const { cloudId } = req.body;

    console.log(
        `getJiraSiteIssues - workspaceId, cloudId: ${workspaceId}, ${cloudId}`
    );

    // Get Latest Access Token on Cloud Id in Workspace
    var accessToken;

    try {
        accessToken = await JiraSite.findOne({
            workspaceId: ObjectId(workspaceId),
            cloudId: cloudId,
        })
            .sort({ createdAt: -1 })
            .lean()
            .exec();
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error fetching JiraSite Issues - workspaceId, cloudId: ${workspaceId}, ${cloudId}`,
            function: "getJiraSiteIssues",
        });
        return res.json({ success: false, result: false });
    }

    console.log(
        `getJiraSiteIssues using JiraSite: ${JSON.stringify(accessToken)}`
    );

    var jiraApiClient = axios.create({
        baseURL: `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3`,
        headers: {
            Authorization: `Bearer ${accessToken.accessToken}`,
            Accept: "application/json",
        },
    });

    console.log(`Bearer: ${accessToken.accessToken}`);

    var jiraIssueResponse;
    try {
        // jiraIssueResponse = await jiraApiClient.get('/search?jql=?project%20quilt-kanban-classic');
        jiraIssueResponse = await jiraApiClient.get(
            "/search?jql=project=QKC&maxResults=1000"
        );
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error searching JiraSite Issues - cloudId: ${cloudId}`,
            function: "getJiraSiteIssues",
        });

        return res.json({ success: false, result: false });
    }

    console.log(
        `jiraIssueResponse.data: ${JSON.stringify(jiraIssueResponse.data)}`
    );

    return res.json({ success: true, result: jiraIssueResponse.data.issues });
};

handleJiraCallback = async (req, res) => {
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
    if (!process.env.IS_PRODUCTION) {
        jiraRedirectURI = process.env.LOCAL_JIRA_CALLBACK_URL;
    }

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

    /*
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
    */

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

triggerJiraScrape = async (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();
    const userId = req.tokenPayload.userId.toString();

    // projects is [{ sourceId, repositoryIds }]
    const { projects } = req.body;

    // Get Jira Site by userId

    var jiraSite;
    try {
        jiraSite = await JiraSite.findOne({
            userId: ObjectId(userId),
            workspace: ObjectId(workspaceId),
        })
            .lean()
            .exec();
    } catch (err) {
        Sentry.setContext("JiraController::triggerJiraScrape", {
            message: `Could not find JiraSite`,
            userId: userId,
        });

        Sentry.captureException(err);

        return res.json({
            success: false,
            error: `Could not find JiraSite for userId - ${userId.toString()}`,
        });
    }

    var runImportJiraIssuesData = {};
    runImportJiraIssuesData["jiraSiteId"] = jiraSite._id.toString();
    runImportJiraIssuesData["jiraProjects"] = projects;
    runImportJiraIssuesData["workspaceId"] = workspaceId;

    runImportJiraIssuesData[
        "jobType"
    ] = constants.jobs.JOB_IMPORT_JIRA_ISSUES.toString();

    try {
        await jobs.dispatchImportJiraIssuesJob(runImportJiraIssuesData);
    } catch (err) {
        console.log(err);

        Sentry.setContext("JiraController::triggerJiraScrape", {
            message: `Error dispatching import Jira Issues job`,
            jiraSiteId: jiraSite._id.toString(),
            jobType: runImportJiraIssuesData["jobType"],
        });

        Sentry.captureException(err);

        return res.json({
            success: false,
            error: `Error dispatching update import Jira Issues job - jiraSiteId, jobType: ${jiraSite._id.toString()}, ${constants.jobs.JOB_IMPORT_JIRA_ISSUES.toString()}`,
        });
    }

    return res.json({ success: true, result: null });
    /*
    await logger.info({
        source: "backend-api",
        message: `Successfully began importing Jira issues - jiraSiteId, jobType: ${jiraSite._id.toString()}, ${constants.jobs.JOB_IMPORT_JIRA_ISSUES.toString()}`,
        function: "jiraAuthResponse",
    });
    */
};

getExternalJiraProjects = async (req, res) => {
    console.log("Getting Jira Projects");
    console.log(req.params);
    const workspaceId = req.workspaceObj._id.toString();
    const userId = req.tokenPayload.userId.toString();

    var userJiraSite;

    try {
        userJiraSite = await JiraSite.findOne({
            userId: ObjectId(userId),
            workspace: ObjectId(workspaceId),
        })
            .lean()
            .exec();
    } catch (e) {
        Sentry.setContext("JiraController::getExternalJiraProjects", {
            message: `Error finding JiraSites`,
            userId: userId,
            workspaceId: workspaceId,
        });
        Sentry.captureException(e);

        return res.json({
            success: false,
            error: `Error finding JiraSites - userId, workspaceId: ${userId}, ${workspaceId}`,
        });
    }

    if (!userJiraSite) return res.json({ success: true, result: null });

    var jiraAuthClient = axios.create({
        baseURL: "https://api.atlassian.com/ex/jira",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userJiraSite.accessToken}`,
        },
    });

    var jiraProjects;
    try {
        jiraProjects = await jiraAuthClient.get(
            `/${userJiraSite.cloudIds[0]}/rest/api/3/project/search`
        );
    } catch (err) {
        console.log(err);

        Sentry.setContext("JiraController::getExternalJiraProjects", {
            message: `Error getting Jira Projects from Jira API`,
            cloudId: userJiraSite.cloudIds[0],
            accessToken: userJiraSite.accessToken,
        });
        Sentry.captureException(err);

        return res.json({
            success: false,
            error: `Error getting Jira Projects from Jira API - userId, workspaceId: ${userId}, ${workspaceId}`,
        });
    }

    console.log("Jira API Response: ");
    console.log(jiraProjects.data);

    jiraProjects = jiraProjects.data.values;

    let workspace;

    try {
        workspace = await Workspace.find({
            workspace: workspaceId,
        })
            .lean()
            .select("boards")
            .populate("boards")
            .exec();
    } catch (err) {
        console.log(err);

        Sentry.setContext("JiraController::getExternalJiraProjects", {
            message: `Error finding Workspace`,
            workspaceId: workspaceId.toString(),
        });

        Sentry.captureException(err);

        return res.json({ success: true, error: err });
    }

    /*
    const integratedBoardSourceIds = new Set(
        workspace.boards.map((board) => board.sourceId)
    );
    */

    /*
    jiraProjects = jiraProjects.map((projectObj) => projectObj.id);

    const integratedBoardSourceIds = jiraProjects;

    jiraProjects = jiraProjects.filter((board) => {
        const { id } = board;

        return !integratedBoardSourceIds.has(id);
    });
    */

    return res.json({ success: true, result: jiraProjects });
};

const createPersonalToken = async (req, res) => {
    const userId = req.tokenPayload.userId.toString();
    const workspaceId = req.workspaceObj._id.toString();

    const { tokenValue, emailAddress } = req.body;

    if (!checkValid(tokenValue))
        return res.json({ success: false, error: "No tokenValue provided." });
    if (!checkValid(emailAddress))
        return res.json({ success: false, error: "No emailAddress provided." });

    var userJiraSite;

    try {
        userJiraSite = await JiraSite.findOneAndUpdate(
            { userId: ObjectId(userId), workspace: ObjectId(workspaceId) },
            { personalAccessToken: tokenValue, jiraEmailAddress: emailAddress }
        )
            .lean()
            .exec();
    } catch (e) {
        Sentry.setContext("JiraController::createPersonalToken", {
            message: `Error JiraSite findOneAndUpdate failed`,
            userId: userId,
            workspaceId: workspaceId,
            tokenValue: tokenValue,
        });
        Sentry.captureException(e);

        return res.json({
            success: false,
            error: `Error findOneAndUpdate JiraSite failed - userId, workspaceId, tokenValue: ${userId}, ${workspaceId}, ${tokenValue}`,
        });
    }

    return res.json({ success: true, result: userJiraSite });
};

module.exports = {
    getWorkspaceJiraSites,
    getJiraSiteIssues,
    beginJiraConnect,
    handleJiraCallback,
    triggerJiraScrape,
    getExternalJiraProjects,
    createPersonalToken,
};
