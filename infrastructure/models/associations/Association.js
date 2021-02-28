const mongoose = require.main.require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let associationSchema = new Schema({
    created: { type: Date, default: Date.now },
    board: { type: ObjectId, ref: "Board" },
    repository: { type: ObjectId, ref: "Repository" },
    firstElement: ObjectId,
    firstElementModelType: String,
    secondElement: ObjectId,
    secondElementModelType: String,
    source: String,
    direct: Boolean,
});

let Association = mongoose.model("Association", associationSchema);

module.exports = Association;

/*
 quality: Number,
    associationLevel: Number,
    attachmentLink: String,
    semanticContent: [{ type: String }],
    intervalStart: Date,
    intervalEnd: Date,*/
