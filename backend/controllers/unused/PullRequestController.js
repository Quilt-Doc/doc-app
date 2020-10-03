

const apis = require('../../apis/api');
const api = apis.requestGithubClient();

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


const PullRequest = require('../../models/unused/PullRequest');





checkValid = (item) => {
    if (item !== null && item !== undefined) {
        return true
    }
    return false
}



const createPullRequest = async (req, res) => {

    const repositoryId = req.repositoryObj._id.toString();

    const {installationId, status, headRef, baseRef, checks, pullRequestObjId, pullRequestNumber} = req.body;

    if (!checkValid(installationId)) return res.json({success: false, error: 'no pull request installationId provided'});
    if (!checkValid(status)) return res.json({success: false, error: 'no pull request status provided'});
    if (!checkValid(headRef)) return res.json({success: false, error: 'no pull request headRef provided'});
    if (!checkValid(baseRef)) return res.json({success: false, error: 'no pull request baseRef provided'});
    if (!checkValid(pullRequestObjId)) return res.json({success: false, error: 'no pull request pullRequestObjId provided'});
    if (!checkValid(pullRequestNumber)) return res.json({success: false, error: 'no pull request pullRequestNumber provided'});


    let pullRequest = new PullRequest({
        installationId,
        status,
        headRef,
        baseRef,
        pullRequestObjId,
        pullRequestNumber,
        repository: repositoryId
    });
    if (checks) pullRequest.checks = checks;

    try {
        pullRequest = await pullRequest.save();
    }
    catch(err) {
        return res.json({success: false, error: err});
    }



    return res.json({success: true, result: pullRequest});
}

module.exports = {
    createPullRequest
}