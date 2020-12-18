// teardown.js

const utils = require('./utils');

module.exports = async function () {
    try {
        await utils.deleteRepositories( global.createdWorkspaceId, global.createdRepositoryIds);
    }
    catch (err) {
        console.log('Error deleting Repositories');
        throw err;
    }


    try {
        await utils.deleteWorkspace( global.createdWorkspaceId );
    }
    catch (err) {
        console.log('Error deleting Workspace');
        throw err;
    }
};
  