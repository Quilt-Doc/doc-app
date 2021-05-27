const Sentry = require("@sentry/node");


const handlePushEvent = async (backendClient, event) => {
    
    console.log("Push Event Received");

    // var branch = event.payload.ref.split('/').pop();
    var ref = event.body.ref;
    // var baseCommit = event.body.before;
    var headCommit = event.body.after;
    var repositoryFullName = event.body.repository.full_name;
    var cloneUrl = event.body.repository.clone_url;
    var installationId = event.body.installation.id;

    var pusher = event.body.pusher.name;

    // Get the head commit message
    var message;
    var currentCommit;

    console.log("headCommit: ", headCommit);

    console.log("Commits Array: ");
    console.log(JSON.stringify(event.body.commits));

    for (var i = 0; i < event.body.commits.length; i++) {
        currentCommit = event.body.commits[i];
        // KARAN TODO: The Commits array doesn't seem to have 'sha' fields, rather 'id' fields
        if (currentCommit.id == headCommit) {
            message = currentCommit.message;
            break;
        }
    }

    // If message is null or undefined, set it to empty string
    if (!message && message != "") {
        message = "";
    }
    console.log(`updating Repository - ref, headCommit, fullName, cloneUrl, installationId, message, pusher: ${ref}, ${headCommit}, ${repositoryFullName}, ${cloneUrl}, ${installationId}, ${message}, ${pusher}`);

    
    try {
        var updateResponse = await backendClient.post("/repositories/update", { ref, headCommit, fullName: repositoryFullName, cloneUrl, installationId, message, pusher });
        if (updateResponse.data.success == false) {
            throw Error(`repositories/update success == false: ${updateResponse.error}`);
        }
    } catch (err) {

        console.log(err);

        Sentry.setContext("handlePushEvents", {
            message: "Error calling update repository route",
            installationId: installationId,
            repositoryFullName: repositoryFullName,
        });

        Sentry.captureException(err);

        throw err;
    }

    console.log("Successfully handled Push Event");
};

module.exports = {
    handlePushEvent,
};