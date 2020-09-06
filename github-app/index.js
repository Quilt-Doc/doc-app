const fs = require('fs');

require('dotenv').config();


const apis = require('./apis/api');
const backendClient = apis.requestBackendClient();
 
const crypto = require('crypto')

exports.handler = async (event) => {


    console.log("EVENT: ", event);
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
        console.log('Push event.payload: ');
        console.log(event.payload);
        // console.log('payload: ');
        // console.log(event.payload);
      
        // var branch = event.payload.ref.split('/').pop();
    
        var headCommit = event.payload['after'];
        var repositoryFullName = event.payload['repository']['full_name'];
        var cloneUrl = event.payload['repository']['clone_url'];
        var installationId = event.payload['installation']['id'];
       // TODO: Call Repository Update Route Here
    }
    
    else if (githubAction == 'installation') {
        console.log('Installation Event: ');
        console.log(event.payload);

        var installatonId = event.payload.installation.id;
        var action = event.payload.action;
        var repositories = action.repositories;
        
        var defaultIcon = 1;
        
        
        if (action == 'created') {
        
            for (i = 0; i < repositories.length; i++) {
              backendClient.post("/repositories/create", 
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
        console.log(event.payload);
        var action = event.payload.action;
        var installationId = event.payload.installation.id;
        console.log('Installation Id: ', installationId);

        if (action == 'added') {
            var added = event.payload.repositories_added;

            for(i = 0; i < added.length; i++) {
              backendClient.post("/repositories/create", 
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
    }


    let responseBody = {
        message: greeting,
        input: event
    };

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