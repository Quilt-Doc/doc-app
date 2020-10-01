const url = require('url');

var request = require("request");

const apis = require('../apis/api');

const jobs = require('../apis/jobs');
const jobConstants = require('../constants/index').jobs;

const logger = require('../logging/index').logger;

const Repository = require('../models/Repository');
const Reference = require('../models/Reference');
const Document = require('../models/Document');

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const { json } = require('body-parser');


checkValid = (item) => {
    if (item !== null && item !== undefined) {
        return true
    }
    return false
}

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
        return res.json({success: false, error: `Error saving repository fullName, installationId: ${fullName}, ${installationId}`});
    }

    try {
        await Reference.create({repository: repository._id, 
            name: repository.fullName, kind: 'dir', path: "", parseProvider: "create"});
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
            await logger.error({source: 'backend-api', message: err, errorDescription: `Error querying findOne on Reference - referenceId: `,
                                function: 'getRepositoryFile'});
            return res.json({success: false, error: err});
        }
        pathInRepo = reference.path;
    }


    var installationClient;
    try {
        = await apis.requestInstallationClient(installationId);
    }
    catch (err) {

    }

    var fileResponse;
    try {
        fileResponse = await installationClient.get(`/repos/${fullName}/contents/${pathInRepo}`)
    }
    catch (err) {
        return res.json({success: false, error: 'getRepositoryFile error fetching fileSha: ' + err});
    }

    if (!fileResponse.data.hasOwnProperty('sha')) {
        return res.json({success: false, error: 'getRepositoryFile error: provided path did not resolve to a file'});
    }
    var fileSha = fileResponse.data.sha;
    // repos/:username/:reponame/git/blobs/:sha
    var blobResponse;
    try {
        blobResponse = await installationClient.get(`/repos/${fullName}/git/blobs/${fileSha}`);
    }
    catch (err) {

        return res.json({success: false, error: 'getRepositoryFile error getting file blob'});
    }
    if(!blobResponse.data.hasOwnProperty('content')) {
        return res.json({success: false, error: 'getRepositoryFile error: provided fileSha did not return a blob'});
    }

    
    var blobContent = blobResponse.data.content;
    var fileContent = Buffer.from(blobContent, 'base64').toString('binary');

    return res.json({success: true, result: fileContent});
}


getRepository = async (req, res) => {

    const repositoryId = req.repositoryObj._id.toString();

    let returnedRepository;

    try {
        returnedRepository = await Repository.findById(repositoryId).lean().exec();
    } catch (err) {
        return res.json({success: false, error: 'getRepository error: repository find by id query failed', trace: err});
    }
    
    return res.json({success: true, result: returnedRepository});
}


deleteRepository = async (req, res) => {
    const repositoryId = req.repositoryObj._id.toString();

    let returnedRepository;

    try {
        returnedRepository = await Repository.findByIdAndRemove(repositoryId).lean().select("_id").exec();
    } catch (err) {
        return res.json({success: false, error: 'deleteRepository error: repository find by id and remove query failed', trace: err});
    }

    return res.json({success: true, result: returnedRepository});
}


retrieveRepositories = async (req, res) => {
    const {fullName, installationId, fullNames} = req.body;

    var repositoriesInWorkspace = req.workspaceObj.repositories;

    let query = Repository.find();

    if (fullName) query.where('fullName').equals(fullName);
    if (installationId) query.where('installationId').equals(installationId);
    if (fullNames) query.where('fullName').in(fullNames)

    let returnedRepositories;

    try {
        returnedRepositories = await query.lean().exec()
    } catch (err) {
        return res.json({success: false, error: 'retrieveRepositories error: repository retrieve \
            query failed', trace: err});
    }
    
    // make sure that repository is in accessible workspace
    returnedRepositories = returnedRepositories.filter((repo) => repositoriesInWorkspace.includes(repo));

    return res.json({success: true, result: returnedRepositories});
}

jobRetrieveRepositories = async (req, res) => {
   const {fullName, installationId, fullNames} = req.body;

    let query = Repository.find();

    if (fullName) query.where('fullName').equals(fullName);
    if (installationId) query.where('installationId').equals(installationId);
    if (fullNames) query.where('fullName').in(fullNames)

    let returnedRepositories;

    try {
        returnedRepositories = await query.lean().exec()
    } catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error job fetching repositories, fullName, installationId: ${fullName}, ${installationId}`,
                                function: 'jobRetrieveRepositories'});

        return res.json({success: false, error: 'retrieveRepositories error: repository retrieve \
            query failed', trace: err});
    }

    return res.json({success: true, result: returnedRepositories});
}


validateRepositories = async (req, res) => {
    let repositories = [];


    let ids = Object.keys(req.body.selected)
    for (let i = 0; i < ids.length; i++){
        let id = ids[i]
        let fullName = req.body.selected[id]
        let repository = await (await Repository.findOne({fullName: fullName, installationId: req.body.installationId})).execPopulate()

        if (!repository) {
            repositories.push(fullName)
            /*
            console.log("REPOSITORY Id:", id)
            console.log("INSTALLATION Id:", req.body.installationId)
            console.log("ACCESS TOKEN:", req.body.accessToken)

            const response = 
                await api.put(`/user/installations/${req.body.installationId}/repositories/${id}`, 
                    { headers: {
                        Authorization: `token ${req.body.accessToken}`,
                        Accept: 'application/json'
                    }
                })
            
            console.log(response)*/
        }
    }
    /*
    req.body.fullNames.map(fullName => {
        let repository = await Repository.findOne({fullName, installationId: req.body.installationId})
        if (!repository) {
            repositories.push(fullName)
        }
    })*/
    return res.json({success: true, result: repositories})
}


pollRepositories = async (req, res) => {
    let { fullNames, installationId } = req.body
    for (let i = 0; i < fullNames.length; i++) {
        let fullName = fullNames[i]
        let repository = await Repository.findOne({fullName: fullName, installationId: installationId})
        if (!repository || repository.doxygenJobStatus !== jobConstants.JOB_STATUS_FINISHED || repository.semanticJobStatus !== jobConstants.JOB_STATUS_FINISHED) {
            return res.json({success: true, result: false})
        }
    }
    return res.json({success: true, result: true})
}


updateRepository = async (req, res) => {
    const {fullName, ref, installationId, headCommit, cloneUrl} = req.body;

    if (!checkValid(fullName)) return res.json({success: false, error: 'updateRepository: no repository fullName provided'});
    if (!checkValid(installationId)) return res.json({success: false, error: 'updateRepository: no repository installationId provided'});


    if (typeof headCommit == 'undefined' || headCommit == null) return res.json({success: false, error: 'updateRepository: no headCommit provided on `push` event'});
    if (typeof cloneUrl == 'undefined' || cloneUrl == null) return res.json({success: false, error: 'updateRepository: no cloneUrl provided on `push` event'});

    var repository;

    try {
        repository = await Repository.findOne({fullName, installationId}).exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                        errorDescription: `Error finding repository fullName, installationId: ${fullName}, ${installationId}`,
                        function: 'updateRepository'});
        return res.json({success: false, error: `Error finding repository fullName, installationId: ${fullName}, ${installationId}`});
    }

    // If repository is unscanned, we don't update
    if (repository.scanned == false || repository.scanned == true) {
        return res.json({success: true, result: `Ignoring update on unscanned repository fullName, installationId: ${fullName}, ${installationId}`});
    }

    var runReferencesData = {};
    runReferencesData['fullName'] = fullName;
    runReferencesData['installationId'] = installationId;
    runReferencesData['headCommit'] = '9d87a041d7f12f1f59df90fb2e9485d9b067ac37';
    runReferencesData['cloneUrl'] = cloneUrl;
    runReferencesData['jobType'] = jobConstants.JOB_UPDATE_REFERENCES.toString();

    try {
        await jobs.dispatchUpdateReferencesJob(runReferencesData);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                        errorDescription: `Error dispatching update references job on repository fullName, installationId: ${fullName}, ${installationId}`,
                        function: 'updateRepository'});
        return res.json({success: false, error: `Error dispatching update references job on repository fullName, installationId: ${fullName}, ${installationId}`});
    }

    return res.json({success: true, result: true});
}


module.exports = {
    initRepository, getRepositoryFile, getRepository,
    deleteRepository, retrieveRepositories,
    validateRepositories, pollRepositories, updateRepository,
    jobRetrieveRepositories
}
