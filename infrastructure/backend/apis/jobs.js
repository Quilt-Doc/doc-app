const apis = require('./api');
const sqs = apis.requestSQSServiceObject();

const logger = require('../logging/index').logger;

const queueUrl = process.env.JOB_QUEUE_URL;

const dispatchScanRepositoriesJob = async (jobData) => {

    var timestamp = Date.now().toString();

    var sqsScanData = {
        MessageAttributes: {},
        MessageBody: JSON.stringify(jobData),
        // MessageDeduplicationId: timestamp,
        MessageGroupId: jobData.repositoryIdList.toString(),
        QueueUrl: queueUrl
    };

    // Send the scan data to the SQS queue
    try {
        await sqs.sendMessage(sqsScanData).promise();
    }
    catch (err) {
        console.log(err);
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error sending SQS message to scan repositories jobData: ${JSON.stringify(jobData)}`,
                                function: 'dispatchScanRepositoriesJob'});
        throw err;
    }
}

  
const dispatchUpdateReferencesJob = async (jobData) => {

    var timestamp = Date.now().toString();

    var sqsReferenceData = {
        MessageAttributes: {},
        MessageBody: JSON.stringify(jobData),
        // MessageDeduplicationId: timestamp,
        MessageGroupId: jobData.fullName.toString(),
        QueueUrl: queueUrl
    };

    // Send the update data to the SQS queue
    try {
        await sqs.sendMessage(sqsReferenceData).promise();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error sending SQS message to update references jobData: ${JSON.stringify(jobData)}`,
                                function: 'dispatchUpdateReferencesJob'});
        throw err;
    }
}

const dispatchUpdateChecksJob = async (jobData) => {

    var timestamp = Date.now().toString();

    var sqsCheckData = {
        MessageAttributes: {},
        MessageBody: JSON.stringify(jobData),
        // MessageDeduplicationId: timestamp,
        MessageGroupId: jobData.repositoryId.toString(),
        QueueUrl: queueUrl
    };

    // Send the update data to the SQS queue
    try {
        await sqs.sendMessage(sqsCheckData).promise();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error sending SQS message to update Checks jobData: ${JSON.stringify(jobData)}`,
                                function: 'dispatchUpdateChecksJob'});
        throw err;
    }
}



const dispatchTrelloScrapeJob = async (jobData) => {
    var timestamp = Date.now().toString();

    //  const { trelloIntegrationId, requiredBoardIdList, relevantLists } = req.body;
    var sqsTrelloData = {
        MessageAttributes: {},
        MessageBody: JSON.stringify(jobData),
        // MessageDeduplicationId: timestamp,
        MessageGroupId: jobData.trelloIntegrationId.toString(),
        QueueUrl: queueUrl
    };

    // Send the update data to the SQS queue
    try {
        await sqs.sendMessage(sqsTrelloData).promise();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error sending SQS message to scrape Trello job - jobData: ${JSON.stringify(jobData)}`,
                                function: 'dispatchTrelloScrapeJob'});
        throw err;
    }
}



const dispatchImportJiraIssuesJob = async (jobData) => {
    var timestamp = Date.now().toString();

    var sqsJiraData = {
        MessageAttributes: {},
        MessageBody: JSON.stringify(jobData),
        // MessageDeduplicationId: timestamp,
        MessageGroupId: jobData.jiraSiteId.toString(),
        QueueUrl: queueUrl
    };

    // Send the update data to the SQS queue
    try {
        await sqs.sendMessage(sqsJiraData).promise();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error sending SQS message to import Jira Issues job - jobData: ${JSON.stringify(jobData)}`,
                                function: 'dispatchImportJiraIssuesJob'});
        throw err;
    }
}

module.exports = {
    dispatchScanRepositoriesJob,
    dispatchUpdateReferencesJob,
    dispatchUpdateChecksJob,
    dispatchTrelloScrapeJob,
    dispatchImportJiraIssuesJob,    
}