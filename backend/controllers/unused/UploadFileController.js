/*
const UploadFile = require('../../models/UploadFile');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createUploadFile = (req, res) => {
    const { documentId, filePath, fileExtension } = req.body;

    if (!typeof documentId == 'undefined' && documentId !== null) return res.json({success: false, error: 'no upload file documentId provided'});
    if (!typeof filePath == 'undefined' && filePath !== null) return res.json({success: false, error: 'no upload title filePath provided'});

    let uploadFile = new UploadFile(
        {
            document: ObjectId(documentId),
            filePath: filePath,
            fileExtension: fileExtension
        },
    );
    uploadFile.save((err, uploadFile) => {
        if (err) return res.json({ success: false, error: err });
        uploadFile.populate('document', (err, uploadFile) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(uploadFile);
        });
    });
}

getUploadFile = (req, res) => {
    UploadFile.findById(req.params.id).populate('document').exec(function (err, uploadFile) {
        if (err) return res.json({ success: false, error: err });
        return res.json(uploadFile);
    });
}

editUploadFile = (req, res) => {
    const { id } = req.params;
    const { documentId, filePath, fileExtension } = req.body;
    let update = {};
    if (documentId) update.document = ObjectId(documentId);
    if (filePath) update.filePath = filePath;
    if (fileExtension) update.fileExtension = fileExtension;
    UploadFile.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, uploadFile) => {
        if (err) return res.json({ success: false, error: err });
        uploadFile.populate('document', (err, uploadFile) => {
            if (err) return res.json(err);
            return res.json(uploadFile);
        });
    });
}

deleteUploadFile = (req, res) => {
    const { id } = req.params;
    UploadFile.findByIdAndRemove(id, (err, uploadFile) => {
        if (err) return res.json({ success: false, error: err });
        uploadFile.populate('document', (err, uploadFile) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(uploadFile);
        });
    });
}

retrieveUploadFiles = (req, res) => {
    let { documentId, filePath, fileExtension, limit, skip } = req.body;
    
    query = UploadFile.find();
    if (documentId) query.where('document').equals(documentId);
    if (filePath) query.where('filePath').equals(filePath);
    if (fileExtension) query.where('fileExtension').equals(fileExtension);
    if (limit) query.limit(Number(limit));
    if (skip) query.skip(Number(skip));
    query.populate('document').exec((err, uploadFiles) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(uploadFiles);
    });
}


module.exports = {
    createUploadFile, getUploadFile, editUploadFile, deleteUploadFile, retrieveUploadFiles
}
*/