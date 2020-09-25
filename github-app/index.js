// How to handle pull requests?

const fs = require('fs');

const logger = require('./logging/index').logger;
require('dotenv').config();


const apis = require('./apis/api');
const backendClient = apis.requestBackendClient();
 
const crypto = require('crypto')

exports.handler = async (event) => {

    const secret = process.env.WEBHOOK_SECRET;
    const sigHeaderName = 'x-hub-signature'
    const sig = event.headers[sigHeaderName] || ''
    
    var hmac = crypto.createHmac("sha1", secret)
    hmac.update(event.body, 'binary')
    var expected = 'sha1=' + hmac.digest('hex')

    if ( !(sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) ) {
        let response = {
        statusCode: 401,
        headers: {
            "x-error-desc" : "Invalid Request Source"
        },
            body: {}
        };
        console.error("Webhook Secret Hash Didn't Match");
        return response;
    }

    if (process.env.IS_PRODUCTION) {
        try {
            await require('./logging/index').setupESConnection();
        }
        catch (err) {
            console.error("Couldn't setup ES connection");
            console.error(err);
        }
    }


    event.body = JSON.parse(event.body);

    var githubAction = event.headers['x-github-event'];
    
    if (githubAction == 'error') {
        console.error('Error:', err.message)
    }

    else if (githubAction == 'push') {
        await logger.info({source: 'github-lambda', message: 'Push Event Received', function: 'handler'});
        /*
        console.log('Received a push event for %s to %s',
        event.payload.repository.name,
        event.payload.ref)
        */

        // var branch = event.payload.ref.split('/').pop();
        var ref = event.body.ref;
        var baseCommit = event.body.before;
        var headCommit = event.body.after;
        var repositoryFullName = event.body.repository.full_name;
        var cloneUrl = event.body.repository.clone_url;
        var installationId = event.body.installation.id;
        // TODO: Fix controller method, so doesn't update non-scanned repositories
        await backendClient.post("/repositories/update", {eventType: 'push', ref, headCommit, fullName: repositoryFullName, cloneUrl, installationId});
    }

    else if (githubAction == 'installation') {
        await logger.info({source: 'github-lambda', message: 'Installation Event Received', function: 'handler'});

        var installationId = event.body.installation.id;
        var action = event.body.action;
        var repositories = action.repositories;
        
        var defaultIcon = 1;


        if (action == 'created') {
            await logger.info({source: 'github-lambda', message: 'Created Event Received', function: 'handler'});

            var postDataList = repositories.map(repositoryObj => ({ fullName: repositoryObj.full_name, installationId, 'icon': defaultIcon}));

            var requestPromiseList = postDataList.map(postDataObj => backendClient.post("/repositories/init", postDataObj));

            try {
                await Promise.all(requestPromiseList);
            }
            catch (err) {
                await logger.error({source: 'github-lambda', message: err,
                                    errorDescription: `error initializing repositories: ${postDataList}`,
                                    function: 'handler'});

                let responseBody = {
                    message: "200 OK",
                };
            
                let responseCode = 200;
            
            
                let response = {
                    statusCode: responseCode,
                    headers: {
                        "x-custom-header" : "my custom header value"
                    },
                    body: JSON.stringify(responseBody)
                };
                return response;

            }

        }

        /*
        else if (action == 'deleted') {
    
        }
        
      
        if(event.payload['action'] == 'created') {
    
        }
        */
    }

    else if (githubAction == 'installation_repositories') {
        await logger.info({source: 'github-lambda', message: 'Installation Repositories Event Received', function: 'handler'});
        var action = event.body.action;
        var installationId = event.body.installation.id;


        if (action == 'added') {
            var added = event.body.repositories_added;

            var postDataList = added.map(repositoryObj => ({ fullName: repositoryObj.full_name, installationId, 'icon': defaultIcon}));

            var requestPromiseList = postDataList.map(postDataObj => backendClient.post("/repositories/init", postDataObj));

            try {
                await Promise.all(requestPromiseList);
            }
            catch (err) {
                await logger.error({source: 'github-lambda', message: err,
                                    errorDescription: `error initializing repositories: ${postDataList}`,
                                    function: 'handler'});

                let responseBody = {
                    message: "200 OK",
                };
            
                let responseCode = 200;
            
            
                let response = {
                    statusCode: responseCode,
                    headers: {
                        "x-custom-header" : "my custom header value"
                    },
                    body: JSON.stringify(responseBody)
                };
                return response;

            }
        }

        else if (action == 'removed') {
            var removed = event.body.repositories_removed;
        }        
    }

    else if (githubAction == "check_suite") {

      var action = event.body.action;
      console.log('Check Suite Event Action: ', action);


      // Create new Check Run
      if (action == "requested") {
        console.log('Check Suite Event Head Sha: ', event.body.check_suite.head_commit);
        console.log('Check Suite Event Head Commit Message: ', event.body.check_suite.head_commit.message);
        //Can't do the following here, rather on the route: Check if branch matches the default_branch
      }

    }


    // Parameters needed
    else if (githubAction == 'pull_request') {
      await logger.info({source: 'github-lambda', message: 'Pull Request Event Received', function: 'handler'});
    
      //  const {installationId, status, headRef, baseRef, checks, pullRequestObjId, pullRequestNumber} = req.body;
      var installationId = event.installation.id;
      var status = event.body.action;
      var headRef = event.body.pull_request.head.ref;
      var baseRef = event.body.pull_request.base.ref;
      var pullRequestObjId = event.body.pull_request.id;
      var pullRequestNumber = event.body.number;
      


    }



    // The output from a Lambda proxy integration must be 
    // in the following JSON object. The 'headers' property 
    // is for custom response headers in addition to standard 
    // ones. The 'body' property  must be a JSON string. For 
    // base64-encoded payload, you must also set the 'isBase64Encoded'
    // property to 'true'.

    let responseBody = {
        message: "200 OK",
    };

    let responseCode = 200;


    let response = {
        statusCode: responseCode,
        headers: {
            "x-custom-header" : "my custom header value"
        },
        body: JSON.stringify(responseBody)
    };
    return response;
};