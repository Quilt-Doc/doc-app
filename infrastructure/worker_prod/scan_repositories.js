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

let db = mongoose.connection;



const scanRepositories = async () => {

    var worker = require('cluster').worker;

    const session = await db.startSession();

    var transactionAborted = false;
    var transactionError = {message: ''};

    await session.withTransaction(async () => {

        var installationId = process.env.installationId;

        var workspaceId = process.env.workspaceId;

        var repositoryIdList = JSON.parse(process.env.repositoryIdList);
        var urlList;


        var repositoryObjList;

        try {
            repositoryObjList = await Repository.find({_id: {$in: repositoryIdList}, installationId}, null, { session });
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                        errorDescription: `Error finding repositories, installationId repositoryIdList: ${installationId}, ${JSON.stringify(repositoryIdList)}`,
                                                        source: 'worker-instance', function: 'scanRepositories'}});

            transactionAborted = true;
            transactionError.message = `Error finding repositories, installationId repositoryIdList: ${installationId}, ${JSON.stringify(repositoryIdList)}`;

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
                await Workspace.findByIdAndUpdate(workspaceId, {$set: {setupComplete: true}}, { session }).exec();
            }
            catch (err) {
                await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                            errorDescription: `Error setting workspace setupComplete to true, workspaceId: : ${workspaceId}`,
                                                            source: 'worker-instance', function: 'scanRepositories'}});

                transactionAborted = true;
                transactionError.message = `Error setting workspace setupComplete to true, workspaceId: : ${workspaceId}`;

                throw new Error(`Error setting workspace setupComplete to true, workspaceId: : ${workspaceId}`);
            }
            await worker.send({action: 'log', info: {level: 'info', message: `No repositories to scan for repositoryIdList: ${JSON.stringify(repositoryIdList)}`,
                                                        source: 'worker-instance', function: 'scanRepositories'}});
            return true;
            // throw new Error(`No repositories to scan for repositoryIdList: ${JSON.stringify(repositoryIdList)}`);
        }


        var installationClient;
        try {
            installationClient = await apis.requestInstallationClient(installationId);
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                        errorDescription: `Error fetching installationClient installationId: ${installationId}`,
                                                        function: 'scanRepositories'}});

            transactionAborted = true;
            transactionError.message = `Error setting workspace setupComplete to true, workspaceId: : ${workspaceId}`;
            
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

            transactionAborted = true;
            transactionError.message = `Error getting repository objects urlList: ${urlList}`;

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
                const bulkResult = await Repository.collection.bulkWrite(bulkFieldUpdateOps, { session });
                await worker.send({action: 'log', info: {level: 'info', message: `bulk Repository 'html_url', 'clone_url', 'default_branch' update results: ${JSON.stringify(bulkResult)}`,
                                                    source: 'worker-instance', function: 'scanRepositories'}});
            }
            catch(err) {
                await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                            errorDescription: `Error bulk Repository 'html_url', 'clone_url', 'default_branch' update failed - repositories: ${JSON.stringify(unscannedRepositoryIdList)}`,
                                                            source: 'worker-instance', function: 'scanRepositories'}});

                transactionAborted = true;
                transactionError.message = `Error bulk Repository 'html_url', 'clone_url', 'default_branch' update failed - repositories: ${JSON.stringify(unscannedRepositoryIdList)}`;
                                                
                throw new Error(`Error bulk Repository 'html_url', 'clone_url', 'default_branch' update failed - repositories: ${JSON.stringify(unscannedRepositoryIdList)}`);
            }
        }


        // Get Repository commits for all unscanned Repositories
        // Handle 409 Responses
        var repositoryListCommits;
        try {
            urlList = unscannedRepositories.map(repositoryObj => `/repos/${repositoryObj.fullName}/commits/${repositoryObj.defaultBranch}`);
            var requestPromiseList = urlList.map( async (url) => {
                var response;
                try {
                    response = await installationClient.get(url);
                }
                catch (err) {
                    /*
                    await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                        errorDescription: `Error retrieving repository commits - url: ${url}`,
                                        source: 'worker-instance', function: 'scanRepositories'}});
                    */
                    return {error: 'Error', statusCode: err.response.status};
                }
                return response;
            });

            repositoryListCommits = await Promise.allSettled(requestPromiseList);

            // Get all successful results and 409 responses
            // add 'isEmptyRepository' & 'failed' fields to hold status of request
            repositoryListCommits = repositoryListCommits.map(resultObj => {
                var temp = resultObj;
                if (temp.value) {
                    // Was it an empty Repository
                    if (temp.value.error && temp.value.statusCode == 409) {
                        temp.isEmptyRepository = true;
                        temp.failed = false;
                    }
                    // If there's some other error we need to not continue with operations on that Repository
                    else if (temp.value.error) {
                        temp.isEmptyRepository = false;
                        temp.failed = true;
                    }
                    // If there's no error field and a value field, treat as success
                    else {
                        temp.isEmptyRepository = false;
                        temp.failed = false;
                    }
                }
                // If value somehow is falsey, treat as failure
                else {
                    temp.isEmptyRepository = false;
                    temp.failed = true;
                }
                return temp;
            });
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                        errorDescription: `Error getting repository commits urlList: ${urlList}`,
                                                        function: 'scanRepositories'}});
            
            transactionAborted = true;
            transactionError.message = `Error getting repository commits urlList: ${urlList}`;
            
            throw new Error(`Error getting repository commits urlList: ${urlList}`);
        }

        // Bulk update repository 'lastProcessedCommit' fields
        // If repository is empty, set 'lastProcessedCommit' to 'EMPTY'
        // If repository 'failed' is true, return a value that will be filtered out on the bulkWrite
        const bulkLastCommitOps = repositoryListCommits.map((repositoryCommitResponse, idx) => {
            // TODO: Figure out why this list commits endpoint isn't returning an array

            var commitFieldValue;

            if (repositoryCommitResponse.isEmptyRepository == true && !repositoryCommitResponse.failed) {
                commitFieldValue = 'EMPTY';
            }

            else if (!repositoryCommitResponse.failed) {
                commitFieldValue = repositoryCommitResponse.value.data.sha;
            }

            // If failed
            else if (repositoryCommitResponse.failed) {
                return undefined;
            }

            return {updateOne: {
                    filter: { _id: unscannedRepositories[idx]._id },
                    // Where field is the field you want to update
                    update: { $set: { lastProcessedCommit: commitFieldValue } },
                    upsert: false
            }}
        });

        console.log('BULK LAST COMMIT OPS: ');
        console.log(JSON.stringify(bulkLastCommitOps));

        if (bulkLastCommitOps.length > 0 && bulkLastCommitOps.filter(op => op).length > 0) {
            try {
                // Filter out undefined operations (these are operations on repositories whose '/commits/' API calls have failed)
                const bulkResult = await Repository.collection.bulkWrite(bulkLastCommitOps.filter(op => op), { session });
                await worker.send({action: 'log', info: {level: 'info', message: `bulk Repository 'lastProcessCommit' update results: ${JSON.stringify(bulkResult)}`,
                                                    source: 'worker-instance', function: 'scanRepositories'}});
            }
            catch(err) {
                await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                            errorDescription: `Error setting lastProcessedCommit bulk update failed on repositories: ${JSON.stringify(unscannedRepositoryIdList)}`,
                                                            source: 'worker-instance', function: 'scanRepositories'}});
            
                transactionAborted = true;
                transactionError.message = `Error setting lastProcessedCommit bulk update failed on repositories: ${JSON.stringify(unscannedRepositoryIdList)}`;
                // TODO: Why is this Error being thrown
                throw new Error(`Error setting lastProcessedCommit bulk update failed on repositories: ${JSON.stringify(unscannedRepositoryIdList)}`);
            }
        }

        // Get Tree Objects for each Repository
        var repositoryTreeResponseList;

        // Get tree sha's for latest commit on default branch for each Repository
        // Set to undefined if empty Repository or operation failed
        repositoryListCommits.forEach((repositoryCommitResponse, idx) => {
            var treeShaValue;
            var isEmptyValue = false;

            if (repositoryCommitResponse.isEmptyRepository == true) {
                isEmptyValue = true;
                treeShaValue = undefined;
            }

            if (repositoryCommitResponse.failed) {
                treeShaValue = undefined;
            }

            else if (!repositoryCommitResponse.failed && !repositoryCommitResponse.isEmptyRepository) {
                treeShaValue = repositoryCommitResponse.value.data.commit.tree.sha;
            }

            unscannedRepositories[idx].treeSha = treeShaValue;
            unscannedRepositories[idx].isEmpty = isEmptyValue;
        });

        try {
            // Return undefined for repositoryObj whose treeSha cannot be accessed
            urlList = unscannedRepositories.map(repositoryObj => {
                if (!repositoryObj.treeSha) {
                    return undefined;
                }
                return `/repos/${repositoryObj.fullName}/git/trees/${repositoryObj.treeSha}?recursive=true`;
            });

            // Set return value to undefined for invalid Repositories
            var requestPromiseList = urlList.map( async (url) => {
                if (!url) {
                    return undefined;
                }
                return await installationClient.get(url);
            });
            repositoryTreeResponseList = await Promise.all(requestPromiseList);
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                        errorDescription: `Error getting repository tree urlList: ${urlList}`,
                                                        function: 'scanRepositories'}});

            transactionAborted = true;
            transactionError.message = `Error getting repository tree urlList: ${urlList}`;                                                                                  

            throw new Error(`Error getting repository tree urlList: ${urlList}`);
        }

        var treeReferences = [];
        var validPaths = [];
        // Extract References from trees
        for (i = 0; i < repositoryTreeResponseList.length; i++) {

            // Don't try to add tree References for invalid Repositories
            if (!repositoryTreeResponseList[i]) {
                continue;
            }
            
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

        // TODO: Add a log message comparing validPaths.length before & after
        validPaths = filterVendorFiles(validPaths);


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
            insertedReferences = await Reference.insertMany(treeReferences, { session });
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                        errorDescription: `Error inserting tree references: ${JSON.stringify(unscannedRepositoryIdList)}`,
                                                        function: 'scanRepositories'}});

            transactionAborted = true;
            transactionError.message = `Error inserting tree references: ${JSON.stringify(unscannedRepositoryIdList)}`;
            
            throw new Error(`Error inserting tree references: ${JSON.stringify(unscannedRepositoryIdList)}`);
        }

        await worker.send({action: 'log', info: {level: 'info', source: 'worker-instance', message: `inserted ${insertedReferences.length} tree references`,
                                                    function: 'scanRepositories'}});


        // Update 'scanned' to true, 'currentlyScanning' to false
        // For empty Repositories set 'scanned' to true, 'currentlyScanning' to false
        // For failed Repositories set 'scanned' to false, 'currentlyScanning' to false
        const bulkStatusUpdateOps = unscannedRepositories.map(repositoryObj => {

            var scannedValue;

            // If it's an empty repository
            if (repositoryObj.isEmpty) {
                scannedValue = true;
            }
            // If it's a failed repository and not empty repository
            else if (!repositoryObj.treeSha) {
                scannedValue = false;
            }
            // If it's a successful repository
            else {
                scannedValue = true;
            }
            
            return {
                updateOne: {
                        filter: { _id: repositoryObj._id },
                        // Where field is the field you want to update
                        update: { $set: { scanned: scannedValue, currentlyScanning: false } },
                        upsert: false
                }
            }
        });

        if (bulkStatusUpdateOps.length > 0) {
            try {
                const bulkResult = await Repository.collection.bulkWrite(bulkStatusUpdateOps, { session });
                await worker.send({action: 'log', info: {level: 'info', message: `bulk Repository status update results: ${JSON.stringify(bulkResult)}`,
                                                    source: 'worker-instance', function: 'scanRepositories'}});
            }
            catch(err) {
                await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                            errorDescription: `Error bulk updating status on repositories: ${JSON.stringify(unscannedRepositoryIdList)}`,
                                                            source: 'worker-instance', function: 'scanRepositories'}});

                transactionAborted = true;
                transactionError.message = `Error bulk updating status on repositories: ${JSON.stringify(unscannedRepositoryIdList)}`;
                
                throw new Error(`Error bulk updating status on repositories: ${JSON.stringify(unscannedRepositoryIdList)}`);
            }
        }

        // Set workspace 'setupComplete' to true
        // Remove failed Repositories from the workspace 'repositories' array
        var repositoriestoRemove = unscannedRepositories.filter(repositoryObj => !repositoryObj.treeSha && !repositoryObj.isEmpty)
                                                            .map(repositoryObj => repositoryObj._id.toString());
        try {
            await Workspace.findByIdAndUpdate(workspaceId,
                                                        {
                                                            $set: {setupComplete: true},
                                                            $pull: {repositories: { $in: repositoriestoRemove.map(id => ObjectId(id))}}
                                                        },
                                                        { session })
                                                        .exec();
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                        errorDescription: `Error setting workspace setupComplete to true, workspaceId: : ${workspaceId}`,
                                                        source: 'worker-instance', function: 'scanRepositories'}});

            transactionAborted = true;
            transactionError.message = `Error setting workspace setupComplete to true, workspaceId: : ${workspaceId}`;

            throw new Error(`Error setting workspace setupComplete to true, workspaceId: : ${workspaceId}`);
        }

        await worker.send({action: 'log', info: {level: 'info', message: `Completed scanning repositories: ${unscannedRepositoryIdList}`,
                                                    source: 'worker-instance', function: 'scanRepositories'}});

    });

    session.endSession();

    if (transactionAborted) {
        throw new Error(transactionError.message);
    }
}

module.exports = {
    scanRepositories
}