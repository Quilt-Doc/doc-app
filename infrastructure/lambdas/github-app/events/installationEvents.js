const Sentry = require("@sentry/node");


const handleInstallationEvent = async (backendClient, event, githubEvent) => {

    var installationId = event.body.installation.id;
    var action = event.body.action;
    var repositories = event.body.repositories;

    var defaultIcon = 1;

    console.log(`Installation '${action}' Event Received`);


    if (action == 'created') {

        var tokenCreateResponse;
        try {
            tokenCreateResponse = await backendClient.post("/tokens/create", {installationId, type: 'INSTALL'});
            if (tokenCreateResponse.data.success == false) {
                throw Error(`tokens/create success == false: ${tokenCreateResponse.error}`);
            }
        }
        catch (err) {
            
            console.log(err);

            Sentry.setContext("handleInstallationEvent", {
                message: `Error creating install token`,
                installationId: installationId,
            });

            Sentry.captureException(err);

            throw err;
        }

        var postDataList = repositories.map(repositoryObj => ({ fullName: repositoryObj.full_name, installationId, 'icon': defaultIcon}));

        var requestPromiseList = postDataList.map(postDataObj => backendClient.post("/repositories/init", postDataObj));

        try {
            await Promise.all(requestPromiseList);
        }
        catch (err) {

            console.log(err);

            Sentry.setContext("handleInstallationEvent", {
                message: `Error initializing repositories`,
                postDataList: postDataList,
            });

            Sentry.captureException(err);

            throw err;
        }
        console.log(`Successfully created Repositories installationId: ${installationId}`);

    }

    else if (action == 'deleted') {

        var repositoryDataList = repositories.map(repositoryObj => repositoryObj.full_name );

        var removeInstallResponse;

        try {
            removeInstallResponse = await backendClient.post("/repositories/remove_installation", {installationId, repositories: repositoryDataList});
        }
        catch (err) {

            console.log(err);

            Sentry.setContext("handleInstallationEvent", {
                message: `Error Removing Installation`,
                repositoryDataList: repositoryDataList,
            });

            Sentry.captureException(err);

            throw err;
        }

        // Delete the installation token
        var tokenDeleteResponse;
        try {
            tokenDeleteResponse = await backendClient.post("/tokens/delete", {installationId});
            if (tokenDeleteResponse.data.success == false) {
                throw Error(`tokens/delete success == false: ${tokenDeleteResponse.error}`);
            }
        }
        catch (err) {

            console.log(err);

            Sentry.setContext("handleInstallationEvent", {
                message: `Error deleting install token`,
                installationId: installationId,
            });

            Sentry.captureException(err);

            throw err;
        }
        console.log(`Succesfully deleted 'INSTALL' token and removed installation installationId: ${installationId}`);
    }
}


const handleInstallationRepositoriesEvent = async (backendClient, event, githubEvent) => {
    var action = event.body.action;
    var installationId = event.body.installation.id;

    console.log(`Installation Repositories '${action}' Event Received`,);

    if (action == 'added') {
        
        var added = event.body.repositories_added;

        var postDataList = added.map(repositoryObj => ({ fullName: repositoryObj.full_name, installationId, 'icon': defaultIcon}));

        var requestPromiseList = postDataList.map(postDataObj => backendClient.post("/repositories/init", postDataObj));

        try {
            await Promise.all(requestPromiseList);
        }
        catch (err) {

            console.log(err);

            Sentry.setContext("handleInstallationRepositoriesEvent", {
                message: `Error initializing repositories`,
                postDataList: postDataList,
            });

            Sentry.captureException(err);

            throw err;
        }
    }

    else if (action == 'removed') {
        var removed = event.body.repositories_removed;
        
        var repositoryDataList = removed.map(repositoryObj => repositoryObj.full_name );

        var removeInstallResponse;

        try {
            removeInstallResponse = await backendClient.post("/repositories/remove_installation", {installationId, repositories: repositoryDataList});
        }
        catch (err) {

            console.log(err);

            Sentry.setContext("handleInstallationRepositoriesEvent", {
                message: `Error Removing Installation`,
                repositoryDataList: repositoryDataList,
            });

            Sentry.captureException(err);

            throw err;
        }
    }
}


module.exports = {
    handleInstallationEvent,
    handleInstallationRepositoriesEvent,
}