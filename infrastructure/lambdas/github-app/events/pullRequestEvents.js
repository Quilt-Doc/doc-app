

const handlePullRequestEvent = async (backendClient, event, githubEvent, logger) => {
    await logger.info({source: 'github-lambda', message: `Pull Request '${event.body.action}' Event Received`, function: 'handler'});
    
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