// How to handle pull requests?

const fs = require('fs');

const logger = require('./logging/index').logger;
require('dotenv').config();


const apis = require('./apis/api');
const backendClient = apis.requestBackendClient();
 
const crypto = require('crypto');

const pushEvents = require('./events/pushEvents');
const installationEvents = require('./events/installationEvents');
const pullRequestEvents = require('./events/pullRequestEvents');
const projectEvents = require('./events/projectEvents');
const refEvents = require('./events/refEvents');

exports.handler = async (event) => {

    const secret = process.env.WEBHOOK_SECRET;
    const sigHeaderName = 'x-hub-signature'
    const sig = event.headers[sigHeaderName] || ''

    var hmac = crypto.createHmac("sha1", secret)
    hmac.update(event.body, 'binary')
    var expected = 'sha1=' + hmac.digest('hex')

    // Modify

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

    var githubEvent = event.headers['x-github-event'];

    await logger.info({source: 'github-lambda', message: `Github action received - githubEvent: ${githubEvent}`, function: 'handler'});

    try {
        switch (githubEvent) {
            case 'error':
                await logger.info({source: 'github-lambda', message: `Github 'error' action received`, function: 'handler'});
                break;
            case 'push':
                await pushEvents.handlePushEvent(backendClient, event, githubEvent, logger);
                break;
            case 'installation':
                await installationEvents.handleInstallationEvent(backendClient, event, githubEvent, logger);
                break;
            case 'installation_repositories':
                await installationEvents.handleInstallationRepositoriesEvent(backendClient, event, githubEvent, logger);
                break;
            case 'pull_request':
                await pullRequestEvents.handlePullRequestEvent(backendClient, event, githubEvent, logger);
                break;
            case 'create':
                await refEvents.handleCreateEvent(backendClient, event, githubEvent, logger);
                break;
            case 'project':
                await projectEvents.handleProjectEvent(backendClient, event, githubEvent, logger);
            case 'project_card':
                await projectEvents.handleProjectCardEvent(backendClient, event, githubEvent, logger);
                break;
        }
    }
    catch (err) {
        await logger.error({source: 'github-lambda',
                            message: err,
                            errorDescription: `Error handling "${githubEvent}" event`,
                            function: 'handler'});

        let response = {
            statusCode: 200,
            body: JSON.stringify({ message: "200 OK" })
        };
        return response;
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