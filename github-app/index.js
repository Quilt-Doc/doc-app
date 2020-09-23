const fs = require('fs');

require('dotenv').config();


const apis = require('./apis/api');
const backendClient = apis.requestBackendClient();
 
const crypto = require('crypto')

exports.handler = async (event) => {


    // console.log("EVENT: ", event);
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

    event.body = JSON.parse(event.body);
    
    var githubAction = event.headers['x-github-event'];
    
    if (githubAction == 'error') {
        console.error('Error:', err.message)
    }

    else if (githubAction == 'push') {
        /*
        console.log('Received a push event for %s to %s',
        event.payload.repository.name,
        event.payload.ref)
        */
        console.log('Push event.body: ');
        console.log(event.body);
        // console.log('payload: ');
        // console.log(event.payload);
      
        // var branch = event.payload.ref.split('/').pop();
        var ref = event.body.ref;
        var baseCommit = event.body.before;
        var headCommit = event.body.after;
        var repositoryFullName = event.body.repository.full_name;
        var cloneUrl = event.body.repository.clone_url;
        var installationId = event.body.installation.id;
        // TODO: Call Repository Update Route Here
        await backendClient.post("/repositories/update", {eventType: 'push', ref, headCommit, fullName: repositoryFullName, cloneUrl, installationId});
    }

    else if (githubAction == 'installation') {
        console.log('Installation Event: ');
        console.log(event.body);

        var installatonId = event.body.installation.id;
        var action = event.body.action;
        var repositories = action.repositories;

        var defaultIcon = 1;
        
        
        if (action == 'created') {
        
            for (i = 0; i < repositories.length; i++) {
              await backendClient.post("/repositories/create", 
                    {'fullName': repositories[i].full_name,
                    'installationId': installationId,
                    'icon': defaultIcon})
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
        console.log('Installation repositories event');
        console.log(event.body);
        var action = event.body.action;
        var installationId = event.body.installation.id;
        console.log('Installation Id: ', installationId);

        if (action == 'added') {
            var added = event.body.repositories_added;

            for(i = 0; i < added.length; i++) {
              await backendClient.post("/repositories/create", 
                    {'fullName': added[i].full_name,
                     'installationId': installationId,
                      'icon': 1});
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

    else if (githubAction == 'pull_request') {
      console.log('Pull Request Event: ');
      // console.log(event.body);
    }


    let responseBody = {
        message: "200 OK",
    };

    let responseCode = 200;

    // The output from a Lambda proxy integration must be 
    // in the following JSON object. The 'headers' property 
    // is for custom response headers in addition to standard 
    // ones. The 'body' property  must be a JSON string. For 
    // base64-encoded payload, you must also set the 'isBase64Encoded'
    // property to 'true'.
    let response = {
        statusCode: responseCode,
        headers: {
            "x-custom-header" : "my custom header value"
        },
        body: JSON.stringify(responseBody)
    };
    console.log("response: " + JSON.stringify(response))
    return response;
};