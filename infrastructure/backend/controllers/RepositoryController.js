const url = require('url');

var request = require("request");

const client = require("../apis/api").requestGithubClient();

const apis = require('../apis/api');

const jobs = require('../apis/jobs');
const jobConstants = require('../constants/index').jobs;

const logger = require('../logging/index').logger;

const Workspace = require('../models/Workspace');
const Repository = require('../models/Repository');
const Reference = require('../models/Reference');
const Document = require('../models/Document');

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const { json } = require('body-parser');


const { checkValid } = require('../utils/utils');


initRepository = async (req, res) => {
    const {fullName, installationId, icon} = req.body;

    if (!checkValid(fullName)) return res.json({success: false, error: 'no repository fullName provided'});
    if (!checkValid(installationId)) return res.json({success: false, error: 'no repository installationId provided'});

    await logger.info({source: 'backend-api', message: `Initializing Repository - fullName, installationId: ${fullName}, ${installationId}`,
                        function: 'initRepository'});

    let repository = new Repository({
        fullName,
        installationId,
        icon,
        scanned: false,
        currentlyScanning: false
    });

    try {
        repository = await repository.save();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                        errorDescription: `Error saving repository fullName, installationId: ${fullName}, ${installationId}`,
                        function: 'initRepository'});
        return res.json({success: false, error: `Error saving repository fullName, installationId: ${fullName}, ${installationId}`, trace: err});
    }

    try {
        await Reference.create({repository: repository._id, 
            name: repository.fullName, kind: 'dir', path: "", parseProvider: "create", root: true});
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                        errorDescription: `Error saving rootReference - repositoryId: ${repository._id.toString()}`,
                        function: 'initRepository'});
        return res.json({success: false, error: `Error saving rootReference`, trace: err});
    }

    await logger.info({source: 'backend-api', message: `Successfully initialized Repository - fullName, installationId: ${fullName}, ${installationId}`,
                        function: 'initRepository'});

    return res.json({success: true, result: repository});
}


// When the Repository is scanned it's lastProcessedCommit is correctly set to the latest commit on the default branch

// New Procedure:
// 1. Get the tree SHA of the current Repository.lastProcessedCommit
// 2. Get the tree and find the SHA of the relevant file
// 3. 

getRepositoryFileSafe = async (req, res) => {

    var {pathInRepo, referenceId } = req.body;

    const fullName = req.repositoryObj.fullName;
    const lastProcessedCommit = req.repositoryObj.lastProcessedCommit;
    const installationId = req.repositoryObj.installationId;

    // if (typeof fullName == 'undefined' || fullName == null) return res.json({success: false, error: 'no repo fullName provided'});
    // if (typeof installationId == 'undefined' || installationId == null) return res.json({success: false, error: 'no repo installationId provided'});
    if (!checkValid(pathInRepo) && !checkValid(referenceId)) {
        return res.json({success: false, error: 'no repo pathInRepo and referenceId provided'});
    }

    if (referenceId) {
        var reference;
        try {
            reference = await Reference.findOne({_id: referenceId}).lean().select('path').exec();
        }
        catch (err) {
            await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error querying findOne on Reference - referenceId: ${referenceId}`,
                                function: 'getRepositoryFile'});
            return res.json({success: false, error: err});
        }
        pathInRepo = reference.path;
    }


    var installationClient;
    try {
        installationClient = await apis.requestInstallationClient(installationId);
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error fetching installationClient - installationId: ${installationId}`,
                            function: 'getRepositoryFile'});
        return res.json({success: false, error: err, alert: "Failed to authenticate with Github API"});
    }

    var commitResponse;
    try {
        // /repos/{owner}/{repo}/commits/{ref}
        commitResponse = await installationClient.get(`/repos/${fullName}/commits/${lastProcessedCommit}`);
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error fetching Commit Object from Github API - fullName, lastProcessedCommit: ${fullName}, ${lastProcessedCommit}`,
                            function: 'getRepositoryFile'});
        return res.json({success: false, error: err, alert: "Failed to get Commit Object from Github"});
    }

    var treeSha = commitResponse.data.commit.tree.sha;

    var treeResponse;
    try {
        // /repos/{owner}/{repo}/git/trees/{tree_sha}
        treeResponse = await installationClient.get(`/repos/${fullName}/git/trees/${treeSha}?recursive=true`);
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error fetching Tree Object from Github API - fullName, lastProcessedCommit, treeSha: ${fullName}, ${lastProcessedCommit}, ${treeSha}`,
                            function: 'getRepositoryFile'});
        return res.json({success: false, error: err, alert: "Failed to get Tree Object from Github"});
    }

    var fileSha;
    var currentFileObj;
    
    // Find our file
    for (i = 0; i < treeResponse.data.tree.length; i++) {
        currentFileObj = treeResponse.data.tree[i];
        if (currentFileObj.path == pathInRepo) {
            fileSha = currentFileObj.sha;
            break;
        }
    }

    // If we couldn't find file Sha in Tree Object
    if (!fileSha) {
        await logger.error({source: 'backend-api',
                            message: Error(`Error couldn't find file path in Tree Object - fullName, lastProcessedCommit, pathInRepo, treeSha: ${fullName}, ${lastProcessedCommit}, ${pathInRepo}, ${treeSha}`),
                            errorDescription: `Error couldn't find file path in Tree Object - fullName, lastProcessedCommit, pathInRepo, treeSha: ${fullName}, ${lastProcessedCommit}, ${pathInRepo}, ${treeSha}`,
                            function: 'getRepositoryFile'});
        return res.json({success: false, error: Error(`Error couldn't find file path in Tree Object - fullName, lastProcessedCommit, pathInRepo, treeSha: ${fullName}, ${lastProcessedCommit}, ${pathInRepo}, ${treeSha}`), alert: "Failed to find file path in Tree Object"});
    }

    // repos/:username/:reponame/git/blobs/:sha
    var blobResponse;
    try {
        blobResponse = await installationClient.get(`/repos/${fullName}/git/blobs/${fileSha}`);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error Getting blob - fullName, fileSha: ${fullName}, ${fileSha}`,
                            function: 'getRepositoryFile'});
        return res.json({success: false, error: 'getRepositoryFile error getting file blob'});
    }
    if(!blobResponse.data.hasOwnProperty('content')) {
        await logger.error({source: 'backend-api', message: `Error blob has no 'content' property - fullName, fileSha: ${fullName}, ${fileSha}`,
                                function: 'getRepositoryFile'});
        return res.json({success: false, error: 'getRepositoryFile error: provided fileSha did not return a blob'});
    }

    
    var blobContent = blobResponse.data.content;
    var fileContent = Buffer.from(blobContent, 'base64').toString('binary');

    return res.json({success: true, result: fileContent});

}








getRepositoryFile = async (req, res) => {
    var {pathInRepo, referenceId } = req.body;
    const fullName = req.repositoryObj.fullName;
    const installationId = req.repositoryObj.installationId;

    // if (typeof fullName == 'undefined' || fullName == null) return res.json({success: false, error: 'no repo fullName provided'});
    // if (typeof installationId == 'undefined' || installationId == null) return res.json({success: false, error: 'no repo installationId provided'});
    if (!checkValid(pathInRepo) && !checkValid(referenceId)) {
        return res.json({success: false, error: 'no repo pathInRepo and referenceId provided'});
    }

    if (referenceId) {
        var reference;
        try {
            reference = await Reference.findOne({_id: referenceId}).lean().select('path').exec();
        }
        catch (err) {
            await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error querying findOne on Reference - referenceId: ${referenceId}`,
                                function: 'getRepositoryFile'});
            return res.json({success: false, error: err});
        }
        pathInRepo = reference.path;
    }


    var installationClient;
    try {
        installationClient = await apis.requestInstallationClient(installationId);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err, errorDescription: `Error fetching installationClient - installationId: ${installationId}`,
                            function: 'getRepositoryFile'});
        return res.json({success: false, error: err});
    }

    var fileResponse;
    try {
        fileResponse = await installationClient.get(`/repos/${fullName}/contents/${pathInRepo}`)
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error requesting '/repos/fullName/contents' - fullName, pathInRepo: ${fullName}, ${pathInRepo}`,
                            function: 'getRepositoryFile'});
        return res.json({success: false, error: `Error requesting '/repos/fullName/contents' - fullName, pathInRepo: ${fullName}, ${pathInRepo}`});
    }

    if (!fileResponse.data.hasOwnProperty('sha')) {
        await logger.error({source: 'backend-api', message: `Error provided pathInRepo did not resolve to a file - fullName, pathInRepo: ${fullName}, ${pathInRepo}`,
                            function: 'getRepositoryFile'});
        return res.json({success: false, error: 'getRepositoryFile error: provided path did not resolve to a file'});
    }

    var fileSha = fileResponse.data.sha;
    // repos/:username/:reponame/git/blobs/:sha
    var blobResponse;
    try {
        blobResponse = await installationClient.get(`/repos/${fullName}/git/blobs/${fileSha}`);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error Getting blob - fullName, fileSha: ${fullName}, ${fileSha}`,
                            function: 'getRepositoryFile'});
        return res.json({success: false, error: 'getRepositoryFile error getting file blob'});
    }
    if(!blobResponse.data.hasOwnProperty('content')) {
        await logger.error({source: 'backend-api', message: `Error blob has no 'content' property - fullName, fileSha: ${fullName}, ${fileSha}`,
                                function: 'getRepositoryFile'});
        return res.json({success: false, error: 'getRepositoryFile error: provided fileSha did not return a blob'});
    }

    
    var blobContent = blobResponse.data.content;
    var fileContent = Buffer.from(blobContent, 'base64').toString('binary');

    return res.json({success: true, result: fileContent});
}


// KARAN TODO: We can just return 'req.repositoryObj'
getRepository = async (req, res) => {

    const repositoryId = req.repositoryObj._id.toString();

    let returnedRepository;

    try {
        returnedRepository = await Repository.findById(repositoryId).lean().exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error findById Repository - repositoryId: ${repositoryId}`,
                                function: 'getRepository'});
        return res.json({success: false, error: `Error findById Repository - repositoryId: ${repositoryId}`, trace: err});
    }

    return res.json({success: true, result: returnedRepository});
}

// KARAN TODO: Make this a transaction
deleteRepository = async (req, res) => {
    const repositoryId = req.repositoryObj._id.toString();

    let returnedRepository;

    try {
        returnedRepository = await Repository.findByIdAndRemove(repositoryId).lean().select("_id").exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error findByIdAndRemove Repository - repositoryId: ${repositoryId}`,
                                function: 'deleteRepository'});
        return res.json({success: false, error: `Error findByIdAndRemove Repository - repositoryId: ${repositoryId}`, trace: err});
    }


    var referenceDeleteResult;
    try {
        referenceDeleteResult = await Reference.deleteMany({repository: ObjectId(repositoryId)});
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error deleteMany Reference - repositoryId: ${repositoryId}`,
                                function: 'deleteRepository'});
        return res.json({success: false, error: `Error deleteMany Reference - repositoryId: ${repositoryId}`, trace: err});
    }

    await logger.info({source: 'backend-api',
                        message: `Successfully deleted Repository & References - fullName, installationId: ${returnedRepository.fullName}, ${returnedRepository.installationId}`,
                        function: 'deleteRepository'});

    return res.json({success: true, result: returnedRepository});
}

retrieveCreationRepositories = async (req, res) => {
    const userId = req.userObj._id.toString();

    const { installationIds } = req.body;

    console.log('USER ID: ');
    console.log(userId);

    console.log('\n\n INSTALLATION IDS: ');
    console.log(installationIds);

    if (!checkValid(installationIds)) return res.json({success: false, error: "Retrieve Creation Repositories no installationIds provided"});

    if (!checkValid(userId)) return res.json({success: false, error: "Retrieve Creation Repositories no userId provided"});

    /*
    var userAccessToken;
    try {
       userAccessToken = await GithubAuthProfile.findOne({user: userId, status: 'valid'}).select("accessToken").lean().exec();
       userAccessToken = userAccessToken.accessToken;
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error fetching GithubAuthProfile - userId: ${userId}`,
                            function: 'retrieveCreationRepositories'});

        return res.json({success: false, error: err});
    }

    var installationResponse;
    try {
        installationResponse = await client.get("/user/installations",
            { headers: {
                    Authorization: `token ${userAccessToken}`,
                    Accept: 'application/vnd.github.v3+json'
                }
            });
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error fetching installation - userId: ${req.tokenPayload.userId}`, function: 'checkInstallation'});
        return res.json({success: false, error: err});
    }
    */
    var availableRepositories;
    try {
        availableRepositories = await Repository.find({installationId: { $in: installationIds }}).lean().exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error finding repositories - installationIds: ${JSON.stringify(installationIds)}`,
                                function: 'retrieveCreationRepositories'});
        return res.json({success: false,
                            error: `Error finding repositories - installationIds: ${JSON.stringify(installationIds)}`,
                            trace: err});
    }

    return res.json({success: true, result: availableRepositories});
}


retrieveRepositories = async (req, res) => {
    const {fullName, installationId, fullNames} = req.body;

    var repositoriesInWorkspace = req.workspaceObj.repositories;

    let query = Repository.find();

    if (fullName) query.where('fullName').equals(fullName);
    if (installationId) query.where('installationId').equals(installationId);
    if (fullNames) query.where('fullName').in(fullNames);

    let returnedRepositories;

    try {
        returnedRepositories = await query.lean().exec()
    } 
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error find repositories - fullName, fullNames, installationId: ${fullName}, ${JSON.stringify(fullNames)}, ${installationId}`,
                                function: 'deleteRepository'});
        return res.json({success: false,
                            error: `Error find repositories - fullName, fullNames, installationId: ${fullName}, ${JSON.stringify(fullNames)}, ${installationId}`,
                            trace: err});
    }

    // make sure that repository is in accessible workspace
    returnedRepositories = returnedRepositories.filter((repo) => repositoriesInWorkspace.includes(repo));

    return res.json({success: true, result: returnedRepositories});
}
/*
retrieveCreationRepositories = async (req, res) => {
    const { fullName, installationId, fullNames } = req.body;
    let query = Repository.find();

    if (checkValid(fullName)) query.where('fullName').equals(fullName);

    // installationId required for this route
    if (checkValid(installationId)) {
        query.where('installationId').equals(installationId);
    } else {
        return res.json({success: false, error: 'retrieveCreationRepositories error: no installationId Provided'});
    }

    if (checkValid(fullNames)) query.where('fullName').in(fullNames);

    let returnedRepositories;

    try {
        returnedRepositories = await query.lean().exec()
    } catch (err) {
        return res.json({ success: false, error: 'retrieveCreationRepositories error: repository retrieve \
            query failed', trace: err });
    }

    return res.json({success: true, result: returnedRepositories});
}
*/

jobRetrieveRepositories = async (req, res) => {
   const {fullName, installationId, fullNames} = req.body;

    let query = Repository.find();

    if (fullName) query.where('fullName').equals(fullName);
    if (installationId) query.where('installationId').equals(installationId);
    if (fullNames) query.where('fullName').in(fullNames)

    let returnedRepositories;

    try {
        returnedRepositories = await query.lean().exec()
    } 
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error job fetching repositories - fullName, fullNames, installationId: ${fullName}, ${JSON.stringify(fullNames)}, ${installationId}`,
                                function: 'jobRetrieveRepositories'});

        return res.json({success: false,
                            error: `Error job fetching repositories - fullName, fullNames, installationId: ${fullName}, ${JSON.stringify(fullNames)}, ${installationId}`,
                            trace: err});
    }

    return res.json({success: true, result: returnedRepositories});
}



// KARAN TODO: Add filtering here on 'ref', to prevent updating on pushes to other branches
updateRepository = async (req, res) => {
    const {fullName, ref, installationId, headCommit, cloneUrl, message, pusher} = req.body;

    if (!checkValid(fullName)) return res.json({success: false, error: 'updateRepository: no repository fullName provided'});
    if (!checkValid(installationId)) return res.json({success: false, error: 'updateRepository: no repository installationId provided'});


    if (!checkValid(headCommit)) return res.json({success: false, error: 'updateRepository: no headCommit provided on `push` event'});
    if (!checkValid(cloneUrl)) return res.json({success: false, error: 'updateRepository: no cloneUrl provided on `push` event'});

    if (!checkValid(message)) return res.json({success: false, error: 'updateRepository: no message provided on `push` event'});
    if (!checkValid(pusher)) return res.json({success: false, error: 'updateRepository: no pusher provided on `push` event'});

    var repository;

    try {
        repository = await Repository.findOne({fullName, installationId}).lean().exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                        errorDescription: `Error finding repository fullName, installationId: ${fullName}, ${installationId}`,
                        function: 'updateRepository'});
        return res.json({success: false, error: `Error finding repository fullName, installationId: ${fullName}, ${installationId}`});
    }

    // if !ref.includes('refs/heads/'), then it does not point to a branch, abort
    if (!ref.includes('refs/heads/')) {

        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error invalid ref, does not point to a branch - ref: ${ref}`,
                            function: 'updateRepository'});

        return res.json({success: false, error: `Error invalid ref, does not point to a branch - ref: ${ref}`});
    }

    // Don't update the Repository if the push is not to the default branch
    var pushedBranch = ref.split('/').slice(-1);
    if (repository.defaultBranch != pushedBranch) {
        await logger.info({source: 'backend-api',
                            message: `Ignoring update on non-default branch - defaultBranch, pushedBranch, fullName, installationId: ${repository.defaultBranch}, ${pushedBranch}, ${fullName}, ${installationId}`,
                            function: 'updateRepository'});

        return res.json({success: true,
                        result: `Ignoring update on non-default branch - defaultBranch, pushedBranch, fullName, installationId: ${repository.defaultBranch}, ${pushedBranch}, ${fullName}, ${installationId}`});
    }

    // If repository is unscanned, we don't update
    if (repository.scanned == false) {

        await logger.info({source: 'backend-api', message: `Ignoring update on unscanned repository fullName, installationId: ${fullName}, ${installationId}`,
                            function: 'updateRepository'});

        return res.json({success: true, result: `Ignoring update on unscanned repository fullName, installationId: ${fullName}, ${installationId}`});
    }

    var runReferencesData = {};
    runReferencesData['fullName'] = fullName;
    runReferencesData['installationId'] = installationId;
    runReferencesData['headCommit'] = headCommit;
    runReferencesData['cloneUrl'] = cloneUrl;
    runReferencesData['jobType'] = jobConstants.JOB_UPDATE_REFERENCES.toString();
    runReferencesData['message'] = message;
    runReferencesData['pusher'] = pusher;

    try {
        await jobs.dispatchUpdateReferencesJob(runReferencesData);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                        errorDescription: `Error dispatching update references job on repository fullName, installationId: ${fullName}, ${installationId}`,
                        function: 'updateRepository'});
        return res.json({success: false, error: `Error dispatching update references job on repository fullName, installationId: ${fullName}, ${installationId}`});
    }

    await logger.info({source: 'backend-api',
                        message: `Successfully began updating repository - headCommit, fullName, installationId: ${headCommit}, ${fullName}, ${installationId}`,
                        function: 'updateRepository'});

    return res.json({success: true, result: true});
}


removeInstallation = async (req, res) => {
    const { repositories, installationId } = req.body;

    // Get all Repositories installation was installed on
    var installationRepositories;
    try {
        installationRepositories = await Repository.find({fullName: { $in: repositories } }).select('_id fullName installationId').lean().exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error finding installationRepositories - installationId, repositories: ${installationId}, ${JSON.stringify(repositories)}`,
                            function: 'removeInstallation'});
        return res.json({success: false,
                            error: `Error finding installationRepositories - installationId, repositories: ${installationId}, ${JSON.stringify(repositories)}`});
    }

    var deleteIds = installationRepositories.map(repositoryObj => repositoryObj._id.toString());
    // Delete all Repositories installation as installed was on
    try {
        await Repository.deleteMany({_id: { $in: deleteIds.map(id => ObjectId(id)) }});
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error deleting Repositories - repositories: ${JSON.stringify(deleteIds)}`,
                            function: 'removeInstallation'});
        return res.json({success: false, error: `Error deleting Repositories - repositories: ${JSON.stringify(deleteIds)}`});
    }

    // Delete corresponding References
    try {
        await Reference.deleteMany({repository: { $in: deleteIds.map(id => ObjectId(id)) } });
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error deleting References - repositoryIds: ${JSON.stringify(deleteIds)}`,
                            function: 'removeInstallation'});
        return res.json({success: false, error: `Error deleting References - repositoryIds: ${JSON.stringify(deleteIds)}`});
    }

    // Remove from Workspaces
    try {
        await Workspace.updateMany({repositories: { $in: deleteIds.map(id => ObjectId(id))}}, { $pull: { repositories:  deleteIds.map(id => ObjectId(id))} });
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error Removing Repository Ids from Workspace - repositoryIds: ${JSON.stringify(deleteIds)}`,
                            function: 'removeInstallation'});
        return res.json({success: false, error: `Error Removing Repository Ids from Workspace - repositoryIds: ${JSON.stringify(deleteIds)}`});
    }

    await logger.info({source: 'backend-api',
                        message: `Successfully Deleted ${deleteIds.length} Repositories - repositoryIds: ${JSON.stringify(deleteIds)}`,
                        function: 'removeInstallation'});

    return res.json({success: true, result: deleteIds});
}


module.exports = {
    initRepository, getRepositoryFile,
    getRepositoryFileSafe, getRepository,
    deleteRepository, retrieveRepositories,
    updateRepository, jobRetrieveRepositories,
    retrieveCreationRepositories, removeInstallation
}
