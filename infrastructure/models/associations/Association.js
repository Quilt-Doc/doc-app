const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId} = Schema.Types;

let associationSchema = new Schema({
	created: {type: Date, default: Date.now},
    workspace: {type: ObjectId, ref: 'Workspace'},

    firstElement: ObjectId,
    firstElementType: String,

    secondElement: ObjectId,
    secondElementType: String,

    quality: Number,

    associationLevel: Number,

    attachmentLink: String,

    semanticContent: [{ type: String }],

    intervalStart: Date,
    intervalEnd: Date
});

let Association = mongoose.model("Association", associationSchema);

module.exports = Association;
