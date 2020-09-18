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

const fs = require('fs');

const api = require('./apis/api').requestBackendClient();

const fs_promises = require('fs').promises;

const { findNewSnippetRegion } = require('./validator');

const { getRepositoryObject, parseCommitObjects, getTrackedFiles } = require('./utils/validate_utils');

const SNIPPET_STATUS_INVALID = 'INVALID';
const SNIPPET_STATUS_NEW_REGION = 'NEW_REGION';
const SNIPPET_STATUS_VALID = 'VALID';

/*var client = axios.create({
  baseURL: "http://localhost:3001/api"
});*/


require('dotenv').config();
const { exec, execFile, spawnSync } = require('child_process');

const runValidation = async () => {
  var timestamp = Date.now().toString();    
  var repoDiskPath = 'git_repos/' + timestamp +'/';
  const gitClone = spawnSync('git', ['clone', process.env.cloneUrl, repoDiskPath]);

  // Testing Values:
  // var head_commit = '7774441eb5e8bfaa8c151b2bc3a4f7e72ddc6ce5';
  // var repo_commit = '3a64c575cca6ed3e90bf6464ccc4f5a8814c9693';

  var repoObj = await getRepositoryObject(process.env.installationId, process.env.process.env.repositoryFullName);

  var repoId = repoObj._id;
  var repoCommit = repoObj.lastProcessedCommit;

  headCommit = process.env.headCommit;

  const child = execFile('git', ['log', '-M', '--numstat', '--name-status', '--pretty=%H',
    repoCommit + '..' + headCommit],
    { cwd: './' + repoDiskPath },
  (error, stdout, stderr) => {
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


    api.post('/snippets/retrieve', {
      repository: repoId,
//      pathInRepository: 'post_commit.py'
    })
    .then(function (response) {
      console.log(response.data);

    // List of each unique file with snippets attached
    // Strip out branch name
    var snippetData = response.data.map(snippetObj => {
    return {pathInRepository: snippetObj.pathInRepository.substr(snippetObj.pathInRepository.indexOf("/")+1),
    _id: snippetObj._id, startLineNum: snippetObj.startLine, numLines: snippetObj.code.length,
    firstLine: snippetObj.code[0], endLine: snippetObj.code[snippetObj.code.length-1]        
    }
    });

    console.log('Snippets');
    console.log(response.data);

    // Get list of distinct files our snippets are attached to
    snippetFiles = [...new Set(snippetData.map(snippetObj => snippetObj.pathInRepository))];

    // Iterate through commits and get the state of snippet files at the end
    var trackedFiles = getTrackedFiles(commitObjects, snippetFiles);

    // Now we have the list of tracked files, {ref: path, sha: (commit), deleted: bool}
    console.log('Tracked Files');
    console.log(trackedFiles);
    beginSnippetValidation(snippetData, trackedFiles, repoDiskPath);


    })
    .catch(function (error) {
      console.log(error);
    });

  });

}


const beginSnippetValidation = async (snippetData, trackedFiles, repoDiskPath) => {
  // Intra-file section
  const validationResults = trackedFiles.map((currentFile) => {
    var relevantSnippets = snippetData.filter((snippetObj) => {
      console.log('Comparison: ' +  snippetObj.pathInRepository + ' - ' + currentFile.ref);
      return snippetObj.pathInRepository == currentFile.ref;
    });
      return fileContentValidation(currentFile, relevantSnippets, repoDiskPath);
  });
  await Promise.all(validationResults).then((results) => {
    console.log('Validation Results: ');
    console.log(results);
  });
  console.log('final SnippetData: ');
  console.log(snippetData);

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
    return false
  }
  const data = await fs_promises.readFile('./' + repoDiskPath + fileObj.ref, 'utf8');

  var lines = data.toString().split('\n');


  // Section Start: Find Snippets whose start & end haven't moved
  for (i = 0; i < snippetData.length; i++) {
    var currentSnippet = snippetData[i];
    console.log('currentSnippet: ');
    console.log(currentSnippet);
    var status = SNIPPET_STATUS_INVALID;
  
    var snippetStartLine = currentSnippet.firstLine.replace(/\s+/g, '');
    var snippetEndLine = currentSnippet.endLine.replace(/\s+/g, '');
    console.log('lines length, idx, lines: ', lines.length, ' - ', currentSnippet.startLineNum, '\n', lines);
    if (snippetStartLine == lines[currentSnippet.startLineNum].replace(/\s+/g, '')) {
      if (snippetEndLine == lines[currentSnippet.startLineNum + currentSnippet.numLines-1].replace(/\s+/g, '')) {
        status = SNIPPET_STATUS_VALID;
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
  var snippetsToMove = snippetData.filter(snippetObj => !snippetObj.status);
  for (i = 0; i < snippetsToMove.length; i++) {
    // {startLine: finalResult.idx, numLines: finalResult.size, status: 'NEW_REGION'}
    snippetsToMove[i] = findNewSnippetRegion(snippetsToMove[i], lines);
  }

  console.log('snippetsToMove: ');
  console.log(snippetsToMove);

}

module.exports = {
    runValidation
}