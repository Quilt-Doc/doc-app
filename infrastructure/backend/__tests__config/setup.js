// setup.js

require('dotenv').config();
const utils = require('./utils');

module.exports = async () => {
    // ...
    // Set reference to mongod in order to close the server during teardown.
    // global.__MONGOD__ = mongod;

    try {
        await utils.removeWorkspaces();
    }
    catch (err) {
        console.log('Error Clearing Test User Workspaces');
        console.log(err);
        throw err;
    }

    try {
        // global.createdRepositoryIds = await utils.initializeRepositories();
        process.env.TEST_CREATED_REPOSITORIES = JSON.stringify(await utils.fetchRepositories());
    }
    catch (err) {
        console.log('Error initializing Repositories');
        throw err;
    }

    var createdRepositories = JSON.parse(process.env.TEST_CREATED_REPOSITORIES);

    console.log('setup.js createdRepositories: ');
    console.log(createdRepositories);

    var createdRepositoryIds = createdRepositories.map(repositoryObj => {
        console.log('repositoryObj')
        console.log(repositoryObj._id);
        return repositoryObj._id;
    });
    console.log('createdRepositoryIds');

    try {
        // global.createdWorkspaceId = await utils.createWorkspace( createdRepositoryIds );
        process.env.TEST_CREATED_WORKSPACE_ID = await utils.createWorkspace( createdRepositoryIds );
    }
    catch (err) {
        console.log('Error creating Workspace/fetching Repositories setup.js');
        throw err;
    }

};