const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId} = Schema.Types;

const externalDocumentSchema = new Schema({
    type: String,
    repository: {type: ObjectId, ref: 'Repository'},
    workspace: {type: ObjectId, ref: 'Workspace'},
    memberUsers: [{type: ObjectId, ref: 'User'}],
    //members
    associations: {type: String},
    relevant: {type: String},
    created: {type: Date, default: Date.now},

    //GDRIVE SPECIFIC
    googleDriveIntegration: {type:ObjectId, ref: 'GoogleDriveIntegration'},
    googleDriveLink: String,
    googleDriveId: String, //TODO: NEED TO DISCUSS WORDING, this refers to the Id of the object in GDRIVE
    //BUT WORDING MAY BE CONFUSING
    googleDriveMimeType: String,
    googleDriveCreated: Date,
    googleDriveLastModified: Date,
    googleDriveMembers: [{type: String}],
    googleDriveMemberEmails: [{type: String}]
});

const ExternalDocument = mongoose.model("ExternalDocument", externalDocumentSchema);

module.exports = ExternalDocument;