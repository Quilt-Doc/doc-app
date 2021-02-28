
// "project" event

/* fields for API call
    repositoryFullName
    projectId
    projectNumber
    projectColumnsUrl
    projectName
    projectBody
    projectState
*/

const handleProjectEvent = async (backendClient, event, githubEvent, logger) => {

    var projectAction = event.body.action;

    var installationId = undefined;

    if (event.body.installation) {
        installationId = event.body.installation.id;
    }

    if (projectAction == 'created') {

        var repositoryFullName = event.body.repository.full_name;
        var projectId = event.body.project.id;
        var projectNumber = event.body.project.number;
        var projectColumnsUrl = event.body.project.columns_url;
        var projectName = event.body.project.name;
        var projectBody = event.body.project.body;
        var projectState = event.body.project.state;

        var createProjectData = {
            repositoryFullName,
            installationId: (installationId) ? installationId : undefined
            projectId,
            projectNumber,
            projectColumnsUrl,
            projectName,
            projectBody,
            projectState,
        }
    }

    else if (projectAction == 'closed') {
        var projectId = event.body.project.id;
        
        var projectCloseResponse;
        try {
            projectCloseResponse = await backendClient.post("/tokens/create", createIssueData);
            if (projectCloseResponse.data.success == false) {
                throw Error(`Project/close success == false: ${projectCloseResponse.error}`);
            }
        }
        catch (err) {
            await logger.error({source: 'github-lambda', message: err,
                                errorDescription: `error closing Project - projectId: ${projectId}`,
                                function: 'handler'});

            throw err;
        }
    }

    else if (projectAction == 'deleted') {
        var projectId = event.body.project.id;
        
        var projectDeleteResponse;
        try {
            projectDeleteResponse = await backendClient.post("/tokens/create", createIssueData);
            if (projectDeleteResponse.data.success == false) {
                throw Error(`Project/delete success == false: ${projectDeleteResponse.error}`);
            }
        }
        catch (err) {
            await logger.error({source: 'github-lambda', message: err,
                                errorDescription: `error deleting Project - projectId: ${projectId}`,
                                function: 'handler'});

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

    var cardAction = event.body.action;

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

    if (cardAction == 'created') {
        
        /*
            githubCardId: { type: String },
            githubCardColumnId: { type: String },
            githubCardUpdatedAt: { type: Date },
            githubCardContentUrl: { type: String },
        */

        var githubCardCreateData = {
            sourceId: cardId,
            source: 'github',
            githubCardId: cardId,
            githubColumnId: cardColumnId,
            githubCardUpdatedAt: cardUpdatedAt,
            githubCardContentUrl: cardContentUrl,
        }


        var githubCardCreateResponse;
        try {
            githubCardCreateResponse = await backendClient.post("/integrations/github/create_card", githubCardCreateData);
            if (githubCardCreateResponse.data.success == false) {
                throw Error(`Card/create success == false: ${githubCardCreateResponse.error}`);
            }
        }
        catch (err) {
            await logger.error({source: 'github-lambda', message: err,
                                errorDescription: `error creating Github Project Card - sourceId: ${cardId}`,
                                function: 'handler'});

            throw err;
        }

    }

    else if (cardAction == 'moved') {
        var cardAfterId = event.body.project_card.after_id;
        var githubCardMovedResponse;
        try {
            githubCardMovedResponse = await backendClient.post("/integrations/github/move_card", {cardAfterId: cardAfterId, sourceId: cardId});
            if (githubCardMovedResponse.data.success == false) {
                throw Error(`Card/moved success == false: ${githubCardMovedResponse.error}`);
            }
        }
        catch (err) {
            await logger.error({source: 'github-lambda', message: err,
                                errorDescription: `error moving Github Project Card - sourceId, cardAfterId: ${cardId}, ${cardAfterId}`,
                                function: 'handler'});
            throw err;
        }
    }

    else if (cardAction == 'deleted') {
        var githubCardDeletedResponse;
        try {
            githubCardDeletedResponse = await backendClient.post("/integrations/github/delete_card", {sourceId: cardId});
            if (githubCardDeletedResponse.data.success == false) {
                throw Error(`Card/deleted success == false: ${githubCardDeletedResponse.error}`);
            }
        }
        catch (err) {
            await logger.error({source: 'github-lambda', message: err,
                                errorDescription: `error deleting Github Project Card - sourceId: ${cardId}`,
                                function: 'handler'});
            throw err;
        }
    }

}


module.exports = {
    handleProjectEvent,
    handleProjectCardEvent
}