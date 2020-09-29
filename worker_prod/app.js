const updateReferences = require('./update_references');
const scanRepositories = require('./scan_repositories');

const {serializeError, deserializeError} = require('serialize-error');

const constants = require('./constants/index');

var express = require('express');
var bodyParser = require('body-parser');


var worker = require('cluster').worker;

var app = express();
app.use(bodyParser.urlencoded({ limit: '20mb', extended: false }));
app.use(bodyParser.json({ limit: '20mb'}));

checkValid = (item) => {
    if (item !== null && item !== undefined) {
        return true
    }
    return false
}

app.post('/job', async function(req, res) {

    const { jobType } = req.body;

    await worker.send({action: 'log', info: {level: 'info', message: `Received req.body: ${JSON.stringify(req.body)}`,
                            source: 'worker-instance', function: 'app.js'}});


    if (!checkValid(jobType))  {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(Error(`No jobType provided`)), errorDescription: 'No jobType provided',
                            source: 'worker-instance', function: 'app.js'}});
        res.status(400).end();
    }

    worker.send({action: 'log', info: {level: 'info', message: `Received jobType: ${jobType}`, source: 'worker-instance', function: 'app.js'}});
    // workerId = process.id;
    // workerReceipts[workerId] = process.env.receipt;
    // var jobData = JSON.parse(process.env.jobData);

    // Scan Repository Job
    if(jobType == constants.jobs.JOB_SCAN_REPOSITORIES) {

        const { workspaceId, repositoryIdList, installationId } = req.body;
        
        if (!checkValid(workspaceId))  {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(Error(`No workspaceId provided for scanRepositories job`)),
                                errorDescription: 'No workspaceId provided for scanRepositories job',
                                source: 'worker-instance', function: 'app.js'}});
            res.status(400).end();
        }
        if (!checkValid(repositoryIdList))  {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(Error(`No repositoryIdList provided for scanRepositories job`)),
                                errorDescription: 'No repositoryIdList provided for scanRepositories job',
                                source: 'worker-instance', function: 'app.js'}});
            res.status(400).end();
        }
        if (!checkValid(installationId))  {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(Error(`No installationId provided for scanRepositories job`)),
                                errorDescription: 'No installationId provided for scanRepositories job',
                                source: 'worker-instance', function: 'app.js'}});
            res.status(400).end();
        }

        worker.send({action: 'log', info: {level: 'info', source: 'worker-instance', function: 'app.js',
                                            message: `Running Scan Repositories Job workspaceId, installationId, repositoryIdList: ${workspaceId}, ${installationId}, ${repositoryIdList}`}});

        process.env.workspaceId = workspaceId;
        process.env.repositoryIdList = JSON.stringify(repositoryIdList);
        process.env.installationId = installationId;
        try {
            await scanRepositories.scanRepositories();
        }
        catch(err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                errorDescription: `Error aborted 'Scan Repositories' job`,
                                source: 'worker-instance', function: 'app.js'}});
            res.status(500).end();
        }
        res.status(200).end();
    }

    // Update Reference Job
    else if (jobType == constants.jobs.JOB_UPDATE_REFERENCES) {

        const { cloneUrl, installationId, fullName, headCommit } = req.body;

        if (!checkValid(cloneUrl))  {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(Error(`No cloneUrl provided for updateReferences job`)),
                                errorDescription: 'No cloneUrl provided for updateReferences job',
                                source: 'worker-instance', function: 'app.js'}});
            res.status(400).end();
        }
        if (!checkValid(installationId))  {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(Error(`No installationId provided for updateReferences job`)),
                                errorDescription: 'No installationId provided for updateReferences job',
                                source: 'worker-instance', function: 'app.js'}});
            res.status(400).end();
        }
        if (!checkValid(fullName))  {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(Error(`No fullName provided for updateReferences job`)),
                                errorDescription: 'No fullName provided for updateReferences job',
                                source: 'worker-instance', function: 'app.js'}});
            res.status(400).end();
        }
        if (!checkValid(headCommit))  {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(Error(`No headCommit provided for updateReferences job`)),
                                errorDescription: 'No headCommit provided for updateReferences job',
                                source: 'worker-instance', function: 'app.js'}});
            res.status(400).end();
        }


        worker.send({action: 'log', info: {level: 'info', source: 'worker-instance', function: 'app.js',
                                            message: `Running Update References Job cloneUrl, installationId, fullName, headCommit: ${cloneUrl}, ${installationId}, ${fullName}, ${headCommit}`}});


        process.env.cloneUrl = cloneUrl;
        process.env.installationId = installationId;
        process.env.fullName = fullName;
        process.env.headCommit = headCommit;
        try {
            await updateReferences.runUpdateProcedure();
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                errorDescription: `Error aborted 'Update References' job`,
                                source: 'worker-instance', function: 'app.js'}});
            res.status(500).end();
        }
    }
});

var port = process.env.WORKER_PORT || 3000;

var server = app.listen(port, function () {
    worker.send({action: 'log', info: {level: 'info', message: `Worker ${process.pid} started on port: ${port}`, source: 'worker-instance', function: 'app.js'}});
});