

const handleInstallationEvent = async (backendClient, event, githubEvent, logger) => {

    var installationId = event.body.installation.id;
    var action = event.body.action;
    var repositories = event.body.repositories;

    var defaultIcon = 1;

    await logger.info({source: 'github-lambda', message: `Installation '${action}' Event Received`, function: 'handler'});


    if (action == 'created') {

        var tokenCreateResponse;
        try {
            tokenCreateResponse = await backendClient.post("/tokens/create", {installationId, type: 'INSTALL'});
            if (tokenCreateResponse.data.success == false) {
                throw Error(`tokens/create success == false: ${tokenCreateResponse.error}`);
            }
        }
        catch (err) {
            await logger.error({source: 'github-lambda', message: err,
                                errorDescription: `error creating install token installationId: ${installationId}`,
                                function: 'handler'});

            throw err;
        }

        var postDataList = repositories.map(repositoryObj => ({ fullName: repositoryObj.full_name, installationId, 'icon': defaultIcon}));

        var requestPromiseList = postDataList.map(postDataObj => backendClient.post("/repositories/init", postDataObj));

        try {
            await Promise.all(requestPromiseList);
        }
        catch (err) {
            await logger.error({source: 'github-lambda', message: err,
                                errorDescription: `error initializing repositories: ${postDataList}`,
                                function: 'handler'});

            throw err;
        }
        await logger.info({source: 'github-lambda', message: `Successfully created Repositories installationId: ${installationId}`, function: 'handler'});

    }

    else if (action == 'deleted') {

        var repositoryDataList = repositories.map(repositoryObj => repositoryObj.full_name );

        var removeInstallResponse;

        try {
            removeInstallResponse = await backendClient.post("/repositories/remove_installation", {installationId, repositories: repositoryDataList});
        }
        catch (err) {
            await logger.error({source: 'github-lambda', message: err,
                                errorDescription: `Error Removing Installation - repositoryDataList: ${JSON.stringify(repositoryDataList)}`,
                                function: 'handler'});

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
            await logger.error({source: 'github-lambda', message: err,
                                errorDescription: `error deleting install token installationId: ${installationId}`,
                                function: 'handler'});
                    
            throw err;
        }
        await logger.info({source: 'github-lambda', message: `Succesfully deleted 'INSTALL' token and removed installation installationId: ${installationId}`, function: 'handler'});
    }
}


const handleInstallationRepositoriesEvent = async (backendClient, event, githubEvent, logger) => {
    var action = event.body.action;
    var installationId = event.body.installation.id;

    await logger.info({source: 'github-lambda', message: `Installation Repositories '${action}' Event Received`, function: 'handler'});

    if (action == 'added') {
        
        var added = event.body.repositories_added;

        var postDataList = added.map(repositoryObj => ({ fullName: repositoryObj.full_name, installationId, 'icon': defaultIcon}));

        var requestPromiseList = postDataList.map(postDataObj => backendClient.post("/repositories/init", postDataObj));

        try {
            await Promise.all(requestPromiseList);
        }
        catch (err) {
            await logger.error({source: 'github-lambda', message: err,
                                errorDescription: `error initializing repositories: ${postDataList}`,
                                function: 'handler'});

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
            await logger.error({source: 'github-lambda', message: err,
                                errorDescription: `Error Removing Installation - repositoryDataList: ${JSON.stringify(repositoryDataList)}`,
                                function: 'handler'});

            throw err;
        }
    }
}


module.exports = {
    handleInstallationEvent,
    handleInstallationRepositoriesEvent,
}