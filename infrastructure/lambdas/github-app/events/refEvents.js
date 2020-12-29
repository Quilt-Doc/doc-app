

const handleCreateEvent = async (backendClient, event, githubEvent, logger) => {
    
    await logger.info({source: 'github-lambda',
                        message: `Branch '${event.body.action}' Event Received`,
                        function: 'handler'});

    var refType = event.body.ref_type;

    if (refType == 'branch') {
        var branchName = event.body.ref;
        var defaultBranchName = event.body.master_branch;
        var repositoryFullName = event.body.repository.full_name;
        var installationId = event.body.installation.id;
        var githubUserId = event.body.sender.id;


        var createBranchResponse;

        var branchCreateData = {
                    ref: branchName,
                    masterBranch: defaultBranchName,
                    installationId: installationId,
                    fullName: repositoryFullName,
                    githubUserId: githubUserId,
                };

        try {
            createBranchResponse = await backendClient.post("/branch/create", branchCreateData);
        }
        catch (err) {
            await logger.error({source: 'github-lambda',
                    message: err,
                    errorDescription: `Error creating branch - branchCreateData: ${JSON.stringify(branchCreateData)}`,
                    function: 'handler'});

            throw err;
        }
    }
}

module.exports = {
    handleCreateEvent,
}