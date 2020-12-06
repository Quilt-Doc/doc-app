const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId} = Schema.Types;

const integrationSchema = new Schema({
    type: {type: String},
    token: {type: String},
    tokenSecret: {type: String},
	created: {type: Date, default: Date.now},
	user: {type: ObjectId, ref: 'User'},
	workspace: {type: ObjectId, ref: 'Workspace'}
});

const Integration = mongoose.model("Integration", integrationSchema);

module.exports = Integration;
