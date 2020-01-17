const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let uploadFileSchema = new Schema({
    created: Date,
    document: {type: ObjectId, ref: 'Document'},
    filePath: String,
    fileExtension: String
});

let UploadFile = mongoose.model("UploadFile", uploadFileSchema);

module.exports = UploadFile