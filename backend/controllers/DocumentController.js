const Document = require('../models/Document');



createDocument = (req, res) => {
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
    document.save((err, document) => {
        if (err) return res.json({ success: false, error: err });
        document.populate('author').populate('parents').populate('snippets').populate('uploadFiles')
        .populate('tags', (err, document) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(document);
        });
    });
}

module.exports = {createDocument}
