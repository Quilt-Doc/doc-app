const UserStats = require('../../models/reporting/UserStats');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const logger = require('../../logging/index').logger;

/*
    user: {type: ObjectId, ref: 'User', required: true},
    workspace: {type: ObjectId, ref: 'Workspace', required: true},

    documentsCreatedNum: {type: Number, default: 0},
    documentsBrokenNum: {type: Number, default: 0}
*/

createUserStats = async (params) => {
    const {userId, workspaceId } = params;

    let userStats = new UserStats(
        {
            user: ObjectId(userId),
            workspace: ObjectId(workspaceId)
        },
    );

    try {
        userStats = await userStats.save();
    }
    catch (err) {
        logger.error({source: 'backend-api', message: err,
                        errorDescription: `Error saving User Stats object for userId, workspaceId: ${userId}, ${workspaceId}`, function: 'createUserStats'});
        throw new Error(`Error saving User Stats object for userId, workspaceId: ${userId}, ${workspaceId}`);
    }

    await logger.info({source: 'backend-api', message: `Successfully created UserStats object - userId, workspaceId: ${userId}, ${workspaceId}`,
                        function: 'createUserStats'});

    return userStats;
}



retrieveUserStats = async (req, res) => {
    const { limit, skip } = req.body;

    const workspaceId = req.workspaceObj._id.toString();

    let query;

    query = UserStats.find({ workspace: workspaceId });

    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));

    query.populate('user');

    var statItems;

    try {
        statItems = await query.exec();
    }
    catch(err) {
        await logger.error({source: 'backend-api', message: err,
                        errorDescription: 'Error executing query to retrieve user stats', function: 'retrieveUserStats'});
        return res.json({success: false, result: err});
    }
    // alphabetically sort by user name
    statItems.sort(function(a, b) {
        var textA = a.user.username.toUpperCase();
        var textB = b.user.username.toUpperCase();
        return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
    });
    
    return res.json({success: true, result: statItems});
}

updateDocumentsCreatedNum = async (params) => {
    const {userUpdates, workspaceId} = params;

    if (userUpdates.length < 1) {
        return true;
    }
    
    try {
        const bulkIncrementOps = userUpdates.map((update) => {
            return ({
                updateOne: {
                    filter: { user: update.userId, workspace: workspaceId },
                    // Where field is the field you want to update
                    update: { $inc: { documentsCreatedNum: update.updateNum } },
                    upsert: false
                }
            })
        });

       await UserStats.bulkWrite(bulkIncrementOps).exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                        errorDescription: `Error bulk updating User Stats for userUpdates, workspaceId: ${JSON.stringify(userUpdates)}, ${workspaceId}`,
                        function: 'updateDocumentsCreatedNum'});
        throw new Error(`Error bulk updating User Stats for userUpdates, workspaceId: ${JSON.stringify(userUpdates)}, ${workspaceId}`);
    }

    await logger.info({source: 'backend-api',
                        message: `Successfully updated 'UserStats.documentsCreatedNum' for ${userUpdates.length} Users - workspaceId: ${workspaceId}`,
                        function: 'updateDocumentsCreatedNum'});

    return true;
}

updateDocumentsBrokenNum = async (params) => {
    const {userUpdates, workspaceId} = params;

    if (userUpdates.length < 1) {
        return true;
    }

    // mongoose bulkwrite for one many update db call
    try {
        const bulkDecrementOps = userUpdates.map((update) => {
            return ({
                updateOne: {
                    filter: { user: update.userId, workspace: workspaceId },
                    // Where field is the field you want to update
                    update: { $inc: { documentsBrokenNum: update.updateNum } },
                    upsert: false
                }
            })
        });
       await UserStats.bulkWrite(bulkDecrementOps).exec();
    }
    catch (err) {
        logger.error({source: 'backend-api', message: err,
                        errorDescription: `Error bulk updating User Stats for userUpdates, workspaceId: ${JSON.stringify(userUpdates)}, ${workspaceId}`,
                        function: 'updateDocumentsBrokenNum'});
        throw new Error(`Error bulk updating User Stats for userUpdates, workspaceId: ${JSON.stringify(userUpdates)}, ${workspaceId}`);
    }

    await logger.info({source: 'backend-api',
                        message: `Successfully updated 'UserStats.documentsBrokenNum' for ${userUpdates.length} Users - workspaceId: ${workspaceId}`,
                        function: 'updateDocumentsBrokenNum'});

    return true;
}

module.exports = { createUserStats, retrieveUserStats,
                   updateDocumentsCreatedNum, updateDocumentsBrokenNum};