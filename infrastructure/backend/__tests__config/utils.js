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
const fetchRepositories = async () => {
    var backendClient = api.requestTestingDevBackendClient();

    var defaultIcon = 1;
    var repositoryCreateData = [
        {
            fullName: "kgodara-testing/brodal_queue",
            installationId: process.env.TESTING_INSTALLATION_ID,
            icon: defaultIcon,
        },
        {
            fullName: "kgodara-testing/doc-app",
            installationId: process.env.TESTING_INSTALLATION_ID,
            icon: defaultIcon,
        },
    ];

    var fullNameList = [
        "kgodara-testing/brodal_queue",
        "kgodara-testing/doc-app",
    ];
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

    /*
    var requestPromiseList = repositoryCreateData.map(postDataObj => backendClient.post("/repositories/test/retrieve", postDataObj));

    var results;
    try {
        results = await Promise.all(requestPromiseList);
    } catch (err) {
        console.log("Failed to successfully Create Repositories");
        throw err;
    }

    // createdRepositoryIds
    return results.map(response => {
        return { _id: response.data.result[0]._id, fullName: response.data.result[0].fullName}
    });
    */
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

const createWorkspace = async (createdRepositoryIds) => {
    console.log("createWorkspace() -  createdRepositoryIds: ");
    console.log(createdRepositoryIds);

    var backendClient = api.requestTestingUserBackendClient();

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
    return createWorkspaceResponse.data.result._id;
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
