//models
const ActivityFeedItem = require('../../../models/reporting/ActivityFeedItem');
const Document = require('../../../models/Document');


//controllers
const ActivityFeedItemController = require('../../controllers/reporting/ActivityFeedItemController');
const UserStatsController = require('../../controllers/reporting/UserStatsController');

const logger = require('../../logging/index').logger;

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


retrieveBrokenDocuments = async (req, res) => {
    const { limit, skip } = req.body;

    const workspaceId = req.workspaceObj._id.toString();

    let query;

    query = Document.find({ workspace: workspaceId, status: {$in: ['invalid', 'resolve']} });

    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));

    query.sort({breakDate: -1});

    var documents;
    try {
        documents = await query.exec();
        return res.json({success: true, result: documents});
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                        errorDescription: 'Error executing query to retrieve broken documents', function: 'retrieveBrokenDocuments'});
        return res.json({success: false, error: err});
    }
}


// Routes
module.exports = { retrieveBrokenDocuments,
                   retrieveActivityFeedItems: ActivityFeedItemController.retrieveActivityFeedItems,
                   retrieveUserStats: UserStatsController.retrieveUserStats,
                };
