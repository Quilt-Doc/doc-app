
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
            installationId: (installationId) ? installationId : undefine
            projectId,
            projectNumber,
            projectColumnsUrl,
            projectName,
            projectBody,
            projectState,
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

    await 

}


module.exports = {
    handleProjectEvent,
    handleProjectCardEvent
}