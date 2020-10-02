const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const { ObjectId } = Schema.Types;

let userStatsSchema = new Schema({
    user: {type: ObjectId, ref: 'User', required: true},
    workspace: {type: ObjectId, ref: 'Workspace', required: true},

    documentsCreatedNum: {type: Number, default: 0},
    documentsBrokenNum: {type: Number, default: 0},
});

let UserStats = mongoose.model("UserStats", userStatsSchema);

module.exports = UserStats;