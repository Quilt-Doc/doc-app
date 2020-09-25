const fs = require('fs');

const apis = require('./apis/api');


require('dotenv').config();

const constants = require('./constants/index');

const Repository = require('./models/Repository');
const Reference = require('./models/Reference');


const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;


const {serializeError, deserializeError} = require('serialize-error');



const scanRepositories = async () => {

    var worker = require('cluster').worker;

    await worker.send({action: 'receipt', receipt: process.env.receipt})

    var installationId = process.env.installationId;

    var repositoryIdList = JSON.parse(process.env.repositoryIdList);
    var urlList;


    var repositoryObjList;

    try {
        repositoryObjList = await Repository.find({_id: {$in: repositoryIdList}, installationId});
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                    errorDescription: `Error finding repositories, installationId repositoryIdList: ${installationId}, ${JSON.stringify(repositoryIdList)}`,
                                                    source: 'worker-instance', function: 'scanRepositories'}});
        worker.kill();
    }


    // Assumption: Repositories with 'scanned' == false have 'currentlyScanning' set to true
    // Filter out repositories with 'scanned' == true
    var unscannedRepositories = repositoryObjList.filter(repositoryObj => repositoryObj.scanned == false);
    var unscannedRepositoryIdList = unscannedRepositories.map(repositoryObj => repositoryObj._id);
    
    // If all repositories within this workspace have already been scanned, nothing to do
    if (unscannedRepositories.length == 0) {
        await worker.send({action: 'log', info: {level: 'info', message: `No repositories to scan for repositoryIdList: ${JSON.stringify(repositoryIdList)}`,
                                                    source: 'worker-instance', function: 'scanRepositories'}});
        worker.kill();
    }


    var installationClient;
    try {
        installationClient = await apis.requestInstallationClient(installationId);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                    errorDescription: `Error fetching installationClient installationId: ${installationId}`,
                                                    function: 'scanRepositories'}});
        worker.kill();
    }

    // Get Repository objects from github for all unscanned Repositories
    var repositoryListObjects;
    try {
        urlList = unscannedRepositories.map(repositoryObj => `/repos/${repositoryObj.fullName}`);
        var requestPromiseList = urlList.map(url => installationClient.get(url));

        repositoryListObjects = await Promise.all(requestPromiseList);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                    errorDescription: `Error getting repository objects urlList: ${urlList}`,
                                                    function: 'scanRepositories'}});
        worker.kill();
    }

    // Bulk update 'cloneUrl', 'htmlUrl', and 'defaultBranch' fields
    // Update our local list of unscannedRepositories to include the default_branch at the same time
    const bulkFieldUpdateOps = repositoryListObjects.map((repositoryListObjectResponse, idx) => {
        unscannedRepositories[idx].defaultBranch = repositoryListObjectResponse.data.default_branch
        return {
            updateOne: {
                    filter: { _id: unscannedRepositories[idx]._id },
                    // Where field is the field you want to update
                    update: { $set: { htmlUrl: repositoryListObjectResponse.data.html_url,
                                        cloneUrl: repositoryListObjectResponse.data.clone_url,
                                        defaultBranch:  repositoryListObjectResponse.data.default_branch} },
                    upsert: false
            }
        }
    });

    if (bulkFieldUpdateOps.length > 0) {
        try {
            const bulkResult = await Repository.collection.bulkWrite(bulkFieldUpdateOps);
            await worker.send({action: 'log', info: {level: 'debug', message: `bulk Repository 'html_url', 'clone_url', 'default_branch' update results: ${bulkResult}`,
                                                source: 'worker-instance', function: 'scanRepositories'}});
        }
        catch(err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                        errorDescription: `Error bulk updating  on repositories: ${JSON.stringify(unscannedRepositoryIdList)}`,
                                                        source: 'worker-instance', function: 'scanRepositories'}});
            worker.kill();
        }
    }


    // Get Repository commits for all unscanned Repositories
    var repositoryListCommits;
    try {
        urlList = unscannedRepositories.map(repositoryObj => `/repos/${repositoryObj.fullName}/commits/${repositoryObj.defaultBranch}`);
        var requestPromiseList = urlList.map(url => installationClient.get(url));

        repositoryListCommits = await Promise.all(requestPromiseList);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                    errorDescription: `Error getting repository commits urlList: ${urlList}`,
                                                    function: 'scanRepositories'}});
        worker.kill();
    }

    // Bulk update repository 'lastProcessedCommit' fields
    /*
    const bulkLastCommitOps = repositoryListCommits.map((repositoryCommitResponse, idx) => ({

        updateOne: {
                filter: { _id: unscannedRepositories[idx]._id },
                // Where field is the field you want to update
                update: { $set: { lastProcessedCommit: repositoryCommitResponse.data[0].sha } },
                upsert: false
        }
    }));
    */

   const bulkLastCommitOps = repositoryListCommits.map((repositoryCommitResponse, idx) => {
    // TODO: Figure out why this list commits endpoint isn't returning an array
    // console.log('repositoryCommitResponse.data[0]: ');
    // console.log(repositoryCommitResponse.data[0]);
    return {updateOne: {
            filter: { _id: unscannedRepositories[idx]._id },
            // Where field is the field you want to update
            update: { $set: { lastProcessedCommit: repositoryCommitResponse.data.sha } },
            upsert: false
    }}
    });

    if (bulkLastCommitOps.length > 0) {
        try {
            const bulkResult = await Repository.collection.bulkWrite(bulkLastCommitOps);
            await worker.send({action: 'log', info: {level: 'debug', message: `bulk Repository 'lastProcessCommit' update results: ${bulkResult}`,
                                                source: 'worker-instance', function: 'scanRepositories'}});
        }
        catch(err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                        errorDescription: `Error bulk updating  on repositories: ${JSON.stringify(unscannedRepositoryIdList)}`,
                                                        source: 'worker-instance', function: 'scanRepositories'}});
            worker.kill();
        }
    }

    // Get Tree Objects for each Repository
    var repositoryTreeResponseList;

    // Get tree sha's for latest commit on default branch for each Repository
    repositoryListCommits.forEach((repositoryCommitResponse, idx) => {
        unscannedRepositories[idx].treeSha = repositoryCommitResponse.data.commit.tree.sha;
    });

    try {
        urlList = unscannedRepositories.map(repositoryObj => `/repos/${repositoryObj.fullName}/git/trees/${repositoryObj.treeSha}?recursive=true`);
        var requestPromiseList = urlList.map(url => installationClient.get(url));
        repositoryTreeResponseList = await Promise.all(requestPromiseList);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                    errorDescription: `Error getting repository tree urlList: ${urlList}`,
                                                    function: 'scanRepositories'}});
        worker.kill();
    }

    var treeReferences = [];
    // Extract References from trees
    for (i = 0; i < repositoryTreeResponseList.length; i++) {
        var currentTree = repositoryTreeResponseList[i].data.tree;
        for (k = 0; k < currentTree.length; k++) {
            let item = currentTree[k];

            let pathSplit = item.path.split('/')

            let name = pathSplit.slice(pathSplit.length - 1)[0]
            let path = pathSplit.join('/');
            let kind = item.type == 'blob' ? 'file' : 'dir'

            treeReferences.push({ name, path, kind, repository: ObjectId(unscannedRepositories[i]._id), parseProvider: 'create' });
        }
    }


    // Bulk insert tree references
    var insertedReferences;
    try {
        insertedReferences = await Reference.insertMany(treeReferences);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                    errorDescription: `Error inserting tree references: ${JSON.stringify(unscannedRepositoryIdList)}`,
                                                    function: 'scanRepositories'}});
        worker.kill();
    }

    await worker.send({action: 'log', info: {level: 'info', source: 'worker-instance', message: `inserted ${insertedReferences.length} tree references`,
                                                function: 'scanRepositories'}});


    // Update 'scanned' to true, 'currentlyScanning' to false
    const bulkStatusUpdateOps = unscannedRepositories.map(repositoryObj => ({

        updateOne: {
                filter: { _id: repositoryObj._id },
                // Where field is the field you want to update
                update: { $set: { scanned: true, currentlyScanning: false } },
                upsert: false
        }
    }));

    if (bulkStatusUpdateOps.length > 0) {
        try {
            const bulkResult = await Repository.collection.bulkWrite(bulkStatusUpdateOps);
            await worker.send({action: 'log', info: {level: 'debug', message: `bulk Repository status update results: ${bulkResult}`,
                                                source: 'worker-instance', function: 'scanRepositories'}});
        }
        catch(err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                        errorDescription: `Error bulk updating status on repositories: ${JSON.stringify(unscannedRepositoryIdList)}`,
                                                        source: 'worker-instance', function: 'scanRepositories'}});
            worker.kill();
        }
    }

    await worker.send({action: 'log', info: {level: 'info', message: `Completed scanning repositories: ${unscannedRepositoryIdList}`,
                                                source: 'worker-instance', function: 'scanRepositories'}});
}

module.exports = {
    scanRepositories
}