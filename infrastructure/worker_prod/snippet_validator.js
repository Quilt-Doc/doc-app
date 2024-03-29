const  { diff_match_patch }  = require('./lib/diff_match_patch');
var dmp = new diff_match_patch();

// Input Needed: Snippet Obj, File Content (Raw String), repository last_processed_commit (?? We don't need this here), 

// TODO - Make sure that only first 3-4 lines of snippets can create a new snippet candidate region
// TODO - Don't search the whole file for the new snippet regions, instead search some factor of `windowSize` around old region


const constants = require('./constants/index');

// fileData: new fileContents, finalResult: final selected snippet region, windowSize: size of max snippet range
const trimSnippet = (targetData, fileData, finalResult, windowSize) => {
  // Now we will trim it on both sides so the range starts and ends with code from original snippet

  var newSize = 0;
  var newIdx = finalResult.idx;
  // Trim from the front
  var frontTrim = 0;
  for(i = 0; i < windowSize; i++) {
    console.log('include index: ', i+newIdx);
    if (targetData.includes(fileData[i+newIdx].val)) {
      break;
    }
    else {
      frontTrim = frontTrim + 1;
    }
  }
  console.log('FrontTrim: ', frontTrim);
  newSize = windowSize - frontTrim;
  newIdx = newIdx + frontTrim;

  // Trim from the back
  var backTrim = 0;
  for(i = (windowSize-1-frontTrim); i >= 0; i--) {
    console.log('include index: ', i+newIdx);
    if (targetData.includes(fileData[i+newIdx].val)) {
      break;
    }
    else {
      backTrim = backTrim + 1;
    }
  }
  console.log('BackTrim: ', backTrim);
  newSize = newSize - backTrim;
  return [ newSize,  newIdx];
}

const getMaxCandidateScore = (possibleRegions) => {
    // Higher val & numLines is good, lower distance is good
    var candidateScores = possibleRegions.map(regionObj => (regionObj.val + regionObj.numLines + (1-regionObj.distance)) / 3);
    console.log('candidateScores: ');
    console.log(candidateScores);

    var maxScore = 0;
    var maxScoreIdx = 0;
    for(i = 0; i < candidateScores.length; i++) {
      if (i == 0) {
        maxScore = candidateScores[0];
      }
      else {
        if (candidateScores[i] > maxScore) {
          maxScore = candidateScores[i];
          maxScoreIdx = i;
        }
      }
    }
    return maxScoreIdx;
}



const findNewSnippetRegion = (snippetObj, fileContents) => {
  // var snippetObj = {startLine: 2, numLines: 5, originalSize, originalCode, code: ['test1();', 'test2();', 'test3();', 'test4();', 'test5();']};
  var snippetCode = snippetObj.originalCode.join('\n');


  // Replace all whitespace except `\n`
  snippetCode = snippetCode.replace(/[ \t\r]+/g,"");
  fileContents = fileContents.replace(/[ \t\r]+/g,"");



  var line_versions = dmp.diff_linesToChars_(snippetCode, fileContents);


  var targetData = '';
  for (i = 0; i < snippetObj.originalSize; i++) {
    targetData = targetData + line_versions.chars1[i];
  }

  fileData = line_versions.chars2.split('').map((unicodeChar, index) => {
      if (targetData.includes(unicodeChar)) {
          return {val: ('' + unicodeChar).charCodeAt(0), idx: index};
      }
      return {val: -1, idx: -1};
  });

  var snippetSize = targetData.length;

  // Convert targetData to number
  targetData = targetData.split('').map(value => ('' + value).charCodeAt(0));
  console.log('targetData: ');
  console.log(targetData);

  windowSize = Math.round((snippetSize * constants.snippets.SNIPPET_EXPANSION_FACTOR));

  // Make sure windowSize not bigger than file length
  windowSize = windowSize > fileData.length ? fileData.length : windowSize;

  console.log('windowSize: ', windowSize);

  var starterLines = targetData.slice(0, constants.snippets.NUM_VALID_SNIPPET_START_LINES);
  console.log('starterLines: ', starterLines);
  var windowMaxes = [];
  // This computes the LIS for every possible window of size `windowSize` within fileData
  for (windowStart = 0; (windowStart+windowSize) < fileData.length; windowStart++) {
    lis = new Array(windowSize);
    lis[0] = 1;
    for (i = windowStart+1; i < windowStart+windowSize; i++) {
        lis[i-windowStart] = 1;
        for (j = windowStart; j < i; j++) {
            // First two conditionals are standard LIS, third one is so that we don't count lines that are not part of the snippet
            if (fileData[i].val > fileData[j].val  && lis[i-windowStart] < lis[j-windowStart] + 1 && fileData[j].idx != -1) {

                // Can only start a new sequence if the previous element is one of the first three lines
                // Check if we are starting new sequence
                if (lis[j-windowStart] == 1) {
                  // Check if first element in sequence part of snippet start
                  // console.log('fileData[j]: ', fileData[j]);
                  if (starterLines.includes(fileData[j].val)) {
                    // console.log('I, J: ' + i + ', ' + j);
                    lis[i-windowStart] = lis[j-windowStart]+1;
                  }
                }
                else {
                  // console.log('ELSE CALLEd');
                  // console.log('I, J: ' + i + ', ' + j);
                  lis[i-windowStart] = lis[j-windowStart]+1;
                }
            }
        }
    }
    windowMaxes.push(Math.max(...lis));
  }


  // We did not find any increasing subsequences
  if (Math.max(...windowMaxes) < 2) {
    snippetObj.status = constants.snippets.SNIPPET_STATUS_INVALID;
    return snippetObj;
  }

  var snippetCenterLine = ((snippetObj.startLineNum + snippetObj.numLines-1)/2);
    // val: number of in order lines from original snippet - We normalize this by dividing by snippet length
    // idx: start location of proposed region
    // numLines: number of lines of original snippet present in the region - We normalize this by dividing by snippet length
    // distance: ratio of distance from original snippet center - We normalize this by dividing by snippet length

  // KARAN TODO: Why is distance alwyas NaN
  var possibleRegions = windowMaxes.map((value, index) => {
    if (value > (snippetSize * constants.snippets.SNIPPET_VALID_REGION_THRESHOLD)) {
      var regionLines = fileData.slice(index, index+windowSize);
      return {
        val: value / targetData.length,
        idx: index,
        numLines:
          regionLines.filter(function(item) {
            return targetData.includes(item.val);
          }).length / targetData.length,
        // KARAN TODO: This line is really sus, I don't think it's doing what the above comment says
        distance: ( Math.abs(snippetCenterLine-(index+windowSize-1)) / fileData.length)
      };
    }
  }).filter(x => x !== undefined);
  console.log('possibleRegions: ');
  console.log(possibleRegions);

  // There are no regions that meet threshold
  if (possibleRegions.length < 1) {
    snippetObj.status = constants.snippets.SNIPPET_STATUS_INVALID;
    return snippetObj;
  }

  // Get the region candidate with the best score
  var maxScoreIdx = getMaxCandidateScore(possibleRegions);

  // This is our selected new snippet
  var finalResult = possibleRegions[maxScoreIdx];

  [finalResult.size, finalResult.idx] = trimSnippet(targetData, fileData, finalResult, windowSize);

  // Create New Snippet Obj
  var newSnippet = snippetObj;
  newSnippet.startLineNum = finalResult.idx;
  newSnippet.numLines = finalResult.size;
  newSnippet.status = constants.snippets.SNIPPET_STATUS_VALID;
  newSnippet.code = [];
  var fileContentsLines = fileContents.split('\n');
  // KARAN TODO: Fix this so it is appending the actual file content, not the hashed lines
  for( i = newSnippet.startLineNum; i < newSnippet.numLines; i++ ) {
    newSnippet.code.push(fileContentsLines[i]);
  }
  console.log('Returning: ');

  console.log(newSnippet);

  return newSnippet;
}


module.exports = { findNewSnippetRegion };



// Now I want to get the correct alignment for the window around these increasing segments which maximizes the amount of snippet lines in the window
// ^^ We shouldn't have to do this because if there is a better alignment at the snippet max, then it will be represented in our array as a separate element
