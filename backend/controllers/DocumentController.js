const Document = require('../models/Document');
/*
createDocItem(authorID, parentIDs, snippetIDs, title, description, uploadFileIDs, tagIDs)
getDocItem(docID)
editDocItem(docID, title, description)
deleteDocItem(docID)
retrieveDocItems(textQuery, authorID, parentIDs, snippetIDs, uploadFileIDs, tagIDs)
attachTag(docID, tagID)
removeTag(docID, tagID)
attachSnippet(docID, snippetID)
removeSnippet(docID, snippetID)
attachParent(docID, parentID)
removeParent(docID, parentID)
attachUploadFile(docID, uploadFileID)
removeUploadFile(docID, uploadFileID)
addCanWrite(folderID, userID)
removeCanWrite(folderID, userID)
addCanRead(folderID, userID)
removeCanRead(folderID, userID)
*/
createDocument = (req, res) => {
    console.log(req.body)
    /*
    const { authorID, parentIDs, snippetIDs, title, description, uploadFileIDs, tagIDs } = req.body;
    let document = new Document(
        {
            author: ObjectId(authorID),
            title,
            parents: parentIDs.map(parentID => ObjectId(parentID)),
            created: new Date(),
        },
    );
    if (snippetIDs) document.snippets = snippetIDs.map(snippetID => ObjectId(snippetID));
    if (description) document.description = description;
    if (uploadFileIDs) document.uploadFiles = uploadFileIDs.map(snippetID => ObjectId(snippetID));
    if (tagIDs) document.tags = tagIDs.map(tagID => ObjectId(tagID))
    */
    /*
    document.save((err, document) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(document);
        
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
        
    });
    */
}


module.exports = {createDocument}
