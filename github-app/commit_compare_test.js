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

// We will 

var https = require('https')

const fs = require('fs');

const axios = require('axios');

const fs_promises = require('fs').promises;

var client = axios.create({
  baseURL: "http://localhost:3001/api"
});


require('dotenv').config();
const { exec, execFile } = require('child_process');

var head_commit = '7774441eb5e8bfaa8c151b2bc3a4f7e72ddc6ce5';
var repo_commit = '3a64c575cca6ed3e90bf6464ccc4f5a8814c9693';

const getRepositoryResponse = client.post('/repositories/retrieve', {
    link: 'kgodara/snippet-logic-test/'
  }).then( (response) => {
    console.log('Fetched Repo: ');
    // console.log(response.data);
  }
  );

const runFileCheck = async (fileObj, snippetData) => {
  console.log('runFile Check received fileObj: ');
  console.log(fileObj);
  if (fileObj.deleted) {
    snippetData = snippetData.map ( (obj) => {
      obj.stillValid = false;
      return obj;
    });
    return false
  }
  const data = await fs_promises.readFile('../../snippet-logic-test/' + fileObj.ref, 'utf8');
  var lines = data.toString().split('\n');
  for (i = 0; i < snippetData.length; i++) {
    var currentSnippet = snippetData[i];
    console.log('currentSnippet: ');
    console.log(currentSnippet);
    var stillValid = false;
  
    var snippetStartLine = currentSnippet.firstLine.replace(/\s+/g, '');
    var snippetEndLine = currentSnippet.endLine.replace(/\s+/g, '');
    console.log('lines length, idx, lines: ', lines.length, ' - ', currentSnippet.startLineNum, '\n', lines);
    if (snippetStartLine == lines[currentSnippet.startLineNum].replace(/\s+/g, '')) {
      if (snippetEndLine == lines[currentSnippet.startLineNum + currentSnippet.numLines-1].replace(/\s+/g, '')) {
        stillValid = true;
      }
    }

    snippetData[i].stillValid = stillValid;
  }
  return stillValid;
}


const beginSnippetValidation = async (snippetData, trackedFiles) => {
  // Intra-file section
  const validationResults = trackedFiles.map((currentFile) => {
    var relevantSnippets = snippetData.filter((snippetObj) => {
      console.log('Comparison: ' +  snippetObj.pathInRepository + ' - ' + currentFile.ref);
      return snippetObj.pathInRepository == currentFile.ref;
    });
      return runFileCheck(currentFile, relevantSnippets);
  });
  await Promise.all(validationResults).then((results) => {
    console.log('Validation Results: ');
    console.log(validationResults);
  });
  console.log('final SnippetData: ');
  console.log(snippetData);

}



// --name-status
const child = execFile('git', ['log', '-M', '--numstat', '--name-status', '--pretty=%H',
                              repo_commit + '..' + head_commit],
                              { cwd: '../../snippet-logic-test/' },
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

  var within_commit = '';
  var commit_objects = [];
  console.log('lines.length: ', lines.length);

  while( i < lines.length) {

    if (lines[i].length == 40) {
      // console.log('found commit hash');

      within_commit = lines[i];
      commit_objects.push({sha: lines[i], changes: []})
      i++;
    }

    else {
      if (lines[i].length > 1) { 
        // console.log('Appending to: ', commit_objects[commit_objects.length-1].sha);
        // console.log('Appending line: ', lines[i]);

        var lineData = lines[i].split("\t");
        // Operation type
        commit_objects[commit_objects.length-1].changes.push({operation: lineData[0], file_names:  lineData.slice(1)});

        // If the operation was a rename / move, there are two parameters left to add
        // commit_objects[commit_objects.length-1].file_names = lineData.slice(1);

        /*if (commit_objects[commit_objects.length-1].changes) {
          commit_objects[commit_objects.length-1].changes.push(lines[i].split('\t'));
        }
        else {
          commit_objects[commit_objects.length-1].changes = [];
          commit_objects[commit_objects.length-1].changes.push(lines[i].split('\t'));
        }*/
      }
    }

    i++;
  }
  // git log -M --name-status --numstat --pretty=%H e523b394a56c4507a5200a7294769ad33e66e295..646974ca9aa034f029fb0e419ab3467e6822bca4

  // Put commits in chronological order (earliest to latest)
  commit_objects = commit_objects.reverse();



  // console.log('commit_objects: ');
  // console.log(commit_objects);


  client.post('/snippets/retrieve', {
    location: 'kgodara/snippet-logic-test/master/'
  })
  .then(function (response) {
    // console.log(response.data);

    // List of each unique file with snippets attached
    // Strip out branch name
    var snippetData = response.data.map(snippet_obj => {
      return {pathInRepository: snippet_obj.pathInRepository.substr(snippet_obj.pathInRepository.indexOf("/")+1),
              _id: snippet_obj._id, startLineNum: snippet_obj.startLine, numLines: snippet_obj.code.length,
              firstLine: snippet_obj.code[0], endLine: snippet_obj.code[snippet_obj.code.length-1]        
            }
    });
    
    console.log('Snippets');
    console.log(response.data);
    
    snippetFiles = [...new Set(snippetData.map(snippetObj => snippetObj.pathInRepository))];

    var trackedFiles = [];

    for (i = 0; i < commit_objects.length; i++) {
      var commit = commit_objects[i];
      console.log('On Commit: ');
      console.log(commit);
      for (k = 0; k < commit.changes.length; k++) {

        var commit_changes = commit.changes[k];
        var commit_operation = commit.changes[k].operation;
        console.log('COMMIT OPERATION: ', commit_operation);
        var file_obj = trackedFiles.find( function( ele ) { 
          return ele.ref == commit_changes.file_names[0];
        });

        // If there is already a file object for this existing in trackedFiles, update the new_ref
        // Else: add file object: {old_ref: snippetFiles[x], ref: commit}
        if (commit_operation == 'R') {
          console.log('Rename Operation');
          if (commit_changes.file_names.length < 2) {
            throw new Error('Rename Operation with less than 2 names');
          }
          if (file_obj) {
            if (!(file_obj.deleted)) {
              // Update the file_obj with the new file name
              file_obj.ref = commit_changes.file_names[0];
              file_obj.sha = commit.sha;
            }
          }
          // Add a new object if the old file name is in snippetFiles
          // This is the case where the file is being referenced and renamed
          // for the first time in the commit log
          else {
            if (snippetFiles.includes(commit_changes.file_names[0])) {
              trackedFiles.push({old_ref: commit_changes.file_names[0], new_ref: commit_changes.file_names[1], sha: commit.sha, deleted: false});
            }
          }
        }
        // End of R Handling Section

        else {


          if (commit_operation == 'D') {
            console.log('Delete Operation');

            // We only care if a Snippet file has been deleted
            

            // Case: file is already being tracked
            if (file_obj) {
              file_obj.deleted = true;
            }
            // What do we do if this is the only commit referencing the file
            // Idea: Add a file_obj to trackedFiles with status: 'DELETED'
            else if (snippetFiles.includes(commit_changes.file_names[0])) {
              trackedFiles.push({ref: commit_changes.file_names[0], deleted: true, sha: commit.sha});
            }

          }

          else if (commit_operation == 'M' || commit_operation == 'A') {
              console.log('Add File / Modify File Operation ');
            if (!(file_obj)) {
              if (snippetFiles.includes(commit_changes.file_names[0])) {
                trackedFiles.push({ref: commit_changes.file_names[0], deleted: false, sha: commit.sha});
              }
            }

            else {
              file_obj.sha = commit.sha;
            }

          }

        }
      }
    }

    // Now we have the list of tracked files, {ref: path, sha: (commit), deleted: bool}
    console.log('Tracked Files');
    console.log(trackedFiles);
    beginSnippetValidation(snippetData, trackedFiles);

    
  })
  .catch(function (error) {
    console.log(error);
  });

});
/*child.stdout.on('data', (data) => {
  console.log(`child stdout:\n${data}`);
});

child.stderr.on('data', (data) => {
  console.error(`child stderr:\n${data}`);
});*/
