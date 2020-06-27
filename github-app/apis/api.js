const requestClient = () => {
    const axios = require('axios');
    return axios.create({
        baseURL: "https://api.github.com",
        headers: {
            post: {        // can be common or any other method
                Authorization: 'token ' + process.env.OAUTH_TOKEN
            },
            get: {        // can be common or any other method
                Authorization: 'token ' + process.env.OAUTH_TOKEN
              }
          }
    });
}

const requestBackendClient = () => {
	const axios = require('axios');
	return axios.create({
		baseURL: "http://54.160.81.133:3001/api"
	})
}

const requestSQSServiceObject = () => {
    // Load the AWS SDK for Node.js
    var AWS = require('aws-sdk');
    // Set the region 
    AWS.config.update({region: 'us-east-1'});

    // Create an SQS service object
    var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

    /*var params = {
      QueueName: 'dataUpdate.fifo'
    };

    sqs.getQueueUrl(params, function(err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data.QueueUrl);
        }
    });*/
    return sqs;
}

module.exports = {
    requestClient,
    requestBackendClient,
    requestSQSServiceObject
}