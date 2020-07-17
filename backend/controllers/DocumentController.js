const Document = require('../models/Document');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}

createDocument = async (req, res) => {
    const { authorId, referenceIds, childrenIds, repositoryId, workspaceId,
        title, root, markup, tagIds, parentId } = req.body;

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

    
    //if (!typeof author == 'undefined' && author !== null) return res.json({success: false, error: 'no document author provided'});
    //if (!typeof title == 'undefined' && title !== null) return res.json({success: false, error: 'no document title provided'});

    var workingTitle = '';

    // If we are creating an 'untitled_[0-9]+' document 
    if (!checkValid(title)) {
        workingTitle = 'untitled_';
        var re = new RegExp('^' + parentPath + 'untitled_[0-9]+$', 'i');
        var untitledDocuments = await Document.find({path: {$regex: re}});
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
       var duplicateDocument = await Document.findOne({path: parentPath + workingTitle});
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
            title: workingTitle,
            path: parentPath + workingTitle
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


    document.save((err, document) => {
        if (err) return res.json({ success: false, error: err, result: null });
        if (parentId) {
            parent.children.push(ObjectId(document._id));
            parent.save();
        }
        document.populate('author').populate('repository').populate('workspace').populate('references').populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err, result: [document] });
            return res.json({success: false, result: [document]});
        });
    });
}

getDocument = (req, res) => {
    Document.findById(req.params.id).populate('repository').populate('workspace').populate('tags').exec(function (err, document) {
        if (err) return res.json({ success: false, error: err });
        return res.json(document);
    });
}

getParent = (req, res) => {
    let query = Document.findOne({})
    
    query.where('children').equals(req.params.id)
    query.populate('author').populate('workspace')
    .populate('repository')
    .populate('tags').exec((err, document) => {
        if (err) return res.json(err);
        return res.json(document)
    })
}



editDocument = (req, res) => {
    const { id } = req.params;
    const { title, markup } = req.body;
    let update = {};
    if (checkValid(title)) update.title = title;
    if (checkValid(markup)) update.markup = markup;
    Document.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author', (err, document) => {
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

    console.log('documentId: ', documentId);
    console.log(typeof documentId);
    var toDelete = await Document.findById(documentId);
    if (!toDelete) {
        return res.json({success: false, error: 'deleteDocument: error could not find document to delete', result: null});
    }
    if (toDelete.parent != null) {
       Document.update({_id: ObjectId(toDelete.parent.toString())}, 
              { $pull: {children: ObjectId(documentId) }});
    }
    var pathToDelete = toDelete.path;
    var re = new RegExp(pathToDelete + '.*', 'i');
    const deletedDocs = await Document.find({path: {$regex: re}}, '');
    await Document.deleteMany({path: {$regex: re}}, (err) => {
        if (err) {
            return res.json({ success: false, error: err, result: [toDelete] });
        }
        console.log('Delete successful');
        return res.json({success: true, result: [deletedDocs]});
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
    var duplicateDocument = await Document.findOne({path: newProposedPath});
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
    

    if (title == '') {
        console.log('parentPath: ', parentPath);
        var re = new RegExp('^' + parentPath + 'untitled_[0-9]+$', 'i');
        var untitledDocuments = await Document.find({path: {$regex: re}});
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
    var oldPaths = await Document.find({path: {$regex: re}});//.select('name path');
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
    const { documentId, parentId } = req.body;
    if (!checkValid(documentId)) return res.json({success: false, error: 'renameDocument: error no documentId provided.', result: null});
    if (!checkValid(parentId)) return res.json({success: false, error: 'renameDocument: error no parentId provided', result: null});
    

    var oldDocument = await Document.findById(documentId);
    if (!oldDocument) {
        return res.json({success: false, error: 'moveDocument: error could not find document to move', result: null});
    }

    var modifiedDocs = [];

    if (oldDocument.parent != null) {
        const originalParent = await Document.findOneAndUpdate({_id: ObjectId(oldDocument.parent.toString())}, 
              { $pull: {children: ObjectId(documentId) }},
              {new: true});
        modifiedDocs.push(originalParent);
    }

    // set newPath
    var newPath = '';
    if (parentId != '') {
        var parent = await Document.findById(parentId);
        if (!parent) {
            return res.json({success: false, error: 'moveDocument: error could not find parent document', result: [oldDocument]});
        }

        // Don't allow moving the original document into its own child
        if (parent.path.includes(oldDocument.path)) {
            return res.json({success: false, error: 'moveDocument: error cannot move parent into its own child', result: [oldDocument]});
        }

        const newParent = await Document.findOneAndUpdate({_id: ObjectId(parentId)}, 
          { $push: {children: ObjectId(documentId) }},
          { new: true});
        oldDocument.parent = ObjectId(parentId);
        modifiedDocs.push(newParent);

        newPath = parent.path;
    }

    if (parentId == '') {
        oldDocument.parent = null;
    }

    await oldDocument.save();

    var oldPath = oldDocument.path;
    var oldPathItemCount = oldPath.split('/').length;

    console.log('newPath: ', newPath);
    console.log('oldPath: ', oldPath);
    console.log('oldPathItemCount: ', oldPathItemCount);

    var re = new RegExp(oldPath, 'i');
    var oldPaths = await Document.find({path: {$regex: re}});//.select('name path');
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
        await Document.collection
            .bulkWrite(bulkMoveOps)
            .then(async (results) => {
                console.log(results);
                modifiedDocs = modifiedDocs.concat( await Document.find({_id: {$in: modifiedObjIds}}));
                return res.json({success: true, result: modifiedDocs});
            })
            .catch((err) => {
                return res.json({success: false, error: 'moveDocument: error bulk moving Documents: ' + err, result: [oldDocument]});
            });
    }
    else {
        return res.json({success: false, error: 'moveDocument: error no Documents to move.', result: [oldDocument]});
    }
    // if parentId == '', move to root
}

retrieveDocuments = (req, res) => {
    let { textQuery, authorId, childrenIds, workspaceId, repositoryId, referenceIds, root, tagIds, limit, skip } = req.body;
    
    let query = Document.find({});
    if (checkValid(root)) query.where('root').equals(root);
    if (checkValid(authorId)) query.where('author').equals(authorId);
    if (checkValid(workspaceId)) query.where('workspace').equals(workspaceId);
    if (checkValid(repositoryId)) query.where('repository').equals(repositoryId);
    if (checkValid(childrenIds)) query.where('_id').in(childrenIds);
    if (checkValid(tagIds)) query.where('tags').all(tagIds);
    if (checkValid(referenceIds)) query.where('references').in(referenceIds);
    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));
    query.populate('author').populate('workspace').populate('repository').populate('tags').exec((err, documents) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(documents);
    });
}



attachTag = (req, res) => {
    const { id } = req.params;
    const { tagId } = req.body;
    let update = {};
    if (tagId) update.tags = ObjectId(tagId);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
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
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}


attachChild = (req, res) => {
    const { id } = req.params;
    const { childId } = req.body;
    let update = {};
    if (childId) update.children = ObjectId(childId);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('workspace').populate('repository').populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

removeChild = (req, res) => {
    const { id } = req.params;
    const { childId } = req.body;
    let update = {};
    if (childId) update.children = ObjectId(childId);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('workspace').populate('repository').populate('tags', (err, document) => {
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
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
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
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
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
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}


attachParent = (req, res) => {
    const { id } = req.params;
    const { parentId } = req.body;
    let update = {};
    if (parentId) update.parents = ObjectId(parentId);
    Document.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}


removeParent = (req, res) => {
    const { id } = req.params;
    const { parentId } = req.body;
    let update = {};
    if (parentId) update.parents = ObjectId(parentId);
    Document.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
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
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
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
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
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
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
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
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
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
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
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
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}


module.exports = { createDocument, getDocument, editDocument, 
    deleteDocument, retrieveDocuments, attachTag, removeTag, 
    attachSnippet, removeSnippet, attachParent, removeParent, 
    attachUploadFile, removeUploadFile, addCanWrite, removeCanWrite, 
    addCanRead, removeCanRead, attachChild, removeChild, getParent,
    renameDocument, moveDocument }
