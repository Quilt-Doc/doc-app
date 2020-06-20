/* QUEUE MESSAGE --
{"repoLink": "kgodara/snippet-logic-test/", "apiCallLink": "https://github.com/kgodara/snippet-logic-test/"}

*/


var mongoose = require('mongoose')

var sqs = require('./apis/api').requestSQSServiceObject();

const parseUtils = require('./parse_code');
const queueUrl = "https://sqs.us-east-1.amazonaws.com/695620441159/dataUpdate.fifo";

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

require('dotenv').config();

const password = process.env.EXTERNAL_DB_PASS
const user = process.env.EXTERNAL_DB_USER;
var dbRoute = `mongodb+srv://${user}:${password}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`

if (process.env.USE_EXTERNAL_DB == 0) {
    dbRoute = 'mongodb://127.0.0.1:27017?retryWrites=true&w=majority'
}

console.log(dbRoute);
console.log(process.env.USE_EXTERNAL_DB);


//mongoose.connect('mongodb://localhost:27017/myDatabase');
mongoose.connect(dbRoute, { useNewUrlParser: true });
let db = mongoose.connection;

db.once('open', () => console.log('connected to the database'));
db.on('error', console.error.bind(console, 'MongoDB connection error:'));



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
  console.log('Entered pollQueue');

  currentlyPolling = true;
	sqs.receiveMessage(params)
	.promise()
	.then(res => {
    	console.log("Success", res);
    	if (res.Messages) {
	    	// We are only grabbing one message
	   		var jobData = JSON.parse(res.Messages[0].Body);
	   		// Make new env and pass it to a fork call
	   		var workerEnv = {
	   			repoLink: jobData.repoLink,
	   			apiCallLink: jobData.apiCallLink,
          receipt: res.Messages[0].ReceiptHandle

	   		}
        numWorkersActive = numWorkersActive + 1;
	   		var worker = cluster.fork(workerEnv);

	   	}
  	})
  	// handle the errors and restore the chain so we always recurse
  	.catch((err) => {
      console.log(err, err.stack)
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
  console.log(`Master ${process.pid} is running`);
  pollQueue(cluster);
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
    if (message.receipt) {
      workerId = sendingWorker.id;
      workerReceipts[workerId] = message.receipt;
      console.log('workerReceipts: ', workerReceipts);
    }
  });

  cluster.on('disconnect', (worker) => {
    console.log(`The worker #${worker.id} has disconnected`);

    deleteMessageId = worker.id;
    // console.log('workerReceipts: ', workerReceipts);
    deleteReceipt = workerReceipts[deleteMessageId];
    console.log('deleteReceipt: ', deleteReceipt );
    var deleteParams = {
        QueueUrl : queueUrl,
        ReceiptHandle : deleteReceipt
    };
    delete workerReceipts[deleteMessageId];
    sqs.deleteMessage(deleteParams, function(err, data) {
        if (err) {
          console.log(err);
        }
        console.log('Successfully deleted SQS message');
      });
    numWorkersActive  = numWorkersActive - 1;
    if (numWorkersActive < 4 && !(currentlyPolling)) {
      pollQueue(cluster);
    }
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} 
else {
  // workerId = process.id;
  // workerReceipts[workerId] = process.env.receipt;
  parseUtils.getRefs();
  console.log(`Worker ${process.pid} started`);
}