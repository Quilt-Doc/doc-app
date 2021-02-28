var mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

const logger = require("../../../logging/index").logger;

const apis = require("../../../apis/api");

const JiraSite = require("../../../models/integrations/jira/JiraSite");

const axios = require("axios");

const { JIRA_CLIENT_ID } = process.env;

beginJiraConnect = async (req, res) => {
    const { user_id, workspace_id } = req.query;

    const workspaceId = workspace_id.toString();

    const userId = user_id.toString();

    console.log(`Entered beginJiraConnect, Params: ${workspaceId} ${userId}`);

    const jiraBaseURL = `https://auth.atlassian.com/authorize?audience=api.atlassian.com`;

    const jiraBaseParams = `&client_id=${JIRA_CLIENT_ID}&scope=read%3Ajira-user%20read%3Ajira-work%20offline_access`;

    const jiraCallbackUrl =
        "http://localhost:3001/api/integrations/connect/jira/callback";

    const jiraSpecParams = `&redirect_uri=${encodeURIComponent(
        jiraCallbackUrl
    )}&state=${workspaceId}-${userId}&response_type=code&prompt=consent`;

    const jiraAuthURL = `${jiraBaseURL}${jiraBaseParams}${jiraSpecParams}`;

    return res.redirect(jiraAuthURL);
};

getExternalJiraProjects = async (req, res) => {
    const { userId, workspaceId } = req.params;

    /*
    console.log(
        `Entered getExternalJiraProjects, Params: ${workspaceId} ${userId}`
    );*/

    return res.json({ success: true, result: [] });
};

handleJiraCallback = async (req, res) => {
    return res.json({
        success: true,
        message: "Entered here in browser buddy",
    });
};

getWorkspaceJiraSites = async (req, res) => {
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

module.exports = {
    getWorkspaceJiraSites,
    getJiraSiteIssues,
    beginJiraConnect,
    getExternalJiraProjects,
    handleJiraCallback,
};
