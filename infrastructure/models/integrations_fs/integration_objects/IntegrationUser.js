const mongoose = require.main.require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

var integrationUserSchema = new Schema({
    sourceId: String,
    source: String,
    userName: String,
    name: String,
    email: String,
    user: { type: ObjectId, ref: 'User'},
	created: {type: Date, default: Date.now},
});

var IntegrationUser = mongoose.model("IntegrationUser", integrationUserSchema);

module.exports = IntegrationUser;
