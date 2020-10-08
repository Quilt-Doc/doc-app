const fs = require('fs');

const apis = require('./apis/api');


require('dotenv').config();

const constants = require('./constants/index');

const Workspace = require('./models/Workspace');
const Repository = require('./models/Repository');
const Reference = require('./models/Reference');


const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

const { filterVendorFiles } = require('./utils/validate_utils');


const {serializeError, deserializeError} = require('serialize-error');



const scanRepositories = async () => {

    var worker = require('cluster').worker;

    var installationId = process.env.installationId;

    var workspaceId = process.env.workspaceId;

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
        throw err;
    }


    // Assumption: Repositories with 'scanned' == false have 'currentlyScanning' set to true
    // Filter out repositories with 'scanned' == true
    var unscannedRepositories = repositoryObjList.filter(repositoryObj => repositoryObj.scanned == false);
    var unscannedRepositoryIdList = unscannedRepositories.map(repositoryObj => repositoryObj._id);
    
    // If all repositories within this workspace have already been scanned, nothing to do
    if (unscannedRepositories.length == 0) {
        // Set workspace 'setupComplete' to true
        try {
            await Workspace.findByIdAndUpdate(workspaceId, {$set: {setupComplete: true}}).exec();
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                        errorDescription: `Error setting workspace setupComplete to true, workspaceId: : ${workspaceId}`,
                                                        source: 'worker-instance', function: 'scanRepositories'}});
            throw new Error(`Error setting workspace setupComplete to true, workspaceId: : ${workspaceId}`);
        }
        await worker.send({action: 'log', info: {level: 'info', message: `No repositories to scan for repositoryIdList: ${JSON.stringify(repositoryIdList)}`,
                                                    source: 'worker-instance', function: 'scanRepositories'}});
        throw new Error(`No repositories to scan for repositoryIdList: ${JSON.stringify(repositoryIdList)}`);
    }


    var installationClient;
    try {
        installationClient = await apis.requestInstallationClient(installationId);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                    errorDescription: `Error fetching installationClient installationId: ${installationId}`,
                                                    function: 'scanRepositories'}});
        throw new Error(`Error fetching installationClient installationId: ${installationId}`);
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
        throw new Error(`Error getting repository objects urlList: ${urlList}`);
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
            await worker.send({action: 'log', info: {level: 'info', message: `bulk Repository 'html_url', 'clone_url', 'default_branch' update results: ${JSON.stringify(bulkResult)}`,
                                                source: 'worker-instance', function: 'scanRepositories'}});
        }
        catch(err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                        errorDescription: `Error bulk updating  on repositories: ${JSON.stringify(unscannedRepositoryIdList)}`,
                                                        source: 'worker-instance', function: 'scanRepositories'}});
            throw new Error(`Error bulk updating  on repositories: ${JSON.stringify(unscannedRepositoryIdList)}`);
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
        await worker.send({action: 'log', info: {level: 'info', source: 'worker-instance', message: err,
                                                    function: 'scanRepositories'}});

        await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                    errorDescription: `Error getting repository commits urlList: ${urlList}`,
                                                    function: 'scanRepositories'}});
        throw new Error(`Error getting repository commits urlList: ${urlList}`);
    }

    // Bulk update repository 'lastProcessedCommit' fields
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
            await worker.send({action: 'log', info: {level: 'info', message: `bulk Repository 'lastProcessCommit' update results: ${JSON.stringify(bulkResult)}`,
                                                source: 'worker-instance', function: 'scanRepositories'}});
        }
        catch(err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                        errorDescription: `Error bulk updating  on repositories: ${JSON.stringify(unscannedRepositoryIdList)}`,
                                                        source: 'worker-instance', function: 'scanRepositories'}});
            throw new Error(`Error bulk updating  on repositories: ${JSON.stringify(unscannedRepositoryIdList)}`);
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
        throw new Error(`Error getting repository tree urlList: ${urlList}`);
    }

    var treeReferences = [];
    var validPaths = [];
    // Extract References from trees
    for (i = 0; i < repositoryTreeResponseList.length; i++) {
        var currentTree = repositoryTreeResponseList[i].data.tree;
        for (k = 0; k < currentTree.length; k++) {
            let item = currentTree[k];

            let pathSplit = item.path.split('/')

            let name = pathSplit.slice(pathSplit.length - 1)[0]
            let path = pathSplit.join('/');
            let kind = item.type == 'blob' ? 'file' : 'dir'

            // Add trailing slashes for vendor filtering
            if (kind == 'dir') {
                path = path.endsWith('/') ? path : path + '/'
            }

            validPaths.push(path);
            treeReferences.push({ name, path, kind, repository: ObjectId(unscannedRepositories[i]._id), parseProvider: 'create' });
        }
    }

    // console.log('Paths to test: ');
    // console.log(JSON.stringify(validPaths));
    validPaths = filterVendorFiles(validPaths);

    console.log('validPaths: ');
    console.log(JSON.stringify(validPaths));

    // Remove invalid paths (vendor paths) from treeReferences
    treeReferences = treeReferences.filter(treeRefObj => validPaths.includes(treeRefObj.path));

    // Remove trailing slashes from directories
    treeReferences = treeReferences.map(treeRefObj => {
        var temp = treeRefObj.path;
        if (treeRefObj.kind == 'dir') {
            // directories are not stored with a trailing slash
            temp = temp.endsWith('/') ? temp.slice(0,-1) : temp
            // Strip out './' from start of paths
            temp = temp.startsWith('./') ? temp.slice(2, temp.length) : temp;
            return Object.assign({}, treeRefObj, {path: temp});
        }
        return treeRefObj;
    });


    // Bulk insert tree references
    var insertedReferences;
    try {
        insertedReferences = await Reference.insertMany(treeReferences);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                    errorDescription: `Error inserting tree references: ${JSON.stringify(unscannedRepositoryIdList)}`,
                                                    function: 'scanRepositories'}});
        throw new Error(`Error inserting tree references: ${JSON.stringify(unscannedRepositoryIdList)}`);
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
            await worker.send({action: 'log', info: {level: 'info', message: `bulk Repository status update results: ${JSON.stringify(bulkResult)}`,
                                                source: 'worker-instance', function: 'scanRepositories'}});
        }
        catch(err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                        errorDescription: `Error bulk updating status on repositories: ${JSON.stringify(unscannedRepositoryIdList)}`,
                                                        source: 'worker-instance', function: 'scanRepositories'}});
            throw new Error(`Error bulk updating status on repositories: ${JSON.stringify(unscannedRepositoryIdList)}`);
        }
    }

    // Set workspace 'setupComplete' to true
    try {
        await Workspace.findByIdAndUpdate(workspaceId, {$set: {setupComplete: true}}).exec();
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                    errorDescription: `Error setting workspace setupComplete to true, workspaceId: : ${workspaceId}`,
                                                    source: 'worker-instance', function: 'scanRepositories'}});
        throw new Error(`Error setting workspace setupComplete to true, workspaceId: : ${workspaceId}`);
    }

    await worker.send({action: 'log', info: {level: 'info', message: `Completed scanning repositories: ${unscannedRepositoryIdList}`,
                                                source: 'worker-instance', function: 'scanRepositories'}});
    
    return true;
}

module.exports = {
    scanRepositories
}