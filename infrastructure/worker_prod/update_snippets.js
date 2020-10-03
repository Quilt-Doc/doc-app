// Handled: DRAM
// Unhandled: CTUX
/*
Possible status letters are:
  A: addition of a file - Handled

  C: copy of a file into a new one - I couldn't get this one to show up

  D: deletion of a file - Handled

  M: modification of the contents or mode of a file - Handled

  R: renaming of a file - Handled

  T: change in the type of the file - I couldn't get this one to show up

  U: file is unmerged (you must complete the merge before it can be committed) - We will lump this in with others

  X: "unknown" change type (most probably a bug, please report it) - We will skip this
*/

// TODO: Snippet Updating needs to be called before any References are updated on repository push

const fs = require('fs');

const api = require('./apis/api').requestBackendClient();

const fs_promises = require('fs').promises;

const { findNewSnippetRegion } = require('./snippet_validator');

const tokenUtils = require('./utils/token_utils');

require('dotenv').config();
const { exec, execFile, spawnSync } = require('child_process');

const constants = require('../constants/index');

const Snippet = require('../models/Snippet');
const Reference = require('../models/Reference');

const {serializeError, deserializeError} = require('serialize-error');



// TODO: Verify that the same array is always being created.
// This is NOT the case currently, filter returns a new array
const validateSnippetsOnFiles = async (snippetData, trackedFiles, repoDiskPath, repoId, worker) => {
  // Intra-file section
  const validationResults = trackedFiles.map((currentFile) => {

    var relevantSnippets = snippetData.filter((snippetObj) => {
      return snippetObj.pathInRepository == currentFile.ref;
    });

    worker.send({action: 'log', info: {level: 'debug', message: `relevantSnippets on repository: ${repoId}\n${relevantSnippets}`,
                                        source: 'worker-instance', function: 'validateSnippetsOnFiles'}});

    return fileContentValidation(currentFile, relevantSnippets, repoDiskPath);
  });

  var validateResults;
  try {
    validateResults = await Promise.all(validationResults);
  }
  catch (err) {
    await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: 'Error validationResults error',
                                        source: 'worker-instance', function: 'validateSnippetsOnFiles'}})
    throw new Error(`Error validationResults error`);
  }

  // flatten list of arrays
  var snippetUpdateData = [].concat(...validateResults);

  worker.send({action: 'log', info: {level: 'debug', message: `snippetUpdateData on repository: ${repoId}\n${snippetUpdateData}`,
                                      source: 'worker-instance', function: 'validateSnippetsOnFiles'}});

  return snippetUpdateData;
}

// Check if start and end lines in same place, snippet automatically valid
const fileContentValidation = async (fileObj, snippetData, repoDiskPath) => {

  if (fileObj.deleted) {
    snippetData = snippetData.map ( (obj) => {
      obj.status = 'INVALID';
      return obj;
    });
    return snippetData;
  }
  const data = await fs_promises.readFile('./' + repoDiskPath + fileObj.ref, 'utf8');

  var lines = data.toString().split('\n');


  // Section Start: Find Snippets whose start & end haven't moved
  for (i = 0; i < snippetData.length; i++) {
    var currentSnippet = snippetData[i];
    var status = constants.snippets.SNIPPET_STATUS_INVALID;
  
    var snippetStartLine = currentSnippet.firstLine.replace(/\s+/g, '');
    var snippetEndLine = currentSnippet.endLine.replace(/\s+/g, '');
    // console.log('lines length, idx, lines: ', lines.length, ' - ', currentSnippet.startLineNum, '\n', lines);
  
    // If Snippet start line and end line are the same and in the same place, assume that Snippet is still valid
    if (snippetStartLine == lines[currentSnippet.startLineNum].replace(/\s+/g, '')) {
      if (snippetEndLine == lines[currentSnippet.startLineNum + currentSnippet.numLines-1].replace(/\s+/g, '')) {
        status = constants.snippets.SNIPPET_STATUS_VALID;
      }
    }

    snippetData[i].status = status;
  }
  // Section End: Find Snippets whose start & end haven't moved


  lines = lines.join('\n');

  // Look for new regions for snippets that haven't been successfully validated
  for (i = 0; i < snippetData.length; i++) {
    // {startLine: finalResult.idx, numLines: finalResult.size, status: 'NEW_REGION'}
    
    // If Snippet start and end lines don't both match anymore.
    if (snippetData[i].status == constants.snippets.SNIPPET_STATUS_INVALID) {
      console.log('Looking for new snippet region, idx: ', i);
      snippetData[i] = findNewSnippetRegion(snippetData[i], lines);
    }
  }

  console.log('final snippetData: ');
  console.log(snippetData);

  return snippetData;
  // _id
}


const runSnippetValidation = async (installationId, repoDiskPath, repoObj, headCommit, trackedFiles, worker) => {

  // Needed Parameters:
  // ----------------------
  // repository fullName
  // repository cloneUrl
  // Head commit
  // Base commit
  // Github API Client

  var repoId = repoObj._id;
  var repoCommit = repoObj.lastProcessedCommit;

  // Make sure repository is at correct commit
  try {
    const ensureCommit = spawnSync('git', ['reset', '--hard', `${headCommit}`], {cwd: repoDiskPath});
  }
  catch (err) {
    await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error resetting repository ${repoId} to commit ${headCommit}`,
                                              source: 'worker-instance', function: 'runSnippetValidation'}});
    throw new Error(`Error resetting repository ${repoId} to commit ${headCommit}`);
  }


  var fileReferences;

  try {
    fileReferences = await Reference.find({repository: repoId, kind: "file", status: "valid"});
  }
  catch (err) {
    await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error fetching 'file' References on repository: ${repoId}`,
                                        source: 'worker-instance', function: 'runSnippetValidation'}});
    throw new Error(`Error fetching 'file' References on repository: ${repoId}`);
  }


  fileReferences = fileReferences.map(referenceObj => {
    return referenceObj._id.toString();
  });


  // TODO: We have to get all Snippets attached to this repository and validate them all, not by workspace
  var repoSnippets;
  
  try {
    repoSnippets = await Snippet.find({_id: {$in: fileReferences}, repository: repoId});
  }
  catch (err) {
    await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error fetching Snippets from 'file' References on repository: ${repoId}`,
                                              source: 'worker-instance', function: 'runSnippetValidation'}});
    throw new Error(`Error fetching Snippets from 'file' References on repository: ${repoId}`);
  }

  // List of each unique file with snippets attached
  // Strip out branch name
  var snippetData = repoSnippets.map(snippetObj => {
    return { _id: snippetObj._id.toString(), startLineNum: snippetObj.start, numLines: snippetObj.code.length,
              firstLine: snippetObj.code[0], endLine: snippetObj.code[snippetObj.code.length-1],
              reference: snippetObj.reference
          }
  });

  // Get Snippet file paths and match them to Snippet
  var snippetReferences = [...new Set(snippetData.map(snippetObj => snippetObj.reference.toString()))];

  try {
    snippetReferences = await Reference.find({_id: {$in: snippetReferences}});
  }
  catch (err) {
    await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), 
                                              errorDescription: `Error fetching References from list of References assigned to all Snippets on repository: ${repoId}`,
                                              source: 'worker-instance', function: 'runSnippetValidation'}});
    throw new Error(`Error fetching References from list of References assigned to all Snippets on repository: ${repoId}`);
  }

  snippetData = snippetData.map(snippetObj => {
    var refIdx = snippetReferences.findIndex(refObj => refObj._id.toString() == snippetObj.toString());
    snippetObj.pathInRepository = snippetReferences[refIdx].path;
  });

  // Get list of distinct files our snippets are attached to
  snippetFiles = [...new Set(snippetData.map(snippetObj => snippetObj.pathInRepository))];

  // TODO: Filter trackedFiles by snippetFiles, use oldRef for filtering
  trackedFiles = trackedFiles.filter(fileObj => snippetFiles.includes(fileObj.oldRef));

  // Update snippet pathInRepository if it's file has moved
  for(i = 0; i < trackedFiles.length; i++) {
    if (trackedFiles[i].oldRef) {
      snippetData = snippetData.map(snippetObj => {
        if (snippetObj.pathInRepository == trackedFiles[i].oldRef) {
          snippetObj.pathInRepository = trackedFiles[i].ref;
        }
        return snippetObj;
      });
    }
  }

  // TODO: Update Snippets in DB
  

  /*
  Format: { _id: snippetObj._id.toString(), startLineNum: snippetObj.start, numLines: snippetObj.code.length,
  firstLine: snippetObj.code[0], endLine: snippetObj.code[snippetObj.code.length-1],
  reference: snippetObj.reference
  }
  */
  var snippetUpdateData = await validateSnippetsOnFiles(snippetData, trackedFiles, repoDiskPath, repoId, worker);

  // Can we just do a bulk update on all of the snippets? We don't ever actually create or delete a snippet
  // Update these fields:
  /*
    code: {type: [String], required: true},
    start: {type: Number, required: true},
    status: {type: String, required: true, enum: ['VALID', 'NEW_REGION','INVALID'], default: 'VALID'},
  */

  const bulkSnippetUpdateOps = snippetUpdateData.map(snippetObj => ({
        
    updateOne: {
            filter: { _id: snippetObj._id },
            // Where field is the field you want to update
            update: { $set: { status: snippetObj.status, code: snipeptObj.code, start: snippetObj.start } },
            upsert: false
    }
  }));

  if (bulkSnippetUpdateOps.length > 0) {
    try {
        const updateResults = await Snippet.collection.bulkWrite(bulkSnippetUpdateOps);
        worker.send({action: 'log', info: {level: 'debug',
                                            message: `Update results for bulk update on Snippets on repository: ${repoId}\n${updateResults}`,
                                            source: 'worker-instance', function:'runSnippetValidation'}})
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                errorDescription: `Error updatings Snippets on repository: ${repoId}`,
                                                source: 'worker-instance', function: 'runSnippetValidation'}});
        throw new Error(`Error updatings Snippets on repository: ${repoId}`);
    }
  }

}

module.exports = {
  runSnippetValidation
}
