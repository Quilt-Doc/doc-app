// setup.js

require('dotenv').config();
const utils = require('./utils');

module.exports = async () => {
    // ...
    // Set reference to mongod in order to close the server during teardown.
    // global.__MONGOD__ = mongod;

    try {
        // global.createdRepositoryIds = await utils.initializeRepositories();
        process.env.TEST_CREATED_REPOSITORIES = JSON.stringify(await utils.fetchRepositories());
    }
    catch (err) {
        console.log('Error initializing Repositories');
        throw err;
    }

    var createdRepositories = JSON.parse(process.env.TEST_CREATED_REPOSITORIES);
    var createdRepositoryIds = createdRepositories.map(repositoryObj => repositoryObj._id);

    try {
        // global.createdWorkspaceId = await utils.createWorkspace( createdRepositoryIds );
        process.env.TEST_CREATED_WORKSPACE_ID = await utils.createWorkspace( createdRepositoryIds );
    }
    catch (err) {
        console.log('Error creating Workspace');
        throw err;
    }

};