//models
const Document = require('../models/Document');
const Repository = require('../models/Repository');
const Reference = require('../models/Reference');

const ReportingController = require('../controllers/reporting/ReportingController');
const UserStatsController = require('../controllers/reporting/UserStatsController');
const ActivityFeedItemController = require('../controllers/reporting/ActivityFeedItemController');

var mongoose = require('mongoose');
const UserStats = require('../models/reporting/UserStats');
const { ObjectId } = mongoose.Types;
const logger = require('../logging/index').logger;

let db = mongoose.connection;


checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true;
    }
    return false;
}


escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


/// parents children and path are updated, document is returned
/// FARAZ TODO: Make title a required field during document creation (in modal)
/// FARAZ TODO: Log times of middleware and of major points in controller methods
createDocument = async (req, res) => {
    const { markup, authorId, referenceIds, snippetIds, repositoryId, title, tagIds, parentPath, root } = req.body;
    const workspaceId = req.workspaceObj._id.toString();

    await logger.info({source: 'backend-api',
                        message: `Creating Document - workspaceId, authorId, referenceIds, snippetIds, repositoryId, title: ${workspaceId}, ${authorId}, ${JSON.stringify(referenceIds)}, ${JSON.stringify(snippetIds)}, ${repositoryId}, ${title}`,
                        function: 'createDocument'});
    
    // validation
    if (!checkValid(authorId)) return res.json({success: false, error: "createDocument error: no authorId provided.", result: null});
    if (!checkValid(title) || (title === "" && !root)) return res.json({
        success: false, error: "createDocument error: no title provided.", result: null, alert: "Please provide a title"});
    if (!checkValid(markup) && !root) return res.json({success: false, error: "createDocument error: no markup provided."});
    // make sure title doesn't exist already in space
    try {
        let duplicate = await Document.exists({title, workspace: workspaceId});
        if (duplicate) {
            await logger.info({source: 'backend-api',
                                message: `Create Document duplicate title - workspaceId, authorId, title: ${workspaceId}, ${authorId}, ${title}`,
                                function: 'createDocument'});
            return res.json({success: false, error: "createDocument Error: duplicate title.", alert: "Duplicate title in space.. Please select a unique title"})
        }
    } catch (err) {
        await logger.error({source: 'backend-api',
                            error: err,
                            errorDescription: `Create Document Error validation on duplicate title failed - workspaceId, authorId, title: ${workspaceId}, ${authorId}, ${title}`,
                            function: 'createDocument'});
        return res.json({success: false, error: "createDocument Error: validation on duplicate title failed.", trace: err});
    }
    

    // Check that repositoryId is in accessible workspace
    const validRepositoryIds = req.workspaceObj.repositories;

    if (checkValid(repositoryId)) {
        if (!validRepositoryIds.includes(repositoryId)) {
            await logger.info({source: 'backend-api',
                                message: `Create Document User can't access Repository - workspaceId, repositoryId authorId: ${workspaceId}, ${repositoryId}, ${authorId}`,
                                function: 'createDocument'});
            return res.json({success: false, error: "createDocument Error: request on repository user does not have access to."});
        }
    }
    
     // Check that authorId matches the userId in the JWT (only the user can create a document for themselves)
    if (authorId != req.tokenPayload.userId && req.tokenPayload.role != 'dev') {
        await logger.info({source: 'backend-api',
                            message: `Create Document userId doesn't match authorId - authorId, userId, workspaceId: ${authorId}, ${req.tokenPayload.userId}, ${workspaceId}`,
                            function: 'createDocument'});
        return res.json({success: false, error: "createDocument Error: userId in JWT doesn't match authorId."});
    }

    // Get parent of newly created document to add to parent's children 
    let parent;

    if (checkValid(parentPath)) {
        try {   
            parent = await Document.findOne({path: parentPath, workspace: workspaceId})
                                    .select('_id path children').exec();
        } catch (err) {
            await logger.error({source: 'backend-api',
                                error: err,
                                errorDescription: `Create Document Error invalid parentPath - workspaceId, parentPath: ${workspaceId}, ${parentPath}`,
                                function: 'createDocument'});

            return res.json({success: false, error: `createDocument Error: invalid parentPath`, trace: err});
        }
    // if created document is root, no need to update a "parent"
    } else if (!root) {
        await logger.error({source: 'backend-api',
                            error: err,
                            errorDescription: `Create Document Error no parentPath provided  - workspaceId, authorId: ${workspaceId}, ${authorId}`,
                            function: 'createDocument'});
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
            path: documentPath,
            markup,
            status: 'valid'
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
        await logger.error({source: 'backend-api',
                            error: err,
                            errorDescription: `Create Document Error document.save() failed - workspaceId, authorId, title, path: ${workspaceId}, ${authorId}, ${title}, ${documentPath}`,
                            function: 'createDocument'});
        return res.json({success: false, error: "createDocument Error: document creation failed", trace: err});
    }

    // Reporting Section
    if (document.root != true) {
        try {
            await ReportingController.handleDocumentCreate(authorId, workspaceId, title, document._id.toString());
        }
        catch (err) {
            await logger.error({source: 'backend-api',
                                    message: err,
                                    errorDescription: `Error handleDocumentCreate - authorId, workspaceId, documentId: ${authorId}, ${workspaceId}, ${documentObj._id.toString()}`,
                                    function: `handleDocumentDelete`});

            return res.json({success: false,
                                error: `Error handleDocumentCreate - authorId, workspaceId, documentId: ${authorId}, ${workspaceId}, ${documentObj._id.toString()}`,
                                trace: err});
        }
    }

    // add document to parent's children
    if (!root) {
        try {
            parent.children.push(document._id);
            parent = await parent.save();
        } catch (err) {
            await logger.error({source: 'backend-api',
                                error: err,
                                errorDescription: `Create Document Error parent update children failed - workspaceId, authorId, parentId, documentId: ${workspaceId}, ${authorId}, ${parent._id.toString()}, ${document._id.toString()}`,
                                function: 'createDocument'});
            return res.json({success: false, error: "createDocument Error: parent update children failed", trace: err});
        }
    }

    // populate everything on the document on creation
    try {
        document = await Document.populate(document, {path: "author references workspace repository tags snippets"});
    } catch (err) {
        await logger.error({source: 'backend-api',
                            error: err,
                            errorDescription: `Create Document Error document population failed - workspaceId, authorId, title: ${workspaceId}, ${authorId}, ${title}`,
                            function: 'createDocument'});
        return res.json({success: false, error: "createDocument Error: document population failed", trace: err});
    }

    await logger.info({source: 'backend-api',
                        message: `Successfully created document - workspaceId, authorId, documentId, title: ${workspaceId}, ${authorId}, ${document._id.toString()}, ${title}`,
                        function: 'createDocument'});
   
    return root ? res.json({success: true, result: [document]}) : 
        res.json({success: true, result: [document, parent]});
}  


// paths of modifiedDocs are changed, children of parents are changed
moveDocument = async (req, res) => {

    const session = await db.startSession();
    // extract old and new parent as well as the new index of placement
    let output;

    await session.withTransaction(async () => {
        const { oldParentId, newParentId, newIndex } = req.body;
        const documentId = req.documentObj._id.toString();
        const workspaceId = req.workspaceObj._id.toString();
    
        const documentObj = req.documentObj;
    
        let oldParent, newParent, modifiedDocuments;
    
        // check if we're moving the document into the same directory or not
        let sameDir = oldParentId === newParentId;
    
        await logger.info({source: 'backend-api',
                            message: `Move Document attempting to move ${documentId} from old parent ${oldParentId} to new parent ${newParentId} - workspaceId: ${workspaceId}`,
                            function: 'moveDocument'});
    
        // checks if both parentIds are provided else throws error
        if (checkValid(oldParentId) && checkValid(newParentId)) {
            // trys to retrieve the oldParent, does some validation to make sure oldParent is indeed the current parent
            try {
                oldParent = await Document.findOne({_id: oldParentId, workspace: workspaceId})
                    .select('_id path children').exec();
                if (oldParent.path >= documentObj.path || 
                    documentObj.path.slice(0, oldParent.path.length) !== oldParent.path) {
                        await logger.error({source: 'backend-api',
                                            error: Error(`Old parent path does not match Document's parent's path`),
                                            errorDescription: `Old parent path does not match Document's parent path - workspaceId, document path, oldParent path: ${workspaceId}, ${documentObj.path.slice(0, oldParent.path.length)}, ${oldParent.path}`,
                                            function: 'moveDocument'});
    
                        output = {success: false, error: `moveDocument Error: oldParent is not correct oldParent`};
                        throw new Error(`moveDocument Error: oldParent is not correct oldParent`);
                    }
            } catch (err) {
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `Move Document Error invalid oldParentId - workspaceId, oldParentId: ${workspaceId}, ${oldParentId}`,
                                    function: 'moveDocument'});
                output = {success: false, error: `moveDocument Error: invalid oldParentId`, trace: err};
                throw new Error(`moveDocument Error: invalid oldParentId`);
            }
    
            // filter out the doc from it's old parent's children and save the old parent
            oldParent.children = oldParent.children.filter((childId) => childId.toString() !== documentId);
    
            try {
                oldParent = await oldParent.save();
            } catch (err) {
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `Move Document Error oldParent save failed - workspaceId, oldParentId: ${workspaceId}, ${oldParentId}`,
                                    function: 'moveDocument'});
    
                output = {success: false, error: `moveDocument Error: oldParent save failed`, trace: err};
                throw new Error(`moveDocument Error: oldParent save failed`);
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
                            await logger.error({source: 'backend-api',
                                                    error: Error(`newParent is child of movedDocument`),
                                                    errorDescription: `newParent is child of movedDocument - workspaceId, document path, newParent path: ${workspaceId}, ${documentObj.path}, ${newParent.path.slice(0, documentObj.path.length)}`,
                                                    function: 'moveDocument'});
    
                            output = {success: false, error: `moveDocument Error: newParent is child of movedDocument`};
                            throw new Error(`moveDocument Error: newParent is child of movedDocument`);
                        }
                } catch (err) {
                    await logger.error({source: 'backend-api',
                                        error: err,
                                        errorDescription: `Move Document Error invalid newParentId - workspaceId, newParentId: ${workspaceId}, ${newParentId}`,
                                        function: 'moveDocument'});
    
                    output = {success: false, error: `moveDocument Error: invalid newParentId`, trace: err};
                    throw new Error(`moveDocument Error: invalid newParentId`);
                }
            }
    
            //splice the movedDocument into the right location in the newParents children
            newParent.children.splice(newIndex, 0, documentId);
            try {
                newParent = await newParent.save();
            } catch (err) {
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `Move Document Error invalid newParentId - workspaceId, newParentId: ${workspaceId}, ${newParentId}`,
                                    function: 'moveDocument'});
    
                output = {success: false, error: `moveDocument Error: newParent save failed`, trace: err};
                throw new Error(`moveDocument Error: newParent save failed`);
            }
    
        } else {
            await logger.error({source: 'backend-api',
                                error: Error(`parentIds not provided`),
                                errorDescription: `parentIds not provided - workspaceId: ${workspaceId}`,
                                function: 'moveDocument'});
            output = {success: false, error: "moveDocument Error: parentIds not provided"};
            throw new Error("moveDocument Error: parentIds not provided");
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
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `Move Document Error failed retrieving document descendants for update - workspaceId, document path: ${workspaceId}, ${documentObj.path}`,
                                    function: 'moveDocument'});
    
                output = {success: false, error: "moveDocument Error: failed retrieving document descendants for update", trace: err};
                throw new Error("moveDocument Error: failed retrieving document descendants for update");
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
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `Move Document Error bulk write of paths failed - workspaceId: ${workspaceId}`,
                                    function: 'moveDocument'});
    
                output = {success: false, error: "moveDocument Error: bulk write of paths failed", trace: err};
                throw new Error("moveDocument Error: bulk write of paths failed");
            }
    
            // get the modified docs once again through query as update + bulkwrite does not return the docs affected
            try {
                let modifiedIds = modifiedDocuments.map((doc) => doc._id);
                modifiedDocuments = await Document.find({_id: { $in: modifiedIds } }).lean()
                    .select('path _id').exec();
            } catch (err) {
                await logger.error({source: 'backend-api',
                                    error: err,
                                    errorDescription: `Move Document Error retrieve modifiedDocs failed - workspaceId, modifiedIds: ${workspaceId}, ${JSON.stringify(modifiedIds)}`,
                                    function: 'moveDocument'});
    
                output = {success: false, error: "moveDocument Error: unable to retrieve modifiedDocs", trace: err};
                throw new Error("moveDocument Error: unable to retrieve modifiedDocs");
            }
        }
    
        await logger.info({source: 'backend-api',
                            message: `Successfully Moved Document ${documentId} from old parent ${oldParentId} to new parent ${newParentId} - workspaceId: ${workspaceId}`,
                            function: 'moveDocument'});
    
        output = sameDir ? {success: true, result: [newParent]} : {success: true, result: [oldParent, newParent, ...modifiedDocuments]};
        return 
    });
    
    session.endSession();

    return res.json(output);
}


// remove ids of deleted docs if they exist, change parent's children
deleteDocument = async (req, res) => {

    const documentObj = req.documentObj;
    const workspaceId = req.workspaceObj._id.toString();
    const userId = req.tokenPayload.userId.toString();

    const repositoryId = req.documentObj.repository._id.toString();

    // escape the path of the document so regex characters don't affect the query
    const escapedPath = escapeRegExp(`${documentObj.path}`);
    const regex =  new RegExp(`^${escapedPath}`);

    await logger.info({source: 'backend-api',
                        message: `Delete Document attempting to delete ${documentObj._id.toString()} - workspaceId, userId: ${workspaceId}, ${userId}`,
                        function: 'deleteDocument'});

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
            await logger.error({source: 'backend-api',
                                error: err,
                                errorDescription: `Delete Document Error findOne parent query failed - workspaceId, userId, parentPath: ${workspaceId}, ${userId}, ${parentPath}`,
                                function: 'deleteDocument'});

            return res.json({success: false, error: "deleteDocument Error: unable to retrieve parent from path", trace: err});
        }

        // filter the children of the parent to remove the deleted top level document
        parent.children = parent.children.filter(child => !(child._id.equals(documentObj._id)));

        try {
            parent = await parent.save();
        } catch (err) {
            await logger.error({source: 'backend-api',
                                error: err,
                                errorDescription: `Delete Document Error parent.save() query failed - workspaceId, userId, parentId: ${workspaceId}, ${userId}, ${parent._id.toString()}`,
                                function: 'deleteDocument'});
            return res.json({success: false, error: "deleteDocument Error: unable to save parent", trace: err});
        }


        // add the parent to finalResult
        finalResult.parent = parent;
    }

    // find all documents that are about to be deleted (toplevel doc included for cleanliness)
    try {
        deletedDocuments = await Document.find({path: regex, workspace: workspaceId}).select("_id").lean().exec();
    } catch (err) {
        await logger.error({source: 'backend-api',
                            error: err,
                            errorDescription: `Delete Document Error find deletedDocuments query failed - workspaceId, userId, path: ${workspaceId}, ${userId}, ${documentObj.path}`,
                            function: 'deleteDocument'});

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
        await logger.error({source: 'backend-api',
                            error: err,
                            errorDescription: `Delete Document Error deleteMany query failed - workspaceId, userId, deletedIds: ${workspaceId}, ${userId}, ${JSON.stringify(deletedIds)}`,
                            function: 'deleteDocument'});

        return res.json({success: false, error: "deleteDocument Error: unable to delete document and/or descendants", trace: err});
    }

    try {
        await ReportingController.handleDocumentDelete(deletedDocumentInfo, workspaceId, repositoryId, userId);
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error handling Document delete Reporting updates workspaceId, userId, documentId: ${workspaceId}, ${userId}, ${documentObj._id.toString()}`,
                            function: `handleDocumentDelete`});

        return res.json({success: false, error: `Error handling Document delete Reporting updates workspaceId, userId, documentId: ${workspaceId}, ${userId}, ${documentObj._id.toString()}`, trace: err});
    }


    // since delete many does not return documents, but we only need ids, we can use previous extracted deletedDocuments
    finalResult.deletedDocuments = deletedDocuments;

    await logger.info({source: 'backend-api',
                        message: `Successfully deleted ${finalResult.deletedDocuments.length} documents - workspaceId, userId, deletedDocuments: ${workspaceId}, ${userId}, ${JSON.stringify(deletedDocuments)}`,
                        function: 'deleteDocument'});

    console.log('Delete Document Returning: ');
    console.log(finalResult);

    return res.json({success: true, result: finalResult});
}


// title + path of main doc changed, path of descendants changed
renameDocument = async (req, res) => {

    // extract new title that will be used to rename
    const { title } = req.body;
    if (!checkValid(title)) return res.json({success: false, error: 'renameDocument: error no title provided', alert: "Please provide a title"});

    
    const workspaceId = req.workspaceObj._id.toString();
    const { documentObj } = req;

    await logger.info({source: 'backend-api',
                        message: `Rename Document attempting to rename ${documentObj._id} - workspaceId, userId, oldTitle, newTitle: ${workspaceId}, ${req.tokenPayload.userId}, ${documentObj.title}, ${title}`,
                        function: 'renameDocument'});

    // make sure title doesn't exist already in space
    try {
        let duplicate = await Document.exists({title, workspace: workspaceId});
        if (duplicate) {
            await logger.info({source: 'backend-api',
                                message: `duplicate title.`,
                                function: 'renameDocument'});

            return res.json({success: false, error: "renameDocument Error: duplicate title.", alert: "Duplicate title in space.. Please select a unique title"})
        }
    } catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Rename Document Error title exists query failed - workspaceId, userId, title: ${workspaceId}, ${req.tokenPayload.userId}, ${title}`,
                            function: `renameDocument`});

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
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Rename Document Error find() renamed doc descendants query failed - workspaceId, userId, path: ${workspaceId}, ${req.tokenPayload.userId}, ${path}`,
                            function: `renameDocument`});

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
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Rename Document Error bulkWrite query failed - workspaceId, userId, documentId: ${workspaceId}, ${req.tokenPayload.userId}, ${documentObj._id.toString()}`,
                            function: `renameDocument`});

        return res.json({success: false, error: "renameDocument Error: bulk write of paths failed", trace: err});
    }

    // extract new renamed Docs after bulk update
    try {
        let renamedIds = renamedDocuments.map((doc) => doc._id);
        renamedDocuments = await Document.find({_id: {$in: renamedIds}}).lean().select('_id title path').exec();
    } catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Rename Document Error find() renamed doc descendants query failed - workspaceId, userId, path: ${workspaceId}, ${req.tokenPayload.userId}, ${path}`,
                            function: `renameDocument`});
        return res.json({ success: false, error: "renameDocument Error: unable to retrieve renamedDocs", trace: err });
    }

    await logger.info({source: 'backend-api',
                        message: ``,
                        function: 'renameDocument'});

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

// update any of the values that were returned on edit
editDocument = async (req, res) => {
    const { title, markup, referenceIds, repositoryId, image, content } = req.body;

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
        population += " repository";
    }

    if (checkValid(image)) {
        update.image = image;
        selection += " image";
    }

    if (checkValid(content)) {
        update.content = content;
        selection += " content";
    }

    if (checkValid(referenceIds)){
        update.references = referenceIds.map(refId => ObjectId(refId));
        selection += " references";
        population += " references";
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
    const userId = req.tokenPayload.userId.toString();
   
    let returnDocument;

    let update = {};
    update.references = ObjectId(referenceId);

    // populate and select only whats needed -- refs and id
    let query = Document.findOneAndUpdate({_id: documentId, workspace: workspaceId}, { $pull: update }, { new: true }).lean();
    query.populate('references');
    query.select('_id status repository references');

    try {
        returnDocument = await query.exec();
    } catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error remove reference DB query failed documentId, referenceId: ${documentId}, ${referenceId}`,
                                function: `removeDocumentReference`});

        return res.json({ success: false, error: `Error remove reference DB query failed documentId, referenceId: ${documentId}, ${referenceId}`, trace: err });
    }


    try {
        await ReportingController.handleDocumentReferenceRemove(req.referenceObj.status, returnDocument, userId, workspaceId);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error handleDocumentReferenceRemove referenceId, referenceStatus, documentId, userId, workspaceId: ${referenceId}, ${req.referenceObj.status}, ${documentId}, ${userId}, ${workspaceId}`,
                                function: `handleDocumentReferenceRemove`});

        return res.json({ success: false,
                            error: `Error handleDocumentReferenceRemove referenceId, referenceStatus, documentId, userId, workspaceId: ${referenceId}, ${req.referenceObj.status}, ${documentId}, ${userId}, ${workspaceId}`,
                            trace: err });
    }

    delete returnDocument.repository;

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
    let query = Document.findOneAndUpdate({_id: documentId, workspace: workspaceId}, { $push: update }, { new: true }).lean();
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
    let query = Document.findOneAndUpdate({_id: documentId, workspace: workspaceId}, { $pull: update }, { new: true }).lean();
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

    let documents = await documentAggregate.exec();

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
        if (checkValid(includeImage) && includeImage) minimalProjectionString += " image";
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

module.exports = { searchDocuments,
    createDocument, getDocument, editDocument, deleteDocument,
    renameDocument, moveDocument, retrieveDocuments, attachDocumentTag, removeDocumentTag, attachDocumentSnippet,
    removeDocumentSnippet, attachDocumentReference, removeDocumentReference }