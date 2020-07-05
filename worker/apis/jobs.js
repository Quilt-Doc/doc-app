
const apis = require('./api');
const sqs = apis.requestSQSServiceObject();

const JOB_GET_REFS = 1;
const JOB_UPDATE_SNIPPETS = 2;
const JOB_SEMANTIC = 3;

const queueUrl = "https://sqs.us-east-1.amazonaws.com/695620441159/dataUpdate.fifo";

// {installationId: , cloneUrl, jobType}
const dispatchDoxygenJob = async (runDoxygenData) => {

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
	    "repositoryId": {
		DataType: "String",
		StringValue: runDoxygenData.repositoryId
	    },
            "jobType": {
                DataType: "String",
                StringValue: JOB_GET_REFS.toString()
            }
        },
        MessageBody: JSON.stringify(runDoxygenData),
        MessageDeduplicationId: timestamp,
        MessageGroupId: "runDoxygen_" + timestamp,
        QueueUrl: queueUrl
    };
    // if (process.env.RUN_AS_REMOTE_BACKEND) log.info(`Doxygen | MessageDeduplicationId: ${timestamp}`);
    // if (process.env.RUN_AS_REMOTE_BACKEND)  log.info(`Doxygen | MessageGroupId: getRefRequest_${timestamp}`);
    // Send the doxygen data to the SQS queue
    let sendSqsMessage = sqs.sendMessage(sqsDoxygenData).promise();

    sendSqsMessage.then((data) => {

        // if (process.env.RUN_AS_REMOTE_BACKEND) log.info(`Doxygen | SUCCESS: ${data.MessageId}`);
        console.log(`Doxygen | SUCCESS: ${data.MessageId}`);
    }).catch((err) => {
        // if (process.env.RUN_AS_REMOTE_BACKEND) log.error(`Doxygen | ERROR: ${err}`);
        console.log(`Doxygen | ERROR: ${err}`);

    });
}




const dispatchSemanticJob = async (runSemanticData, log) => {
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
                StringValue: JOB_SEMANTIC.toString()
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

module.exports = {
    dispatchDoxygenJob,
    dispatchSemanticJob,
}
