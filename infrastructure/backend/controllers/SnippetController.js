// SnippetController
const Snippet = require('../models/Snippet');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const logger = require('../logging/index').logger;
const ReportingController = require('./reporting/ReportingController');
const snippetConstants = require('../constants/index').snippets;

// Create and Edit

// grab the Mixpanel factory
const Mixpanel = require('mixpanel');

// create an instance of the mixpanel client
const mixpanel = Mixpanel.init(`${process.env.MIXPANEL_TOKEN}`);

let db = mongoose.connection;


checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}

createSnippet = async (req, res) => {
    const { annotation, code, start, 
        status, name, creatorId, documentId } = req.body;
    
    const workspaceId = req.workspaceObj._id.toString();
    const referenceId = req.referenceObj._id.toString();
    const repositoryId = req.referenceObj.repository.toString();
    
    var referenceRepository = req.referenceObj.repository;
    var workspaceRepositories = req.workspaceObj.repositories;

    const session = await db.startSession();
    let output = {};
    try {
        await session.withTransaction(async () => {

            // check if repositories accessible to the user workspace includes reference Repository
            if (!workspaceRepositories.includes(referenceRepository)) {
                await logger.error({source: 'backend-api',
                                        message: Error(`Error cannot create Snippet on repository user can't access - repositoryId, userId: ${referenceRepository}, ${req.tokenPayload.userId}`),
                                        errorDescription: `Error cannot create Snippet on repository user can't access - repositoryId, userId: ${referenceRepository}, ${req.tokenPayload.userId}`,
                                        function: 'createSnippet'});
                output = {success: false, error: "createSnippet Error: request on repository user does not have access to."};
                throw Error(`Error cannot create Snippet on repository user can't access - repositoryId, userId: ${referenceRepository}, ${req.tokenPayload.userId}`);
            }

            // verify creator matches user in req.tokenPayload
            if (checkValid(creatorId)) {
                if (req.tokenPayload.userId.toString() != creatorId) {
                    await logger.error({source: 'backend-api',
                                            message: Error(`Error Snippet 'creatorId' doesn't match token userId - creatorId, userId: ${creatorId}, ${req.tokenPayload.userId}`),
                                            errorDescription: `Error Snippet 'creatorId' doesn't match token userId - creatorId, userId: ${creatorId}, ${req.tokenPayload.userId}`,
                                            function: 'createSnippet'});
                    output = {success: false, error: "createSnippet Error: JWT does not match `creator`."};
                    throw Error(`Error Snippet 'creatorId' doesn't match token userId - creatorId, userId: ${creatorId}, ${req.tokenPayload.userId}`);
                }
            }
            else {
                ouput = {success: false, error: "createSnippet error: snippet creator not provided"};
                throw Error("createSnippet error: snippet creator not provided");
            }

            // validation on essential values
            if (!documentId && !checkValid(annotation)) return res.json({success: false, error: "createSnippet error: snippet annotation not provided"});
            if (!checkValid(code)) return res.json({success: false, error: "createSnippet error: snippet code not provided"});
            if (!checkValid(start)) return res.json({success: false, error: "createSnippet error: snippet start not provided"});
            if (!checkValid(status)) return res.json({success: false, error: "createSnippet error: snippet status not provided"});

            let snippet = new Snippet(
                {       
                workspace: ObjectId(workspaceId),
                reference: ObjectId(referenceId),
                repository: ObjectId(repositoryId),
                code,
                originalCode: code,
                originalSize: code.length,
                annotation,
                start,
                status,
                creator: creatorId
                },
            );

            if (name) snippet.name = name;
            if (documentId) snippet.document = ObjectId(documentId);
            
            // save the snippet to db
            try {
                snippet = await snippet.save({ session });
            } catch (err) {
                await logger.error({source: 'backend-api',
                                        message: err,
                                        errorDescription: `Error couldn't save Snippet - creatorId, workspaceId, referenceId, repositoryId: ${creatorId}, ${workspaceId}, ${referenceId}, ${repositoryId}`,
                                        function: 'createSnippet'});
                output = {success: false, error: "createSnippet error: new snippet could not be saved", trace: err};
                throw Error(`Error couldn't save Snippet - creatorId, workspaceId, referenceId, repositoryId: ${creatorId}, ${workspaceId}, ${referenceId}, ${repositoryId}`);
            }
            
            // populate certain object fields on the snippet
            try {
                snippet = await Snippet.populate(snippet, {path: "workspace reference creator"});
            } catch (err) {
                await logger.error({source: 'backend-api',
                                        message: err,
                                        errorDescription: `Error couldn't populate Snippet - creatorId, workspaceId, referenceId, repositoryId: ${creatorId}, ${workspaceId}, ${referenceId}, ${repositoryId}`,
                                        function: 'createSnippet'});
                output = {success: false, error: "createSnippet error: new snippet could not be populated but was saved", trace: err};
                throw Error("createSnippet error: new snippet could not be populated but was saved");
            }

            await logger.info({source: 'backend-api',
                                message: `Successfully created Snippet - creatorId, workspaceId, referenceId, repositoryId: ${creatorId}, ${workspaceId}, ${referenceId}, ${repositoryId}`,
                                function: 'createSnippet'});

            // track an event with optional properties
            mixpanel.track('Snippet Create', {
                distinct_id: `${creatorId}`,
                workspaceId: `${workspaceId.toString()}`,
                repositoryId: `${repositoryId.toString()}`,
                size: `${code.length}`,
            });

            output = { success: true, result: snippet };
        });
    }
    catch (err) {
        session.endSession();
        return res.json(output);
    }

    session.endSession();

    return res.json(output);
}


getSnippet = async (req, res) => {
    const snippetId = req.snippetObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();

    let returnedSnippet;

    try {
        console.log("GET SNIPPET DATA", {_id: snippetId, workspace: workspaceId});
        returnedSnippet = await Snippet.findOne({_id: snippetId, workspace: workspaceId})
            .populate({path: 'workspace reference'}).lean().exec();
    } catch (err) {
        await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error findOne failed - snippetId, workspaceId: ${snippetId}, ${workspaceId}`,
                                function: 'getSnippet'});
        return res.json({success: false, error: "getSnippet error: findOne query failed", trace: err});
    }

    return res.json({success: true, result: returnedSnippet});
}

editSnippet = async (req, res) => {
    const snippetId = req.snippetObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();
    const { name, status, code, start } = req.body;

    var isValidatingSnippet = false;

    const session = await db.startSession();
    let output = {};
    try {
        await session.withTransaction(async () => {

            // build update object and selection object to update and only pull exactly what is needed from db
            let update = {};
            let selectionString = "_id";

            if (name) {
                update.name = name;
                selectionString += " name";
            }

            // If updating Status, potential for Check updates
            if (status) {
                
                update.status = status;
                selectionString += " status";
                
                if (req.snippetObj.status == snippetConstants.SNIPPET_STATUS_INVALID && status == snippetConstants.SNIPPET_STATUS_VALID) {
                    isValidatingSnippet = true;
                }

            }

            if (code) {
                update.code = code;
                selectionString += " code";
            }

            if (start) {
                update.start = start;
                selectionString += " start";
            }

            let returnedSnippet;
            try {
                returnedSnippet = Snippet.findOneAndUpdate({_id: snippetId, workspace: workspaceId}, 
                    { $set: update }, { new: true, session }).select(selectionString).lean().exec();
            } catch (err) {
                await logger.error({source: 'backend-api',
                                        message: err,
                                        errorDescription: `Error findOneAndUpdate failed - snippetId, workspaceId, update: ${snippetId}, ${workspaceId}, ${JSON.stringify(update)}`,
                                        function: 'getSnippet'});
                output = {success: false, error: "editSnippet error: findOneAndUpdate query failed", trace: err};
                throw Error(`Error findOneAndUpdate failed - snippetId, workspaceId, update: ${snippetId}, ${workspaceId}, ${JSON.stringify(update)}`);
            }

            // Kick off Check update job
            if (isValidatingSnippet) {

                // track an event with optional properties
                mixpanel.track('Snippet Validate', {
                    distinct_id: `${req.snippetObj.creator.toString()}`,
                    workspaceId: `${workspaceId.toString()}`,
                    repositoryId: `${req.snippetObj.repository.toString()}`,
                });

            }

            await logger.info({source: 'backend-api',
                                message: `Successfully updated Snippet - snippetId, workspaceId, update: ${snippetId}, ${workspaceId}, ${JSON.stringify(update)}`,
                                function: 'editSnippet'});
            output = { success: true, result: returnedSnippet };
        });
    }
    catch (err) {
        session.endSession();
        return res.json(output);
    }

    session.endSession();

    if (isValidatingSnippet) {
        try {
            await ReportingController.handleSnippetEdit(req.snippetObj._id.toString(), req.snippetObj.repository.toString());
        }
        catch (err) {
            await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error handleSnippetEdit - snippetId, repositoryId: ${req.snippetObj._id.toString()}, ${req.snippetObj.repository.toString()}`,
                                function: 'handleSnippetEdit'});
            return res.json({success: false,
                error: `Error handleSnippetEdit - snippetId, repositoryId: ${req.snippetObj._id.toString()}, ${req.snippetObj.repository.toString()}`,
                trace: err});
        }
    }

    return res.json(output);
}

deleteSnippet = async (req, res) => {
    const snippetId = req.snippetObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();

    let deletedSnippet;
    try {
        deletedSnippet = await Snippet.findOneAndRemove({_id: snippetId, workspace: workspaceId}).select('_id').lean().exec();
    } catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error findOneAndRemove failed - snippetId, workspaceId: ${snippetId}, ${workspaceId}`,
                                function: 'deleteSnippet'});
        return res.json({success: false, error: "deleteSnippet error: findOneAndRemove query failed", trace: err});
    }

    // Kick off Check update job if Snippet was 'invalid'
    if (deletedSnippet.status == snippetConstants.SNIPPET_STATUS_INVALID) {

        try {
            await ReportingController.handleSnippetDelete(deletedSnippet, deletedSnippet.repository.toString());
        }
        catch (err) {
            await logger.error({source: 'backend-api',
                                    message: err,
                                    errorDescription: `Error handleSnippetDelete - snippetId, repositoryId, validatedSnippets: ${snippetId}, ${repositoryId}, ${JSON.stringify(validatedSnippets)}`,
                                    function: 'deleteSnippet'});

            return res.json({success: false, error: `Error handleSnippetDelete - snippetId, repositoryId, validatedSnippets: ${snippetId}, ${repositoryId}, ${JSON.stringify(validatedSnippets)}`});
        }

        // track an event with optional properties
        mixpanel.track('Snippet Validate', {
            distinct_id: `${req.snippetObj.creator.toString()}`,
            workspaceId: `${workspaceId.toString()}`,
            repositoryId: `${req.snippetObj.repository.toString()}`,
        });
        
    }
    
    await logger.info({source: 'backend-api', message: `Successfully deleted Snippet - snippetId, workspaceId: ${snippetId}, ${workspaceId}`, function: 'deleteSnippet'});
    return res.json({success: true, result: deletedSnippet});
}

retrieveSnippets = async (req, res) => {
    let { referenceId, repositoryId, name, status, minimal, limit, skip } = req.body;
    const workspaceId = req.workspaceObj._id.toString();

    //TODO: ADD repository: repositoryId spec
    let query = Snippet.find({ workspace: workspaceId });

    if (checkValid(referenceId)) query.where('reference').equals(referenceId)
    if (checkValid(name)) query.where('name').equals(name)
    if (checkValid(status)) query.where('status').equals(status);
    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));

    if (!minimal) {
        query.populate({path: 'workspace reference creator'});
    } else {
        query.select('_id name annotation code status start creator');
        query.populate({path: 'creator'});
    }
    
    let returnedSnippets;

    try {
        returnedSnippets = await query.lean().exec();
    } catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error find failed - workspaceId, repositoryId, referenceId: ${workspaceId}, ${repositoryId}, ${referenceId}`,
                                function: 'retrieveSnippets'});
        return res.json({success: false,  error: "retrieveSnippets error: find query failed", trace: err});
    }

    return res.json({success: true, result: returnedSnippets});
}


module.exports = { createSnippet, getSnippet, editSnippet, deleteSnippet, 
    retrieveSnippets }
