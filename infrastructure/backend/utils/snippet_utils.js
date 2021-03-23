const  { diff_match_patch }  = require('../lib/diff_match_patch');
var dmp = new diff_match_patch();

// Input Needed: Snippet Obj, File Content (Raw String), repository last_processed_commit (?? We don't need this here), 

// TODO - Make sure that only first 3-4 lines of snippets can create a new snippet candidate region
// TODO - Don't search the whole file for the new snippet regions, instead search some factor of `windowSize` around old region


const constants = require('../constants/index');
const { file } = require('googleapis/build/src/apis/file');

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


// Returns in format:
/*
{
  startLineNum: finalResult.idx;
  numLines: finalResult.size;
  status: constants.snippets.SNIPPET_STATUS_VALID;
  code: = [];
}
*/
const findNewSnippetRegion = (startLine, numLines, hunkSize, hunkCode, fileContents) => {
  // var snippetObj = {startLine: 2, numLines: 5, originalSize, originalCode, code: ['test1();', 'test2();', 'test3();', 'test4();', 'test5();']};
  var snippetCode = hunkCode.join('\n');


  // Replace all whitespace except `\n`
  snippetCode = snippetCode.replace(/[ \t\r]+/g,"");
  fileContents = fileContents.replace(/[ \t\r]+/g,"");

  // console.log(snippetCode);



  var line_versions = dmp.diff_linesToChars_(snippetCode, fileContents);

  console.log("line_versions.lineArray.length: ", line_versions.lineArray.length);

  console.log("line_versions.chars1.split('').length: ", line_versions.chars1.split('').length);

  console.log("line_versions.chars2.split('').length: ", line_versions.chars2.split('').length);


  var targetData = '';
  for (i = 0; i < line_versions.chars1.split('').length; i++) {
    targetData = targetData + line_versions.chars1[i];
  }

  console.log("targetData.split('').length: ");
  console.log(targetData.split('').length);

  // Convert fileContents to a list of { val: , idx:  }
  // val represents an integer which maps to a line,
  // idx represents the original line number of the line in the file
  var fileData = line_versions.chars2.split('').map((unicodeChar, index) => {
      if (targetData.includes(unicodeChar)) {
          return {val: ('' + unicodeChar).charCodeAt(0), idx: index};
      }
      return {val: -1, idx: -1};
  });

  var snippetSize = targetData.length; // [...targetData].length;

  console.log("snippetSize: ", snippetSize);

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

            // Is this '.val' conditional the issue? 
            // There's no guarantee that because the charCodeAt() is higher the line actually occurs later in the snippet,
            // e.g. targetData can be: 
            /*
                [
                    1, 117, 110, 100,
                101, 102, 105, 110,
                101, 100
                ]
            */
            // However 110 followed by 100 would not correctly be identified as an increasing subsequence
            // Question: Does it matter if the fileData line numbers are ordered? It shouldn't since they already have an index
            // Solution:
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

  console.log("windowMaxes.length: ", windowMaxes.length);
  console.log("Math.max(...windowMaxes): ", Math.max(...windowMaxes));


  // We did not find any increasing subsequences
  if (Math.max(...windowMaxes) < 2) {
    return { status: constants.snippets.SNIPPET_STATUS_INVALID };
  }

  var snippetCenterLine = ((startLine + numLines-1)/2);
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
    return { status: constants.snippets.SNIPPET_STATUS_INVALID };
  }

  // Get the region candidate with the best score
  var maxScoreIdx = getMaxCandidateScore(possibleRegions);

  // This is our selected new snippet
  var finalResult = possibleRegions[maxScoreIdx];

  [finalResult.size, finalResult.idx] = trimSnippet(targetData, fileData, finalResult, windowSize);

  // Create New Snippet Obj
  var newSnippet;
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

// Find SnippetRegion based purely on number of occurrences of unique lines from hunk within file region
// Return in format: { insertHunkId: insertHunkId, newRegionFound: Bool, regionStartLine: Number, regionLength: Number }
const simpleNewSnippetRegion = (startLine, insertHunkId, commitSha, pullRequestNumber, hunkSize, hunkCode, fileContents) => {

    const HUNK_EXPANSION_FACTOR = 1.5;
    const HUNK_WINDOW_SEARCH_FACTOR = 1.5;

    var depthPrint = false;

    if (hunkCode[0] == 'print("RAW 2")') {
        depthPrint = true;
    }


    hunkCode = hunkCode.join('\n');


    // Replace all whitespace except `\n`
    hunkCode = hunkCode.replace(/[ \t\r]+/g,"").split("\n");
    hunkCode = hunkCode.filter(line => line.length > 0);

    fileContents = fileContents.replace(/[ \t\r]+/g,"").split("\n");

    if (depthPrint) {

        console.log("hunkCode: ");
        console.log(hunkCode);

        console.log(`fileContents.slice(160,fileContents.length): `);
        console.log(fileContents.slice(160,fileContents.length));
    }


    var windowSize = Math.round((hunkSize * HUNK_EXPANSION_FACTOR));

    // Make sure windowSize not bigger than file length
    windowSize = windowSize > fileContents.length ? fileContents.length : windowSize;

    // console.log('hunkCode: ');
    // console.log(hunkCode);
    console.log('hunkSize: ', hunkSize);
    console.log('windowSize: ', windowSize);

    // Set windowStart to
    var searchRangeStart = startLine - Math.round( hunkSize * HUNK_WINDOW_SEARCH_FACTOR );
    searchRangeStart = searchRangeStart > 0 ? searchRangeStart : 0;

    var searchRangeEnd = startLine + hunkSize + Math.round( hunkSize * HUNK_WINDOW_SEARCH_FACTOR );
    searchRangeEnd = searchRangeEnd < fileContents.length ? searchRangeEnd : fileContents.length

    var windowStart;

    var regionScores = [];

    // Sliding-windows across searchRange on fileData

    console.log(`searchRangeStart: ${searchRangeStart}`);
    console.log(`searchRangeEnd: ${searchRangeEnd}`);

    for (windowStart = searchRangeStart; (windowStart+windowSize) < searchRangeEnd; windowStart++) {

        var line_presence_dict = {};
        hunkCode.map(lineNum => {
            if (!line_presence_dict.hasOwnProperty(lineNum)) {
                line_presence_dict[lineNum] = 1;
            }
            else {
                line_presence_dict[lineNum] += 1;
            }
        });


        // Generate region scores for each window across searchRange
        var i;
        var regionScoreNum = 0;
        /*
        console.log(`Checking line range ${windowStart} - ${(windowStart+windowSize)}`);

        console.log("Searching for: ");
        console.log(hunkCode);

        console.log("Within Window: ");
        console.log(fileContents.slice(windowStart, (windowStart+windowSize+1)));
        */

        for(i = windowStart; i <= (windowStart+windowSize); i++) {
            var currentLine = fileContents[i];
            if (line_presence_dict.hasOwnProperty(currentLine)) {
                if (line_presence_dict[currentLine] > 0) {
                    regionScoreNum += 1;
                    line_presence_dict[currentLine] -= 1;
                }
            }
            else {
                continue;
            }
        }
        regionScores.push(regionScoreNum);
    }

    console.log(regionScores);

    var regionStartLine;
    var regionLength;

    // Karan TODO: Improve this to use a percentage of original snippet size
    if (regionScores.length < 1 || Math.max(...regionScores) < 1) {
        return { insertHunkId: insertHunkId, newRegionFound: false };
    }

    var maxScore = 0;
    regionScores.map( ( score, idx ) => {
        if (score > maxScore) {
            maxScore = score;
            regionStartLine = windowStart + idx;
        }
    });

    return { insertHunkId: insertHunkId, commitSha: commitSha,
            pullRequestNumber: pullRequestNumber, newRegionFound: true,
            regionStartLine: regionStartLine, regionLength: windowSize, };

}


module.exports = { simpleNewSnippetRegion,
                   findNewSnippetRegion };



// Now I want to get the correct alignment for the window around these increasing segments which maximizes the amount of snippet lines in the window
// ^^ We shouldn't have to do this because if there is a better alignment at the snippet max, then it will be represented in our array as a separate element
