const apis = require('./api');
const sqs = apis.requestSQSServiceObject();

const constants = require('../constants/index');

// {installationId: , cloneUrl, jobType}
const dispatchParseDoxygenJob = async (runDoxygenData, log) => {

    var timestamp = Date.now().toString();
    // default_branch, fullName, cloneUrl, args_2, installationId 


    console.log('RUN DOXYGEN DATA: ');
    console.log(runDoxygenData);

    var sqsDoxygenData = {
        MessageAttributes: {
            "installationId": {
                DataType: "String",
                StringValue: runDoxygenData.installationId
            },
            "cloneUrl": {
                DataType: "String",
                StringValue: runDoxygenData.cloneUrl
            },
            "jobType": {
                DataType: "String",
                StringValue: constants.jobs.JOB_PARSE_DOXYGEN.toString()
            }
        },
        MessageBody: JSON.stringify(runDoxygenData),
        MessageDeduplicationId: timestamp,
        MessageGroupId: "runDoxygen_" + timestamp,
        QueueUrl: queueUrl
    };
    if (process.env.RUN_AS_REMOTE_BACKEND) log.info(`Doxygen | MessageDeduplicationId: ${timestamp}`);
    if (process.env.RUN_AS_REMOTE_BACKEND)  log.info(`Doxygen | MessageGroupId: getRefRequest_${timestamp}`);
    // Send the doxygen data to the SQS queue
    let sendSqsMessage = sqs.sendMessage(sqsDoxygenData).promise();

    sendSqsMessage.then((data) => {

        if (process.env.RUN_AS_REMOTE_BACKEND) log.info(`Doxygen | SUCCESS: ${data.MessageId}`);
        console.log(`Doxygen | SUCCESS: ${data.MessageId}`);
    }).catch((err) => {
        if (process.env.RUN_AS_REMOTE_BACKEND) log.error(`Doxygen | ERROR: ${err}`);
        console.log(`Doxygen | ERROR: ${err}`);
    });
}




const dispatchParseSemanticJob = async (runSemanticData, log) => {
    var timestamp = Date.now().toString();
    // default_branch, fullName, cloneUrl, args_2, installationId 

    var sqsSemanticData = {
        MessageAttributes: {
            "fullName": {
                DataType: "String",
                StringValue: runSemanticData.fullName
            },
            "defaultBranch": {
                DataType: "String",
                StringValue: runSemanticData.defaultBranch
            },
            "cloneUrl": {
                DataType: "String",
                StringValue: runSemanticData.cloneUrl
            },
            "semanticTargets": {
                DataType: "String",
                StringValue: runSemanticData.semanticTargets
            },
            "installationId": {
                DataType: "String",
                StringValue: runSemanticData.installationId
            },
            "jobType": {
                DataType: "Number",
                StringValue: constants.jobs.JOB_PARSE_SEMANTIC.toString()
                }
        },
        MessageBody: JSON.stringify(runSemanticData),
        MessageDeduplicationId: timestamp,
        MessageGroupId: "runSemantic_" + timestamp,
        QueueUrl: queueUrl
    };
    if (process.env.RUN_AS_REMOTE_BACKEND) log.info(`Semantic | MessageDeduplicationId: ${timestamp}`);
    if (process.env.RUN_AS_REMOTE_BACKEND)  log.info(`Semantic | MessageGroupId: getRefRequest_${timestamp}`);
    // Send the semantic data to the SQS queue
    let sendSqsMessage = sqs.sendMessage(sqsSemanticData).promise();

    sendSqsMessage.then((data) => {

        if (process.env.RUN_AS_REMOTE_BACKEND) log.info(`Semantic | SUCCESS: ${data.MessageId}`);
        console.log(`Semantic | SUCCESS: ${data.MessageId}`);
    }).catch((err) => {
        if (process.env.RUN_AS_REMOTE_BACKEND) log.error(`Semantic | ERROR: ${err}`);
        console.log(`Semantic | ERROR: ${err}`);
    });
}


const dispatchUpdateSnippetsJob = async (runSnippetData, log) => {
  
    var timestamp = Date.now().toString();
  
    var sqsSnippetData = {
        MessageAttributes: {},
        MessageBody: JSON.stringify(runSnippetData),
        MessageDeduplicationId: timestamp,
        MessageGroupId: "updateSnippets_" + timestamp,
        QueueUrl: queueUrl
    };
    if (process.env.RUN_AS_REMOTE_BACKEND) log.info(`Push | MessageDeduplicationId: ${timestamp}`);
    if (process.env.RUN_AS_REMOTE_BACKEND)  log.info(`Push | MessageGroupId: getRefRequest_${timestamp}`);
    // Send the refs data to the SQS queue
    let sendSqsMessage = sqs.sendMessage(sqsSnippetData).promise();
  
    sendSqsMessage.then((data) => {
  
        if (process.env.RUN_AS_REMOTE_BACKEND) log.info(`Push | SUCCESS: ${data.MessageId}`);
        console.log(`Push | SUCCESS: ${data.MessageId}`);
        // res.json({success: true, msg: "Job successfully sent to queue: ", queueUrl});
    }).catch((err) => {
        if (process.env.RUN_AS_REMOTE_BACKEND) log.error(`Push | ERROR: ${err}`);
        console.log(`Push | ERROR: ${err}`);
    });
  }
  
  const dispatchUpdateReferencesJob = async (runReferenceUpdateData, log) => {
  
    var timestamp = Date.now().toString();
  
    var sqsReferenceData = {
        MessageAttributes: {},
        MessageBody: JSON.stringify(runReferenceUpdateData),
        MessageDeduplicationId: timestamp,
        MessageGroupId: "updateReferences_" + timestamp,
        QueueUrl: queueUrl
    };
    if (process.env.RUN_AS_REMOTE_BACKEND) log.info(`Push | MessageDeduplicationId: ${timestamp}`);
    if (process.env.RUN_AS_REMOTE_BACKEND)  log.info(`Push | MessageGroupId: updateReferences_${timestamp}`);
    // Send the refs data to the SQS queue
    let sendSqsMessage = sqs.sendMessage(sqsReferenceData).promise();
  
    sendSqsMessage.then((data) => {
  
        if (process.env.RUN_AS_REMOTE_BACKEND) log.info(`Push | SUCCESS: ${data.MessageId}`);
        console.log(`Push | SUCCESS: ${data.MessageId}`);
        // res.json({success: true, msg: "Job successfully sent to queue: ", queueUrl});
    }).catch((err) => {
        if (process.env.RUN_AS_REMOTE_BACKEND) log.error(`Push | ERROR: ${err}`);
        console.log(`Push | ERROR: ${err}`);
    });
  
  }

module.exports = {
    dispatchParseDoxygenJob,
    dispatchParseSemanticJob,
    dispatchUpdateSnippetsJob,
    dispatchUpdateReferencesJob
}