

const apis = require('../../../apis/api');
const api = apis.requestGithubClient();

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


const IntegrationTicket = require('../../../models/integrations/integration_objects/IntegrationTicket');


const { checkValid } = require('../../../utils/utils');




const createGithubIssue = async (req, res) => {

    const {sourceId, source, githubIssueHtmlUrl,
            githubIssueNumber, githubIssueState, githubIssueTitle,
            githubIssueBody, githubIssueLabels, githubIssueLocked,
            githubIssueCommentNumber, githubIssueClosedAt, githubIssueCreatedAt,
            githubIssueUpdatedAt, githubIssueAuthorAssociation} = req.body;


    var createIssueData = {
        sourceId,
        source,
        githubIssueHtmlUrl,
        githubIssueNumber,
        githubIssueState,
        githubIssueTitle,
        githubIssueBody,
        githubIssueLabels,
        githubIssueLocked,
        githubIssueCommentNumber,
        githubIssueClosedAt,
        githubIssueCreatedAt,
        githubIssueUpdatedAt,
        githubIssueAuthorAssociation
    }

    let githubIssue = new IntegrationTicket(createIssueData);

    try {
        githubIssue = await githubIssue.save();
    }
    catch(err) {
        return res.json({success: false, error: err});
    }

    return res.json({success: true, result: pullRequest});
}

module.exports = {
    createGithubIssue
}