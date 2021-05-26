require("dotenv").config();


const apis = require("./apis/api");
const backendClient = apis.requestBackendClient();

const crypto = require("crypto");

const pushEvents = require("./events/pushEvents");
const installationEvents = require("./events/installationEvents");
const pullRequestEvents = require("./events/pullRequestEvents");
const issueEvents = require("./events/issueEvents");
const refEvents = require("./events/refEvents");

const Sentry = require("@sentry/serverless");



exports.handler = async (event) => {

    const secret = process.env.WEBHOOK_SECRET;
    const sigHeaderName = "x-hub-signature";
    const sig = event.headers[sigHeaderName] || "";

    var hmac = crypto.createHmac("sha1", secret);
    hmac.update(event.body, "binary");
    var expected = "sha1=" + hmac.digest("hex");

    if (!(sig.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)))) {
        let response = {
            statusCode: 401,
            headers: {
                "x-error-desc": "Invalid Request Source",
            },
            body: JSON.stringify({}),
        };
        console.error("Webhook Secret Hash Didn't Match");
        return response;
    }

    Sentry.init({
        dsn: process.env.SENTRY_DSN,

        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: 1.0,
    });


    event.body = JSON.parse(event.body);

    var githubEvent = event.headers["x-github-event"];

    console.log(`Github action received - githubEvent: ${githubEvent}`);

    try {
        switch (githubEvent) {
        case "error":
            console.log("Github 'error' action received");
            break;
        case "push":
            await pushEvents.handlePushEvent(backendClient, event);
            break;
        case "installation":
            await installationEvents.handleInstallationEvent(backendClient, event);
            break;
        case "installation_repositories":
            await installationEvents.handleInstallationRepositoriesEvent(backendClient, event);
            break;
        case "pull_request":
            await pullRequestEvents.handlePullRequestEvent(backendClient, event);
            break;
        case "create":
            await refEvents.handleCreateEvent(backendClient, event);
            break;
        case "issues":
            await issueEvents.handleIssueEvent(backendClient, event);
        }
    } catch (err) {
        console.log(err);

        Sentry.setContext("github-app-lambda", {
            message: "Event handling failed",
        });

        Sentry.captureException(err);

        let response = {
            statusCode: 200,
            body: JSON.stringify({ message: "200 OK" }),
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
            "x-custom-header": "my custom header value",
        },
        body: JSON.stringify({ message: "200 OK" }),
    };
    return response;
};