const Document = require('../models/Document');

const Repository = require('../models/Repository');
const Reference = require('../models/Reference');

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}

removeDuplicates = (modifiedDocs) => {
    var seenIds = {};
    var finalResults = [];
    var x = 0;
    var currentDoc = undefined;
    for (x = 0; x < modifiedDocs.length; x++) {
        currentDoc = modifiedDocs[x];
        if (!seenIds[currentDoc._id.toString()]) {
            seenIds[currentDoc._id.toString()] = true;
            finalResults.push(currentDoc);
        }
    }
    return finalResults;
}

// TODO: add order validation
// Assumption: referenceIds only consists of valid references
createDocument = async (req, res) => {
    const { authorId, referenceIds, childrenIds, repositoryId,
        title, root, markup, tagIds, parentId/*, order*/ } = req.body;
    const { workspaceId } = req.params;

    if (!checkValid(authorId)) return res.json({success: false, error: "createDocument error: no authorId provided.", result: null});
    if (!checkValid(repositoryId)) return res.json({success: false, error: "createDocument error: no repositoryId provided.", result: null});
    if (!checkValid(workspaceId)) return res.json({success: false, error: "createDocument error: no workspaceId provided.", result: null});
    if (!checkValid(title)) return res.json({success: false, error: "createDocument error: no title provided.", result: null});
    // if (!checkValid(order)) return res.json({success: false, error: "createDocument error: no order provided.", result: null});
    var order = 0;

    var parentPath = '';
    var parent;
    // Get parent
    if (parentId) {
        parent = await Document.findById(ObjectId(parentId));
        if (!parent) {
            return res.json({success: false, error: 'createDocument: error getting parent Document - parentId: ' + parentId.toString, result: null});
        }
        parentPath = parent.path;
    }

    if (parentPath.length > 0) {
        parentPath = parentPath + '/';
    }


    var modifiedDocs = [];


    //if (!typeof author == 'undefined' && author !== null) return res.json({success: false, error: 'no document author provided'});
    //if (!typeof title == 'undefined' && title !== null) return res.json({success: false, error: 'no document title provided'});

    var workingTitle = '';
    var emptyTitle = false;

    // If we are creating an 'untitled_[0-9]+' document 
    if (title == '') {
        emptyTitle = true;
        workingTitle = 'untitled_';
        var re = new RegExp('^' + parentPath + 'untitled_[0-9]+$', 'i');
        var untitledDocuments = await Document.find({path: {$regex: re}, workspace: ObjectId(workspaceId)});
        console.log('other untitledDocuments: ');
        console.log(untitledDocuments);


        if (untitledDocuments.length > 0) {
            var temp = 
                untitledDocuments.map(docObj => { 
                    var tempTitle = docObj.path.split('/');
                    tempTitle = tempTitle[tempTitle.length-1];
                    return tempTitle.match(/\d+$/) == null ? -1 : tempTitle.match(/\d+$/)[0];
                    // return docObj.title.match(/\d+$/) == null ? -1 : docObj.title.match(/\d+$/)[0]
                });
            console.log('untitledDocuments: ');
            console.log(temp);
            var max = Math.max(...temp);
            console.log('found max: ', max);
            workingTitle = workingTitle + (max + 1).toString();
        }
        else {
            console.log('making first untitled');
            workingTitle = workingTitle + '1';
        }
    }

    // Were given a title, so have to check it's uniqueness
    else {
        workingTitle = title;
       var duplicateDocument = await Document.findOne({path: parentPath + workingTitle, workspace: ObjectId(workspaceId)});
       if (duplicateDocument) {
           return res.json({success: false, 
            error: 'createDocument: error creating Document, duplicate name - '
            + parentPath + workingTitle, result: null});
       }
    }

    let document = new Document(
        {
            author: ObjectId(authorId),
            repository: ObjectId(repositoryId),
            workspace: ObjectId(workspaceId),
            title: emptyTitle ? '' : workingTitle,
            path: parentPath + workingTitle,
            order
        },
    );

    if (parentId) {
        document.parent = ObjectId(parentId);
    }

    if (!parentId) document.parent = null;


    if (checkValid(referenceIds)) {
        document.references = referenceIds.map(referenceId => ObjectId(referenceId))
    }

    if (checkValid(childrenIds)){
        document.children = childrenIds.map(childrenId => ObjectId(childrenId))
    }

    if (checkValid(root)){
        console.log(root)
        document.root = root
    }

    document.status = 'valid';


    document.save(async (err, document) => {
        if (err) return res.json({ success: false, error: err, result: null });
        var pushParent = false;

        // Increment `order` of parent's children
        if (parent) {
            await Document.updateMany({_id: {$in: parent.children.map(childObj => ObjectId(childObj._id.toString()))},
                    order: {$gte: order}},
                    {$inc: {order: 1}});
            var incrementDocs = await Document.find(
                {
                    _id: {$in: parent.children.map(childObj => ObjectId(childObj._id.toString()))},
                    order: {$gte: (order+1)}
                }
            );
            modifiedDocs = modifiedDocs.concat(incrementDocs);
        }
        else {
            await Document.updateMany({ parent: null, _id: {$ne: ObjectId(document._id.toString())}, workspace: ObjectId(workspaceId), order: {$gte: order} },
                {$inc: {order: 1}});
            var incrementDocs = await Document.find(
                {
                    parent: null,
                    _id: {$ne: ObjectId(document._id.toString())},
                    workspace: ObjectId(workspaceId),
                    order: {$gte: (order+1)}
                }
            );
            modifiedDocs = modifiedDocs.concat(incrementDocs);
        }


        if (parentId) {
            // parent.children.push(ObjectId(document._id));
            parent = await Document.findOneAndUpdate({_id: ObjectId(parent._id.toString())}, 
              { $push: {children: ObjectId(document._id) }},
              { new: true});

            // await parent.save();
            pushParent = true;
            // modifiedDocs.push(parent);
        }


        document.populate('author').populate('repository').populate('workspace').populate('references').populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err, result: [document] });
            modifiedDocs.push(document);
            if (pushParent) {
             modifiedDocs.push(parent);
            }

            modifiedDocs.reverse();
            var finalResults = removeDuplicates(modifiedDocs);

            return res.json({success: true, result: finalResults});
        });
    });
}

getDocument = (req, res) => {
    Document.findById(req.params.id).populate('parent').populate('repository').populate('workspace').populate('references').populate('tags').exec(function (err, document) {
        if (err) return res.json({ success: false, error: err });
        return res.json(document);
    });
}

getParent = (req, res) => {
    let query = Document.findOne({})
    
    query.where('children').equals(req.params.id)
    query.populate('parent').populate('author').populate('workspace')
    .populate('repository').populate('references')
    .populate('tags').exec((err, document) => {
        if (err) return res.json(err);
        return res.json(document)
    })
}



editDocument = (req, res) => {
    const { id } = req.params;
    const { title, markup, repositoryId } = req.body;
    let update = {};
    if (title) update.title = title;
    if (markup) update.markup = markup;
    if (repositoryId) update.repository = repositoryId
    Document.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('parent').populate('author').populate('workspace')
        .populate('repository').populate('references')
        .populate('tags', (err, document) => {
            if (err) return res.json(err);
            return res.json(document);
        });
    });
}


deleteDocument = async (req, res) => {
    const { documentId } = req.body;
    if (!checkValid(documentId)) {
        return res.json({success: false, error: 'deleteDocument: error no id passed', result: null});
    }

    var modifiedDocs = [];

    console.log('documentId: ', documentId);
    console.log(typeof documentId);
    var toDelete = await Document.findById(documentId);
    if (!toDelete) {
        return res.json({success: false, error: 'deleteDocument: error could not find document to delete', result: null});
    }

    if (toDelete.parent != null) {

        await Document.update({_id: ObjectId(toDelete.parent.toString())}, 
            { $pull: {children: ObjectId(documentId) }});


        const parentObj = await Document.findById(toDelete.parent);
        modifiedDocs.push(parentObj);

        await Document.updateMany({$and: 
                [
                    {_id: {$in: parentObj.children.map(childObj => ObjectId(childObj._id.toString()))}},
                    {_id: {$ne: ObjectId(documentId)}}
                ],
                order: {$gt: toDelete.order}},
                {$inc: {order: -1}});
        modifiedDocs = modifiedDocs.concat(await Document.find({$and: 
                [
                    {_id: {$in: parentObj.children.map(childObj => ObjectId(childObj._id.toString()))}},
                    {_id: {$ne: ObjectId(documentId)}}
                ],
                order: {$gt: (toDelete.order-1)}
            }));
    }
    else {
        await Document.updateMany({ parent: null, _id: {$ne: ObjectId(documentId)}, workspace: ObjectId(workspaceId), order: {$gt: toDelete.order} },
            {$inc: {order: -1}});
        modifiedDocs = modifiedDocs.concat(await Document.find({
            parent: null,
            _id: {$ne: ObjectId(documentId)},
            workspace: ObjectId(workspaceId),
            order: {$gt: (toDelete.order-1)}
        }));
    }
    var pathToDelete = toDelete.path;
    var re = new RegExp(pathToDelete + '.*', 'i');
    modifiedDocs = modifiedDocs.concat( await Document.find(
        {path: {$regex: re}, workspace: ObjectId(workspaceId)
    }));

    await Document.deleteMany({path: {$regex: re}, workspace: ObjectId(workspaceId)}, (err) => {
        if (err) {
            return res.json({ success: false, error: err, result: toDelete });
        }
        modifiedDocs.reverse();
        var finalResults = removeDuplicates(modifiedDocs);
        console.log('Delete successful');
        return res.json({success: true, result: finalResults});
    });
}

renameDocument = async (req, res) => {
    const { documentId, title } = req.body;
    if (!checkValid(documentId)) return res.json({success: false, error: 'renameDocument: error no documentId provided.', result: null});
    if (!checkValid(title)) return res.json({success: false, error: 'renameDocument: error no name provided', result: null});
    var oldDocument = await Document.findById(documentId);
    if (!oldDocument) {
        return res.json({success: false, error: 'renameDocument: error could not find document: ' + documentId, result: null});
    }

    var untouchedOldPath = `${oldDocument.path}`;
    var oldPath = oldDocument.path;
    var oldTitle = oldDocument.title;
    var oldPathItemCount = oldPath.split('/').length;

    var modifiedDocs = [];

    if (title == oldTitle) {
        return res.json({success: false, result: [oldDocument]});
    }

    var newProposedPath = oldPath.split('/');
    newProposedPath[newProposedPath.length - 1] = title;// .length > 0 ? title : '';
    newProposedPath = newProposedPath.join('/');
    var duplicateDocument = await Document.findOne({path: newProposedPath, workspace: ObjectId(workspaceId)});
    if (duplicateDocument) {
        return res.json({success: false, 
        error: 'renameDocument: error renaming Document, duplicate path - '
        + newProposedPath, result: [duplicateDocument]});
    }

    var temp = oldPath.split('/');
    console.log('temp for parentPath: ');
    console.log(temp);
    var parentPath = temp.slice(0, temp.length - 1).join('/');
    var workingTitle = 'untitled_';

    var oldDocumentId = undefined;
    

    if (title == '') {
        console.log('parentPath: ', parentPath);
        var re = new RegExp('^' + parentPath + 'untitled_[0-9]+$', 'i');
        var untitledDocuments = await Document.find({path: {$regex: re}, workspace: ObjectId(workspaceId)});
        console.log('other untitledDocuments: ');
        console.log(untitledDocuments);

        if (untitledDocuments.length > 0) {
                untitledDocuments.map(docObj => {
                    var tempTitle = docObj.path.split('/');
                    tempTitle = tempTitle[tempTitle.length-1];
                    console.log('tempTitle: ', tempTitle);
                    return tempTitle.match(/\d+$/) == null ? -1 : tempTitle.match(/\d+$/)[0];
                });
            console.log('untitledDocuments: ');
            console.log(temp);
            var max = Math.max(...temp);
            console.log('found max: ', max);
            workingTitle = workingTitle + (max + 1).toString();
        }
        else {
            console.log('making first untitled');
            workingTitle = workingTitle + '1';
        }
        oldDocument.path = parentPath.length > 1 ? parentPath + "/" + workingTitle : workingTitle;
        oldDocument.title = title;
        oldPath = parentPath.length > 1 ? parentPath + "/" + workingTitle : workingTitle;
        await oldDocument.save();
        modifiedDocs.push(oldDocument);
    }

    console.log('oldPath: ', oldPath);


    var re = new RegExp(untouchedOldPath, 'i');
    var oldPaths = await Document.find({path: {$regex: re}, workspace: ObjectId(workspaceId)});//.select('name path');
    oldPaths = oldPaths.map( docObj => {
        var pathItems;
        // If this is the oldDocument
        if (docObj.path == oldDocument.path && docObj.title == oldTitle) {
            docObj.title = title; // workingTitle.length > 'untitled_'.length ? workingTitle : title;
            console.log('OLD PATH: ', docObj.path);
            console.log('workingTitle: ', workingTitle);
        }
        pathItems = docObj.path.split('/');

        pathItems[oldPathItemCount-1] = workingTitle.length > 'untitled_'.length ? workingTitle : title;

        docObj.path = pathItems.join('/');
        return docObj;
    });

    // console.log('oldPaths[0]: ');
    // console.log(oldPaths[0]);
    var modifiedObjIds = oldPaths.map(docObj => {
        return docObj._id;
    });


    // Upsert all of the tree References
    const bulkRenameOps = oldPaths.map(docObj => ({
   
        updateOne: {
                filter: { _id: docObj._id },
                // Where field is the field you want to update
                update: { $set: { title: docObj.title, path: docObj.path } },
                upsert: false
                }
            }));
    if (bulkRenameOps.length > 0) {
        await Document.collection
            .bulkWrite(bulkRenameOps)
            .then(async (results) => {
                console.log(results);
                modifiedDocs = modifiedDocs.concat(await Document.find({_id: {$in: modifiedObjIds}}));
                // var originalDoc = await Document.findById({_id: documentId});
                // modifiedDocs.push(originalDoc);
                return res.json({success: true, result: modifiedDocs});
            })
            .catch((err) => {
                return res.json({success: false, error: 'renameDocument: error bulk renaming Documents: ' + err, result: [oldDocument]});
            });
    }
    else {
        return res.json({success: false, error: 'renameDocument: error no Documents to rename.', result: [oldDocument]});
    }
}

moveDocument = async (req, res) => {
    var { documentId, parentId, order } = req.body;
    if (!checkValid(documentId)) return res.json({success: false, error: 'moveDocument: error no documentId provided.', result: null});
    if (!checkValid(parentId)) return res.json({success: false, error: 'moveDocument: error no parentId provided', result: null});
    if (!checkValid(order)) return res.json({success: false, error: 'moveDocument: error no order provided', result: null});

    order = parseInt(order);

    var oldDocument = await Document.findById(documentId);
    if (!oldDocument) {
        return res.json({success: false, error: 'moveDocument: error could not find document to move', result: null});
    }

    var workspaceId = oldDocument.workspace.toString();

    var originalOrder = oldDocument.order;
    oldDocument.order = order;

    var modifiedDocs = [];
    var usedOldParentId = '';

    var originalParent = oldDocument.parent;

    if (oldDocument.parent != null) {
        originalParent = await Document.findOneAndUpdate({_id: ObjectId(oldDocument.parent.toString())}, 
              { $pull: {children: ObjectId(documentId) }},
              {new: true});
        
        usedOldParentId = originalParent._id;
    
        // modifiedDocs.push(originalParent);
    }

    // set newPath
    var newPath = '';
    var newParent = undefined;
    var newParentId = undefined;


    var parentToSet = undefined;

    // Determine the value to set the document's parent field to
    // Update the document's new parent, if not null, to add the documentId to children
    if (parentId != '') {
        newParent = await Document.findById(parentId);
        if (!newParent) {
            return res.json({success: false, error: 'moveDocument: error could not find parent document', result: [oldDocument]});
        }

        // Don't allow moving the original document into its own child
        if (newParent.path.indexOf(oldDocument.path) == 0) {
            return res.json({success: false, error: 'moveDocument: error cannot move parent into its own child', result: [oldDocument]});
        }

        newParent = await Document.findOneAndUpdate({_id: ObjectId(parentId)}, 
          { $push: {children: ObjectId(documentId) }},
          { new: true});
        parentToSet = ObjectId(parentId);
        // oldDocument.parent = ObjectId(parentId);

        newParentId = newParent._id;
        console.log('Found a parent object');
        // modifiedDocs.push(newParent);
        newPath = newParent.path;
    }

    else {
        parentToSet = null;
    }



    // If parents are the same and moving child to the end
    // If the request was made with the same order as the max, we just increment the order by 1
    if (newParent == null && originalParent == null) {
        var rootChildren = await Document.find({parent: null, workspace: ObjectId(workspaceId)});
        var rootOrders = rootChildren.map(childObj => parseInt(childObj.order));
        if (Math.max(...rootOrders) == order) {
            console.log('Incrementing Order');
            order += 1
        }
    }
    else if (newParent != null && originalParent != null) {
        if (newParent._id.toString() == originalParent._id.toString()) {
            // console.log('newParent.children: ', newParent.children);
            var newParentChildren = newParent.children.filter(childObj => childObj.toString() != oldDocument._id.toString());
            // console.log('newParentChildren: ', newParentChildren);
            newParentChildren = await Document.find({_id: { $in: newParentChildren}});
            newParentChildren = newParentChildren.map(childObj => parseInt(childObj.order));
             // newParentChildren.map(childObj => parseInt(childObj.order));
            console.log('newParentChildren: ', newParentChildren);
            if (Math.max(...newParentChildren) == order) {
                console.log('Incrementing Order');
                order += 1;
            }
        }
    }


    console.log('Order is: ', order);
    await Document.findByIdAndUpdate(oldDocument._id, {$set: {parent: parentToSet, order: order}});

    // Update the new parent's children
    // If not root
    if (newPath) {
        console.log('Conditional insert 1');
        // Update the new parent's children's (those that are getting moved up) order
        // Don't update the document that is being moved, it is part of the children already
        await Document.updateMany({$and: 
            [
                {_id: {$in: newParent.children.map(childObj => ObjectId(childObj._id.toString()))}},
                {_id: {$ne: ObjectId(documentId)}}
            ],
            order: {$gte: order}},
            {$inc: {order: 1}});

        var incrementDocs = await Document.find({$and: 
            [
                {_id: {$in: newParent.children.map(childObj => ObjectId(childObj._id.toString()))}},
                {_id: {$ne: ObjectId(documentId)}},
                {order: {$gte: (order+1)}},
            ]}
            );
        console.log('incrementDocs: ');
        console.log(incrementDocs);
        modifiedDocs = modifiedDocs.concat(incrementDocs);
    }
    // If root
    else {
        console.log('Conditional insert 2');
        await Document.updateMany({ parent: null, _id: {$ne: ObjectId(documentId)}, workspace: ObjectId(workspaceId), order: {$gte: order} },
        {$inc: {order: 1}});
        
        modifiedDocs = modifiedDocs.concat(await Document.find({
            parent: null, _id: {$ne: ObjectId(documentId)}, workspace: ObjectId(workspaceId), order: {$gte: (order+1)}
        }));
        // Remove gap if moving within the same directory and order is now too high

    }

    // Update the old parent's children
    // This needs to use the original order value
    // If not root
    if (originalParent) {
        originalParent = await Document.findById(originalParent._id);
        console.log('Conditional remove 1');
        // Update the new parent's children's (those that are getting moved up) order
        // Don't update the document that is being moved, it is part of the children already
        console.log('originalOrder: ', originalOrder);
        // await Document.updateMany({_id: [{$in: originalParent.children.map(childObj => ObjectId(childObj._id.toString()))}, {$ne: ObjectId(documentId)}], order: {$gt: originalOrder}},
        // {$inc: {order: -1}});

        await Document.updateMany({$and: 
            [
                {_id: {$in: originalParent.children.map(childObj => ObjectId(childObj._id.toString()))}}
                // {_id: {$ne: ObjectId(documentId)}}
            ],
            order: {$gt: originalOrder}},
            {$inc: {order: -1}});
        var decrementDocs = await Document.find({_id: {$in: originalParent.children.map(childObj => ObjectId(childObj._id.toString()))},
                                                                order: {$gt: (originalOrder-1)}});
        console.log('decrementDocs: ');
        console.log(decrementDocs);
        modifiedDocs = modifiedDocs.concat(decrementDocs);
    }
    // If root
    else {
        console.log('Conditional remove 2');
        await Document.updateMany({ parent: null, workspace: ObjectId(workspaceId), order: {$gt: originalOrder} },
        {$inc: {order: -1}});

        modifiedDocs = modifiedDocs.concat(await Document.find({parent: null, workspace: ObjectId(workspaceId), order: {$gt: (originalOrder-1)}}));
    }

   /* const unique = [...new Set(data.map(item => item.age))]; // [ 'A', 'B']
    var resultArr = indexArr.map(i => fruitier[i])*/

    //}

    /*// Remove gap if moving within the same directory and order is now too high
    if (newPath) {
        var newParentMaxOrder = newParent.children.map(childObj => parseInt(childObj.order));
        newParentMaxOrder = Math.max(...newParentMaxOrder);
        if ( (order - newParentMaxOrder) > 1) {
            await Document.findByIdAndUpdate(oldDocument._id, {$set: { order: (newParentMaxOrder + 1)}});
        }
    }
    // If root
    else {
        var rootChildren = await Document.find({parent: null});
        var newParentMaxOrder = rootChildren.map(childObj => parseInt(childObj.order));
        if ( (order - newParentMaxOrder) > 1) {
            await Document.findByIdAndUpdate(oldDocument._id, {$set: { order: (newParentMaxOrder + 1)}});
        }
    }*/

    var oldPath = oldDocument.path;
    var oldPathItemCount = oldPath.split('/').length;

    console.log('newPath: ', newPath);
    console.log('oldPath: ', oldPath);
    console.log('oldPathItemCount: ', oldPathItemCount);

    var re = new RegExp(oldPath, 'i');
    var oldPaths = await Document.find({path: {$regex: re}, workspace: ObjectId(workspaceId)});//.select('name path');
    console.log('Response: ');
    console.log(oldPaths);
    oldPaths = oldPaths.map(docObj => {
        console.log('oldPath: ', docObj.path);
        var oldPathItemList;
        if (docObj.path == oldPath && docObj.title == oldDocument.title) {
            oldPathItemList = docObj.path.split('/').slice(oldPathItemCount-1);
        }
        else {
            oldPathItemList = docObj.path.split('/').slice(oldPathItemCount-1);
        }

        // console.log('oldPathItemList: ');
        // console.log(oldPathItemList);

        var temp = newPath.split('/').concat(oldPathItemList);
        docObj.path = temp.filter(pathItem => pathItem.length > 0).join('/');

        // remove the possible empty string if moving to root
        // docObj.path = docObj.path.filter(pathItem => pathItem.length > 0);
        // docObj.path = docObj.path.join('/');
        console.log('newPath: ', docObj.path);
        return docObj;
    });

    console.log('Before bulk: ');
    console.log(oldPaths);

    // Upsert all of the tree References
    const bulkMoveOps = oldPaths.map(docObj => ({
   
        updateOne: {
                filter: { _id: docObj._id },
                // Where field is the field you want to update
                update: { $set: { path: docObj.path } },
                upsert: false
                }
    }));
    var modifiedObjIds = oldPaths.map(docObj => {
        return docObj._id;
    })
    if (bulkMoveOps.length > 0) {
        /*await Document.collection
            .bulkWrite(bulkMoveOps)
            .then(async (results) => {
                console.log(results);
                modifiedDocs = modifiedDocs.concat( await Document.find({_id: {$in: modifiedObjIds}}));

                return res.json({success: true, result: modifiedDocs});
            })
            .catch((err) => {
                return res.json({success: false, error: 'moveDocument: error bulk moving Documents: ' + err, result: [oldDocument]});
            });*/



            await Document.collection
            .bulkWrite(bulkMoveOps)
            .catch((err) => {
                return res.json({success: false, error: 'moveDocument: error bulk moving Documents: ' + err, result: [oldDocument]});
            });
            if(newPath) {
                modifiedDocs.push(await Document.findById(newParentId));
            }
            if (originalParent != null) {
                var oldParentResult = await Document.findById(originalParent._id);
                console.log('oldParentResult: ');
                console.log(oldParentResult);
                modifiedDocs.push(oldParentResult);
            }
            
            console.log('LOG #1');
            // console.log(modifiedDocs);
            console.log(await Document.find({_id: {$in: modifiedObjIds}}));
            modifiedDocs = modifiedDocs.concat( await Document.find({_id: {$in: modifiedObjIds}}));

            console.log('LOG #2');
            // console.log(modifiedDocs);
            modifiedDocs.reverse();

            var finalResults = removeDuplicates(modifiedDocs);

            return res.json({success: true, result: finalResults});
    }
    else {
        return res.json({success: false, error: 'moveDocument: error no Documents to move.', result: [oldDocument]});
    }



    // if parentId == '', move to root
}


retrieveDocumentsExtension = async (req, res) => {
    let {repositoryFullName, referencePath} = req.body;
    const { workspaceId } = req.params;
    let repository = await Repository.findOne({fullName})
}

retrieveDocuments = (req, res) => {
    let { search, sort, authorId, childrenIds, repositoryId, documentIds, referenceIds, parentId, tagIds, limit, skip } = req.body;
    const { workspaceId } = req.params;
    let query;
    if (search) {
        query = Document.find({title: { $regex: new RegExp(search, 'i')} })
    } else {
        query =  Document.find();
    }

    if (checkValid(parentId)) {
        if (parentId == '') {
            query.where('parent').equals(null);
        }
        else {
            query.where('parent').equals(parentId);
        }
    }

    if (checkValid(referenceIds)) query.where('references').in(referenceIds);
    if (checkValid(documentIds)) query.where('_id').in(documentIds);
    if (checkValid(authorId)) query.where('author').equals(authorId);
    if (checkValid(workspaceId)) query.where('workspace').equals(workspaceId);
    if (checkValid(repositoryId)) query.where('repository').equals(repositoryId);
    if (checkValid(childrenIds)) query.where('_id').in(childrenIds);
    if (checkValid(tagIds)) query.where('tags').all(tagIds);
    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));
    if (checkValid(skip)) query.skip(Number(skip));
    if (checkValid(sort)) query.sort(sort);
    query.populate('parent').populate('author').populate('workspace').populate('repository').populate('references').populate('tags').exec((err, documents) => {
        if (err) return res.json({ success: false, error: err });
        if (checkValid(documentIds) && checkValid(limit)) {
            if (documents.length < limit) {
                let queryNext = Document.find()
                queryNext.limit(Number(limit - documents.length))
                if (documentIds.length !== 0) {
                    queryNext.where('_id').nin(documentIds)
                }
                if (checkValid(sort)) queryNext.sort(sort);
                queryNext.exec((err, nextDocuments) => {
                    if (err) return res.json({ success: false, error: err });
                    return res.json(documents.concat(nextDocuments))
                })
            } else {
                return res.json(documents)
            }
        } else {
            return res.json(documents);
        }
    });
}

attachReference = (req, res) => {
    const { id } = req.params;
    const { referenceId } = req.body;
    let update = {};
    if (referenceId) update.references = ObjectId(referenceId);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('parent').populate('author').populate('workspace').populate('repository').populate('references').populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            console.log("DOCUMENT", document)
            return res.json(document);
        });
    });
}

removeReference = (req, res) => {
    const { id } = req.params;
    const { referenceId } = req.body;
    let update = {};
    if (referenceId) update.references = ObjectId(referenceId);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('parent').populate('author').populate('workspace').populate('repository').populate('references').populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

attachTag = (req, res) => {
    const { id } = req.params;
    const { tagId } = req.body;
    let update = {};
    if (tagId) update.tags = ObjectId(tagId);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('parent').populate('author').populate('workspace').populate('repository').populate('references').populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}


removeTag = (req, res) => {
    const { id } = req.params;
    const { tagId } = req.body;
    let update = {};
    if (tagId) update.tags = ObjectId(tagId);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('parent').populate('author').populate('workspace').populate('repository').populate('references').populate('tags', (err, document) => {
            
            if (err) return res.json({ success: false, error: err });
            console.log("DOC", document)
            return res.json(document);
        });
    });
}


attachSnippet = (req, res) => {
    const { id } = req.params;
    const { snippetId } = req.body;
    let update = {};
    if (snippetId) update.snippets = ObjectId(snippetId);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('parent').populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}


removeSnippet = (req, res) => {
    const { id } = req.params;
    const { snippetId } = req.body;
    let update = {};
    if (snippetId) update.snippets = ObjectId(snippetId);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('parent').populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}


attachUploadFile = (req, res) => {
    const { id } = req.params;
    const { uploadFileId } = req.body;
    let update = {};
    if (uploadFileId) update.uploadFiles = ObjectId(uploadFileId);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('parent').populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

removeUploadFile = (req, res) => {
    const { id } = req.params;
    const { uploadFileId } = req.body;
    let update = {};
    if (uploadFileId) update.uploadFiles = ObjectId(uploadFileId);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('parent').populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

addCanWrite = (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    let update = {};
    if (userId) update.canWrite = ObjectId(userId);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('parent').populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

removeCanWrite = (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    let update = {};
    if (userId) update.canWrite = ObjectId(userId);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('parent').populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

addCanRead = (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    let update = {};
    if (userId) update.canRead = ObjectId(userId);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('parent').populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

removeCanRead = (req, res) => {
    const { id } = req.params;
    const { userId } = req.body;
    let update = {};
    if (userId) update.canRead = ObjectId(userId);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('parent').populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}


module.exports = { createDocument, getDocument, editDocument, deleteDocument,
    retrieveDocuments, attachTag, removeTag, attachSnippet,
    removeSnippet, attachUploadFile, removeUploadFile, addCanWrite,
    removeCanWrite, addCanRead, removeCanRead, getParent,
    renameDocument, moveDocument, attachReference, removeReference }
