// Parse individual commit objects from `git log` output
const parseCommitObjects = (logLines) => {
    var within_commit = '';
    var commitObjects = [];
    console.log('logLines.length: ', logLines.length);

    var i = 0;

    while( i < logLines.length) {
  
      if (logLines[i].length == 40) {
        // console.log('found commit hash');
  
        within_commit = logLines[i];
        commitObjects.push({sha: logLines[i], changes: []})
        i++;
      }
  
      else {
        if (logLines[i].length > 1) { 
          // console.log('Appending to: ', commitObjects[commitObjects.length-1].sha);
          // console.log('Appending line: ', logLines[i]);
  
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






  const getTrackedFiles = (commitObjects, snippetFiles) => {
    for (i = 0; i < commitObjects.length; i++) {
      var commit = commitObjects[i];
      console.log('On Commit: ');
      console.log(commit);
      // console.log(commit.fileNames);

      var trackedFiles = [];
        
      for (k = 0; k < commit.changes.length; k++) {
  
        var commitChanges = commit.changes[k];
        var commitOperation = commit.changes[k].operation;
        console.log('COMMIT OPERATION: ', commitOperation);
        var fileObj = trackedFiles.find( function( ele ) { 
          return ele.ref == commitChanges.fileNames[0];
        });
  
        // If there is already a file object for this existing in trackedFiles, update the ref
        // Else: add file object: {oldRef: snippetFiles[x], ref: commit}
        if (commitOperation == 'R') {
          console.log('Rename Operation');
          if (commitChanges.fileNames.length < 2) {
            throw new Error('Rename Operation with less than 2 names');
          }
          if (fileObj) {
            if (!(fileObj.deleted)) {
              // Update the fileObj with the new file name
              fileObj.ref = commitChanges.fileNames[0];
              fileObj.sha = commit.sha;
            }
          }
          // Add a new object if the old file name is in snippetFiles
          // This is the case where the file is being referenced and renamed
          // for the first time in the commit log
          else {
            if (snippetFiles.includes(commitChanges.fileNames[0])) {
              trackedFiles.push({oldRef: commitChanges.fileNames[0], ref: commitChanges.fileNames[1], sha: commit.sha, deleted: false});
            }
          }
        }
        // End of R Handling Section
  
        else {
  
  
          if (commitOperation == 'D') {
            console.log('Delete Operation');
  
            // We only care if a Snippet file has been deleted
            
  
            // Case: file is already being tracked
            if (fileObj) {
              fileObj.deleted = true;
            }
            // What do we do if this is the only commit referencing the file
            // Idea: Add a fileObj to trackedFiles with status: 'DELETED'
            else if (snippetFiles.includes(commitChanges.fileNames[0])) {
              trackedFiles.push({ref: commitChanges.fileNames[0], deleted: true, sha: commit.sha});
            }
  
          }
  
          else if (commitOperation == 'M' || commitOperation == 'A') {
              console.log('Add File / Modify File Operation ');
            if (!(fileObj)) {
              if (snippetFiles.includes(commitChanges.fileNames[0])) {
                trackedFiles.push({ref: commitChanges.fileNames[0], deleted: false, sha: commit.sha});
              }
            }
  
            else {
              fileObj.sha = commit.sha;
            }
  
          }
  
        }
      }
    }
  
    return trackedFiles;
  }

module.exports = { parseCommitObjects, getTrackedFiles };