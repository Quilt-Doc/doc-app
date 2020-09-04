const UserStats = require('../../models/reporting/UserStats');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

/*
    user: {type: ObjectId, ref: 'User', required: true},
    workspace: {type: ObjectId, ref: 'Workspace', required: true},

    documentsCreatedNum: {type: Number, default: 0},
    documentsBrokenNum: {type: Number, default: 0}
*/

createUserStats = (params) => {
    const {userId, workspaceId } = params;

    let userStats = new UserStats(
        {
            user: ObjectId(userId),
            workspace: ObjectId(workspaceId)
        },
    );

    userStats.save((err, createdObj) => {
        if (err) throw new Error("createUserStats Error: Could not save");
        return createdObj;
    });
}



retrieveUserStats = (req, res) => {
    const { limit, skip } = req.body;

    const workspaceId = req.workspaceObj._id.toString();

    let query;

    query = UserStats.find({ workspace: workspaceId });

    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));
    
    query.populate('user').exec((err, statItems) => {
        if (err) return res.json({ success: false, error: err });

        // alphabetically sort by user name
        statItems.sort(function(a, b) {
            var textA = a.user.username.toUpperCase();
            var textB = b.user.username.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });
        
        return res.json({success: true, result: statItems});
    });
}

updateDocumentsCreatedNum = (params) => {
    const {updateNum, userId, workspaceId} = params;
    
    UserStats.findOneAndUpdate({user: userId, workspace: workspaceId},
        {$inc: {documentsCreatedNum: updateNum}});

}

updateDocumentsBrokenNum = (params) => {
    const {updateNum, userId, workspaceId} = params;
    
    UserStats.findOneAndUpdate({user: userId, workspace: workspaceId},
        {$inc: {documentsBrokenNum: updateNum}});
}

module.exports = { createUserStats, retrieveUserStats,
                   updateDocumentsCreatedNum, updateDocumentsBrokenNum};