

const apis = require('../apis/api');
const api = apis.requestGithubClient();

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


const Document = require('../models/Document');
const Snippet = require('../models/Snippet');
const Check = require('../models/Check');
const Repository = require('../models/Repository');
const Workspace = require('../models/Workspace');

const NotificationController = require('./reporting/NotificationController');


const logger = require('../logging/index').logger;

const checkConstants = require('../constants/index').checks;


checkValid = (item) => {
    if (item !== null && item !== undefined) {
        return true
    }
    return false
}

generateCheckSummary = (brokenDocuments, brokenSnippets) => {

    var documentWord = (brokenDocuments.length > 0 && brokenDocuments.length < 2) ? 'document' : 'documents'
    var snippetWord = (brokenSnippets.length > 0 && brokenSnippets.length < 2) ? 'snippet' : 'snippets'


    if (brokenDocuments.length == 0 && brokenSnippets.length == 0) {
        return 'This push broke no documentats or snippets!';
    }
    else if (brokenDocuments.length > 0 && brokenSnippets.length == 0) {
        return `This push broke ${brokenDocuments.length} ${documentWord}`;
    }
    else if (brokenDocuments.length == 0 && brokenSnippets.length > 0) {
        return `This push broke ${brokenSnippets.length} ${snippetWord}`;
    }
    else if (brokenDocuments.length > 0 && brokenSnippets.length > 0) {
        return `This push broke ${brokenDocuments.length} ${documentWord} and ${brokenSnippets.length} ${snippetWord}`;
    }
}

// TODO: Make documents link to themselves
generateCheckText = async (brokenDocuments, brokenSnippets) => {
    var text = '';


    // Append broken Document text
    for (i = 0; i < brokenDocuments.length; i++) {
        if (i >= checkConstants.CHECK_DOCUMENT_MAX_NUM) break;
        var documentObj;
        try {
            documentObj = await Document.findById(brokenDocuments[i].toString(), 'title workspace').exec();
        }
        catch (err) {
            throw new Error(`Error fetching Document: ${brokenDocuments[i]}`);
        }
        if (documentObj) text += `![Invalid Document Icon](${process.env.PRODUCTION_API_URL}/assets/invalid_document) [${documentObj.title}](${process.env.PRODUCTION_HOME_PAGE_URL})\n`
    }

    // Append broken Snippet text
    for (i = 0; i < brokenSnippets.length; i++) {
        if (i >= checkConstants.CHECK_SNIPPET_MAX_NUM) break;
        var snippetObj;
        try {
            snippetObj = await Snippet.findById(brokenSnippets[i]);
        }
        catch (err) {
            throw new Error(`Error fetching Snippet: ${brokenSnippets[i]}`);
        }
        if (snippetObj) text += `![Invalid Document Icon](${process.env.PRODUCTION_API_URL}/assets/invalid_snippet) [${snippetObj.annotation.slice(0, checkConstants.CHECK_SNIPPET_CHAR_MAX)}](${process.env.PRODUCTION_HOME_PAGE_URL})\n`
    }

    return text;

}

createCheckRunObj = async (commit, brokenDocuments, brokenSnippets, checkId) => {

    var outputObj;
    try {
        outputObj = {   title: 'Quilt Knowledge Changes',
                    summary: generateCheckSummary(brokenDocuments, brokenSnippets),
                    text: await generateCheckText(brokenDocuments, brokenSnippets),
                    // images: [imageObj]
                }
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err, errorDescription: `Error generating check text on commit: ${commit}`, function: "generateCheckText"});
        return res.json({success: false, error: 'error Generating Check'});
    }
    var currentDateISO = (new Date()).toISOString();

    var checkObj = {
        name: 'document-coverage',
        head_sha: commit,
        details_url: `${process.env.PRODUCTION_HOME_PAGE_URL}`,
        external_id: checkId,
        status: 'completed',
        started_at: currentDateISO,
        conclusion: (brokenDocuments.length > 0 || brokenSnippets.length > 0) ? 'failure' : 'success',
        completed_at: currentDateISO,
        output: outputObj,
    };

    return checkObj

}



const createCheck = async (req, res) => {

    const repositoryId = req.repositoryObj._id.toString();

    const {installationId, commit, brokenDocuments, brokenSnippets, message, pusher, addedReferences} = req.body;

    if (!checkValid(installationId)) return res.json({success: false, error: 'no check installationId provided'});
    if (!checkValid(commit)) return res.json({success: false, error: 'no check commit provided'});
    if (!checkValid(brokenDocuments)) return res.json({success: false, error: 'no check brokenDocuments provided'});
    if (!checkValid(brokenSnippets)) return res.json({success: false, error: 'no check brokenSnippets provided'});
    if (!checkValid(message)) return res.json({success: false, error: 'no check message provided'});
    if (!checkValid(pusher)) return res.json({success: false, error: 'no check pusher provided'});
    if (!checkValid(addedReferences)) return res.json({success: false, error: 'no check addedReferences provided'});

    const fullName = req.repositoryObj.fullName;

    var installationClient;
    try {
        installationClient = await apis.requestInstallationClient(installationId);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err, errorDescription: "Error fetching installationClient", function: "createCheck"});
        return res.json({success: false, error: 'error accessing installationClient'});
    }

    // KARAN TODO: Validate that there isn't already a Check on this commit

    // Get Repository html URL
    var repositoryHtmlUrl;
    try {
        repositoryHtmlUrl = await Repository.findById(repositoryId).select('htmlUrl').lean().exec();
        repositoryHtmlUrl = repositoryHtmlUrl.htmlUrl;
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error Repository findById query failed - repositoryId: ${repositoryId}`,
                            function: "createCheck"});

        return res.json({success: false, error: `Error Repository findById query failed - repositoryId: ${repositoryId}`});
    }

    await logger.info({source: 'backend-api',
                        message: `Creating new Check - sha, repositoryId, commitMessage, pusher: ${commit}, ${repositoryId}, ${message}, ${pusher}`,
                        function: 'createCheck'});


    let check = new Check({
        sha: commit,
        brokenDocuments,
        brokenSnippets,
        repository: repositoryId,
        commitMessage: message,
        pusher,
        addedReferences
    });

    // Save new Check
    try {
        check = await check.save();
    }
    catch (err) {
        console.log(err);
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error saving new Check sha, repositoryId, pusher, message: ${commit}, ${repositoryId}, ${pusher}, ${message}`,
                            function: "createCheck"});

        return res.json({success: false, error: 'error accessing installationClient'});
    }

    // Create initial 'in_progress' Check
    var beginObject = {
        name: 'document-coverage',
        head_sha: commit,
        details_url: `${process.env.PRODUCTION_HOME_PAGE_URL}`,
        external_id: check._id.toString(),
        status: 'in_progress',
    }

    var checkCreateBegin;
    try {
        checkCreateBegin = await installationClient.post(`/repos/${fullName}/check-runs`, beginObject);
        check.githubId = checkCreateBegin.data.id;
        check.checkUrl = `${repositoryHtmlUrl}/runs/${checkCreateBegin.data.id}`
        check = await check.save();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err, errorDescription: `Error creating 'in_progress' Check on commit: ${commit}`, function: "createCheck"});
        return res.json({success: false, error: 'error accessing installationClient'});
    }

    // Create Notifications for all Users who've had Documents broken

    // Get Workspace Repository is in
    var workspaceResponse;
    try {
        workspaceResponse = await Workspace.find({repositories: { $in: [ObjectId(repositoryId)] }}).lean().exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error retrieving Workspace of Repository - repositoryId, commit: ${repositoryId}, ${commit}`,
                            function: "createCheck"});
        return res.json({success: false, error: 'Error retrieving Workspace of Repository'});
    }

    // Get list of userIds of creators of invalidated Snippets/Documents
    var documentResponse;
    var snippetResponse;
    try {
        documentResponse = await Document.find({_id: { $in: brokenDocuments.map(id => ObjectId(id.toString())) }}).select('_id author').lean().exec();
        snippetResponse = await Snippet.find({_id: { $in: brokenSnippets.map(id => ObjectId(id.toString())) }}).select('_id creator').lean().exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error getting invalidated Documents/Snippets on commit: ${commit}`,
                            function: "createCheck"});
        return res.json({success: false, error: 'error getting invalidated Documents/Snippets'});
    }

    var userIdList = documentResponse.map(documentObj => documentObj.author.toString()).concat( snippetResponse.map(snippetObj => snippetObj.creator.toString()));


    // Get list of Users who've had snippets/documents invalidated
    userIdList = [...new Set(userIdList)];

    var invalidNotificationData = [];

    invalidNotificationData = userIdList.map(userId => {
        return {
            type: 'invalid_knowledge',
            user: userId.toString(),
            workspace: workspaceResponse._id.toString(),
            repository: repositoryId,
            check: check._id.toString(),
        };
    });
    
    // Create Invalid Knowledge Notification
    try {
        await NotificationController.createInvalidNotifications(invalidNotificationData);
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error creating push Notifications - workspaceId, repositoryId, commit: ${workspaceResponse._id.toString()}, ${repositoryId}, ${commit}`,
                            function: "createCheck"});
        return res.json({success: false, error: 'Error creating push Notifications'});
    }

    // If References have been added create a notification for the pusher

    if (addedReferences.length > 0) {
        var toDocumentNotification = {
            type: 'to_document',
            user: userId.toString(),
            workspace: workspaceResponse._id.toString(),
            repository: repositoryId,
            check: check._id.toString(),
        };
        try {
            await NotificationController.createToDocumentNotification(toDocumentNotification);
        }
        catch (err) {
            await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error creating toDocument Notification - workspaceId, repositoryId, commit: ${workspaceResponse._id.toString()}, ${repositoryId}, ${commit}`,
                                function: "createCheck"});

            return res.json({success: false, error: 'Error creating toDocument Notification'});
        }
    }






    var checkObj;
    try {
        checkObj = await createCheckRunObj(commit, brokenDocuments, brokenSnippets, check._id.toString());
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error creating updated check object: ${commit}`,
                            function: "createCheckRunObj"});
        return res.json({success: false, error: 'Error Creating Check Content'});
    }


    
    var checkUpdateResponse;
    try {
        checkUpdateResponse = await installationClient.patch(`/repos/${fullName}/check-runs/${check.githubId}`, checkObj);
        
        if (checkUpdateResponse.status.toString() != '200') {
            await logger.error({source: 'backend-api', message: err,
            errorDescription: `Error updating Check Run Github API call commit, status: ${commit}, ${checkUpdateResponse.status}`,
            function: "createCheckRunObj"});
        return res.json({success: false, error: `Error Updating Check Run, status: ${checkUpdateResponse.status}`});
        }
    }
    catch (err) {

        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error creating updated check object for Github API call: ${commit}`,
                            function: "createCheckRunObj"});
        return res.json({success: false, error: 'Error Creating Check Content'});
    }
    
    

    return res.json({success: true, result: check});
}

const retrieveChecks = async (req, res) => {
    const repositoryId = req.repositoryObj._id.toString();

    var { skip, limit } = req.body;


    if (!checkValid(skip)) skip = 0;

    if (!checkValid(limit))  limit = 10;

    var retrieveResponse;
    try {
        retrieveResponse = await Check.find({repository: repositoryId})
        .populate({path: 'addedReferences brokenDocuments repository'})
        .populate({path: 'brokenSnippets', populate: {path: 'reference'}}).limit(limit).skip(skip).sort({created: -1}).exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error retrieving Checks - repositoryId, limit, skip: ${repositoryId}, ${limit}, ${skip}`,
                            function: "retrieveChecks"});
        return res.json({success: false, error: `Error retrieving Checks - repositoryId, limit, skip: ${repositoryId}, ${limit}, ${skip}`});
    }


    return res.json({success: true, result: retrieveResponse});
}

module.exports = {
    createCheck,
    retrieveChecks
}