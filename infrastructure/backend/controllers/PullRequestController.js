

const apis = require('../apis/api');
const api = apis.requestGithubClient();

const diffUtils = require('../utils/diff/index');

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const Sentry = require("@sentry/node");

const Repository = require('../models/Repository');
const PullRequest = require('../models/PullRequest');


const { checkValid } = require('../utils/utils');
const { pull } = require('lodash');




const createPullRequest = async (req, res) => {

    const {installationId, repositoryFullName, prData} = req.body;

    if (!checkValid(installationId)) return res.json({success: false, error: 'createPullRequest: No installationId provided'});
    if (!checkValid(repositoryFullName)) return res.json({success: false, error: 'createPullRequest: No repositoryFullName provided'});
    if (!checkValid(prData)) return res.json({success: false, error: 'createPullRequest: No prData provided'});
    
    // Get Repository Id
    var repositoryObj;
    try {
        repositoryObj = await Repository.findOne({ fullName: repositoryFullName }, '_id').lean().exec();
    }
    catch (err) {
        Sentry.setContext("createPullRequest", {
            message: `Repository findOne failed`,
            repositoryFullName: rrepositoryFullName,
        });

        Sentry.captureException(err);

        return res.json({success: false, error: `Repository findOne failed - repositoryFullName: ${repositoryFullName}`});
    }

    if (!repositoryObj) return res.json({success: false, error: `Repository findOne failed - repositoryFullName: ${repositoryFullName}`});
    if (!repositoryObj._id) return res.json({success: false, error: `Repository findOne failed - repositoryFullName: ${repositoryFullName}`});

    prData.installationId = installationId;
    prData.repository = repositoryObj._id.toString();

    let pullRequest = new PullRequest(prData);
    try {
        pullRequest = await pullRequest.save();
    }
    catch(err) {
        return res.json({success: false, error: err});
    }

    // Generate InsertHunk for PR Here
    // Pseudocode:
    //  installationClient = await apis.requestInstallationClient(installationId);
    //  prPatchContent = diffUtils.getPRDiffContent(installationClient, repositoryFullName, pullRequest.number);
    //  insertHunks = diffUtils.createBlamesFromPRPatch(prPatchContent, pullRequest.number, pullRequest.repository);
    //  diffUtils.createInsertHunks(insertHunks);

    // Get Installation Client
    var installationClient;
    try {
        installationClient = await apis.requestInstallationClient(installationId);
    }
    catch (err) {
        Sentry.setContext("createPullRequest", {
            message: `requestInstallationClient failed`,
            installationId: installationId,
        });

        Sentry.captureException(err);

        return res.json({success: false, error: `requestInstallationClient failed - installationId: ${installationId}`});
    }

    // Get Raw PR Patch Content
    var prPatchContent;
    try {
        prPatchContent = diffUtils.getPRDiffContent(installationClient, repositoryFullName, pullRequest.number);
    }
    catch (err) {
        Sentry.setContext("createPullRequest", {
            message: `getPRDiffContent failed`,
            installationId: installationId,
            repositoryFullName: repositoryFullName,
            pullRequestNumber: pullRequest.number,
        });

        Sentry.captureException(err);

        return res.json({success: false,
                            error: `getPRDiffContent failed - installationId, repositoryFullName, pullRequestNumber: ${installationId}, ${repositoryFullName}, ${pullRequestNumber}`
                        });

    }

    // Generate InsertHunks from raw patch content
    var insertHunks;
    try {
        insertHunks = diffUtils.createBlamesFromPRPatch(prPatchContent, pullRequest.number, pullRequest.repository);
    }
    catch (err) {
        Sentry.setContext("createPullRequest", {
            message: `createBlamesFromPRPatch failed`,
            pullRequestNumber: pullRequest.number,
            repositoryId: pullRequest.repository,
        });

        Sentry.captureException(err);

        return res.json({success: false, 
                            error: `createBlamesFromPRPatch failed - repositoryId, pullRequestNumber: ${pullRequest.repository}, ${pullRequest.number}`
                        });
    }

    // Save InsertHunks to DB
    if (insertHunks.length > 0) {
        try {
            diffUtils.createInsertHunks(insertHunks);
        }
        catch (err) {
            Sentry.setContext("createPullRequest", {
                message: `createInsertHunks failed`,
                numInsertHunks: insertHunks.length,
                repositoryId: pullRequest.repository,
            });
    
            Sentry.captureException(err);
    
            return res.json({success: false, 
                                error: `createBlamesFromPRPatch failed - repositoryId, numInsertHunks: ${pullRequest.repository}, ${insertHunks.length}`
                            });
        }
    }



    return res.json({success: true, result: pullRequest});
}

module.exports = {
    createPullRequest
}