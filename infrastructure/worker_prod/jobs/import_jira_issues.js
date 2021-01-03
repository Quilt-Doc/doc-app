const fs = require('fs');

const apis = require('../apis/api');


require('dotenv').config();

const constants = require('../constants/index');

const JiraSite = require('../models/integrations_fs/jira/JiraSite');
const JiraProject = require('../models/integrations_fs/jira/JiraProject');
const IntegrationTicket = require('../models/integrations_fs/integration_objects/IntegrationTicket');

const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

const {serializeError, deserializeError} = require('serialize-error');


let db = mongoose.connection;

const getJiraSiteObj = async (jiraSiteId) => {
    
    var jiraSiteObj;
    try {
        jiraSiteObj = await JiraSite.findById(ObjectId(jiraSiteId)).lean().exec();
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    source: 'worker-instance',
                                                    message: serializeError(err),
                                                    errorDescription: `Error fetching JiraSite - jiraSiteId: ${jiraSiteId}`,
                                                    function: 'getJiraSiteObj'}});

        throw Error(`Error fetching JiraSite - jiraSiteId: ${jiraSiteId}`);
    }
    return jiraSiteObj;

}

const importJiraIssues = async () => {

    var worker = require('cluster').worker;

    var jiraSiteId = process.env.jiraSiteId;
    
    var jiraSite = await getJiraSiteObj(jiraSiteId);

    var workspaceId = jiraSite.workspace.toString();

    var jiraCloudIds = jiraSite.cloudIds;

    var jiraApiClientList = jiraCloudIds.map( cloudId => apis.requestJiraClient( cloudId , jiraSite.accessToken));

    // Get the projects associated with each cloudId

    var projectSearchRequestList = jiraCloudIds.map(async (cloudId, idx) => {

        var projectListResponse;
        var jiraSiteApiClient = jiraApiClientList[idx];

        // GET /rest/api/3/project/search
        try {
            projectListResponse = await jiraSiteApiClient.get('/project/search');
        }
        catch (err) {
            console.log(err);
            return {error: 'Error', cloudId};
        }
        if (idx == 0) {
            await worker.send({action: 'log', info: {level: 'info', 
                    message: `projectListResponse.data.length: ${projectListResponse.data.length}`,
                    source: 'worker-instance',
                    function:'importJiraIssues', }});
        }
        return { projectData: projectListResponse.data, cloudId };
    });

    // Execute all requests
    var projectListResults;
    try {
        projectListResults = await Promise.allSettled(projectSearchRequestList);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    source: 'worker-instance',
                                                    message: serializeError(err),
                                                    errorDescription: `Error fetching project list - cloudIds: ${JSON.stringify(cloudIds)}`,
                                                    function: 'importJiraIssues'}});
        throw err;
    }

    // Non-error responses
    var validResults = projectListResults.filter(resultObj => resultObj.value && !resultObj.value.error);

    // Error responses
    var invalidResults = projectListResults.filter(resultObj => resultObj.value && resultObj.value.error);

    await worker.send({action: 'log', info: {level: 'info', 
                                                message: `projectListResults validResults.length: ${validResults.length}`,
                                                source: 'worker-instance',
                                                function:'importJiraIssues'}});

    var jiraProjectsToCreate = [];
    var currentResult;
    var currentValue;

    for (i = 0; i < validResults.length; i++) {
        currentResult = validResults[i];
        if (currentResult.status != "fulfilled") {
            continue;
        }

        currentValue = currentResult.value;
        var currentProject;
        // Get all Projects from cloudId
        for (k = 0; k < currentValue.projectData.values.length; k++) {
            currentProject = currentValue.projectData.values[k];
            /*
            "self": "https://api.atlassian.com/ex/jira/8791c16c-d2d6-483a-bad9-ff96a96f7d16/rest/api/3/project/10001",
            "id": "10001",
            "key": "QKC",
            "name": "quilt-kanban-classic",
            "avatarUrls": {
              "48x48": "https://api.atlassian.com/ex/jira/8791c16c-d2d6-483a-bad9-ff96a96f7d16/secure/projectavatar?pid=10001&avatarId=10408",
              "24x24": "https://api.atlassian.com/ex/jira/8791c16c-d2d6-483a-bad9-ff96a96f7d16/secure/projectavatar?size=small&s=small&pid=10001&avatarId=10408",
              "16x16": "https://api.atlassian.com/ex/jira/8791c16c-d2d6-483a-bad9-ff96a96f7d16/secure/projectavatar?size=xsmall&s=xsmall&pid=10001&avatarId=10408",
              "32x32": "https://api.atlassian.com/ex/jira/8791c16c-d2d6-483a-bad9-ff96a96f7d16/secure/projectavatar?size=medium&s=medium&pid=10001&avatarId=10408"
            },
            "projectTypeKey": "software",
            "simplified": false,
            "style": "classic",
            "isPrivate": false,
            "properties": {}
            */

            /*
                self: {type: String, required: true},
                jiraId: {type: String, required: true},
                key:{type: String, required: true},
                name: {type: String, required: true},
                projectTypeKey:{type: String, required: true},
                simplified:{type: Boolean, required: true},
                style: {type: String, required: true},
                isPrivate: {type: Boolean, required: true},

                cloudId: {type: String, required: true},
            */

            jiraProjectsToCreate.push({
                self: currentProject.self,
                jiraId: currentProject.id,
                key: currentProject.key,
                name: currentProject.name,
                projectTypeKey: currentProject.projectTypeKey,
                simplified: currentProject.simplified,
                style: currentProject.style,
                isPrivate: currentProject.isPrivate,
                cloudId: currentValue.cloudId,
                jiraSiteId: jiraSiteId,
            });
        }
    }

    var insertedJiraProjects;
    try {
        insertedJiraProjects = await JiraProject.insertMany(jiraProjectsToCreate);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    source: 'worker-instance',
                                                    message: serializeError(err),
                                                    errorDescription: `Error inserting Jira Projects - insertedJiraProjects: ${JSON.stringify(insertedJiraProjects)}`,
                                                    function: 'importJiraIssues'}});

        throw new Error(`Error inserting Jira Projects - insertedJiraProjects: ${JSON.stringify(insertedJiraProjects)}`);
    }

    // Query for the tickets relevant to each project


    var issueSearchRequestList = insertedJiraProjects.map(async (jiraProjectObj, idx) => {

        var issueListResponse;

        // Get appropriate client by matching cloudId
        var jiraIssueApiClient;

        await worker.send({action: 'log', info: {level: 'info', 
                                                    message: `jiraApiClientList[0].defaults.baseURL: ${JSON.stringify(jiraApiClientList[0].defaults.baseURL)}`,
                                                    source: 'worker-instance',
                                                    function:'importJiraIssues'}});

        for (i = 0; i < jiraApiClientList.length; i++) {
            if (jiraApiClientList[i].defaults.baseURL.includes(jiraProjectObj.cloudId)) {
                jiraIssueApiClient = jiraApiClientList[i];
            }
        }

        // jiraIssueResponse = await jiraApiClient.get('/search?jql=project=QKC&maxResults=1000');
        try {
            issueListResponse = await jiraIssueApiClient.get(`/search?jql=project=${jiraProjectObj.key}&maxResults=1000`);
        }
        catch (err) {
            console.log(err);
            return {error: 'Error', cloudId: jiraProjectObj.cloudId};
        }
        if (idx < 1) {
            await worker.send({action: 'log', info: {level: 'info', 
                    message: `issueListResponse.data.issues: ${JSON.stringify(issueListResponse.data.issues)}`,
                    source: 'worker-instance',
                    function:'importJiraIssues', }});
        }
        return { issueData: issueListResponse.data.issues, siteId: jiraProjectObj.jiraSiteId, cloudId: jiraProjectObj.cloudId, projectId: jiraProjectObj._id.toString() };
    });

    // Execute all requests
    var issueListResults;
    try {
        issueListResults = await Promise.allSettled(issueSearchRequestList);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error',
                                                    source: 'worker-instance',
                                                    message: serializeError(err),
                                                    errorDescription: `Error fetching issue list - insertedJiraProjects: ${JSON.stringify(insertedJiraProjects)}`,
                                                    function: 'importJiraIssues'}});
        throw err;
    }

    // Non-error responses
    var issueValidResults = issueListResults.filter(resultObj => resultObj.value && !resultObj.value.error);

    // Error responses
    var issueInvalidResults = issueListResults.filter(resultObj => resultObj.value && resultObj.value.error);

    await worker.send({action: 'log', info: {level: 'info', 
                                                message: `issueListResults issueValidResults.length: ${issueValidResults.length}`,
                                                source: 'worker-instance',
                                                function:'importJiraIssues'}});

    var jiraTicketList = issueValidResults.map(promiseObj => {
        var newTickets = promiseObj.value.issueData.map(issueObj => {
            return {    source: 'jira',
                        workspace: ObjectId(workspaceId.toString()),
                        jiraSiteId: issueObj.jiraSiteId,
                        jiraIssueId: issueObj.id,
                        jiraSummary: issueObj.summary,
                        jiraProjectId: promiseObj.value.projectId
                    }
        });
        return newTickets;
    });

    jiraTicketList = jiraTicketList.flat();

    if (jiraTicketList.length > 0) {
        await worker.send({action: 'log', info: {level: 'info', 
                                                    message: `jiraTicketList[0]: ${JSON.stringify(jiraTicketList[0])}`,
                                                    source: 'worker-instance',
                                                    function:'importJiraIssues'}});
    }


    var bulkInsertResult;
    try {
        bulkInsertResult = await IntegrationTicket.insertMany(jiraTicketList);
    }
    catch (err) {


        await worker.send({action: 'log', info: {level: 'error',
                                                    source: 'worker-instance',
                                                    message: serializeError(err),
                                                    errorDescription: `Error bulk inserting Jira Tickets - jiraTicketList: ${JSON.stringify(jiraTicketList)}`,
                                                    function: 'importJiraIssues'}});

        throw new Error(`Error bulk inserting Jira Tickets - jiraTicketList: ${JSON.stringify(jiraTicketList)}`);
    }

}

module.exports = {
    importJiraIssues
}