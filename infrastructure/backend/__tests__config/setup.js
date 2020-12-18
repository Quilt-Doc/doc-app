// setup.js

const utils = require('./utils');

module.exports = async () => {
    // ...
    // Set reference to mongod in order to close the server during teardown.
    // global.__MONGOD__ = mongod;

    try {
        global.createdRepositoryIds = await utils.initializeRepositories();
    }
    catch (err) {
        console.log('Error initializing Repositories');
        throw err;
    }

    try {
        global.createdWorkspaceId = await utils.createWorkspace( createdRepositoryIds );
    }
    catch (err) {
        console.log('Error creating Workspace');
        throw err;
    }

};