var https = require('https')

const fs = require('fs');

require('dotenv').config();

var request = require("request");

const apis = require('./apis/api');
const api = apis.requestBackendClient();
const sqs = apis.requestSQSServiceObject();
const queueUrl = "https://sqs.us-east-1.amazonaws.com/695620441159/dataUpdate.fifo";
const JOB_UPDATE_SNIPPETS = 2;

var createHandler = require('github-webhook-handler')
var handler = createHandler({ path: '/webhook', secret: process.env.WEBHOOK_SECRET })

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};


https.createServer(options, function (req, res) {
  handler(req, res, function (err) {
    res.statusCode = 404
    res.end('no such location')
  })
}).listen(3002)

handler.on('error', function (err) {
  console.error('Error:', err.message)
})

handler.on('push', function (event) {
  /*console.log('Received a push event for %s to %s',
    event.payload.repository.name,
    event.payload.ref)*/
  console.log('Push event.payload: ');
  console.log(event.payload);
  // console.log('payload: ');
  // console.log(event.payload);
  
  // var branch = event.payload.ref.split('/').pop();

  var headCommit = event.payload['after'];
  var repositoryFullName = event.payload['repository']['full_name'];
  var cloneUrl = event.payload['repository']['clone_url'];
  var installationId = event.payload['installation']['id'];

  // console.log('branch: ', branch);
  console.log('headCommit: ', headCommit);

  var timestamp = Date.now().toString();

  var pushData = {
      'headCommit': headCommit,
      'repositoryFullName': repositoryFullName,
      'cloneUrl': cloneUrl,
      'installationId': installationId,
      'jobType': JOB_UPDATE_SNIPPETS
  }
  var sqsPushData = {
      MessageAttributes: {
        "headCommit": {
          DataType: "String",
          StringValue: pushData.headCommit
        },
        "repositoryFullName": {
          DataType: "String",
          StringValue: pushData.repositoryFullName
        },
        "cloneUrl": {
          DataType: "String",
          StringValue: pushData.cloneUrl
        },
        "installationId": {
          DataType: "Number",
          StringValue: pushData.installationId.toString()
        },
        "jobType": {
          DataType: "Number",
          StringValue: JOB_UPDATE_SNIPPETS.toString()
        }
      },
      MessageBody: JSON.stringify(pushData),
      MessageDeduplicationId: timestamp,
      MessageGroupId: "updateSnippets_" + timestamp,
      QueueUrl: queueUrl
  };
  if (process.env.RUN_AS_REMOTE_BACKEND) log.info(`Push | MessageDeduplicationId: ${timestamp}`);
  if (process.env.RUN_AS_REMOTE_BACKEND)  log.info(`Push | MessageGroupId: getRefRequest_${timestamp}`);
  // Send the refs data to the SQS queue
  let sendSqsMessage = sqs.sendMessage(sqsPushData).promise();

  sendSqsMessage.then((data) => {

      if (process.env.RUN_AS_REMOTE_BACKEND) log.info(`Push | SUCCESS: ${data.MessageId}`);
      console.log(`Push | SUCCESS: ${data.MessageId}`);
      // res.json({success: true, msg: "Job successfully sent to queue: ", queueUrl});
  }).catch((err) => {
      if (process.env.RUN_AS_REMOTE_BACKEND) log.error(`Push | ERROR: ${err}`);
      console.log(`Push | ERROR: ${err}`);

      // Send email to emails API
      // res.json({success: false, msg: "We ran into an error. Please try again."});
  });


});

handler.on('installation', function (event) {
  console.log('Installation Event: ');
  console.log(event.payload);

  var installatonId = event.payload.installation.id;
  var action = event.payload.action;
  var repositories = action.repositories;

  var defaultIcon = 1;


  if (action == 'created') {

    for (i = 0; i < repositories.length; i++) {
      api.post("/repositories/create", 
        {'fullName': repositories[i].full_name,
        'installationId': installationId,
        'icon': defaultIcon})
    }

  }

  /*else if (action == 'deleted') {

  }*/
  //if(event.payload['action'] == 'created') {

  //  }

});

handler.on('installation_repositories', function (event) {
  console.log('Installation repositories event');
  console.log(event.payload);
  var action = event.payload.action;
  var installationId = event.payload.installation.id;
  console.log('Installation Id: ', installationId);

  if (action == 'added') {
    var added = event.payload.repositories_added;

    for(i = 0; i < added.length; i++) {
      api.post("/repositories/create", 
        {'fullName': added[i].full_name,
        'installationId': installationId,
        'icon': 1})
      .then(response => {
        console.log('Create Repository Success');
      })
      .catch(error => {
        console.log('Create Repository Error: ', error);
      });
    }

  }

  else if (action == 'removed') {
    var removed = event.payload.repositories_removed;
  }

});

handler.on('issues', function (event) {
  console.log('Received an issue event for %s action=%s: #%d %s',
    event.payload.repository.name,
    event.payload.action,
    event.payload.issue.number,
    event.payload.issue.title)
  console.log('Print payload');
  console.log(event.payload);
})
