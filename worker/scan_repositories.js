const fs = require('fs');

const apis = require('../apis/api');


require('dotenv').config();

const constants = require('./constants/index');

const Repository = require('./models/Repository');


const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;


const {serializeError, deserializeError} = require('serialize-error');



const scanRepositories = async () => {

    var worker = require('cluster').worker;

    await worker.send({action: 'receipt', receipt: process.env.receipt})

    var installationId = process.env.installationId;


    var repositoryIdList = process.env.repositoryIdList;

    var repositoryObjList;

    try {
        repositoryObjList = await Repository.find({_id: {$in: repositoryIdList}});
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                    errorDescription: `Error finding repositories, repositoryIdList: ${repoId}`,
                                                    source: 'worker-instance', function: 'scanRepositories'}});
        worker.kill();
    }




    if (repository.scanned == true) {
        await logger.error({source: 'backend-api', error: Error(`Repository already scanned fullName, installationId: ${fullName}, ${installationId}`),
                                errorDescription: 'Repository already scanned', function: 'scanRepositories'});
        return res.json({success: false, error: `Repository already scanned fullName, installationId: ${fullName}, ${installationId}`});
    }


    var installationClient;
    try {
        installationClient = await apis.requestInstallationClient(installationId);
    }
    catch (err) {
        await logger.error({source: 'worker-instance', message: err,
                        errorDescription: `Error fetching installationClient installationId: ${installationId}`, function: 'scanRepositories'});
        return res.json({success: false, error: 'Error fetching installationClient'});
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

module.exports = {
    scanRepositories
}