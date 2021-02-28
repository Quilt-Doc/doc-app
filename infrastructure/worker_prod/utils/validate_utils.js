const { execFileSync } = require('child_process');
const yaml = require('js-yaml');
const fs = require('fs');

const {serializeError, deserializeError} = require('serialize-error');


const backendClient = require('../apis/api').requestBackendClient();


const filterVendorFiles = (filePaths) => {
  var regexFilters = yaml.safeLoad(fs.readFileSync('vendor.yml', 'utf8'));
  regexFilters = regexFilters.map(filter => RegExp(filter));
  
  // Return all elements that don't match any regex filters
  return filePaths.filter(function (fileName) {
    return !regexFilters.some(function (regex) {
        return regex.test(fileName);
    });
  });
}


const getRepositoryObject = async (installationId, repositoryFullName, worker) => {

  await worker.send({action: 'log', info: {level: 'debug', message: `InstallationId, repositoryFullName: ${installationId}, ${repositoryFullName}`,
                                      source: 'worker-instance', function: 'getRepositoryObject'}})

  var getRepositoryResponse;
  try {
    getRepositoryResponse = await backendClient.post('/repositories/job_retrieve', {
      installationId,
      fullName: repositoryFullName 
    });
  }
  catch (err) {
    await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                              errorDescription: `Error /repositories/job_retrieve call error on repositoryFullName: ${repositoryFullName}`,
                                              source: 'worker-instance', function: 'getRepositoryObject'}})
    throw new Error(`Error /repositories/job_retrieve call error on repositoryFullName: ${repositoryFullName}`);
  }

  if (!getRepositoryResponse.data.success) {
    await worker.send({action: 'log', info: {level: 'error', message: serializeError(Error(getRepositoryResponse.data.error)),
                                              errorDescription: `Error /repositories/job_retrieve call failed on repositoryFullName: ${repositoryFullName}`,
                                              source: 'worker-instance', function: 'getRepositoryObject'}})
    throw new Error(`Error /repositories/job_retrieve call failed on repositoryFullName: ${repositoryFullName}`);
  }
  return getRepositoryResponse.data.result[0];
};


// Parse individual commit objects from `git log` output
const parseCommitObjects = (logLines) => {
    var withinCommit = '';
    var commitObjects = [];

    var i = 0;

    while( i < logLines.length) {
  
      if (logLines[i].length == 40) {
        // console.log('found commit hash');
  
        withinCommit = logLines[i];
        commitObjects.push({sha: logLines[i], changes: []})
        i++;
      }
  
      else {
        if (logLines[i].length > 1) { 
  
          var lineData = logLines[i].split("\t");
          // Operation type
          commitObjects[commitObjects.length-1].changes.push({operation: lineData[0], fileNames:  lineData.slice(1)});
        }
      }
  
      i++;
    }
    // git log -M --name-status --numstat --pretty=%H e523b394a56c4507a5200a7294769ad33e66e295..646974ca9aa034f029fb0e419ab3467e6822bca4
  
    // Return commits in chronological order (earliest to latest)
    return commitObjects.reverse();
}


// Assumption: fileChangeList is chronological, earliest to latest
const parseGithubFileChangeList = (fileChangeList) => {
  // Get the unique file's modified in fileChangeList

  // Remove renames from the trackedFiles list so that we don't have extra References
  // var fileChangeNoRename = fileChangeList.filter(fileChange => fileChange.status != 'renamed');
  // We need to get the list of files that are being modified
  // var trackedFiles = [...new Set(fileChangeList.map(fileChange => fileChange.filename))];

  // trackedFiles = trackedFiles.map(fileName => {ref: fileName});

  // Build file list as we go
  var trackedFiles = [];

  // ['added', 'removed', 'modified', 'renamed']
  for (i = 0; i < fileChangeList.length; i++) {

    var currentFileChange = fileChangeList[i];
    var fileObj = trackedFiles.find( function( ele ) {
      return ele.ref == currentFileChange.filename && ele.deleted == false;
    });
    
    if (currentFileChange.status == 'added') {
      trackedFiles.push({ref: currentFileChange.filename, oldRef: currentFileChange.filename, operationList: [{sha: currentFileChange.sha, operation: 'Add'}], isNewRef: true, deleted: false });
    }

    else if (currentFileChange.status == 'modified') {
      
      if (fileObj) {
        fileObj.operationList.push({sha: currentFileChange.sha, operation: 'Modify'});
      }
      else {
        trackedFiles.push({ref: currentFileChange.filename, oldRef: currentFileChange.filename, operationList: [{sha: currentFileChange.sha, operation: 'Modify'}], isNewRef: false, deleted: false});
       }
    }

    else if (currentFileChange.status == 'renamed') {
      
      if (fileObj) {
        fileObj.ref = currentFileChange.filename;
        fileObj.operationList.push({sha: currentFileChange.sha, operation: 'Rename'});
      }
      else {
        trackedFiles.push({ref: currentFileChange.filename, oldRef: currentFileChange.previous_filename, operationList: [{sha: currentFileChange.sha, operation: 'Rename'}], isNewRef: false, deleted: false});
      }
    }
    else if (currentFileChange.status == 'removed') {
      if (fileObj) {
        fileObj.deleted = true;
        fileObj.operationList.push({sha: currentFileChange.sha, operation: 'Remove'});
      }
      else {
        trackedFiles.push({ref: currentFileChange.filename, oldRef: currentFileChange.filename, operationList: [{sha: currentFileChange.sha, operation: 'Remove'}], isNewRef: false, deleted: true});
      }
    }
  }

  console.log("parseGithubFileChangeList trackedFiles: ");
  trackedFiles.forEach(file => {
    console.log(file);
    console.log(file.operationList);
    console.log();
  });

  // snippetFiles = [...new Set(snippetData.map(snippetObj => snippetObj.pathInRepository))];
}


const getFileChangeList = (commitObjects) => {

  // Build file list as we go
  var trackedFiles = [];

  for (i = 0; i < commitObjects.length; i++) {
    var commit = commitObjects[i];

    for (k = 0; k < commit.changes.length; k++) {

      var commitChanges = commit.changes[k];
      var commitOperation = commit.changes[k].operation;
      var fileObj = trackedFiles.find( function( ele ) {
        return ele.ref == commitChanges.fileNames[0] && ele.deleted == false;
      });

      // Rename Operation
      // If there is already a file object for this existing in trackedFiles, update the ref
      // Else: add file object: {oldRef: snippetFiles[x], ref: commit}
      if (commitOperation.includes('R')) {
        if (commitChanges.fileNames.length < 2) {
          throw new Error('Rename Operation with less than 2 names');
        }
        if (fileObj) {
          // Update the fileObj with the new file name
          fileObj.ref = commitChanges.fileNames[0];
          fileObj.operationList.push({sha: commit.sha, operation: 'Rename'});
          // fileObj.sha = commit.sha;
        }
        // Add a new object if the old file name is in snippetFiles
        // This is the case where the file is being referenced and renamed
        // for the first time in the commit log
        else {
          trackedFiles.push({ref: commitChanges.fileNames[1], oldRef: commitChanges.fileNames[0], operationList: [{sha: commit.sha, operation: 'Rename'}], isNewRef: false, deleted: false});
          // OLD
          // trackedFiles.push({oldRef: commitChanges.fileNames[0], ref: commitChanges.fileNames[1], sha: commit.sha, deleted: false});
        }
      }
      // End of R Handling Section

      // Delete Operation
      if (commitOperation == 'D') {

        // We only care if a Snippet file has been deleted
        

        // Case: file is already being tracked
        if (fileObj) {
          fileObj.deleted = true;
          fileObj.operationList.push({sha: commit.sha, operation: 'Remove'});
        }
        // What do we do if this is the only commit referencing the file
        // Idea: Add a fileObj to trackedFiles with status: 'DELETED'
        else {
          // trackedFiles.push({ref: commitChanges.fileNames[0], deleted: true, sha: commit.sha});
          trackedFiles.push({ref: commitChanges.fileNames[0], oldRef: commitChanges.fileNames[0], operationList: [{sha: commit.sha, operation: 'Remove'}], isNewRef: false, deleted: true});
        }
      }

      // Modify File Operation
      else if (commitOperation == 'M') {
        if (fileObj) {
          fileObj.operationList.push({sha: commit.sha, operation: 'Modify'});
        }

        else {
          trackedFiles.push({ref: commitChanges.fileNames[0], oldRef: commitChanges.fileNames[0], operationList: [{sha: commit.sha, operation: 'Modify'}], isNewRef: false, deleted: false, });
        }
      }

      // Add File Operation
      else if (commitOperation == 'A') {
        if (fileObj) {
          throw new Error ("Add File Commit Operation Found Existing Reference with same `ref` and not deleted");
          fileObj.operationList.push({sha: commit.sha, operation: 'Add'});
          // trackedFiles.push({ref: commitChanges.fileNames[0], deleted: false, sha: commit.sha});
        }

        else {
          trackedFiles.push({ref: commitChanges.fileNames[0], oldRef: commitChanges.fileNames[0], operationList: [{sha: commit.sha, operation: 'Add'}], isNewRef: true, deleted: false, });
        }
      }
  

    }
  }

  return trackedFiles;
}


module.exports = {getRepositoryObject, filterVendorFiles, parseCommitObjects,
                  getFileChangeList, parseGithubFileChangeList };