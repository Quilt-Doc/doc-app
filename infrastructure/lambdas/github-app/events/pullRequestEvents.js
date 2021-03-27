

const handlePullRequestEvent = async (backendClient, event, githubEvent) => {
    console.log(`Pull Request '${event.body.action}' Event Received`);
    
    //  const {installationId, status, headRef, baseRef, checks, pullRequestObjId, pullRequestNumber} = req.body;
    var installationId = event.installation.id;
    var status = event.body.action;
    var headRef = event.body.pull_request.head.ref;
    var baseRef = event.body.pull_request.base.ref;
    var pullRequestObjId = event.body.pull_request.id;
    var pullRequestNumber = event.body.number;

}

module.exports = {
    handlePullRequestEvent
}