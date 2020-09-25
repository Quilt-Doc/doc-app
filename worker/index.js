//TODO: Figure out why we can't do 'mongoose.connect()' in the async function before we run pollQueue

const logger = require('./logging/index').logger;
const setupESConnection = require('./logging/index').setupESConnection;

const { format } = require('logform');
const jsonFormat = format.json();


var mongoose = require('mongoose')


const updateReferences = require('./update_references');
const scanRepositories = require('./scan_repositories');

const constants = require('./constants/index');


var sqs = require('./apis/api').requestSQSServiceObject();

const queueUrl = "https://sqs.us-east-1.amazonaws.com/695620441159/dataUpdate.fifo";

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const {serializeError, deserializeError} = require('serialize-error');

require('dotenv').config();

const password = process.env.EXTERNAL_DB_PASS
const user = process.env.EXTERNAL_DB_USER;
var dbRoute = `mongodb+srv://${user}:${password}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`

if (process.env.USE_EXTERNAL_DB == 0) {
    dbRoute = 'mongodb://127.0.0.1:27017?retryWrites=true&w=majority'
}

logger.debug({message: `MongoDB Connection String: ${dbRoute}`, source: 'worker-instance', function: 'index.js'});
logger.debug({message: `USE_EXTERNAL_DB=${process.env.USE_EXTERNAL_DB}`, source: 'worker-instance', function: 'index.js'});

mongoose.connect(dbRoute, { useNewUrlParser: true });

var params = {
 AttributeNames: [
    "SentTimestamp"
 ],
 MaxNumberOfMessages: 1,
 MessageAttributeNames: [
    "All"
 ],
 QueueUrl: queueUrl,
 WaitTimeSeconds: 20
};

let numWorkersActive = 0;
let activeWorkerLimit = 4;

let currentlyPolling = false;

var workerReceipts = {};

const pollQueue = async (cluster) => {
  logger.debug({message: 'Entered pollQueue', source: 'worker-instance', function: 'pollQueue'});
  

  currentlyPolling = true;
	sqs.receiveMessage(params)
	.promise()
	.then(res => {
    	if (res.Messages) {
	    	// We are only grabbing one message
	   		var jobType = JSON.parse(res.Messages[0].Body).jobType;
	   		// Make new env and pass it to a fork call
	   		var workerEnv = {
          jobData: res.Messages[0].Body,
          receipt: res.Messages[0].ReceiptHandle,
          jobType: jobType
	   		}
        numWorkersActive = numWorkersActive + 1;
	   		var worker = cluster.fork(workerEnv);

	   	}
  	})
  	// handle the errors and restore the chain so we always recurse
  	.catch((err) => {
      logger.error({source: 'worker-instance', message: err, errorDescription: "Error Listening for SQS Message", function: "pollQueue"});
    })
    .finally(() => {
      currentlyPolling = false;
      if (numWorkersActive < 4) {
        pollQueue(cluster);
      }
    });
  	// only fail the function if we couldn't recurse
    /*.catch((err) => {
     currentlyPolling = false;
     context.fail(err, err.stack)
    })*/
}



if (cluster.isMaster) {
  logger.debug({message: `Master ${process.pid} is running`, source: 'worker-instance', function: 'index.js'});
  setupESConnection().then(async () => {
    
    /*
    try {
      await mongoose.connect(dbRoute, { useNewUrlParser: true });
    }
    catch (err) {
      logger.error({message: err, errorDescription: "Error Connecting to Database, aborting worker", source: 'worker-instance', function: 'index.js'});
      process.exitCode = 1;
      // handleError(error);
    }
    logger.debug({message: 'connected to the database', source: 'worker-instance', function: 'index.js'});
    */
   pollQueue(cluster);
  });

  // Fork workers.
  /*for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }*/

  /*cluster.on('online', (worker) => {
  numWorkersActive = numWorkersActive + 1;
  if (numWorkersActive < 4 && !(currentlyPolling)) {
    pollQueue();
  }
  });*/

  cluster.on('message', (sendingWorker, message, handle) => {
    if (message.action == 'receipt') {
      workerId = sendingWorker.process.pid;
      workerReceipts[workerId] = message.receipt;
      logger.debug({message: `workerReceipts: ${workerReceipts}`, source: 'worker-instance', function: 'index.js'});
    }
    if (message.action == 'log') {
        if (message.info.level == 'error') {
          message.info.message = deserializeError(message.info.message);
        }
        logger.log(message.info);
    }
  });

  cluster.on('disconnect', (worker) => {
    logger.debug({message: `The worker #${worker.id} has disconnected`, source: 'worker-instance', function: 'index.js'});
    logger.debug({message: `workerReceipts: ${workerReceipts}`, source: 'worker-instance', function: 'index.js'});

    deleteMessageId = worker.process.pid;

    deleteReceipt = workerReceipts[deleteMessageId];
    logger.debug({message: `deleteReceipt: ${deleteReceipt}`, source: 'worker-instance', function: 'index.js'});

    var deleteParams = {
        QueueUrl : queueUrl,
        ReceiptHandle : deleteReceipt
    };
    delete workerReceipts[deleteMessageId];

    logger.debug({message: `deleteParams: ${deleteParams}`, source: 'worker-instance', function: 'index.js'});

    sqs.deleteMessage(deleteParams, function(err, data) {
        if (err) {
          logger.error({message: err, errorDescription: `Error Deleting SQS Message.`, source: 'worker-instance', function: 'index.js'})
        }
        logger.debug({message: `Successfully deleted SQS message`, source: 'worker-instance', function: 'index.js'});
    });
    numWorkersActive  = numWorkersActive - 1;
    if (numWorkersActive < 4 && !(currentlyPolling)) {
      pollQueue(cluster);
    }
  });

  cluster.on('exit', (worker, code, signal) => {
    logger.debug({message: `Worker ${worker.process.pid} exited.`, source: 'worker-instance', function: 'index.js'});
  });
}

else {
  var worker = require('cluster').worker;

  worker.send({action: 'log', info: {level: 'debug', message: `Received jobType: ${process.env.jobType}`}});
  // workerId = process.id;
  // workerReceipts[workerId] = process.env.receipt;
  var jobData = JSON.parse(process.env.jobData);

  // Scan Repository Job
  if(process.env.jobType == constants.jobs.JOB_SCAN_REPOSITORIES) {
    
    worker.send({action: 'log', info: {level: 'debug', message: `Running Scan Repositories Job`, source: 'worker-instance', function: 'index.js'}});
    process.env.repositoryIdList = JSON.stringify(jobData.repositoryIdList);
    process.env.installationId = jobData.installationId;
    scanRepositories.scanRepositories();
  }

  // Update Reference Job
  else if (process.env.jobType == constants.jobs.JOB_UPDATE_REFERENCES) {

    worker.send({action: 'log', info: {level: 'debug', message: `Running Update References Job`, source: 'worker-instance', function: 'index.js'}});

    // installationId, fullName, headCommit
    process.env.cloneUrl = jobData.cloneUrl;
    process.env.installationId = jobData.installationId;
    process.env.fullName = jobData.fullName;
    process.env.headCommit = jobData.headCommit;
    updateReferences.runUpdateProcedure();
  }
 

  worker.send({action: 'log', info: {level: 'debug', message: `Worker ${process.pid} started`, source: 'worker-instance', function: 'index.js'}});
}