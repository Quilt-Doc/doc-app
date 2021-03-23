
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const { checkValid } = require('../../utils/utils');

const { simpleNewSnippetRegion, findNewSnippetRegion } = require("../../utils/snippet_utils");

const InsertHunk = require("../../models/InsertHunk");

const PullRequest = require("../../models/PullRequest");
const Commit = require("../../models/Commit");

const Association = require("../../models/associations/Association");

const Sentry = require("@sentry/node");

// [ { insertHunkId: "EEE" pullRequestNumber: "EEE", commitSha: "EEE" } ]
const getPullRequestsFromHunks = async (repositoryId, hunkList) => {
    var pullRequestsToFetch = hunkList.filter(hunkObj => hunkObj.pullRequestNumber);


    if (pullRequestsToFetch.length < 1) {
        return [];
    }

    var fetchedPRs;

    try {
        fetchedPRs = await PullRequest.find({ repository: repositoryId, number:  { $in: pullRequestsToFetch.map(obj => obj.pullRequestNumber) } }).lean().exec();
    }
    catch (err) {
        console.log(err);
        throw err;
    }

    return fetchedPRs;
}

const getPullRequestToHunkMapping = async (hunkList, prList) => {

    var prToHunkMapping = {};

    var prHunkList = hunkList.filter(hunkObj => hunkObj.pullRequestNumber);

    prList.map(prObj => {

        // Find indexes of all hunkObjs whose pullRequestNumber match prObj.number
        var matchingHunks = prHunkList.filter(hunkObj => hunkObj.pullRequestNumber == prObj.number);

        var startEndRangeList = matchingHunks.map(hunkObj => {
            return { start: hunkObj.regionStartLine, end: hunkObj.regionLength + hunkObj.regionStartLine };
        });

        // Add to mapping
        prToHunkMapping[prObj._id.toString()] = startEndRangeList;
    });

    return prToHunkMapping;

}

const getCommitsFromHunks = async (repositoryId, hunkList) => {
    var commitsToFetch = hunkList.filter(hunkObj => hunkObj.commitSha);


    if (commitsToFetch.length < 1) {
        return [];
    }

    var fetchedCommits;

    try {
        fetchedCommits = await Commit.find({ repository: repositoryId, sha:  { $in: commitsToFetch.map(obj => obj.commitSha) } }).lean().exec();
    }
    catch (err) {
        console.log(err);
        throw err;
    }

    return fetchedCommits;
}

const getCommitToHunkMapping = (hunkList, commitList) => {

    var commitToHunkMapping = {};

    var commitHunkList = hunkList.filter(hunkObj => hunkObj.commitSha);

    commitList.map(commitObj => {

        // Find indexes of all hunkObjs whose commitSha match commitObj.sha
        var matchingHunks = commitHunkList.filter(hunkObj => hunkObj.commitSha == commitObj.sha);

        var startEndRangeList = matchingHunks.map(hunkObj => {
            return { start: hunkObj.regionStartLine, end: hunkObj.regionLength + hunkObj.regionStartLine };
        });

        // Add to mapping
        commitToHunkMapping[commitObj._id.toString()] = startEndRangeList;
    });

    return commitToHunkMapping;

}

// Fetch all Associations from Code Objects return [{ associationObjectId, codeObjectId }]
const getAllAssociationsFromCodeObjects = async (repositoryId, codeObjectIdList) => {

    var relevantAssociations;

    console.log("getAllAssociationsFromCodeObjects - querying for relevantAssociations with codeObjectIdList: ");
    console.log(codeObjectIdList);
    try {
        relevantAssociations = await Association.find({ $and:[ {repository: repositoryId,}, { $or: [ { firstElement: codeObjectIdList }, { secondElement: codeObjectIdList } ] } ] },
                                                        '_id firstElementModelType firstElement secondElementModelType secondElement')
                                                .lean()
                                                .exec();
    }
    catch (err) {
        console.log(err);
        throw err;
    }

    console.log("getAllAssociationsFromCodeObjects - relevantAssociations: ");
    console.log(relevantAssociations);

    relevantAssociations = relevantAssociations.map(associationObj => {
        if (firstElementModelType == 'PullRequest' || firstElementModelType == 'Commit') {
            return { associationObjectId: associationObj._id.toString(), codeObjectId: associationObj.firstElement.toString() };
        }
        else {
            return { associationObjectId: associationObj._id.toString(), codeObjectId: associationObj.secondElement.toString() };
        }
    });

    return relevantAssociations;

}

const sort = async () => {

}
// associationCodeObjectIdPairs - { associationObjectId: , codeObjectId:  }
const mapAssociationObjectsToRanges = (associationCodeObjectIdPairs, idToAllHunkRangeMapping) => {

    var associationObjectsToRanges = {};


    associationCodeObjectIdPairs.map(pairObj => {
        if (associationObjectsToRanges.hasOwnProperty(pairObj.associationObjectId)) {
            associationObjectsToRanges[pairObj.associationObjectId] = associationObjectsToRanges[pairObj.associationObjectId].concat(idToAllHunkRangeMapping[pairObj.codeObjectId]);
        }
        else {
            associationObjectsToRanges[pairObj.associationObjectId] = associationObjectsToRanges[pairObj.associationObjectId].concat(idToAllHunkRangeMapping[pairObj.codeObjectId]);
        }
    });



    return Object.assign(idToAllHunkRangeMapping, associationObjectsToRanges);

}

// const getAssociationsFromCodeObjects = 


const getBlamesForFile = async (req, res) => {

    // const workspaceId = req.workspaceObj._id.toString();
    const repositoryId = req.repositoryObj._id.toString();

    const { filePath, fileContents } = req.body;

    if (!checkValid(filePath)) return res.json({success: false, error: "getBlamesForFile Error: filePath not provided"});
    if (!checkValid(fileContents)) return res.json({success: false, error: "getBlamesForFile Error: fileContents not provided"});

    // Fetch all InsertHunks associated with this filePath and repositoryId
    var allInsertHunks;

    console.log("repositoryId: ");
    console.log(repositoryId);

    try {
        allInsertHunks = await InsertHunk.find({ repository: repositoryId, filePath: filePath }).lean().exec();
    }
    catch (err) {
        Sentry.setContext("getBlamesForFile", {
            message: `Failed to fetch InsertHunks'`,
            repositoryId: repositoryId,
            filePath: filePath,
        });

        Sentry.captureException(err);

        console.log(err);

        return res.json({success: false, err: `Failed to fetch InsertHunks - repositoryId, filePath: ${repositoryId}, ${filePath}`});
    }

    console.log("allInsertHunks.length: ");
    console.log(allInsertHunks.length);

    // Run "simpleNewSnippetRegion" for each InsertHunk
    var findNewSnippetResults = allInsertHunks.map((insertHunkObj, idx) => {
        var startLine = insertHunkObj.lineStart;
        var numLines = insertHunkObj.lines.length;
        var hunkSize = insertHunkObj.lines.length;
        var hunkCode = insertHunkObj.lines;

        // return findNewSnippetRegion(startLine, numLines, hunkSize, hunkCode, decodeURIComponent(fileContents));
        return simpleNewSnippetRegion(startLine, insertHunkObj._id.toString(), insertHunkObj.commitSha,
                                        insertHunkObj.pullRequestNumber, hunkSize,
                                        hunkCode, decodeURIComponent(fileContents)
                                    );
    });

    console.log("findNewSnippetResults: ");
    console.log(findNewSnippetResults);

    // For all InsertHunks for which new regions have been found, fetch associated Commits and PullRequests
    var relevantHunks = findNewSnippetResults.filter(result => result.newRegionFound == true);

    var idToAllHunkRangeMapping = {};


    // Fetch Commits associated with relevantHunks
    var relevantCommits;
    try {
        relevantCommits = await getCommitsFromHunks(repositoryId, relevantHunks);
    }
    catch (err) {
        Sentry.setContext("getBlamesForFile", {
            message: `Failed to get Commits for InsertHunks'`,
            repositoryId: repositoryId,
            filePath: filePath,
        });

        Sentry.captureException(err);

        console.log(err);

        return res.json({success: false, err: `Failed to get Commits for InsertHunks - repositoryId, filePath: ${repositoryId}, ${filePath}`});
    }

    // Create commitToHunkMapping
    Object.assign(idToAllHunkRangeMapping, getCommitToHunkMapping(relevantHunks, relevantCommits));



    // Fetch PRs associated with relevantHunks
    var relevantPRs;
    try {
        relevantPRs = await getPullRequestsFromHunks(repositoryId, relevantHunks);
    }
    catch (err) {
        Sentry.setContext("getBlamesForFile", {
            message: `Failed to get PullRequests for InsertHunks`,
            repositoryId: repositoryId,
            filePath: filePath,
        });

        Sentry.captureException(err);

        console.log(err);

        return res.json({success: false, err: `Failed to get PullRequests for InsertHunks - repositoryId, filePath: ${repositoryId}, ${filePath}`});
    }

    // Create prToHunkMapping
    Object.assign(idToAllHunkRangeMapping, getPullRequestToHunkMapping(relevantHunks, relevantPRs));




    // Acquire issue/docid to blame mappings


    // Get association <-> Code Object id pairs
    var associationCodeObjectIdPairs;
    try {
        associationCodeObjectIdPairs = await getAllAssociationsFromCodeObjects(repositoryId, Object.keys(idToAllHunkRangeMapping));
    }
    catch (err) {
        Sentry.setContext("getBlamesForFile", {
            message: `Failed to get Association<->Code Object id pairs for InsertHunks`,
            repositoryId: repositoryId,
            filePath: filePath,
            numCodeObjects: Object.keys(idToAllHunkRangeMapping).length,
        });

        Sentry.captureException(err);

        console.log(err);

        return res.json({success: false, err: `Failed to get Association<->Code Object id pairs for InsertHunks - repositoryId, filePath: ${repositoryId}, ${filePath}`});
    }

    console.log("associationCodeObjectIdPairs: ");
    console.log(associationCodeObjectIdPairs);

    try {
        idToAllHunkRangeMapping = mapAssociationObjectsToRanges(associationCodeObjectIdPairs, idToAllHunkRangeMapping);
    }
    catch (err) {
        Sentry.setContext("getBlamesForFile", {
            message: `mapAssociationObjectsToRanges failed`,
            repositoryId: repositoryId,
            filePath: filePath,
            numAssociationObjects: associationCodeObjectIdPairs.length,
        });

        Sentry.captureException(err);

        console.log(err);

        return res.json({success: false, err: `mapAssociationObjectsToRanges failed - repositoryId, filePath: ${repositoryId}, ${filePath}`});
    }





    console.log('idToAllHunkRangeMapping: ');
    console.log(idToAllHunkRangeMapping);


    return res.json({ blameChunks: [], contextBlames: idToAllHunkRangeMapping });

}

module.exports = {
    getBlamesForFile,
}