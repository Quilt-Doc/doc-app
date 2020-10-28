require('dotenv').config();
const api = require('../apis/api');

var createdWorkspaceId;
var createdRepositoryIds;

// TODO: Get the repositoryIds from this
const initializeRepositories = async () => {

    var backendClient = await api.requestTestingDevBackendClient();

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

    createdRepositoryIds = results.map(response => response.data.result._id);


    console.log('Created Repository Ids: ');
    console.log(createdRepositoryIds);

}


// TODO: Change this to call the normal repository delete method, so tests can run concurrently, and use repositoryIds
const deleteRepositories = async () => {
    var backendClient = await api.requestTestingDevBackendClient();
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

    /*
    var repositoryDeleteData = {installationId: process.env.TESTING_INSTALLATION_ID, repositories: ['kgodara-testing/brodal_queue', 'kgodara-testing/hamecha' ]};

    var deleteRepositoriesResponse;
    try {
        deleteRepositoriesResponse = await backendClient.post("repositories/remove_installation", repositoryDeleteData);
    }
    catch (err) {
        console.log('Failed to successfully Delete Repositories');
        throw err;
    }


    console.log('Delete Repository Response: ');
    console.log(deleteRepositoriesResponse);
    */
}

const createWorkspace = async (repositoryIds) => {
    var backendClient = await api.requestTestingUserBackendClient();

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

    createdWorkspaceId = createWorkspaceResponse.data.result._id;

}


const deleteWorkspace = async () => {
    var backendClient = await api.requestTestingUserBackendClient();


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



beforeAll(async () => {
    try {
        await initializeRepositories();
    }
    catch (err) {
        console.log('Error initializing Repositories');
        throw err;
    }

    try {
        await createWorkspace();
    }
    catch (err) {
        console.log('Error creating Workspace');
        throw err;
    }

});


afterAll(async () => {

    try {
        await deleteRepositories();
    }
    catch (err) {
        console.log('Error deleting Repositories');
        throw err;
    }

    
    try {
        await deleteWorkspace();
    }
    catch (err) {

    }  
});

describe("Filter function", () => {
    test("it should filter by a search term (link)", () => {
      expect(1==1).toEqual(true);
    });
});