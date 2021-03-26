
// "issue" event

const handleIssueEvent = async (backendClient, event, githubEvent, logger) => {

    var issueAction = event.body.action;

    var installationId = undefined;

    if (event.body.installation) {
        installationId = event.body.installation.id;
    }

    if (issueAction == 'opened') {

        /*
            sourceId: repositoryIssueObj.id,
            source: 'github',
            githubIssueHtmlUrl: repositoryIssueObj.html_url,
            githubIssueNumber: repositoryIssueObj.number,
            githubIssueState: repositoryIssueObj.state,
            githubIssueTitle: repositoryIssueObj.title,
            githubIssueBody: repositoryIssueObj.body,
            // githubIssueUserId: repositoryIssueObj.user.id,
            githubIssueLabels: repositoryIssueObj.labels.map(labelObj => labelObj.name),
            githubIssueLocked: repositoryIssueObj.locked,
            githubIssueCommentNumber: repositoryIssueObj.comments,
            githubIssueClosedAt: (repositoryIssueObj.closed_at == null || repositoryIssueObj.closed_at == 'null') ? undefined : repositoryIssueObj.closed_at,
            githubIssueCreatedAt: repositoryIssueObj.created_at,
            githubIssueUpdatedAt: repositoryIssueObj.updated_at,
            githubIssueAuthorAssociation: repositoryIssueObj.author_association,
        */

        var sourceId = event.body.issue.id;
        var source = 'github';
        var githubIssueHtmlUrl = event.body.issue.html_url;
        var githubIssueNumber = event.body.issue.number;
        var githubIssueState = event.body.issue.state;
        var githubIssueTitle = event.body.issue.title;
        var githubIssueBody = event.body.issue.body;
        var githubIssueLabels = event.body.issue.labels.map(labelObj => labelObj.name);
        var githubIssueLocked = event.body.issue.locked;
        var githubIssueCommentNumber = event.body.issue.comments;
        var githubIssueClosedAt = (event.body.issue.closed_at == null || event.body.issue.closed_at == 'null') ? undefined : event.body.issue.closed_at;
        var githubIssueCreatedAt = event.body.issue.created_at;
        var githubIssueUpdatedAt = event.body.issue.updated_at;
        var githubIssueAuthorAssociation = event.body.issue.author_association;

        var createIssueData = {
            sourceId,
            source,
            githubIssueHtmlUrl,
            githubIssueNumber,
            githubIssueState,
            githubIssueTitle,
            githubIssueBody,
            githubIssueLabels,
            githubIssueLocked,
            githubIssueCommentNumber,
            githubIssueClosedAt,
            githubIssueCreatedAt,
            githubIssueUpdatedAt,
            githubIssueAuthorAssociation
        }

        var issueOpenResponse;
        try {
            issueOpenResponse = await backendClient.post("/integrations/github/create_issue", createIssueData);
            if (issueOpenResponse.data.success == false) {
                throw Error(`Issue/create success == false: ${issueOpenResponse.error}`);
            }
        }
        catch (err) {
            await logger.error({
                source: 'github-lambda', message: err,
                errorDescription: `error creating Github Issue - createIssueData: ${JSON.stringify(createIssueData)}`,
                function: 'handler'
            });

            throw err;
        }
    }

    else if (issueAction == 'closed') {

        var sourceId = event.body.issue.id;

        var issueCloseResponse;
        try {
            issueCloseResponse = await backendClient.post("/integrations/github/close_issue", createIssueData);
            if (issueCloseResponse.data.success == false) {
                throw Error(`Issue/close success == false: ${issueCloseResponse.error}`);
            }
        }
        catch (err) {
            await logger.error({
                source: 'github-lambda', message: err,
                errorDescription: `error closing Github Issue - sourceId: ${sourceId}`,
                function: 'handler'
            });

            throw err;
        }
    }

    else if (issueAction == 'deleted') {
        var sourceId = event.body.issue.id;

        var issueDeleteResponse;
        try {
            issueDeleteResponse = await backendClient.post("/integrations/github/delete_issue", createIssueData);
            if (issueDeleteResponse.data.success == false) {
                throw Error(`Issue/delete success == false: ${issueDeleteResponse.error}`);
            }
        }
        catch (err) {
            await logger.error({
                source: 'github-lambda', message: err,
                errorDescription: `error deleting Github Issue - sourceId: ${sourceId}`,
                function: 'handler'
            });

            throw err;
        }
    }
}


// "project_card" event

/* fields for API call
    repositoryFullName
    cardId
    cardNote
    cardColumnId
    cardCreatedAt
    cardUpdatedAt
    cardContentUrl -- optional
*/
const handleProjectCardEvent = async (backendClient, event, githubEvent, logger) => {

    /*
    await logger.info({source: 'github-lambda',
                        message: `Received event.body: ${JSON.stringify(event.body)}`,
                        function: 'handleProjectCardEvent'});
    */
    var installationId = undefined;

    if (event.body.installation) {
        installationId = event.body.installation.id;
    }

    var cardId = event.body.project_card.id;
    var cardNote = evnet.body.project_card.note;
    var cardColumnId = event.body.project_card.column_id;
    var cardCreatedAt = event.body.project_card.created_at;
    var cardUpdatedAt = event.body.project_card.updated_at;
    var cardContentUrl = event.body.project_card.content_url;

    // cardContentUrl is undefined if the project card wasn't created from a issue/pr
    if (!cardContentUrl) {
        cardContentUrl = '';
    }

    // await 

}


module.exports = {
    handleProjectEvent,
    handleProjectCardEvent
}