const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let uploadFileSchema = new Schema({
    created: Date,
    docItem: ObjectId,
    filePath: String,
    fileExtension: String
});

let UploadFile = mongoose.model("UploadFile", uploadFileSchema);

module.exports = UploadFile