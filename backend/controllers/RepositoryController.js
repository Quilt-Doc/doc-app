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
        await logger.error({source: 'backend-api', message: 'err',
                        errorDescription: `Error saving repository fullName, installationId: ${fullName}, ${installationId}`,
                        function: 'initRepository'});
        return res.json({success: false, error: `Error saving repository fullName, installationId: ${fullName}, ${installationId}`});
    }

    return res.json({success: true, result: repository});
}

// Needs to use installation token
scanRepository = async (req, res) => {

    var repository = req.repositoryObj;

    if (repository.scanned == true) {
        await logger.error({source: 'backend-api', error: Error(`Repository already scanned fullName, installationId: ${fullName}, ${installationId}`),
                                errorDescription: 'Repository already scanned', function: 'scanRepository'});
        return res.json({success: false, error: `Repository already scanned fullName, installationId: ${fullName}, ${installationId}`});
    }


    var installationClient;
    try {
        installationClient = await apis.requestInstallationClient(installationId);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                        errorDescription: `Error fetching installationClient installationId: ${installationId}`, function: 'scanRepository'});
        return res.json({success: false, error: 'no repository installationId provided'});
    }
    
    var listCommitResponse;
    try {
        listCommitResponse = await installationClient.get('/repos/' + fullName + '/commits')
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err, 
                        errorDescription: `Error getting repository commits fullName, installationId: ${fullName}, ${installationId}`,
                        function: 'scanRepository'});
    }

    var latestCommitSha = listCommitResponse.data[0]['sha'];

    repository.lastProcessedCommit = latestCommitSha;

    try {
        repository = await respository.save();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error saving repository fullName, installationId: ${fullName}, ${installationId}`,
                                function: 'scanRepository'});
        return res.json({success: false, error: `Error saving repository fullName, installationId: ${fullName}, ${installationId}`});
    }

    var githubRepositoryObj;
    try {
        githubRepositoryObj = await installationClient.get(`/repos/${fullName}`).data;
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error getting repository object from Github fullName, installationId: ${fullName}, ${installationId}`,
                                function: 'scanRepository'});
        return res.json({success: false, error: `Error getting repository object from Github fullName, installationId: ${fullName}, ${installationId}`});
    }

    var cloneUrl = githubRepositoryObj.clone_url;
    
    repository.cloneUrl = cloneUrl;
    
    try {
        repository = await repository.save();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error saving repository fullName, installationId: ${fullName}, ${installationId}`,
                                function: 'scanRepository'});
        return res.json({success: false, error: `Error saving repository fullName, installationId: ${fullName}, ${installationId}`});

    }

    // Get all commits from default branch
    var commitListResponse;
    try {
        commitListResponse = await installationClient.get(`/repos/${fullName}/commits/${githubRepositoryObj.default_branch}`).data;
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error getting list of commits for repository fullName, installationId: ${fullName}, ${installationId}`,
                                function: 'scanRepository'});
        return res.json({success: false, error: `Error getting list of commits for repository fullName, installationId: ${fullName}, ${installationId}`});
    }

    // Extract tree SHA from most recent commit
    let treeSHA = commitListResponse.commit.tree.sha;


    // Extract contents using tree SHA
    var treeResponse;
    try {
        treeResponse = await installationClient.get(`/repos/${fullName}/git/trees/${treeSHA}?recursive=true`).data;
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error getting tree for repository treeSHA, fullName, installationId: ${treeSHA}, ${fullName}, ${installationId}`,
                                function: 'scanRepository'});
        return res.json({success: false, error: `Error getting tree for repository treeSHA, fullName, installationId: ${treeSHA}, ${fullName}, ${installationId}`});
    }

    let treeReferences = treeResponse.tree.map(item => {

        let pathSplit = item.path.split('/')
        let name = pathSplit.slice(pathSplit.length - 1)[0]
        let path = pathSplit.join('/');
        let kind = item.type == 'blob' ? 'file' : 'dir'
        return {name, path, kind, repository: ObjectId(repository._id)}
    })

    var insertedReferences;
    try {
        insertedReferences = await Reference.insertMany(treeReferences);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `Error inserting tree references for repository treeSHA, fullName, installationId: ${treeSHA}, ${fullName}, ${installationId}`,
                                function: 'scanRepository'});
        return res.json({success: false, error: `Error inserting tree references for repository treeSHA, fullName, installationId: ${treeSHA}, ${fullName}, ${installationId}`});
    }
    logger.info({source: 'backend-api',
                    message: `scanRepository: inserted ${insertedReferences.length} tree references for repository fullName, installationId: ${fullName}, ${installationId}`,
                    function: 'scanRepository'});
    return res.json({success: true, result: insertedReferences.length});
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
        const reference = await Reference.findOne({_id: referenceId}).lean().select('path').exec();
        pathInRepo = reference.path;
    }


    // var installationClient = await apis.requestInstallationClient(installationId);
    var installationClient = await apis.requestInstallationClient(11148646);
    var fileResponse = await installationClient.get(`/repos/${fullName}/contents/${pathInRepo}`)
            .catch(err => {
                return res.json({success: false, error: 'getRepositoryFile error fetching fileSha: ' + err});
            });
    if (!fileResponse.data.hasOwnProperty('sha')) {
        return res.json({success: false, error: 'getRepositoryFile error: provided path did not resolve to a file'});
    }
    var fileSha = fileResponse.data.sha;
    // repos/:username/:reponame/git/blobs/:sha
    var blobResponse = await installationClient.get(`/repos/${fullName}/git/blobs/${fileSha}`)
            .catch(err => {
                return res.json({success: false, error: 'getRepositoryFile error getting file blob'});
            });
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
        returnedRepository = Repository.findById(repositoryId).lean().exec();
    } catch (err) {
        return res.json({success: false, error: 'getRepository error: repository find by id query failed', trace: err});
    }
    
    return res.json({success: true, result: returnedRepository});
}


deleteRepository = async (req, res) => {
    const repositoryId = req.repositoryObj._id.toString();

    let returnedRepository;

    try {
        returnedRepository = Repository.findByIdAndRemove(repositoryId).lean().select("_id").exec();
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
    const {fullName, ref, installationId, eventType, headCommit, cloneUrl} = req.body;
    console.log('updateRepository called');

    console.log('eventType: ', eventType);
    console.log('fullName: ', fullName);
    console.log('installationId: ', installationId);

    if (!checkValid(eventType)) return res.json({success: false, error: 'updateRepository: no eventType provided'});
    if (!checkValid(fullName)) return res.json({success: false, error: 'updateRepository: no repository fullName provided'});
    if (!checkValid(installationId)) return res.json({success: false, error: 'updateRepository: no repository installationId provided'});

    console.log('eventType: ', eventType);
    // This conditional determines if we run snippet job and outdate old treeReferences
    if (eventType == 'push') {
        console.log('Updating repository on push');
        if (typeof headCommit == 'undefined' || headCommit == null) return res.json({success: false, error: 'updateRepository: no headCommit provided on `push` event'});
        if (typeof cloneUrl == 'undefined' || cloneUrl == null) return res.json({success: false, error: 'updateRepository: no cloneUrl provided on `push` event'});

        var repository;

        var repository = await Repository.findOne({fullName, installationId}).exec()
                                .catch(err => {
                                    return res.json({ success: false, error: 'Error updateRepository could not find repository: ' + err });
                                });

        repository.snippetJobStatus = jobConstants.JOB_STATUS_RUNNING;
        await repository.save()
                .catch(err => {
                    return res.json({success: false, error: 'Error setting repository snippetJobStatus = JOB_STATUS_RUNNING ' + err});
                });

        var runReferencesData = {};
        runReferencesData['fullName'] = fullName;
        runReferencesData['installationId'] = installationId;
        runReferencesData['headCommit'] = '9d87a041d7f12f1f59df90fb2e9485d9b067ac37';
        runReferencesData['cloneUrl'] = cloneUrl;
        runReferencesData['jobType'] = jobConstants.JOB_UPDATE_REFERENCES.toString();

        repository.updateReferencesJobStatus = jobConstants.JOB_STATUS_RUNNING;
        await repository.save();
        console.log('Calling update References Job');
        await jobs.dispatchUpdateReferencesJob(runReferencesData, log);



        /*
        var treeResponse = await installationClient.get(`/repos/${fullName}/git/trees/${headCommit}?recursive=true`)
                                    .catch(err => {
                                        return res.json({success: false, error: 'updateRepository: error getting repository tree: ', err});
                                    });

        let treeReferences = response.data.tree.map(item => {        
            let pathSplit = item.path.split('/')
            let name = pathSplit.slice(pathSplit.length - 1)[0]
            let path = pathSplit.join('/');
            let kind = item.type == 'blob' ? 'file' : 'dir'
            return {name, path, kind, repository: ObjectId(repository._id), lastProcessedCommit: headCommit}
        });

        // Upsert all of the tree References
        const bulkRefreshOps = treeReferences.map(refObj => ({
       
            updateOne: {
                    filter: { name: refObj.name, path: refObj.path, kind: refObj.kind,
                        repository: refObj.repository },
                    // Where field is the field you want to update
                    update: { $set: { status: 'VALID', lastProcessedCommit: headCommit } },
                    upsert: true
                    }
                }));
        if (bulkRefreshOps.length > 0) {
            await Reference.collection
                .bulkWrite(bulkRefreshOps)
                .then(results => console.log(results))
                .catch((err) => {
                    return res.json({success: false, error: 'Error bulk updating References on push: ' + err});
                });
        }

        // Mark all old untouched treeReferences as invalid
        const bulkInvalidateOps = treeReferences.map(refObj => ({
            updateOne: {
                    filter: { lastProcessedCommit: { $ne: headCommit } },
                    // Where field is the field you want to update
                    update: { $set: { status: 'INVALID' } },
                    upsert: false
                    }
                }));
        if (bulkInvalidateOps.length > 0) {
            Reference.collection
                .bulkWrite(bulkRefreshOps)
                .then(results => console.log(results))
                .catch((err) => {
                    return res.json({success: false, error: 'Error bulk invalidating References on push: ' + err});
                });
        }
        */

    }

    return res.json({success: true, result: true});
}

// In route needs: repoId
// In req.body needs: pathInRepo, breakCommit
// Update the Reference itself
// Find all documents associated with the Reference, and update their statuses appropriately
//  If document already invalid, do nothing
//  If document valid then: set status to invalid, set breakCommit to Reference breakCommit
// breakCommits = [{`oldRef`: `commitSha`}, ...]


module.exports = {
    initRepository, scanRepository,
    getRepositoryFile, getRepository,
    deleteRepository, retrieveRepositories,
    validateRepositories, pollRepositories, updateRepository,
    jobRetrieveRepositories
}
