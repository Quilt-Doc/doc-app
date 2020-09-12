const fs = require('fs');

const api = require('./apis/api');
var backendClient = api.requestBackendClient();


const fs_promises = require('fs').promises;

const { findNewSnippetRegion } = require('./snippet_validator');

const { parseCommitObjects, getTrackedFiles } = require('./utils/validate_utils');



require('dotenv').config();
const { exec, execFile, spawnSync } = require('child_process');

const constants = require('./constants/index');


const getRepositoryObject = async (installationId, repositoryFullName) => {
  
    const getRepositoryResponse = await backendClient.post('/repositories/retrieve', {
      installationId: installationId,
      fullName: repositoryFullName 
    });
    console.log('getRepositoryResponse: ');
    console.log(getRepositoryResponse.data);
    var repoCommit = getRepositoryResponse.data.last_processed_commit;
    var repoId = getRepositoryResponse.data._id;
    return [repoId, repoCommit];
};

/*
// Remove old non-tree references
const removeOldNonTreeReferences = async () => {
    
}
*/


const run = async () => {
    
    // Get install client
    var installationClient = api.requestInstallationClient(process.env.installationId);

    var repoId = '';
    var repoCommit = '';
    [repoId, repoCommit] = await getRepositoryObject(process.env.installationId, process.env.repositoryFullName);
    var headCommit = process.env.headCommit;

    var diffResponse = await installationClient.get(`/repos/${process.env.repositoryFullName}/compare/${repoCommit}...${headCommit}`);
    console.log('DIFF RESPONSE: ');
    console.log(diffResponse.data);

}

module.exports = {
    run
}