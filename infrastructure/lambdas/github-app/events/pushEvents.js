

const handlePushEvent = async (backendClient, event, githubEvent, logger) => {
    
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
        throw err;
    }

    await logger.info({source: 'github-lambda', message: 'Successfully handled Push Event', function: 'handler'});
}

module.exports = {
    handlePushEvent
}