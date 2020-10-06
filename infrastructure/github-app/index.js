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
            body: JSON.stringify({})
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
        await logger.info({source: 'github-lambda', message: `Github 'error' action received`, function: 'handler'});
    }

    else if (githubAction == 'push') {
        await logger.info({source: 'github-lambda', message: 'Push Event Received', function: 'handler'});

        // var branch = event.payload.ref.split('/').pop();
        var ref = event.body.ref;
        var baseCommit = event.body.before;
        var headCommit = event.body.after;
        var repositoryFullName = event.body.repository.full_name;
        var cloneUrl = event.body.repository.clone_url;
        var installationId = event.body.installation.id;

        var pusher = event.body.pusher.name;

        // Get the head commit message
        var message;
        var currentCommit;

        console.log('headCommit: ', headCommit);

        console.log('Commits Array: ');
        console.log(JSON.stringify(event.body.commits));
        for (i = 0; i < event.body.commits.length; i++) {
            currentCommit = event.body.commits[i];
            // KARAN TODO: The Commits array doesn't seem to have 'sha' fields, rather 'id' fields
            if (currentCommit.id == headCommit) {
                message = currentCommit.message;
                break;
            }
        }
        // If message is null or undefined, set it to empty string
        if (!message && message != '') {
            message = '';
        }
        await logger.info({source: 'github-lambda',
                            message: `updating Repository - ref, headCommit, fullName, cloneUrl, installationId, message, pusher: ${ref}, ${headCommit}, ${repositoryFullName}, ${cloneUrl}, ${installationId}, ${message}, ${pusher}`,
                            function: 'handler'});

        
        // TODO: Fix controller method, so doesn't update non-scanned repositories
        try {
            var updateResponse = await backendClient.post("/repositories/update", { ref, headCommit, fullName: repositoryFullName, cloneUrl, installationId, message, pusher });
            if (updateResponse.data.success == false) {
                throw Error(`repositories/update success == false: ${updateResponse.error}`);
            }
        }
        catch (err) {
            await logger.error({source: 'github-lambda', message: err,
                                    errorDescription: `error calling update repository route - repositoryFullName, installationId: ${repositoryFullName}, ${installationId}`,
                                    function: 'handler'});
                        
                let response = {
                    statusCode: 200,
                    body: JSON.stringify({message: "200 OK"})
                };
                return response;
        }
        
        await logger.info({source: 'github-lambda', message: 'Successfully handled Push Event', function: 'handler'});
    }

    else if (githubAction == 'installation') {
        var installationId = event.body.installation.id;
        var action = event.body.action;
        var repositories = event.body.repositories;

        var defaultIcon = 1;

        await logger.info({source: 'github-lambda', message: `Installation '${action}' Event Received`, function: 'handler'});


        if (action == 'created') {

            var tokenCreateResponse;
            try {
                tokenCreateResponse = await backendClient.post("/tokens/create", {installationId, type: 'INSTALL'});
                if (tokenCreateResponse.data.success == false) {
                    throw Error(`tokens/create success == false: ${tokenCreateResponse.error}`);
                }
            }
            catch (err) {
                await logger.error({source: 'github-lambda', message: err,
                                    errorDescription: `error creating install token installationId: ${installationId}`,
                                    function: 'handler'});
                        
                let response = {
                    statusCode: 200,
                    body: JSON.stringify({message: "200 OK"})
                };
                return response;
            }

            var postDataList = repositories.map(repositoryObj => ({ fullName: repositoryObj.full_name, installationId, 'icon': defaultIcon}));

            var requestPromiseList = postDataList.map(postDataObj => backendClient.post("/repositories/init", postDataObj));

            try {
                await Promise.all(requestPromiseList);
            }
            catch (err) {
                await logger.error({source: 'github-lambda', message: err,
                                    errorDescription: `error initializing repositories: ${postDataList}`,
                                    function: 'handler'});

                let response = {
                    statusCode: 200,
                    body: JSON.stringify({ message: "200 OK" })
                };
                return response;
            }
            await logger.info({source: 'github-lambda', message: `Successfully created Repositories installationId: ${installationId}`, function: 'handler'});

        }

        
        else if (action == 'deleted') {
            var tokenDeleteResponse;
            try {
                tokenDeleteResponse = await backendClient.post("/tokens/delete", {installationId});
                if (tokenCreateResponse.data.success == false) {
                    throw Error(`tokens/delete success == false: ${tokenCreateResponse.error}`);
                }
            }
            catch (err) {
                await logger.error({source: 'github-lambda', message: err,
                                    errorDescription: `error deleting install token installationId: ${installationId}`,
                                    function: 'handler'});
                        
                let response = {
                    statusCode: 200,
                    body: JSON.stringify({message: "200 OK"})
                };
                return response;
            }
            await logger.info({source: 'github-lambda', message: `Succesfully deleted 'INSTALL' token installationId: ${installationId}`, function: 'handler'});
        }
    }

    else if (githubAction == 'installation_repositories') {

        var action = event.body.action;
        var installationId = event.body.installation.id;

        await logger.info({source: 'github-lambda', message: `Installation Repositories '${action}' Event Received`, function: 'handler'});

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
            
                let responseCode = 200;
            
            
                let response = {
                    statusCode: responseCode,
                    headers: {
                        "x-custom-header" : "my custom header value"
                    },
                    body: JSON.stringify({ message: "200 OK"})
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
      await logger.info({source: 'github-lambda', message: `Check_Suite '${action}' event received`, function: 'handler'});


      // Create new Check Run
      if (action == "requested") {
        // console.log('Check Suite Event Head Sha: ', event.body.check_suite.head_commit);
        // console.log('Check Suite Event Head Commit Message: ', event.body.check_suite.head_commit.message);
        //Can't do the following here, rather on the route: Check if branch matches the default_branch
      }

    }


    // Parameters needed
    else if (githubAction == 'pull_request') {
      await logger.info({source: 'github-lambda', message: `Pull Request '${event.body.action}' Event Received`, function: 'handler'});
    
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

    let responseCode = 200;


    let response = {
        statusCode: responseCode,
        headers: {
            "x-custom-header" : "my custom header value"
        },
        body: JSON.stringify({ message: "200 OK"})
    };
    return response;
};