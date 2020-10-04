//models
const Document = require('../../models/Document');
const Repository = require('../../models/Repository');
const Reference = require('../../models/Reference');

const UserStatsController = require('../controllers/reporting/UserStatsController');
const ActivityFeedItemController = require('../controllers/reporting/ActivityFeedItemController');

var mongoose = require('mongoose');
const UserStats = require('../../models/reporting/UserStats');
const { ObjectId } = mongoose.Types;
const logger = require('../logging/index').logger;

const jobs = require('../apis/jobs');
const jobConstants = require('../../constants/index').jobs;


checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}


escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


/// parents children and path are updated, document is returned
/// FARAZ TODO: Make title a required field during document creation (in modal)
/// FARAZ TODO: Log times of middleware and of major points in controller methods
createDocument = async (req, res) => {
    const { authorId, referenceIds, snippetIds, repositoryId, title, tagIds, parentPath, root } = req.body;
    
    const workspaceId = req.workspaceObj._id.toString();
    
    // validation
    if (!checkValid(authorId)) return res.json({success: false, error: "createDocument error: no authorId provided.", result: null});
    if (!checkValid(title) || (title === "" && !root)) return res.json({
        success: false, error: "createDocument error: no title provided.", result: null, alert: "Please provide a title"});

    // make sure title doesn't exist already in space
    try {
        let duplicate = await Document.exists({title, workspace: workspaceId});
        if (duplicate) {
            return res.json({success: false, error: "createDocument Error: duplicate title.", alert: "Duplicate title in space.. Please select a unique title"})
        }
    } catch (err) {
        return res.json({success: false, error: "createDocument Error: validation on duplicate title failed.", trace: err});
    }
    

    // Check that repositoryId is in accessible workspace
    const validRepositoryIds = req.workspaceObj.repositories;

    if (checkValid(repositoryId)) {
        if (!validRepositoryIds.includes(repositoryId)) {
            return res.json({success: false, error: "createDocument Error: request on repository user does not have access to."});
        }
    } 
    
     // Check that authorId matches the userId in the JWT (only the user can create a document for themselves)
    if (authorId != req.tokenPayload.userId) {
        return res.json({success: false, error: "createDocument Error: userId in JWT doesn't match authorId."});
    }

    // Get parent of newly created document to add to parent's children 
    let parent;

    if (checkValid(parentPath)) {
        try {   
            parent = await Document.findOne({path: parentPath, workspace: workspaceId})
                .select('_id path children').exec();
        } catch (err) {
            return res.json({success: false, error: `createDocument Error: invalid parentPath`, trace: err});
        }
    // if created document is root, no need to update a "parent"
    } else if (!root) {
        return res.json({success: false, error: "createDocument Error: no parentPath provided."});
    }

    let documentPath = "";

    // Remove dash from title for new path creation, path is only dependent on title and parentPath if root doesn't exist
    // TODO: will need to add validation with regard to backslash (possibly)
    if (!root) {    
        let dashRemovedTitle = title.replace('/', "<replacedDash>");
        documentPath = `${parent.path}/${dashRemovedTitle}`
    }

    let document = new Document(
        {
            author: ObjectId(authorId),
            workspace: ObjectId(workspaceId),
            title,
            path: documentPath
        },
    );

    // set optional fields of document
    if (checkValid(root)) document.root = root;
    if (checkValid(tagIds)) document.tags = tagIds.map(tagId => ObjectId(tagId));
    if (checkValid(repositoryId)) document.repository = repositoryId;
    if (checkValid(referenceIds)) document.references = referenceIds.map(referenceId => ObjectId(referenceId));
    if (checkValid(snippetIds)) document.snippets = snippetIds.map(snippetId => ObjectId(snippetId));
    
    // save document
    try {
        document = await document.save();
    } catch (err) {
        return res.json({success: false, error: "createDocument Error: document creation failed", trace: err});
    }

    // Update UserStats.documentsCreatedNum (increase by 1)
    try {
        await UserStatsController.updateDocumentsCreatedNum({userUpdates: [{updateNum: 1, userId: authorId}], workspaceId});
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error updating documentsCreatedNum userId, workspaceId: ${authorId}, ${workspaceId}`,
                            function: `createDocument`});
        return res.json({success: false, error: "updateDocumentsCreatedNum Error: UserStats update failed", trace: err});
    }

    // Create ActivityFeedItem
    try {
        await ActivityFeedItemController.createActivityFeedItem({type: 'create', date: Date.now(), userId: authorId, workspaceId, userUpdates: [{documentId: document._id.toString()}]});
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error creating ActivityFeedItem workspaceId, userId, documentId: ${workspaceId}, ${authorId}, ${document._id.toString()}`,
                                function: `createDocument`});
        return res.json({success: false, error: `Error creating ActivityFeedItem workspaceId, userId, documentId: ${workspaceId}, ${authorId}, ${document._id.toString()}`, trace: err});
    }

    // add document to parent's children
    if (!root) {
        try {
            parent.children.push(document._id);
            parent = await parent.save();
        } catch (err) {
            return res.json({success: false, error: "createDocument Error: parent update children failed", trace: err});
        }
    }

    // populate everything on the document on creation
    try {
        document = await Document.populate(document, {path: "author references workspace repository tags snippets"});
    } catch (err) {
        return res.json({success: false, error: "createDocument Error: document population failed", trace: err});
    }
   
    return root ? res.json({success: true, result: [document]}) : 
        res.json({success: true, result: [document, parent]});
}  


// paths of modifiedDocs are changed, children of parents are changed
moveDocument = async (req, res) => {

    // extract old and new parent as well as the new index of placement
    const { oldParentId, newParentId, newIndex } = req.body;
    const documentId = req.documentObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();

    const documentObj = req.documentObj;

    let oldParent, newParent, modifiedDocuments;

    // check if we're moving the document into the same directory or not
    let sameDir = oldParentId === newParentId;

    // checks if both parentIds are provided else throws error
    if (checkValid(oldParentId) && checkValid(newParentId)) {
        // trys to retrieve the oldParent, does some validation to make sure oldParent is indeed the current parent
        try {
            oldParent = await Document.findOne({_id: oldParentId, workspace: workspaceId})
                .select('_id path children').exec();
            if (oldParent.path >= documentObj.path || 
                documentObj.path.slice(0, oldParent.path.length) !== oldParent.path) {
                    return res.json({success: false, error: `moveDocument Error: oldParent is not correct oldParent`});
                }
        } catch (err) {
            return res.json({success: false, error: `moveDocument Error: invalid oldParentId`, trace: err});
        }

        // filter out the doc from it's old parent's children and save the old parent
        oldParent.children = oldParent.children.filter((childId) => childId.toString() !== documentId);

        try {
            oldParent = await oldParent.save();
        } catch (err) {
            return res.json({success: false, error: `moveDocument Error: oldParent save failed`, trace: err});
        }

        // if we're moving the doc in same dir, no need to find parent again
        if (sameDir) {
            newParent = oldParent;
        } else {
            // find newParent if actually new
            try {
                newParent = await Document.findOne({_id: newParentId, workspace: workspaceId})
                    .select('_id path children').exec();

                // validation here to check that the newParent is not a child of the movedDocument
                if (documentObj.path.length  <= newParent.path.length
                    && newParent.path.slice(0, documentObj.path.length) === documentObj.path) {
                        return res.json({success: false, error: `moveDocument Error: newParent is child of movedDocument`});
                    }
            } catch (err) {
                return res.json({success: false, error: `moveDocument Error: invalid newParentId`, trace: err});
            }
        }

        //splice the movedDocument into the right location in the newParents children
        newParent.children.splice(newIndex, 0, documentId);
        try {
            newParent = await newParent.save();
        } catch (err) {
            return res.json({success: false, error: `moveDocument Error: newParent save failed`, trace: err});
        }

    } else {
        return res.json({success: false, error: "moveDocument Error: parentIds not provided"});
    }


    // if we've moved into a new directory, we need to change the paths of movedDoc and movedDoc's descendants
    if ( !sameDir ) {
        try {
            // escape the path of the document so regex characters don't affect the query
            let escapedPath = escapeRegExp(`${documentObj.path}/`)
            let regex =  new RegExp(`^${escapedPath}`)
            
            // find all descendants using the prefix regex on the path
            modifiedDocuments = await Document.find({path: regex, workspace: workspaceId}).lean()
                .select('path _id').exec();
        } catch (err) {
            return res.json({success: false, error: "moveDocument Error: failed retrieving document descendants for update", trace: err});
        }
    
        // add the movedDoc to all the docs that need to have their paths changed
        modifiedDocuments.push(documentObj);
        // create a list of operations for updating many docs with one db call
        let bulkWritePathOps = modifiedDocuments.map((doc) => {
            let newPath = newParent.path + doc.path.slice(oldParent.path.length);
            return ({
                updateOne: {
                    filter: { _id: doc._id },
                    // Where field is the field you want to update
                    update: { $set: { path: newPath } },
                    upsert: false
                }
            })
        })

        // mongoose bulkwrite for one many update db call
        try {
           await Document.bulkWrite(bulkWritePathOps);
        } catch (err) {
            return res.json({success: false, error: "moveDocument Error: bulk write of paths failed", trace: err});
        }

        // get the modified docs once again through query as update + bulkwrite does not return the docs affected
        try {
            let modifiedIds = modifiedDocuments.map((doc) => doc._id);
            modifiedDocuments = await Document.find({_id: { $in: modifiedIds } }).lean()
                .select('path _id').exec();
        } catch (err) {
            return res.json({success: false, error: "moveDocument Error: unable to retrieve modifiedDocs", trace: err});
        }
    }

    return sameDir ? res.json({success: true, result: [newParent]}) : res.json({success: true, result: [oldParent, newParent, ...modifiedDocuments]});
}


// remove ids of deleted docs if they exist, change parent's children
deleteDocument = async (req, res) => {

    const documentObj = req.documentObj;
    const workspaceId = req.workspaceObj._id.toString();

    // escape the path of the document so regex characters don't affect the query
    const escapedPath = escapeRegExp(`${documentObj.path}`);
    const regex =  new RegExp(`^${escapedPath}`);

    let deletedDocuments;

    let finalResult = {};

    // if the document is not the root, we can find the doc's parent using the doc's path
    // we will remove the deleted document from the parent's children
    if (!documentObj.root) {
        // split by / and join all elements except the last (which would be the document title) to get the parentPath
        let parentPath = documentObj.path.split("/");
        parentPath = parentPath.slice(0, parentPath.length - 1).join("/");

        // extract the parent using the parentPath
        let parent;
        try {
            parent = await Document.findOne({ path: parentPath, workspace: workspaceId }).select("_id children").exec();
        } catch (err) { 
            return res.json({success: false, error: "deleteDocument Error: unable to retrieve parent from path", trace: err});
        }

        // filter the children of the parent to remove the deleted top level document
        parent.children = parent.children.filter(child => !(child._id.equals(documentObj._id)));

        try {
            parent = await parent.save();
        } catch (err) {
            return res.json({success: false, error: "deleteDocument Error: unable to save parent", trace: err});
        }


        // add the parent to finalResult
        finalResult.parent = parent;
    }

    // find all documents that are about to be deleted (toplevel doc included for cleanliness)
    try {
        deletedDocuments = await Document.find({path: regex, workspace: workspaceId}).select("_id").lean().exec();
    } catch (err) {
        return res.json({success: false, error: "deleteDocument Error: unable to retrieve document and/or descendants for deletion", trace: err});
    }

    var deletedDocumentInfo;

    // query to delete all docs using the ids of the docs
    try {
        let deletedIds = deletedDocuments.map((doc) => doc._id);
        
        // Reporting Section ---------
        // Need list of userId's attached to deleted Documents
        // Get all titles of deleted Documents
        deletedDocumentInfo = await Document.find({_id: {$in: deletedIds}}).select("author title status").lean().exec();
        // Reporting Section End ---------
        
        await Document.deleteMany({_id: {$in: deletedIds}})
    } catch (err) {
        console.log(err);
        return res.json({success: false, error: "deleteDocument Error: unable to delete document and/or descendants", trace: err});
    }


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
                            errorDescription: `Error updating documentsCreatedNum userUpdateList, workspaceId: ${userUpdateList}, ${workspaceId}`,
                            function: `deleteDocument`});
        return res.json({success: false, error: "updateDocumentsCreatedNum Error: UserStats update failed", trace: err});
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
                            errorDescription: `Error updating updateDocumentsBrokenNum userBrokenDocumentUpdateList, workspaceId: ${userBrokenDocumentUpdateList}, ${workspaceId}`,
                            function: `deleteDocument`});
        return res.json({success: false, error: `Error updating updateDocumentsBrokenNum userBrokenDocumentUpdateList, workspaceId: ${userBrokenDocumentUpdateList}, ${workspaceId}`, trace: err});
    }

    // Kick off Check update job

    var validatedDocuments = deletedDocumentInfo.filter(infoObj => infoObj.status == 'invalid')
                                                .forEach(infoObj => {
                                                    infoObj._id.toString();
                                                });
    if (validatedDocuments.length > 0) {
        var runUpdateChecksData = {};
        runUpdateChecksData['repositoryId'] = documentObj.repository.toString();
        runUpdateChecksData['validatedDocuments'] = validatedDocuments;
        runUpdateChecksData['validatedSnippets'] = [];

        runUpdateChecksData['jobType'] = jobConstants.JOB_UPDATE_CHECKS.toString();

        try {
            await jobs.dispatchUpdateChecksJob(runUpdateChecksData);
        }
        catch (err) {
            await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error dispatching update Checks job - repositoryId, validatedDocuments: ${repositoryId}, ${JSON.stringify(validatedDocuments)}`,
                            function: 'deleteDocument'});
            return res.json({success: false, error: `Error dispatching update Checks job - repositoryId, validatedDocuments: ${repositoryId}, ${JSON.stringify(validatedDocuments)}`});
        }
    }



    // Create ActivityFeedItems for every deleted Document
    try {
        await ActivityFeedItemController.createActivityFeedItem({type: 'delete', date: Date.now(), userId: req.tokenPayload.userId,
                                                                    workspaceId, userUpdates: activityFeedInfo})
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error creating ActivityFeedItems on Document delete workspaceId, userId, activityFeedInfo: ${workspaceId}, ${userId}, ${JSON.stringify(activityFeedInfo)}`,
                            function: `deleteDocument`});
        return res.json({success: false, error: `Error creating ActivityFeedItems on Document delete workspaceId, userId, activityFeedInfo: ${workspaceId}, ${userId}, ${JSON.stringify(activityFeedInfo)}`, trace: err});
    }
    // Reporting Section End ---------------------------------------------------------------


    // since delete many does not return documents, but we only need ids, we can use previous extracted deletedDocuments
    finalResult.deletedDocuments = deletedDocuments;
    console.log("FINAL RESULT", finalResult);
    return res.json({success: true, result: finalResult});
}


// title + path of main doc changed, path of descendants changed
renameDocument = async (req, res) => {

    // extract new title that will be used to rename
    const { title } = req.body;
    if (!checkValid(title)) return res.json({success: false, error: 'renameDocument: error no title provided', alert: "Please provide a title"});

    
    const workspaceId = req.workspaceObj._id.toString();
    const { documentObj } = req;

    // make sure title doesn't exist already in space
    try {
        let duplicate = await Document.exists({title, workspace: workspaceId});
        if (duplicate) {
            return res.json({success: false, error: "renameDocument Error: duplicate title.", alert: "Duplicate title in space.. Please select a unique title"})
        }
    } catch (err) {
        return res.json({success: false, error: "renameDocument Error: validation on duplicate title failed.", trace: err});
    }
    

    // extract prefix path for all documents that will need to be updated (path) by name change 
    const escapedPath = escapeRegExp(`${documentObj.path}`);
    const regex =  new RegExp(`^${escapedPath}`);

    let renamedDocuments;

    // retrieve all documents that are descendants of renamed doc + the actual renamed doc for convenience
    try {
        renamedDocuments = await Document.find({path: regex, workspace: workspaceId}).lean().select('_id path').exec();
    } catch (err) {
        return res.json({success: false, error: "renameDocument Error: unable to retrieve document and/or descendants for rename", trace: err});
    }

    // the new path of the renamed doc
    let documentPath = documentObj.path;
    documentPath = documentPath.slice(0, documentPath.length - documentObj.title.length) + title;

    // create update ops for each descendant of renamed doc + the actual renamed doc
    let bulkWritePathOps = renamedDocuments.map((doc) => {
        // new path is the new parent path + (old path without old parent path prefix)
        let newPath = documentPath + doc.path.slice(documentObj.path.length, doc.path.length);
        let update = doc._id.equals(documentObj._id) ? { $set: { path: newPath, title } } : { $set: { path: newPath } };
        return ({
            updateOne: {
                filter: { _id: doc._id },
                // Where field is the field you want to update
                update,
                upsert: false
            }
        })
    })

    // execute bulkWrite to make one db call for multi-update
    try {
       await Document.bulkWrite(bulkWritePathOps);
    } catch (err) {
        return res.json({success: false, error: "renameDocument Error: bulk write of paths failed", trace: err});
    }

    // extract new renamed Docs after bulk update
    try {
        let renamedIds = renamedDocuments.map((doc) => doc._id);
        renamedDocuments = await Document.find({_id: {$in: renamedIds}}).lean().select('_id title path').exec();
    } catch (err) {
        return res.json({ success: false, error: "renameDocument Error: unable to retrieve renamedDocs", trace: err });
    }

    return res.json({ success: true, result: renamedDocuments });
} 


// replace or add entire document
getDocument = async (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();
    const documentId = req.documentObj._id.toString();
    // populate everything on get calls
    let returnDocument;
    let population = "author references workspace repository tags snippets";

    // no filtering or selection --- usually get is called when we need all the data
    try {
        returnDocument =  await Document.findOne({_id: documentId, workspace: workspaceId}).select('-image')
        .lean().populate({path: population}).exec();
    } catch (err) {
        return res.json({ success: false, error: "getDocument Error: unable to get document", trace: err });
    }

    return res.json({ success: true, result: returnDocument });
}

testRoute = async (req, res) => {
    console.log("ENTERED HERE TEST", req.body);
}

// update any of the values that were returned on edit
editDocument = async (req, res) => {
    console.log("ENTERED EDIT DOCUMENT");
    const { title, markup, repositoryId, image, content } = req.body;

    const workspaceId = req.workspaceObj._id.toString();
    const documentId = req.documentObj._id.toString();

    var validRepositoryIds = req.workspaceObj.repositories.map(repositoryObj => repositoryObj.toString());
    
    let returnDocument;

    // Check that repositoryId is in accessible workspace
    if (checkValid(repositoryId)) {
        if (validRepositoryIds.indexOf(repositoryId.toString()) == -1) {
            return res.json({success: false, error: "editDocument Error: request on repository user does not have access to."});
        }
    }

    // we only want to select/populate what we are updating so we build our population/selection string as we 
    // see which values were provided for update
    let update = {};
    let selection = "_id";
    let population = "";

    if (checkValid(title)) {
        update.title = title;
        selection += " title";
    }

    if (checkValid(markup)) {
        update.markup = markup;
        selection += " markup";
    }

    if (checkValid(repositoryId)) {
        update.repository = repositoryId
        selection += " repository";
        population += "repository";
    }

    if (checkValid(image)) {
        update.image = image;
        selection += " image";
    }

    if (checkValid(content)) {
        update.content = content;
        selection += " content";
    }

    try {
        let query = Document.findOneAndUpdate({_id: documentId, workspace: workspaceId}, { $set: update }, { new: true }).lean();
        query.select(selection);
        query.populate({path: population});
        returnDocument = await query.exec();
    } catch (err) {
        return res.json({ success: false, error: "editDocument Error: update document query failed", trace: err });
    }

    return res.json({ success: true, result: returnDocument });
}


// if existing document exists in reducer, we only update reducer
retrieveHelper = async (body, req) => {

    let { notInDocumentIds, root, documentIds, referenceIds, limit, skip, minimal } = body;
    const workspaceId = req.workspaceObj._id.toString();

    let query = Document.find({workspace: workspaceId}).lean();
    let returnedDocuments;

    if (checkValid(referenceIds)) {
        query.where('references').in(referenceIds);
    }

    if (checkValid(documentIds)) {
        query.where('_id').in(documentIds);
    }
  
    if (checkValid(notInDocumentIds)) {
        query.where('_id').nin(notInDocumentIds);
    }

    if (checkValid(root)) {
        query.where('root').equals(root);
    }
    
    // depending on whether we need all the data (most of the time we only need the essentials -- minimal)
    // we will select/populate what we need
    let selection = "_id author title created path status references children root"
    let population = checkValid(minimal) ? "author references" : "author references workspace repository tags snippets";

    if (checkValid(minimal)) {
        query.select(selection);  
    } else {
        query.select('-image')
    }

    if (checkValid(limit)) {
        query.limit(limit);
    }

    if (checkValid(skip)) {
        query.skip(skip);
    }

    query.populate(population);

    try {
        returnedDocuments = await query.exec();
    } catch (err) {
        return { success: false, error: "retrieveDocuments Error: retrieve documents mongodb query failed", trace: err };
    }

    return {success: true, result: returnedDocuments};
}


// need to replace only values that exist in the object;
retrieveDocuments = async (req, res) => {

    let { root, documentIds, referenceIds, limit, skip, minimal, fill } = req.body;

    // use helper above to retrieve queried documents
    let response = await retrieveHelper({ root, documentIds, referenceIds, limit, skip, minimal }, req);
    
    // checks to see whether helper errored
    if (!response.success)   return res.json(response);

    let returnedDocuments = response.result;

    // if queried documents are specific to docIds but we want to fill to limit, query the rest
    if (fill && checkValid(documentIds) && returnedDocuments.length < limit) {
        let secondResponse = await retrieveHelper({notInDocumentIds: documentIds,  referenceIds, limit: limit - returnedDocuments.length, skip, minimal }, req);
        if (!secondResponse.success)  return res.json(secondResponse);
        let moreDocuments = secondResponse.result;
        returnedDocuments = [...returnedDocuments, ...moreDocuments];
    }

    return res.json({ success: true, result: returnedDocuments});
}


//originally attachReference
// need to replace only references
attachDocumentReference = async (req, res) => {

    const workspaceId = req.workspaceObj._id.toString();
    const documentId = req.documentObj._id.toString();
    const referenceId = req.referenceObj._id.toString();

    let returnDocument;

    let update = {};
    update.references = ObjectId(referenceId);
    
    // populate and select only whats needed -- refs and id
    let query = Document.findOneAndUpdate({_id: documentId, workspace: workspaceId}, { $push: update }, { new: true }).lean(); 
    query.populate('references');
    query.select('_id references');
    

    try {
       returnDocument = await query.exec()
    } catch (err) {
        return res.json({ success: false, error: "attachReferenceDocument Error: attach reference on documents mongodb query failed", trace: err });
    }

    return res.json({ success: true, result: returnDocument});
}


// TODO: Update this so that it automatically updates the Document's status / breakCommit

//originally removeReference
// update only references
removeDocumentReference = async (req, res) => {

    const workspaceId = req.workspaceObj._id.toString();
    const documentId = req.documentObj._id.toString();
    const referenceId = req.referenceObj._id.toString();
   
    let returnDocument;

    let update = {};
    update.references = ObjectId(referenceId);

    // populate and select only whats needed -- refs and id
    let query = Document.findOneAndUpdate({_id: documentId, workspace: workspaceId}, { $pull: update }, { new: true }).lean();
    query.populate('references');
    query.select('_id references');

    try {
        returnDocument = await query.exec();
    } catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error remove reference DB query failed documentId, referenceId: ${documentId}, ${referenceId}`,
                                function: `removeDocumentReference`});

        return res.json({ success: false, error: `Error remove reference DB query failed documentId, referenceId: ${documentId}, ${referenceId}`, trace: err });
    }


    // Spec:
    //  If removed Reference.status == 'invalid'
    //      If Document has no References set status to 'valid'
    //      If Document now has only valid References set status to 'valid'
    // Now that Reference has been removed, update the Document's status, if necessary
    // Kick off Update Checks Job

    var setStatusValid = false;

    if (req.referenceObj.status == 'invalid' && returnDocument.status == 'invalid') {
        // Fetch all References currently on the Document
        var referenceIds = returnDocument.references;
        var attachedReferences;

        try {
            attachedReferences = await Reference.find({ _id: { $in: referenceIds.map(id => ObjectId(id.toString())) } }).lean().exec();
        }
        catch (err) {
            await logger.error({source: 'backend-api', message: err,
                                    errorDescription: `Error finding attached References - documentId, referenceIds: ${documentId}, ${JSON.stringify(referenceIds)}`,
                                    function: `removeDocumentReference`});

            return res.json({ success: false, error: `Error finding attached References - documentId, referenceIds: ${documentId}, ${JSON.stringify(referenceIds)}`,
                                trace: err });
        }

        // If Document has no References set status to 'valid'
        if (attachedReferences.length == 0) {
            setStatusValid = true;
        }
        
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
                                        function: `removeDocumentReference`});

                return res.json({ success: false, error: `Error setting document status 'valid' - documentId, workspaceId: ${documentId}, ${workspaceId}`,
                                    trace: err });
            }
        }


        // Kick off Check update job
        var validatedDocuments = [documentId.toString()];
        if (validatedDocuments.length > 0) {
            var runUpdateChecksData = {};
            runUpdateChecksData['repositoryId'] = req.documentObj.repository.toString();
            runUpdateChecksData['validatedDocuments'] = validatedDocuments;
            runUpdateChecksData['validatedSnippets'] = [];

            runUpdateChecksData['jobType'] = jobConstants.JOB_UPDATE_CHECKS.toString();

            try {
                await jobs.dispatchUpdateChecksJob(runUpdateChecksData);
            }
            catch (err) {
                await logger.error({source: 'backend-api', message: err,
                                        errorDescription: `Error dispatching update Checks job - repositoryId, validatedDocuments: ${repositoryId}, ${JSON.stringify(validatedDocuments)}`,
                                        function: 'removeDocumentReference'});
            return res.json({success: false, error: `Error dispatching update Checks job - repositoryId, validatedDocuments: ${repositoryId}, ${JSON.stringify(validatedDocuments)}`});
            }
        }

    }

    // Also update UserStats.documentsBrokenNum
    if (setStatusValid) {
        try {
            var userStatUpdateResponse = await UserStatsController.updateDocumentsBrokenNum({
                                                                                                userUpdates: [{userId: req.tokenPayload.userId.toString(), updateNum: -1}],
                                                                                                workspaceId
                                                                                            });
        }
        catch (err) {
            await logger.error({source: 'backend-api', message: err,
                                    errorDescription: `Error updating documentsBrokenNum - userId, documentId, workspaceId: ${req.tokenPayload.userId.toString()}, ${documentId}, ${workspaceId}`,
                                    function: `removeDocumentReference`});

            return res.json({ success: false, error: `Error updating documentsBrokenNum - userId, documentId, workspaceId: ${req.tokenPayload.userId.toString()}, ${documentId}, ${workspaceId}`,
                                trace: err });

        }
    }

    return res.json({ success: true, result: returnDocument});
}


//originally attachTag
// update only tags
attachDocumentTag = async (req, res) => {

    const workspaceId = req.workspaceObj._id.toString();
    const documentId = req.documentObj._id.toString();
    const tagId = req.tagObj._id.toString();
   
    let returnDocument;

    let update = {};
    update.tags = ObjectId(tagId);

    // populate and select only whats needed -- tag and id
    let query = Document.findByOneAndUpdate({_id: documentId, workspace: workspaceId}, { $push: update }, { new: true }).lean();
    query.populate('tags');
    query.select('_id tags');

    try {
        returnDocument = await query.exec()
    } catch (err) {
        return res.json({ success: false, error: "attachTagDocument Error: attach tag on documents mongodb query failed", trace: err });
    }
 
    return res.json({ success: true, result: returnDocument});

}

//originally removeTag
// update only tags
removeDocumentTag = async (req, res) => {

    const workspaceId = req.workspaceObj._id.toString();
    const documentId = req.documentObj._id.toString();
    const tagId = req.tagObj._id.toString();
   
    let returnDocument;

    let update = {};
    update.tags = ObjectId(tagId);

    // populate and select only whats needed -- tag and id
    let query = Document.findOneAndUpdate({_id: documentId, workspace: workspaceId}, { $pull: update }, { new: true }).lean();
    query.populate('tags');
    query.select('_id tags');

    try {
        returnDocument = await query.exec()
    } catch (err) {
        return res.json({ success: false, error: "removeTagDocument Error: remove tag on documents mongodb query failed", trace: err });
    }
 
    return res.json({ success: true, result: returnDocument});

}

//originally attachSnippet
// update only snippets
attachDocumentSnippet = async (req, res) => {

    const workspaceId = req.workspaceObj._id.toString();
    const documentId = req.documentObj._id.toString();
    const snippetId = req.snippetObj._id.toString();

    let returnDocument;

    let update = {};
    update.snippets = ObjectId(snippetId);

    // populate and select only whats needed -- snippets and id
    let query = Document.findOneAndUpdate({_id: documentId, workspace: workspaceId}, { $push: update }, { new: true }).lean();
    query.populate('snippets');
    query.select('_id snippets');

    try {
        returnDocument = await query.exec()
    } catch (err) {
        return res.json({ success: false, error: "attachSnippetDocument Error: attach snippet on documents mongodb query failed", trace: err });
    }
 
    return res.json({ success: true, result: returnDocument});

}


//originally removeSnippet
//update only snippets
removeDocumentSnippet = async (req, res) => {

    const workspaceId = req.workspaceObj._id.toString();
    const documentId = req.documentObj._id.toString();
    const snippetId = req.snippetObj._id.toString();

    let returnDocument;

    let update = {};
    update.snippets = ObjectId(snippetId);
  
    // populate and select only whats needed -- snippets and id
    let query = Document.findByIdAndUpdate({_id: documentId, workspace: workspaceId}, { $pull: update }, { new: true }).lean();
    query.populate('snippets');
    query.select('_id snippets');

    try {
        returnDocument = await query.exec()
    } catch (err) {
        return res.json({ success: false, error: "removeSnippetDocument Error: remove snippet on documents mongodb query failed", trace: err });
    }
 
    return res.json({ success: true, result: returnDocument});
}

searchDocuments = async (req, res) => {
    const { userQuery, repositoryId, tagIds, minimalDocuments, includeImage, searchContent,
        referenceIds, creatorIds, skip, limit, sort } = req.body;
    
    const workspaceId = req.workspaceObj._id.toString();

    let documentAggregate;
    
    if (checkValid(userQuery) && userQuery !== "") {
        // make search for title
        let shouldFilter = [ 
            {
            "autocomplete": {
                    "query": userQuery,
                    "path": "title"
                }
            }];

        // make search for textual content
        if (checkValid(searchContent) && searchContent) shouldFilter.push({
                "text": {
                    "query": userQuery,
                    "path": "content"
                }
            });
        
        documentAggregate = Document.aggregate([
            { 
                $search: {
                    "compound": {
                        "should": shouldFilter,
                        "minimumShouldMatch": 1
                    } 
                }  
            },
        ]);
    } else {
        documentAggregate = Document.aggregate([]);
    }

    documentAggregate.addFields({isDocument: true,  score: { $meta: "searchScore" }});
    
    documentAggregate.match({workspace: ObjectId(workspaceId)});
    
    if (checkValid(repositoryId)) documentAggregate.match({repository: ObjectId(repositoryId)});

    if (checkValid(tagIds)) documentAggregate.match({
        tags: { $in: tagIds.map((tagId) => ObjectId(tagId)) }
    });

    if (checkValid(referenceIds)) documentAggregate.match({
        references: { $in: referenceIds.map((refId) => ObjectId(refId)) }
    });

    if (checkValid(creatorIds)) documentAggregate.match({
        author: { $in: creatorIds.map((creatorId) =>  ObjectId(creatorId)) }
    });
    
    if (checkValid(sort)) documentAggregate.sort(sort);

    if (checkValid(skip))  documentAggregate.skip(skip);
    
    if (checkValid(limit))  documentAggregate.limit(limit);

    
    let minimalProjectionString = "_id created author title status isDocument";
    let populationString = "author references workspace repository tags";
    
    if (checkValid(minimalDocuments) && minimalDocuments) {
        if (checkValid(includeImage)) minimalProjectionString += " image";
        documentAggregate.project(minimalProjectionString);
        populationString = "author";
    }
    
    try {   
        documents = await documentAggregate.exec();
    } catch(err) {
        return res.json({ success: false, error: "searchDocuments: Failed to aggregate documents", trace: err});
    }
   
    try {
        documents = await Document.populate(documents, 
            {
                path: populationString
            }
        );
    } catch (err) {
        return res.json({ success: false, error: "searchDocuments: Failed to populate documents", trace: err});
    }

    return res.json({success: true, result: documents});
}

module.exports = { testRoute, searchDocuments,
    createDocument, getDocument, editDocument, deleteDocument,
    renameDocument, moveDocument, retrieveDocuments, attachDocumentTag, removeDocumentTag, attachDocumentSnippet,
    removeDocumentSnippet, attachDocumentReference, removeDocumentReference }