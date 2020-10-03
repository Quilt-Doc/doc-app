const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let uploadFileSchema = new Schema({
    created: {type: Date, default: Date.now },
    document: {type: ObjectId, ref: 'Document'},
    filePath: String,
    fileExtension: String
});

let UploadFile = mongoose.model("UploadFile", uploadFileSchema);

module.exports = UploadFile