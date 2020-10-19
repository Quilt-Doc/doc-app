const Reference = require('../models/Reference');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const logger = require('../logging/index').logger;

// string to populate the fields needed on Reference
const populationString = "repository tags"
const minSelectionString = "name kind path _id created status"

checkValid = (item) => {
    if (item !== null && item !== undefined) {
        return true
    }
    return false
}

escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Faraz FIXME TODO: will have to see whether insertMany actually populates or returns the refs at all
// Created References should be mapped _.map in reducer
createReferences = async (req, res) => {
    const { references } = req.body;
    if (!checkValid(references)) return res.json({success: false, error: 'no references provided'});

    // validate that the references provided have a name and repository
    var i;
    for (i = 0; i < references.length; i++) {
        var currentRef = references[i];
        if (!checkValid(currentRef.name)) return res.json({success: false, error: 'createReference Error: no reference name provided'});
        if (!checkValid(currentRef.repository)) return res.json({success: false, error: 'createReference Error: no reference repository provided'});
    }

    // insert references through insertMany one db call
    let insertedReferences;

    try {
        insertedReferences = await Reference.insertMany(references).populate({path: populationString});
    } catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error insertMany failed for ${references.length} References`,
                            function: 'createReferences'});

        return res.json({success: false, error: 'createReferences Error: insertMany query failed', trace: err});
    }

    await logger.info({source: 'backend-api', message: `Successfully inserted ${insertedReferences.length} new References`, function: 'createReferences'});
    
    return res.json({success: true, result: insertedReferences});
}

/// add reference to state
getReference = async (req, res) => {
    const referenceId = req.referenceObj._id.toString();
    const repositoryIds = req.workspaceObj.repositories.map(repositoryObj => ObjectId(repositoryObj.toString()));
    
    // acquire reference through findOne call and make sure reference's repository is within the repositories
    //  of accessible workspace
    let reference;
    try {
        reference = await Reference.findOne({_id: referenceId, repository: {$in: repositoryIds}}).lean()
            .populate({path: populationString}).exec(); 
    } catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error findOne failed - referenceId, repositoryIds: ${referenceId}, ${JSON.stringify(repositoryIds)}`,
                                function: 'getReference'});
        return res.json({success: false, error: 'getReference Error: getReference query failed', trace: err});
    }

    return res.json({success: true, result: reference});
}

/// new mapping of references in state
retrieveReferences = async (req, res) => {

    let { kinds, path, referenceId, referenceIds, repositoryId, minimal, limit, skip, sort, onlyValid, filterRoot } = req.body;
    var validRepositoryIds = req.workspaceObj.repositories;

    let query = Reference.find();

    if (!checkValid(onlyValid)) onlyValid = true;

    if (checkValid(kinds)) query.where('kind').in(kinds);
    if (checkValid(path)) query.where('path').equals(path);
    if (checkValid(referenceIds)) query.where('_id').in(referenceIds);
    if (checkValid(filterRoot) && filterRoot) query.where('root').equals(false); 

    if (onlyValid) {
        query.where('status').equals('valid');
    }
    // Don't retrieve Root reference
    // query.where('root').equals(false);

    // make sure that repositoryId provided exists and is accessible from workspace
    
    if (checkValid(repositoryId)) {
        if (!validRepositoryIds.includes(repositoryId)) {
            await logger.error({source: 'backend-api',
                                    message: Error(`Error cannot retrieve References on repository user can't access - repositoryId, userId: ${repositoryId}, ${req.tokenPayload.userId}`),
                                    errorDescription: `Error cannot retrieve References on repository user can't access - repositoryId, userId: ${repositoryId}, ${req.tokenPayload.userId}`,
                                    function: 'retrieveReferences'});
            return res.json({success: false, error: "retrieveReferences Error: request on repository user does not have access to."});
        }
        query.where('repository').equals(repositoryId);
    } else {
        return res.json({success: false, error: "retrieveReferences Error: repositoryId is not provided."});
    }

    if (checkValid(referenceId)) {

        // retrieve the reference so we can extract the reference's path
        let reference;
        if (referenceId !== ""){

            try {
                reference = await Reference.findOne({_id: referenceId, repository: repositoryId})
                    .lean().select('path').exec();
            } catch (err) {
                await logger.error({source: 'backend-api', message: err,
                                    errorDescription: `Error findOne failed - referenceId, repositoryId: ${referenceId}, ${repositoryId}`,
                                    function: 'retrieveReferences'});
                return res.json({success: false, error: "retrieveReferences Error: query findOne of referenceId failed", trace: err});
            }

        } else {

            try {
                reference = await Reference.findOne({ repository: repositoryId, path: "" })
                    .lean().select('path').exec();
            } catch (err) {
                await logger.error({source: 'backend-api', message: err,
                                        errorDescription: `Error findOne failed - path, repositoryId: "", ${repositoryId}`,
                                        function: 'retrieveReferences'});
                return res.json({success: false, error: "retrieveReferences Error: query findOne with empty path of referenceId failed"});
            }
        }

        // build a regex using the reference's path to find all the reference's children and return the reference as well
        // for convenience

        // two cases for regex -- first is when path is empty and need to match anything that doesn't include a slash
        // including empty string. second is when path is nonempty and need to match reference path as well as path of 
        // reference children --- reference path + / + child name
        let regex;

        if (reference.path === "") {
            regex = new RegExp(`^([^\/]+)?$`);
        } else {
            let refPath = escapeRegExp(reference.path);
            regex = new RegExp(`^${refPath}(\/[^\/]+)?$`);
        }

        query.where('path').equals(regex);
    }

    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));

    // minimal retrieve is for cases when you don't need all fields and don't need to populate (dirview)
    if (minimal === true) { 
        query.select(minSelectionString);
    } else {
        query.populate({path: populationString});
    }

    let returnedReferences;
    try {
        returnedReferences =  await query.lean().exec();
    } catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error find failed - referenceId, repositoryId, path: ${referenceId}, ${repositoryId}, ${path}`,
                                function: 'retrieveReferences'});

        return res.json({success: false, error: "retrieveReferences Error: direct retrieve query execution failed", trace: err});
    }

    if (limit && returnedReferences.length < limit && referenceIds) {
        let query2 = Reference.find({repository: repositoryId});

        if (onlyValid) {
            query2.where('status').equals('valid');
        }

        if (checkValid(filterRoot) && filterRoot) query2.where('root').equals(false);
        query2.where('_id').nin(referenceIds);
        query2.limit(limit - returnedReferences.length);
        minimal === true ? query2.select(minSelectionString) : query2.populate({path: populationString});
        if (checkValid(sort)) query2.sort(sort);

        let returnedReferences2;
        try {
            returnedReferences2 = await query2.lean().exec();
        } catch (err) {
            await logger.error({source: 'backend-api', message: err,
            errorDescription: `Error find query failed - repositoryId: ${repositoryId}`,
            function: 'retrieveReferences'});

            return res.json({success: false, error: "retrieveReferences Error: direct retrieve query execution failed on 2nd limiting retrieve", trace: err});
        }
        
        returnedReferences = [...returnedReferences, ...returnedReferences2];
    }

    await logger.info({source: 'backend-api', message: `Successfully retrieved ${returnedReferences.length} References`, function: 'retrieveReferences'});
    
    return res.json({success: true, result: returnedReferences});
}

// merge reference with existing reference
editReference = async (req, res) => {

    const {  name, path, kind } = req.body;

    const referenceId = req.referenceObj._id;
    var repositoryIds = req.workspaceObj.repositories;

    let reference;

    // make sure repository of reference is accessible to the user
    try {
        let repositoryValid = await Reference.exists({_id: referenceId, repository: {$in: repositoryIds}});
        if (!repositoryValid) {
            await logger.error({source: 'backend-api',
                                    message: Error(`Error Reference does not exist in accessible repository - referenceId, repositoryIds, userId: ${referenceId}, ${JSON.stringify(repositoryIds)}, ${req.tokenPayload.userId}`),
                                    errorDescription: `Error Reference does not exist in accessible repository - referenceId, repositoryIds, userId: ${referenceId}, ${JSON.stringify(repositoryIds)}, ${req.tokenPayload.userId}`,
                                    function: 'editReference'});

            return res.json({success: false, error: "editReference Error: reference with that id and that is in accessible \
                repositories doesn't exist", trace: err});
        }
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error exists query failed - referenceId, repositoryIds, userId: ${referenceId}, ${JSON.stringify(repositoryIds)}, ${req.tokenPayload.userId}`,
                                function: 'editReference'});
        return res.json({success: false, error: "editReference Error: error checking whether reference with that id \
        is in accessible repositories", trace: err});
    }

    // check which body params were asked to update -- add to the update object and selection string
    let update = {};
    let selectionString = "_id"

    if (checkValid(name)) {
        update.name = name;
        selectionString += " name";
    }
    if (checkValid(path)) {
        update.path = path;
        selectionString += " path";
    }
    if (checkValid(kind)) {
        update.kind = kind;
        selectionString += " kind";
    }

    let query =  Reference.findByIdAndUpdate(referenceId, { $set: update }, { new: true }, (err, reference));

    query.select(selectionString);

    let returnedReference;
    try {
        returnedReference = await query.lean().exec();
    } catch (err) {
        await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error findByIdAndUpdate query failed - referenceId, update: ${referenceId}, ${JSON.stringify(update)}`,
                                function: 'editReference'});

        return res.json({success: false, error: "editReference Error:  execution of query to update reference failed", 
            trace: err});
    }

    await logger.info({source: 'backend-api', message: `Successfully edited Reference  - referenceId, update: ${referenceId}, ${JSON.stringify(update)}`, function: 'editReference'});
   
    return res.json({success: true, result: returnedReference})
}

// omit reference in state
deleteReference = async (req, res) => {

    const referenceId = req.referenceObj._id;
    var repositoryIds = req.workspaceObj.repositories;

    // make sure repository of reference is accessible to the user
    try {
        let repositoryValid = await Reference.exists({_id: referenceId, repository: {$in: repositoryIds}});
        if (!repositoryValid) {
            await logger.error({source: 'backend-api',
                                    message: Error(`Error Reference does not exist in accessible repository - referenceId, repositoryIds, userId: ${referenceId}, ${JSON.stringify(repositoryIds)}, ${req.tokenPayload.userId}`),
                                    errorDescription: `Error Reference does not exist in accessible repository - referenceId, repositoryIds, userId: ${referenceId}, ${JSON.stringify(repositoryIds)}, ${req.tokenPayload.userId}`,
                                    function: 'deleteReference'});

            return res.json({success: false, error: "deleteReference Error: reference with that id and that is in accessible \
                repositories doesn't exist", trace: err});
        }
    } catch (err) {
        await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error exists query failed - referenceId, repositoryIds, userId: ${referenceId}, ${JSON.stringify(repositoryIds)}, ${req.tokenPayload.userId}`,
                                function: 'deleteReference'});
        return res.json({success: false, error: "deleteReference Error: error checking whether reference with that id \
        is in accessible repositories", trace: err});
    }

    var deletedReference;
    try {
        deletedReference = await Reference.findByIdAndRemove(referenceId).select("_id").lean().exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error findByIdAndRemove query failed - referenceId: ${referenceId}`,
                                function: 'deleteReference'});
        return res.json({success: false, error: "deleteReference Error: error findByIdAndRemove query failed"});
    }

    await logger.info({source: 'backend-api',
                        message: `Successfully deleted Reference - referenceId: ${referenceId}`,
                        function: 'deleteReference'});

    return res.json({success: true, result: deletedReference});
}


// merge reference with existing reference
attachReferenceTag = async (req, res) => {
    const { referenceId, tagId } = req.params;
    //const referenceId = req.referenceObj._id.toString();
    //const tagId = req.tagObj._id.toString();
	let update = {}
	update.tags = ObjectId(tagId);
    
    let query = Reference.findOneAndUpdate({_id: referenceId}, { $push: update}, { new: true }).lean();

    // populate and select only the values we want to update in the reducer
    query.populate('tags');
    query.select('_id tags');

    let returnedReference;
    try {
        returnedReference = await query.exec();
    } catch (err) {
        await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error findOneAndUpdate query failed - referenceId, update: ${referenceId}, ${JSON.stringify(update)}`,
                                function: 'attachReferenceTag'});

        return res.json({success: false, error: "attachReferenceTag Error: error executing tag update query", trace: err});
    }
    return res.json({success: true, result: returnedReference});
}


// merge reference with existing reference
removeReferenceTag = async (req, res) => {

    const referenceId = req.referenceObj._id.toString();
    const tagId = req.tagObj._id.toString();

	let update = {}
	update.tags = ObjectId(tagId);
    
    let query = Reference.findOneAndUpdate({_id: referenceId}, { $pull: update}, { new: true }).lean();

    // populate and select only the values we want to update in the reducer
    query.populate('tags');
    query.select('_id tags');

    let returnedReference;
    try {
        returnedReference = await query.lean().exec();
    } catch (err) {
        await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error findOneAndUpdate query failed - referenceId, update: ${referenceId}, ${JSON.stringify(update)}`,
                                function: 'removeReferenceTag'});

        return res.json({success: false, error: "removeReferenceTag Error: error executing tag update query", trace: err});
    }
    return res.json({success: true, result: returnedReference});
}


searchReferences = async (req, res) => {
    const { userQuery, repositoryId, tagIds, referenceIds, kinds,
      minimalReferences, skip, limit, sort } = req.body;
      
    var { onlyValid } = req.body;


    if (!checkValid(onlyValid)) onlyValid = true;

    let referenceAggregate;
    
    if (checkValid(userQuery) && userQuery !== "") {
        referenceAggregate = Reference.aggregate([
            { 
                $search: {
                    "autocomplete": {
                            "query": userQuery,
                            "path": "name"
                    }
                } 
            }
        ]);
    }
    else {
        referenceAggregate = Reference.aggregate([]);
    }
    
    referenceAggregate.addFields({isReference : true, score: { $meta: "searchScore" }});
    
    referenceAggregate.match({repository: ObjectId(repositoryId)});

    if (onlyValid) {
        console.log('matching only valid');
        referenceAggregate.match({status: 'valid'});
    }

    // Don't retrieve Root reference
    referenceAggregate.match({root: false});
    
    if (checkValid(kinds)) referenceAggregate.match({ kind: { $in: kinds } });

    if (checkValid(tagIds)) referenceAggregate.match({
        tags: { $in: tagIds.map((tagId) => ObjectId(tagId)) }
    });

    if (checkValid(referenceIds)) referenceAggregate.match({
        _id: { $in: referenceIds.map((refId) => ObjectId(refId)) }
    });
    
    if (checkValid(sort)) referenceAggregate.sort(sort);

    if (checkValid(skip))  referenceAggregate.skip(skip);

    if (checkValid(limit))  referenceAggregate.limit(limit);
    
    if (checkValid(minimalReferences) && minimalReferences) referenceAggregate.project("name kind repository path _id created status isReference");

    let populationString = minimalReferences ? "repository tags" : "repository";

    try {
        references = await referenceAggregate.exec()
    } catch (err) {
        return res.json({ success: false, error: "searchReferences: Failed to aggregate references", trace: err});
    }


    try {
        references = await Reference.populate(references, 
            {
                path: populationString
            }
        )
    } catch (err) {
        return res.json({success: false, error: "searchReferences: Failed to populate references", trace: err});
    }

    console.log("REFERENCE RESULT", references.map(ref => ref._id));
    // Need to include time filtering
    return res.json({success: true, result: references});
}

module.exports =
{
    createReferences,
    getReference,
    retrieveReferences,
    editReference,
    deleteReference,
    attachReferenceTag, 
    removeReferenceTag,
    searchReferences
}