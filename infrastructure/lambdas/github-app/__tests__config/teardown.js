// teardown.js

const utils = require('./utils');

const fs = require("fs");

module.exports = async function () {
    /*
    try {
        fs.unlinkSync("./test_env.json");
    }
    catch (err) {
        console.log("Couldn't find JSON env file to delete");
    }
    */

    try {
        await utils.deleteWorkspace( process.env.TEST_CREATED_WORKSPACE_ID );
    }
    catch (err) {
        console.log('Error deleting Workspace');
        throw err;
    }
    /*
    try {
        await utils.deleteRepositories( process.env.TEST_CREATED_WORKSPACE_ID, JSON.parse(process.env.TEST_CREATED_REPOSITORY_IDS));
    }
    catch (err) {
        console.log('Error deleting Repositories');
        throw err;
    }
    */


    // unset env vars
    delete process.env.TEST_CREATED_WORKSPACE_ID;
    delete process.env.TEST_CREATED_REPOSITORY_IDS;
};