// setup.js

require("dotenv").config();
const utils = require("./utils");


module.exports = async () => {
    // ...
    // Set reference to mongod in order to close the server during teardown.
    // global.__MONGOD__ = mongod;

    try {
        await utils.removeWorkspaces();
    } catch (err) {
        console.log("Error Clearing Test User Workspaces");
        console.log(err);
        throw err;
    }

    var createWorkspaceResponse;
    try {
        // global.createdWorkspaceId = await utils.createWorkspace( createdRepositoryIds );
        createWorkspaceResponse = await utils.createWorkspace( ["kgodara-testing/brodal_queue", "kgodara-testing/doc-app"] );
    } catch (err) {
        console.log("Error creating Workspace/fetching Repositories setup.js");
        throw err;
    }

    process.env.TEST_CREATED_WORKSPACE_ID = createWorkspaceResponse.createdWorkspaceId;
    process.env.TEST_CREATED_REPOSITORIES = JSON.stringify(createWorkspaceResponse.repositoryIds);

};