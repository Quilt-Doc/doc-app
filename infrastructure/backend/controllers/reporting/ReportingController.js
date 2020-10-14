//models
const ActivityFeedItem = require('../../models/reporting/ActivityFeedItem');
const Document = require('../../models/Document');
const Reference = require('../../models/Reference');


//controllers
const ActivityFeedItemController = require('../../controllers/reporting/ActivityFeedItemController');
const UserStatsController = require('../../controllers/reporting/UserStatsController');

const jobs = require('../../apis/jobs');
const jobConstants = require('../../constants/index').jobs;

const logger = require('../../logging/index').logger;

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


retrieveBrokenDocuments = async (req, res) => {
    const { limit, skip } = req.body;
    const workspaceId = req.workspaceObj._id.toString();

    let query;

    query = Document.find({ workspace: workspaceId, status: {$in: ['invalid', 'resolve']} });

    query.populate('author');

    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));

    query.sort({breakDate: -1});

    var documents;
    try {
        documents = await query.exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                        errorDescription: 'Error executing query to retrieve broken documents', function: 'retrieveBrokenDocuments'});
        return res.json({success: false, error: err});
    }

    return res.json({success: true, result: documents});
}


handleDocumentCreate = async (userId, workspaceId, title, documentId) => {

    // Update UserStats.documentsCreatedNum (increase by 1)
    try {
        await UserStatsController.updateDocumentsCreatedNum({userUpdates: [{updateNum: 1, userId}], workspaceId});
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error updating documentsCreatedNum - userId, documentId, workspaceId: ${userId}, ${documentId}, ${workspaceId}`,
                            function: `handleDocumentCreate`});
        throw Error(`Error updating documentsCreatedNum - userId, documentId, workspaceId: ${userId}, ${documentId}, ${workspaceId}`);
    }

    // Create ActivityFeedItem
    try {
        await ActivityFeedItemController.createActivityFeedItem({type: 'create', date: Date.now(), userId, workspaceId, userUpdates: [{ documentId, title }]});
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error creating ActivityFeedItem - userId, documentId, workspaceId: ${userId}, ${documentId}, ${workspaceId}`,
                                function: `handleDocumentCreate`});
        throw Error(`Error creating ActivityFeedItem - userId, documentId, workspaceId: ${userId}, ${documentId}, ${workspaceId}`);
    }
    return true;
}



handleDocumentDelete = async (deletedDocumentInfo, workspaceId, repositoryId, userId) => {
        // Reporting Section ---------------------------------------------------------------
    // Update documentsCreatedNum by finding the number of Document's deleted per userId 
    var userUpdateNums = {};
    deletedDocumentInfo.forEach(infoObj => {
        userUpdateNums[infoObj.author.toString()] = (userUpdateNums[infoObj.author.toString()] || 0) + 1;
    });

    var userUpdateList = [];

    Object.keys(userUpdateNums).forEach(key => {
        userUpdateList.push({ userId: key, updateNum: userUpdateNums[key] });
    });

    // Update documentsCreatedNum for all User's whose documents have been deleted
    try {
        await UserStatsController.updateDocumentsCreatedNum({userUpdates: userUpdateList, workspaceId});
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error updating documentsCreatedNum - userId, deletedDocumentInfo.length, workspaceId: ${userId}, ${deletedDocumentInfo.length}, ${workspaceId}`,
                            function: `handleDocumentDelete`});
        throw Error(`Error updating documentsCreatedNum userUpdateList, workspaceId: ${userUpdateList}, ${workspaceId} \n ${err}`);
    }

    var activityFeedInfo = [];
    deletedDocumentInfo.forEach(infoObj => {
        activityFeedInfo.push({documentId: infoObj.author.toString(), title: infoObj.title});
    });

    // Update documentsBrokenNum for all User's whose invalid documents have been deleted

    var userBrokenDocumentNums = {};
    var userBrokenDocumentUpdateList = [];

    deletedDocumentInfo.filter(infoObj => infoObj.status == 'invalid')
                        .forEach(infoObj => {
                            userBrokenDocumentNums[infoObj.author.toString()] = (userBrokenDocumentNums[infoObj.author.toString()] || 0) + 1;
                        });
    Object.keys(userBrokenDocumentNums).forEach(key => {
        userBrokenDocumentUpdateList.push({ userId: key, updateNum: userUpdateNums[key] });
    });

    try {
        if (userBrokenDocumentUpdateList.length > 0) {
            await UserStatsController.updateDocumentsBrokenNum({userUpdates: userBrokenDocumentUpdateList, workspaceId});
        }
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error updating documentsBrokenNum - userId, userBrokenDocumentUpdateList.length, workspaceId: ${userId}, ${userBrokenDocumentUpdateList.length}, ${workspaceId}`,
                            function: `handleDocumentDelete`});
        throw Error(`Error updating documentsBrokenNum - userId, userBrokenDocumentUpdateList.length, workspaceId: ${userId}, ${userBrokenDocumentUpdateList.length}, ${workspaceId}`);
    }

    // Kick off Check update job

    var validatedDocuments = deletedDocumentInfo.filter(infoObj => infoObj.status == 'invalid')
                                                .map(infoObj => infoObj._id.toString());

    if (validatedDocuments.length > 0) {
        var runUpdateChecksData = {};
        runUpdateChecksData['repositoryId'] = repositoryId.toString();
        runUpdateChecksData['validatedDocuments'] = validatedDocuments;
        runUpdateChecksData['validatedSnippets'] = [];

        runUpdateChecksData['jobType'] = jobConstants.JOB_UPDATE_CHECKS.toString();

        await logger.info({source: 'backend-api',
                            message: `Dispatching Update Checks Job - runUpdateChecksData: ${JSON.stringify(runUpdateChecksData)}`,
                            function: 'handleDocumentDelete'});

        try {
            await jobs.dispatchUpdateChecksJob(runUpdateChecksData);
        }
        catch (err) {
            await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error dispatching update Checks job - repositoryId, validatedDocuments.length: ${repositoryId}, ${validatedDocuments.length}`,
                                function: `handleDocumentDelete`});
            throw Error(`Error dispatching update Checks job - repositoryId, validatedDocuments.length: ${repositoryId}, ${validatedDocuments.length}`);
        }
    }

    // Create ActivityFeedItems for every deleted Document
    try {
        await ActivityFeedItemController.createActivityFeedItem({type: 'delete', date: Date.now(), userId: userId,
                                                                    workspaceId, userUpdates: activityFeedInfo})
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error creating ActivityFeedItems on Document delete workspaceId, userId, activityFeedInfo: ${workspaceId}, ${userId}, ${JSON.stringify(activityFeedInfo)}`,
                            function: `handleDocumentDelete`});
        throw Error(`Error creating ActivityFeedItems on Document delete workspaceId, userId, activityFeedInfo: ${workspaceId}, ${userId}, ${JSON.stringify(activityFeedInfo)}`);
    }
    // Reporting Section End ---------------------------------------------------------------
    return true;
}



handleDocumentReferenceRemove = async (referenceStatus, returnDocument, userId, workspaceId) => {
        // Spec:
    //  If removed Reference.status == 'invalid'
    //      If Document has no References set status to 'valid'
    //      If Document now has only valid References set status to 'valid'
    // Now that Reference has been removed, update the Document's status, if necessary
    // Kick off Update Checks Job

    var setStatusValid = false;

    const documentId = returnDocument._id.toString();
    const repositoryId = returnDocument.repository.toString();

    if (referenceStatus == 'invalid' && returnDocument.status == 'invalid') {
        // Fetch all References currently on the Document
        var referenceIds = returnDocument.references.map(refObj => refObj._id.toString());
        var attachedReferences;

        try {
            attachedReferences = await Reference.find({ _id: { $in: referenceIds.map(id => ObjectId(id) )}}).lean().exec();
        }
        catch (err) {
            await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error finding attached References - documentId, referenceIds: ${documentId}, ${JSON.stringify(referenceIds)}`,
                                function: `handleDocumentReferenceRemove`});
            throw Error(`Error finding attached References - documentId, referenceIds: ${documentId}, ${JSON.stringify(referenceIds)}`);
        }

        // If Document has no References set status to 'valid'
        if (attachedReferences.length == 0) {
            setStatusValid = true;
        }
        // If Document has no invalid reference attached remaining
        else {
            var invalidReferenceExists = attachedReferences.some(refObj => {refObj.status == 'invalid'});
            if (!invalidReferenceExists) {
                setStatusValid = true;
            }
        }

        // Set the Document status to 'valid'
        if (setStatusValid) {
            try {
                var setDocumentValidResponse = await Document.findByIdAndUpdate(documentId, {$set: {status: 'valid'}}).lean().exec();
            }
            catch (err) {
                await logger.error({source: 'backend-api', message: err,
                                    errorDescription: `Error setting document status 'valid' - documentId, workspaceId: ${documentId}, ${workspaceId}`,
                                    function: `handleDocumentReferenceRemove`});
                throw Error(`Error setting document status 'valid' - documentId, workspaceId: ${documentId}, ${workspaceId}`);
            }
        }


        // Kick off Check update job
        var validatedDocuments = [documentId.toString()];
        if (validatedDocuments.length > 0) {
            var runUpdateChecksData = {};
            runUpdateChecksData['repositoryId'] = repositoryId;
            runUpdateChecksData['validatedDocuments'] = validatedDocuments;
            runUpdateChecksData['validatedSnippets'] = [];

            runUpdateChecksData['jobType'] = jobConstants.JOB_UPDATE_CHECKS.toString();

            await logger.info({source: 'backend-api',
                                message: `Dispatching Update Checks Job - runUpdateChecksData: ${JSON.stringify(runUpdateChecksData)}`,
                                function: 'handleDocumentReferenceRemove'});

            try {
                await jobs.dispatchUpdateChecksJob(runUpdateChecksData);
            }
            catch (err) {
                await logger.error({source: 'backend-api', message: err,
                                    errorDescription: `Error dispatching update Checks job - repositoryId, validatedDocuments: ${repositoryId}, ${JSON.stringify(validatedDocuments)}`,
                                    function: `handleDocumentReferenceRemove`});
                throw Error(`Error dispatching update Checks job - repositoryId, validatedDocuments: ${repositoryId}, ${JSON.stringify(validatedDocuments)}`);
            }
        }

    }

    // Also update UserStats.documentsBrokenNum
    if (setStatusValid) {
        try {
            var userStatUpdateResponse = await UserStatsController.updateDocumentsBrokenNum({
                                                                                                userUpdates: [{userId: userId.toString(), updateNum: -1}],
                                                                                                workspaceId
                                                                                            });
        }
        catch (err) {
            await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error updating documentsBrokenNum - userId, documentId, workspaceId: ${userId.toString()}, ${documentId}, ${workspaceId}`,
                                function: `handleDocumentReferenceRemove`});
            throw Error(`Error updating documentsBrokenNum - userId, documentId, workspaceId: ${userId.toString()}, ${documentId}, ${workspaceId}`);
        }
    }
    return true;
}


handleSnippetEdit = async (snippetId, repositoryId) => {
    var validatedSnippets = [snippetId];

    var runUpdateChecksData = {};
    runUpdateChecksData['repositoryId'] = repositoryId.toString();
    runUpdateChecksData['validatedDocuments'] = [];
    runUpdateChecksData['validatedSnippets'] = validatedSnippets;

    runUpdateChecksData['jobType'] = jobConstants.JOB_UPDATE_CHECKS.toString();

    await logger.info({source: 'backend-api',
                        message: `Dispatching Update Checks Job - runUpdateChecksData: ${JSON.stringify(runUpdateChecksData)}`,
                        function: 'handleSnippetEdit'});

    try {
        await jobs.dispatchUpdateChecksJob(runUpdateChecksData);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                        errorDescription: `Error dispatching update Checks job - repositoryId, validatedSnippets: ${repositoryId}, ${JSON.stringify(validatedSnippets)}`,
                        function: 'handleSnippetEdit'});
        return res.json({success: false, error: `Error dispatching update Checks job - repositoryId, validatedSnippets: ${repositoryId}, ${JSON.stringify(validatedSnippets)}`});
    }

    await logger.info({source: 'backend-api', message: `Successfully began updating Checks for validated Snippet`, function: 'handleSnippetEdit'});

    return true;
}

handleSnippetDelete = async (deletedSnippet, repositoryId) => {

    var validatedSnippets = [deletedSnippet._id.toString()];

    var runUpdateChecksData = {};
    runUpdateChecksData['repositoryId'] = repositoryId;
    runUpdateChecksData['validatedDocuments'] = [];
    runUpdateChecksData['validatedSnippets'] = validatedSnippets;

    runUpdateChecksData['jobType'] = jobConstants.JOB_UPDATE_CHECKS.toString();

    await logger.info({source: 'backend-api',
                        message: `Dispatching Update Checks Job - runUpdateChecksData: ${JSON.stringify(runUpdateChecksData)}`,
                        function: 'handleSnippetDelete'});

    try {
        await jobs.dispatchUpdateChecksJob(runUpdateChecksData);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error dispatching update Checks job - repositoryId, validatedSnippets: ${repositoryId}, ${JSON.stringify(validatedSnippets)}`,
                                function: 'handleSnippetDelete'});
        throw Error(`Error dispatching update Checks job - repositoryId, validatedSnippets: ${repositoryId}, ${JSON.stringify(validatedSnippets)}`);
    }

    await logger.info({source: 'backend-api', message: `Successfully dispatched update Checks job for invalid Snippet deletion`, function: 'deleteSnippet'});

    return true;
}


// Routes
module.exports = { retrieveBrokenDocuments,
                   retrieveActivityFeedItems: ActivityFeedItemController.retrieveActivityFeedItems,
                   retrieveUserStats: UserStatsController.retrieveUserStats,
                   handleDocumentCreate,
                   handleDocumentDelete,
                   handleDocumentReferenceRemove,
                   handleSnippetEdit,
                   handleSnippetDelete
                };
