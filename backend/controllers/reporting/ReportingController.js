//models
const ActivityFeedItem = require('../../models/reporting/ActivityFeedItem');
const Document = require('../../models/Document');


//controllers
const ActivityFeedItemController = require('../../controllers/reporting/ActivityFeedItemController');
const UserStatsController = require('../../controllers/reporting/UserStatsController');

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


retrieveBrokenDocuments = (req, res) => {
    const { limit, skip } = req.body;

    const workspaceId = req.workspaceObj._id.toString();

    let query;

    query = Document.find({ workspace: workspaceId, status: {$in: ['invalid', 'resolve']} });

    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));
    
    query.sort({breakDate: -1});
    query.exec((err, documents) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({success: true, result: documents});
    });
}


// Routes
module.exports = { retrieveBrokenDocuments,
                   retrieveActivityFeedItems: ActivityFeedItemController.retrieveActivityFeedItems,
                   retrieveUserStats: UserStatsController.retrieveUserStats,

                };
