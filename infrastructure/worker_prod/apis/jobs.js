const apis = require("./api");
const sqs = apis.requestSQSServiceObject();

const queueUrl = process.env.JOB_QUEUE_URL;

const dispatchScanRepositoriesJob = async jobData => {
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
  } catch (err) {
    console.log(
      `Error sending SQS message to scan repositories jobData: ${JSON.stringify(
        jobData
      )}`
    );
    throw err;
  }
};

const dispatchUpdateReferencesJob = async jobData => {
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
  } catch (err) {
    console.log(
      `Error sending SQS message to update references jobData: ${JSON.stringify(
        jobData
      )}`
    );
    throw err;
  }
};

const dispatchUpdateChecksJob = async jobData => {
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
  } catch (err) {
    console.log(`Error sending SQS message to update Checks jobData: ${JSON.stringify(jobData)}`);
    throw err;
  }
};

module.exports = {
  dispatchScanRepositoriesJob,
  dispatchUpdateReferencesJob,
  dispatchUpdateChecksJob
};
