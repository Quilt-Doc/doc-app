const scanRepositories = require('./jobs/scan_repositories');
const importJiraIssues = require('./jobs/import_jira_issues');

const { serializeError, deserializeError } = require('serialize-error');

const constants = require('./constants/index');

var express = require('express');
var bodyParser = require('body-parser');

const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");

Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // We recommend adjusting this value in production, or using tracesSampler
    // for finer control
    tracesSampleRate: 1.0,
});


var worker = require('cluster').worker;

var app = express();
app.use(bodyParser.urlencoded({ limit: '20mb', extended: false }));
app.use(bodyParser.json({ limit: '20mb' }));

const mongoose = require("mongoose")
mongoose.Schema.Types.String.checkRequired(v => v != null);

checkValid = (item) => {
    if (item !== null && item !== undefined) {
        return true
    }
    return false
}

console.log(`process.env.RUNNING_LOCALLY: ${process.env.RUNNING_LOCALLY}`);
console.log(`process.env.NO_GITHUB_ISSUES: ${process.env.NO_GITHUB_ISSUES}`);
console.log(`process.env.NO_GITHUB_PROJECTS: ${process.env.NO_GITHUB_PROJECTS}`);

app.post('/job', async function (req, res) {

    const { jobType } = req.body;

    console.log(`Received req.body: ${JSON.stringify(req.body)}`);


    if (!checkValid(jobType)) {
        console.log("Error: No jobType provided");
        res.status(200).end();
        // res.status(400).end();
    }

    console.log(`Received jobType: ${jobType}`);
    // workerId = process.id;
    // workerReceipts[workerId] = process.env.receipt;
    // var jobData = JSON.parse(process.env.jobData);

    // Scan Repository Job
    if (jobType == constants.jobs.JOB_SCAN_REPOSITORIES) {

        const { workspaceId, repositoryIdList, installationIdLookup, repositoryInstallationIds, installationId } = req.body;

        if (!checkValid(workspaceId)) {
            console.log("Error: No workspaceId provided for scanRepositories job");
            res.status(200).end();
            // res.status(400).end();
        }
        if (!checkValid(repositoryIdList)) {
            console.log(`Error: No repositoryIdList provided for scanRepositories job`);
            res.status(200).end();
            // res.status(400).end();
        }

        if (!checkValid(installationIdLookup)) {
            console.log(`Error: No installationIdLookup provided for scanRepositories job`);
            res.status(200).end();
            // res.status(400).end();
        }

        if (!checkValid(repositoryInstallationIds)) {
            console.log(`Error: No repositoryInstallationIds provided for scanRepositories job`);
            res.status(200).end();
            // res.status(400).end();
        }

        var public = false;
        if (checkValid(public)) {
            public = true;
        }

        console.log(`Running Scan Repositories Job workspaceId, installationId, repositoryIdList: ${workspaceId}, ${installationId}, ${repositoryIdList}`);

        process.env.workspaceId = workspaceId;
        process.env.repositoryIdList = JSON.stringify(repositoryIdList);
        process.env.installationIdLookup = JSON.stringify(installationIdLookup);
        process.env.repositoryInstallationIds = JSON.stringify(repositoryInstallationIds);
        process.env.public = public;

        // DEPRECATED
        // process.env.installationId = installationId;

        try {
            console.log("Calling scanRepositories");
            await scanRepositories.scanRepositories();
        }
        catch (err) {
            console.log(`Error aborted 'Scan Repositories' job`);
            res.status(200).end();
            // res.status(500).end();
        }
        res.status(200).end();
    }


    // Import Jira Issues Job
    else if (jobType == constants.jobs.JOB_IMPORT_JIRA_ISSUES) {
        const { jiraSiteId, jiraProjects, workspaceId } = req.body;

        if (!checkValid(jiraSiteId)) {

            Sentry.setContext("import_jira_issues", {
                message: `No jiraSiteId provided`,
            });

            Sentry.captureException(Error("No jiraSiteId provided"));

            res.status(200).end();
            // res.status(400).end();
        }

        if (!checkValid(jiraProjects)) {
            Sentry.setContext("import_jira_issues", {
                message: `No jiraProjects provided`,
            });

            Sentry.captureException(Error("No jiraProjects provided"));

            res.status(200).end();
        }

        if (!checkValid(workspaceId)) {
            Sentry.setContext("import_jira_issues", {
                message: `No workspaceId provided`,
            });

            Sentry.captureException(Error("No workspaceId provided"));

            res.status(200).end();
        }

        console.log(`Running Import Jira Issues Job - jiraSiteId: ${jiraSiteId}`);


        process.env.jiraSiteId = jiraSiteId;
        process.env.jiraProjects = JSON.stringify(jiraProjects);
        process.env.workspaceId = workspaceId;

        try {
            await importJiraIssues.importJiraIssues();
        }
        catch (err) {

            console.log(err);

            Sentry.setContext("import_jira_issues", {
                message: `Error aborted 'Import Jira Issues' job`,
            });

            Sentry.captureException(Error("No workspaceId provided"));
            res.status(200).end();
            // res.status(500).end();
        }

        res.status(200).end();
    }

});

var port = process.env.WORKER_PORT || 3000;

var server = app.listen(port, function () {
    console.log(`Worker ${process.pid} started on port: ${port}`);
});