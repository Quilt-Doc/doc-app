

const api = require('../apis/api');


// TODO: Get the repositoryIds from this
const initializeRepositories = async () => {

    var backendClient = api.requestTestingDevBackendClient();

    var defaultIcon = 1;
    var repositoryCreateData = [
        {
            fullName: 'kgodara-testing/brodal_queue',
            installationId: process.env.TESTING_INSTALLATION_ID,
            icon: defaultIcon,
        },
        {
            fullName: 'kgodara-testing/hamecha',
            installationId: process.env.TESTING_INSTALLATION_ID,
            icon: defaultIcon,
        },
    ];


    var requestPromiseList = repositoryCreateData.map(postDataObj => backendClient.post("/repositories/init", postDataObj));

    var results;
    try {
        results = await Promise.all(requestPromiseList);
    }
    catch (err) {
        console.log('Failed to successfully Create Repositories');
        throw err;
    }

    // createdRepositoryIds
    return results.map(response => response.data.result._id);

}


// TODO: Change this to call the normal repository delete method, so tests can run concurrently, and use repositoryIds
const deleteRepositories = async (createdWorkspaceId, createdRepositoryIds) => {
    var backendClient = api.requestTestingDevBackendClient();
    /*
    /repositories/:workspaceId/delete/:repositoryId
    */

   var repositoryDeleteRoutes = createdRepositoryIds.map(repositoryId => `/repositories/${createdWorkspaceId}/delete/${repositoryId}`);


    var requestPromiseList = repositoryDeleteRoutes.map(deleteDataRoute => backendClient.delete(deleteDataRoute));

    
    var results;
    try {
        results = await Promise.all(requestPromiseList);
    }
    catch (err) {
        console.log('Failed to successfully Delete Repositories');
        throw err;
    }

}

const createWorkspace = async ( createdRepositoryIds ) => {
    var backendClient = api.requestTestingUserBackendClient();

    var postData = { name: "Testing Workspace",
                        creatorId: process.env.TESTING_USER_ID,
                        installationId: process.env.TESTING_INSTALLATION_ID,
                        repositoryIds: createdRepositoryIds }

    var createWorkspaceResponse;
    try {
        createWorkspaceResponse = await backendClient.post('/workspaces/create', postData);
    }
    catch (err) {
        console.log('Error creating workspace');
        throw err;
    }

    // createdWorkspaceId
    return createWorkspaceResponse.data.result._id;

}


const deleteWorkspace = async ( createdWorkspaceId ) => {
    var backendClient = api.requestTestingUserBackendClient();

    var workspaceDeleteResponse;
    
    try {
        workspaceDeleteResponse = await backendClient.delete(`/workspaces/delete/${createdWorkspaceId}`);
        if (workspaceDeleteResponse.data.success != true) {
            throw Error(`Workspace Delete failed on backend`);
        }
    }
    catch (err) {
        console.log('Error deleting workspace');
        throw err;
    }

}



const fetchWorkspace = async () => {

}

module.exports = {
    initializeRepositories,
    deleteRepositories,
    createWorkspace,
    deleteWorkspace,
}