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

const { getRepositoryObject, parseCommitObjects, getFileChangeList } = require('./utils/validate_utils');


const tokenUtils = require('./utils/token_utils');

require('dotenv').config();
const { exec, execFile, spawnSync } = require('child_process');

const constants = require('./constants/index');

const Snippet = require('./models/Snippet');


// TODO: Verify that the same array is always being created.
// This is NOT the case currently, filter returns a new array
const validateSnippetsOnFiles = async (snippetData, trackedFiles, repoDiskPath) => {
  // Intra-file section
  const validationResults = trackedFiles.map((currentFile) => {
    var relevantSnippets = snippetData.filter((snippetObj) => {
      console.log('Comparison: ' +  snippetObj.pathInRepository + ' - ' + currentFile.ref);
      return snippetObj.pathInRepository == currentFile.ref;
    });
      return fileContentValidation(currentFile, relevantSnippets, repoDiskPath);
  });
  var results = await Promise.all(validationResults);
  var snippetUpdateData = [].concat(...results);
  console.log('final SnippetData: ');
  console.log(snippetUpdateData);
  return snippetUpdateData;
}

// Check if start and end lines in same place, snippet automatically valid
const fileContentValidation = async (fileObj, snippetData, repoDiskPath) => {
  console.log('fileContentValidation received fileObj: ');
  console.log(fileObj);
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
    console.log('currentSnippet: ');
    console.log(currentSnippet);
    var status = constants.snippets.SNIPPET_STATUS_INVALID;
  
    var snippetStartLine = currentSnippet.firstLine.replace(/\s+/g, '');
    var snippetEndLine = currentSnippet.endLine.replace(/\s+/g, '');
    console.log('lines length, idx, lines: ', lines.length, ' - ', currentSnippet.startLineNum, '\n', lines);
  
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
  
  /*
{pathInRepository: snippetObj.pathInRepository.substr(snippetObj.pathInRepository.indexOf("/")+1),
    _id: snippetObj._id, startLineNum: snippetObj.startLine, numLines: snippetObj.code.length,
    firstLine: snippetObj.code[0], endLine: snippetObj.code[snippetObj.code.length-1]        
    }
  */

  // Look for new regions for snippets that haven't been successfully validated
  // var snippetsToMove = snippetData.filter(snippetObj => snippetObj.status == SNIPPET_STATUS_INVALID);
  
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


const runValidation = async (installationId, repoDiskPath, repoObj, headCommit) => {

  var installToken = await tokenUtils.getInstallToken(process.env.installationId);

  // Needed Parameters:
  // ----------------------
  // repository fullName
  // repository cloneUrl
  // Head commit
  // Base commit
  // Github API Client

  var repoId = repoObj._id;
  var repoCommit = repoObj.lastProcessedCommit;

  const child = execFile('git', ['log', '-M', '--numstat', '--name-status', '--pretty=%H',
    repoCommit + '..' + headCommit],
    { cwd: './' + repoDiskPath },
    async (error, stdout, stderr) => {
    console.log('stdout: ');
    console.log(stdout.toString());
    // Output starts with the latest commit and goes back in time
    var lines = stdout.split("\n");
    var i = 0;

    // What we want to parse out:
    // A list of commit objects in chronological (earliest -> latest) order
    // Each of these commit objects containing a fileChange object Array
    // Each file_change object Array contains file modified as well as the type of modification
    var commitObjects = parseCommitObjects(lines);


    // console.log('commitObjects: ');
    // console.log(commitObjects);

    var repoReferences = await Reference.find({repository: repoId, kind: "file", status: "valid"});
    
    repoReferences = repoReferences.data.map(referenceObj => {
      return referenceObj._id.toString();
    });


    // TODO: We have to get all Snippets attached to this repository and validate them all, not by workspace
    var response = await Snippet.find({_id: {$in: repoReferences}, repository: repoId});

    // List of each unique file with snippets attached
    // Strip out branch name
    var snippetData = response.map(snippetObj => {
    return { _id: snippetObj._id.toString(), startLineNum: snippetObj.start, numLines: snippetObj.code.length,
             firstLine: snippetObj.code[0], endLine: snippetObj.code[snippetObj.code.length-1],
             reference: snippetObj.reference        
          }
    });

    // Get Snippet file paths and match them to Snippet
    var snippetReferences = [...new Set(snippetData.map(snippetObj => snippetObj.reference.toString()))];

    snippetReferences = await Reference.find({_id: {$in: snippetReferences}});

    console.log('Snippets');
    console.log(response);

    snippetData = snippetData.map(snippetObj => {
      var refIdx = snippetReferences.findIndex(refObj => refObj._id.toString() == snippetObj.toString());
      snippetObj.pathInRepository = snippetReferences[refIdx].path;
    });

    // Get list of distinct files our snippets are attached to
    snippetFiles = [...new Set(snippetData.map(snippetObj => snippetObj.pathInRepository))];

    // Iterate through commits and get the state of snippet files at the end
    var trackedFiles = getFileChangeList(commitObjects);

    // TODO: Filter trackedFiles by snippetFiles, use oldRef for filtering
    trackedFiles = trackedFiles.filter(fileObj => snippetFiles.includes(fileObj.oldRef));

    // Now we have the list of tracked files, {ref: path, oldRef (optional), sha: (commit), deleted: bool}
    console.log('Tracked Files');
    console.log(trackedFiles);

    // Update snippet pathInRepository if it's file has moved
    for(i = 0; i < trackedFiles.length; i++) {
      if (trackedFiles[i].oldRef) {
        snippetData = snippetData.map(snippetObj => {
          if (snippetObj.pathInRepository == trackedFiles[i].oldRef) {
            console.log('Update file from ', snippetObj.pathInRepository, ' to ', trackedFiles[i].ref);
            snippetObj.pathInRepository = trackedFiles[i].ref;
          }
          return snippetObj;
        });
      }
    }
    // TODO: Update Snippets in DB
    var snippetUpdateData = validateSnippetsOnFiles(snippetData, trackedFiles, repoDiskPath);



  });

}

module.exports = {
    runValidation
}
