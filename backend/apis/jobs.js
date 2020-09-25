const apis = require('./api');
const sqs = apis.requestSQSServiceObject();

const logger = require('../logging/index').logger;

const queueUrl = process.env.JOB_QUEUE_URL;

const dispatchScanRepositoriesJob = async (jobData) => {

    var sqsScanData = {
        MessageAttributes: {},
        MessageBody: JSON.stringify(jobData),
        MessageDeduplicationId: timestamp,
        MessageGroupId: jobData.workspaceId,
        QueueUrl: queueUrl
    };

    // Send the scan data to the SQS queue
    try {
        await sqs.sendMessage(sqsScanData).promise();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error sending SQS message to scan repositories jobData: ${JSON.stringify(jobData)}`,
                                function: 'dispatchScanRepositoriesJob'});
        throw err;
    }
}

  
const dispatchUpdateReferencesJob = async (jobData) => {

    var sqsReferenceData = {
        MessageAttributes: {},
        MessageBody: JSON.stringify(jobData),
        MessageDeduplicationId: timestamp,
        MessageGroupId: jobData.installationId,
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

module.exports = {
    dispatchScanRepositoriesJob,
    dispatchUpdateReferencesJob
}