const api = require("../apis/api");

const removeWorkspaces = async () => {
    var backendClient = api.requestTestingUserBackendClient();

    var retrieveWorkspaceResponse;
    try {
        retrieveWorkspaceResponse = await backendClient.post(
            "/workspaces/retrieve",
            { creatorId: process.env.TEST_USER_ID }
        );
    } catch (err) {
        console.log("Failed to successfully Fetch Repositories");
        throw err;
    }

    var retrievedWorkspaces = retrieveWorkspaceResponse.data.result;

    if (retrievedWorkspaces.length > 0) {
        retrievedWorkspaces = retrievedWorkspaces.map((workspaceObj) =>
            workspaceObj._id.toString()
        );
    }

    var i = 0;
    for (i = 0; i < retrievedWorkspaces.length; i++) {
        await backendClient.delete(
            `/workspaces/delete/${retrievedWorkspaces[i]}`
        );
    }
};

// TODO: Get the repositoryIds from this
const fetchRepositories = async (fullNameList) => {
    var backendClient = api.requestTestingDevBackendClient();

    var response;
    try {
        response = await backendClient.post("/repositories/test_retrieve", {
            fullNames: fullNameList,
        });
    } catch (err) {
        console.log("Failed to successfully Fetch Repositories");
        throw err;
    }

    return response.data.result;
};

// TODO: Change this to call the normal repository delete method, so tests can run concurrently, and use repositoryIds
const deleteRepositories = async (createdWorkspaceId, createdRepositoryIds) => {
    var backendClient = api.requestTestingDevBackendClient();
    /*
    /repositories/:workspaceId/delete/:repositoryId
    */

    var repositoryDeleteRoutes = createdRepositoryIds.map(
        (repositoryId) => `/repositories/delete_test/${repositoryId}`
    );

    var requestPromiseList = repositoryDeleteRoutes.map((deleteDataRoute) =>
        backendClient.delete(deleteDataRoute)
    );

    var results;
    try {
        results = await Promise.all(requestPromiseList);
    } catch (err) {
        console.log("Failed to successfully Delete Repositories");
        throw err;
    }
};

const createWorkspace = async (fullNameList) => {
    var backendClient = api.requestTestingUserBackendClient();

    var createdRepositories = await fetchRepositories(fullNameList);

    var createdRepositoryIds = createdRepositories.map((repositoryObj) => {
        console.log("repositoryObj._id");
        console.log(repositoryObj._id);
        return repositoryObj._id;
    });

    var postData = {
        name: "Testing Workspace",
        creatorId: process.env.TEST_USER_ID,
        installationId: process.env.TESTING_INSTALLATION_ID,
        repositoryIds: createdRepositoryIds,
    };

    var createWorkspaceResponse;
    try {
        createWorkspaceResponse = await backendClient.post(
            "/workspaces/create",
            postData
        );
    } catch (err) {
        console.log("Error creating workspace - utils.js");
        throw err;
    }

    console.log("createWorkspace() returning: ");
    console.log(createWorkspaceResponse.data);

    // createdWorkspaceId
    return {
        createdWorkspaceId: createWorkspaceResponse.data.result._id,
        repositoryIds: createdRepositoryIds,
    };
};

const deleteWorkspace = async (createdWorkspaceId) => {
    var backendClient = api.requestTestingUserBackendClient();

    var workspaceDeleteResponse;

    try {
        workspaceDeleteResponse = await backendClient.delete(
            `/workspaces/delete/${createdWorkspaceId}`
        );
        if (workspaceDeleteResponse.data.success != true) {
            throw Error(`Workspace Delete failed on backend`);
        }
    } catch (err) {
        console.log("Error deleting workspace");
        throw err;
    }
};

const fetchWorkspace = async () => {};

module.exports = {
    removeWorkspaces,
    fetchRepositories,
    deleteRepositories,
    createWorkspace,
    deleteWorkspace,
};
