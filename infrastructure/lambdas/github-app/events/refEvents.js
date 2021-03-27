
/*
ref	            string	The git ref resource.
ref_type	    string	The type of Git ref object created in the repository. Can be either branch or tag.
master_branch	string	The name of the repository's default branch (usually main).
description	    string	The repository's current description.
pusher_type	    string	The pusher type for the event. Can be either user or a deploy key.
repository	    object	The repository where the event occurred.
organization	object	Webhook payloads contain the organization object when the webhook is configured for an organization or the event occurs from activity in a repository owned by an organization.
installation	object	The GitHub App installation. Webhook payloads contain the installation property when the event is configured for and sent to a GitHub App.
sender	        object	The user that triggered the event.
*/

const handleCreateEvent = async (backendClient, event, githubEvent) => {
    
    console.log(`Branch '${event.body.action}' Event Received`);

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

            console.log(err);

            Sentry.setContext("handleCreateEvent", {
                message: `Error creating branch`,
                branchCreateData: branchCreateData,
            });
    
            Sentry.captureException(err);
    
            throw err;


        }
    }
}

module.exports = {
    handleCreateEvent,
}