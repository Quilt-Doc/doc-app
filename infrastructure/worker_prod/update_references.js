const fs = require('fs');

const fs_promises = require('fs').promises;

const { filterVendorFiles, parseCommitObjects,
        parseGithubFileChangeList, getFileChangeList } = require('./utils/validate_utils');

const { cloneInstallationRepo, ensureRepoCloneCommit } = require('./utils/github_repos/cli_utils');

const { runSnippetValidation } = require('./update_snippets');

const _ = require('lodash');




require('dotenv').config();
const { exec, execFile, spawnSync } = require('child_process');

const constants = require('./constants/index');

const apis = require('./apis/api');


const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

const tokenUtils = require('./utils/token_utils');

const Reference = require('./models/Reference');
const Document = require('./models/Document');
const Repository = require('./models/Repository');
const UserStats = require('./models/reporting/UserStats');
const Workspace = require('./models/Workspace');

const breakAttachedDocuments = require('./utils/document_utils').breakAttachedDocuments;


const {serializeError, deserializeError} = require('serialize-error');

let db = mongoose.connection;


// tree -i -f -F --dirsfirst -o test.txt
// tree -i -f -F 
// Directory Update Approach: Only fetch directories by going through the paths given by `tree` at the base commit and comparing with the head commit
// Cases:
//      Old directory exactly matches a new path from `tree`, in this case do nothing
//      Old directory References without a match found have status set to `invalid`
//      New directory References found with `tree` are created as new References
//      

function intersect(a, b) {
    var setA = new Set(a);
    var setB = new Set(b);
    var intersection = new Set([...setA].filter(x => setB.has(x)));
    return Array.from(intersection);
}


const validateDirectories = async (repoId, workspaceId, repoDiskPath, headCommit, worker, session) => {

    var brokenDocuments = [];

    var getFileTree;
    try {
        getFileTree = spawnSync('tree', ['-f', '-i', '-F'], {cwd: repoDiskPath});
    }
    catch(err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error running 'tree' command on repository ${repoId}`,
                                                    source: 'worker-instance', function: 'validateDirectories'}});
        throw new Error(`Error running 'tree' command on repository ${repoId}`);
    }

    const fileTree = getFileTree.stdout.toString().split('\n');

    var newDirectories = fileTree.filter(filePath => filePath.slice(-1) == '/');

    // Get all directories to track for References
    newDirectories = filterVendorFiles(newDirectories);

    newDirectories = newDirectories.map(dirPath => {
        var temp = dirPath;
        
        // directories are not stored with a trailing slash
        if (temp.slice(-1) == '/') {
            temp = temp.slice(0, -1);
        }

        // Remove all Escaped Spaces in directory names

        temp = temp.split("\\ ").join(" ");

        // Strip out './' from start of paths
        temp = temp.startsWith('./') ? temp.slice(2, temp.length) : temp;

        return temp;
    });

    // Get all directory Reference currently existing
    var oldDirectories;
    try {
        oldDirectories = await Reference.find({kind: "dir", status: 'valid', repository: `${repoId}`}, 'path', { session }).exec();
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error fetching 'dir' References on repository ${repoId}`,
                                                    source: 'worker-instance', function: 'validateDirectories'}});
        throw new Error(`Error fetching 'dir' References on repository ${repoId}`);
    }

    // Filter our root Reference
    oldDirectories = oldDirectories.filter(dirObj => dirObj.path.length > 0);

    var oldDirectoryPaths = oldDirectories.map(dirObj => dirObj.path);

    // Don't need to do anything for these References?
    var matchedDirectories = intersect(newDirectories, oldDirectoryPaths);

    // all directories in oldDirectories but not in newDirectories
    var unmatchedDirectories = oldDirectories.map(dirObj => {
        if (!newDirectories.includes(dirObj.path)) {
            return {_id: dirObj._id, path: dirObj.path, status: 'invalid', breakCommit: `${headCommit}`};
        }
        return undefined
    });
    unmatchedDirectories = unmatchedDirectories.filter(dirObj => (dirObj));

    // all directories in newDirectories but not in oldDirectoryPaths
    // This can have just dir paths, since creating new References
    var createdDirectories = newDirectories.filter(dirPath => !oldDirectoryPaths.includes(dirPath));

    // Handle invalidating directories
    // Invalidate all the References that have been broken
    const bulkDirectoryInvalidateOps = unmatchedDirectories.map(dirObj => ({
        
        updateOne: {
                filter: { _id: ObjectId(dirObj._id.toString()) },
                // Where field is the field you want to update
                update: { $set: { status: dirObj.status, breakCommit: headCommit } },
                upsert: false
        }
    }));
    if (bulkDirectoryInvalidateOps.length > 0) {
        try {
            var bulkResult = await Reference.collection.bulkWrite(bulkDirectoryInvalidateOps, { session } );
            worker.send({action: 'log', info: {level: 'info', message: `bulk 'dir' Reference invalidate results: ${JSON.stringify(bulkResult)}`,
                                                source: 'worker-instance', function: 'validateDirectories'}})
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error bulk invalidating 'dir' References on repository: ${repoId}`,
                                                        source: 'worker-instance', function: 'validateDirectories'}});
            throw new Error(`Error bulk invalidating 'dir' References on repository: ${repoId}`);
        }

    }

    try {
        brokenDocuments = brokenDocuments.concat( await breakAttachedDocuments(repoId, workspaceId, unmatchedDirectories, worker, session) );
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                    errorDescription: `Error invalidating Documents attached to invalidated 'dir' References on repository: ${repoId}`,
                                                    source: 'worker-instance', function: 'breakAttachedDocuments'}});
        throw new Error(`Error invalidating Documents attached to invalidated 'dir' References on repository: ${repoId}`);
    }

    // Handle creating new directories

    createdDirectories = createdDirectories.map(dirPath => {
        var pathSplit = dirPath.split('/');
        var dirName = pathSplit.slice(pathSplit.length - 1)[0]


        return {name: dirName, path: dirPath, kind: 'dir',
                status: 'valid', repository: repoId, parseProvider: 'update'}
    });

    var newDirIds = [];

    if (createdDirectories.length > 0) {
        try {
            const insertResults = await Reference.insertMany(createdDirectories, {rawResult: true, session});
            worker.send({action: 'log', info: {level: 'info', message: `New 'dir' Reference bulk insert results repository: ${repoId}\n${JSON.stringify(Object.values(insertResults.insertedIds))}`,
                            source: 'worker-instance', function: 'validateDirectories'}});
            newDirIds = Object.values(insertResults.insertedIds).map(id => id.toString());
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error bulk inserting new 'dir' References on repository: ${repoId}`,
                                                        source: 'worker-instance', function: 'validateDirectories'}});
            throw new Error(`Error bulk inserting new 'dir' References on repository: ${repoId}`);
        }
    }



    return { brokenDocuments, newDirIds };
}

/*
Procedure:
    Get the Repository Object
    Get the Push headCommit
    Clone the repository
    Run a git log with the headCommit and the repoCommit
    create trackedFiles data structure
    Create a final list of the Reference states of previously existing References at the end of the commits.
        Create a sub-list of all References that have ended with a state of deleted
    Create a final list of all newly created References
    Update all document status' for document's attached to any of the broken References
        Get all of the document's that have now been broken, each of these References attached needs to have a `breakCommit` field, populate Document `references` field
    Create a Check Run Object on the headCommit
    Update jobStatus on the Repository
    Kick off the Snippet Job
*/

const runUpdateProcedure = async () => {

    var worker = require('cluster').worker;

    var addedReferences = [];

    var modifiedDocuments = [];
    var brokenDocuments = [];

    var brokenSnippets = [];


    var backendClient = apis.requestBackendClient();

    var checkCreateData = {};


    await worker.send({action: 'log', info: {level: 'debug', message: `cloneUrl: ${process.env.cloneUrl}`,
                                        source: 'worker-instance', function: 'runUpdateProcedure'}});


    const session = await db.startSession();

    var transactionAborted = false;
    var transactionError = {message: ''};
    try {
        await session.withTransaction(async () => {


            // Get Repository Object
            var repoObj;

            try {
                repoObj = await Repository.findOne({installationId: process.env.installationId, fullName: process.env.fullName, scanned: true}, null, { session }).lean().exec();
                // repoObj = await getRepositoryObject(process.env.installationId, process.env.fullName, worker);
            }
            catch(err) {
                await worker.send({action: 'log', info: {level: 'error',
                                                            message: serializeError(err),
                                                            errorDescription: `Error fetching Repository from MongoDB - installationId, fullName: ${process.env.installationId}, ${process.env.fullName}`,
                                                            source: 'worker-instance', function: 'runUpdateProcedure'}});
                transactionAborted = true;
                transactionError.message = `Error fetching Repository from MongoDB - installationId, fullName: ${process.env.installationId}, ${process.env.fullName}`;

                throw new Error(`Error fetching Repository from MongoDB - installationId, fullName: ${process.env.installationId}, ${process.env.fullName}`);
            }

            // We couldn't find a scanned Repository object matching the update params, abort the job
            if (!repoObj) {
                await worker.send({action: 'log', info: {level: 'error',
                                                            message: serializeError(Error(`Error no Repository found matching - installationId, fullName, scanned=true: ${process.env.installationId}, ${process.env.fullName}`)),
                                                            errorDescription: `Error no Repository found matching - installationId, fullName, scanned=true: ${process.env.installationId}, ${process.env.fullName}`,
                                                            source: 'worker-instance',
                                                            function: 'updateReferences'}});

                transactionAborted = true;
                transactionError.message = `Error no Repository found matching - installationId, fullName, scanned=true: ${process.env.installationId}, ${process.env.fullName}`;

                throw new Error(`Error no Repository found matching - installationId, fullName, scanned=true: ${process.env.installationId}, ${process.env.fullName}`);
            }

            // Get Workspace Object
            var workspaceObj;
            try {
                workspaceObj = await Workspace.findOne({repositories: { $in: [ ObjectId(repoObj._id.toString()) ] } }, null, { session }).lean().exec();
            }
            catch (err) {
                await worker.send({action: 'log', info: {level: 'error',
                                                            message: serializeError(err),
                                                            errorDescription: `Error finding Workspace by Id - workspaceId, installationId, fullName: ${repoObj.workspace.toString()}, ${process.env.installationId}, ${process.env.fullName}`,
                                                            source: 'worker-instance',
                                                            function: 'updateReferences'}});

                transactionAborted = true;
                transactionError.message = `Error finding Workspace by Id - workspaceId, installationId, fullName: ${repoObj.workspace.toString()}, ${process.env.installationId}, ${process.env.fullName}`;

                throw new Error(`Error finding Workspace by Id - workspaceId, installationId, fullName: ${repoObj.workspace.toString()}, ${process.env.installationId}, ${process.env.fullName}`);
            }

            if (!workspaceObj) {
                await worker.send({action: 'log', info: {level: 'error',
                                                            message: serializeError(Error(`Error no Workspace found matching - workspaceId, installationId, fullName: ${repoObj.workspace.toString()}, ${process.env.installationId}, ${process.env.fullName}`)),
                                                            errorDescription: `Error no Workspace found matching - workspaceId, installationId, fullName: ${repoObj.workspace.toString()}, ${process.env.installationId}, ${process.env.fullName}`,
                                                            source: 'worker-instance',
                                                            function: 'updateReferences'}});

                transactionAborted = true;
                transactionError.message = `Error no Workspace found matching - workspaceId, installationId, fullName: ${repoObj.workspace.toString()}, ${process.env.installationId}, ${process.env.fullName}`;

                throw new Error(`Error no Workspace found matching - workspaceId, installationId, fullName: ${repoObj.workspace.toString()}, ${process.env.installationId}, ${process.env.fullName}`);
            }



            // Begin procedure

            var repoId = repoObj._id;
            var repoCommit = repoObj.lastProcessedCommit;
        
            var headCommit = process.env.headCommit;


            await worker.send({action: 'log', info: {level: 'info', message: `Using repoCommit..headCommit: ${repoCommit}..${headCommit}`,
                                                source: 'worker-instance', function: 'runUpdateProcedure'}});
            // Clone the Repository
            var repoDiskPath
            try {
                // installationId, cloneUrlRaw, cloneSingleBranch, defaultBranch, worker
                repoDiskPath = await cloneInstallationRepo(process.env.installationId, process.env.cloneUrl, true, repoObj.defaultBranch, worker);
            }
            catch(err) {
                await worker.send({action: 'log', info: {level: 'error',
                                                            message: serializeError(err),
                                                            errorDescription: `Error Cloning Git Repository - installationId, cloneUrl: ${installationId}, ${process.env.cloneUrl}`,
                                                            source: 'worker-instance',
                                                            function: 'runUpdateProcedure'}});

                transactionAborted = true;
                transactionError.message = `Error Cloning Git Repository - installationId, cloneUrl: ${installationId}, ${process.env.cloneUrl}`;

                throw new Error(`Error Cloning Git Repository - installationId, cloneUrl: ${installationId}, ${process.env.cloneUrl}`);
            }

            // Ensure cloned repository headCommit = process.env.headCommit
            try {
                await ensureRepoCloneCommit(repoDiskPath, headCommit, worker);
            }
            catch (err) {
                await worker.send({action: 'log', info: {level: 'error',
                                                            message: serializeError(err),
                                                            errorDescription: `Error running ensureRepoCloneCommit - repoDiskPath, headCommit: ${repoDiskPath}, ${headCommit}`,
                                                            source: 'worker-instance',
                                                            function: 'runUpdateProcedure'}});

                transactionAborted = true;
                transactionError.message = `Error running ensureRepoCloneCommit - repoDiskPath, headCommit: ${repoDiskPath}, ${headCommit}`;

                throw new Error(`Error running ensureRepoCloneCommit - repoDiskPath, headCommit: ${repoDiskPath}, ${headCommit}`);
            }


            worker.send({action: 'log', info: {level: 'info', message: `repoId, repoDiskPath: ${repoId}, ${repoDiskPath}`,
                                                source: 'worker-instance', function: 'runUpdateProcedure'}});


            // git log -M --numstat --name-status --pretty=%H
            /*
            const child = execFile('git', ['log', '-M', '--numstat', '--name-status', '--pretty=%H',
            repoCommit + '..' + headCommit],
            { cwd: './' + repoDiskPath },
            async (error, stdout, stderr) => {
            */

            // Don't put a repoCommit if this repository hasn't had a commit yet
            var commitRange = (repoCommit == 'EMPTY') ? headCommit : `${repoCommit}..${headCommit}`;

            var gitLogResponse;
            try {
                gitLogResponse = spawnSync('git', ['log', '-M', '--numstat', '--name-status', '--pretty=%H', commitRange], {cwd: './' + repoDiskPath});
            }
            catch(err) {
                    await worker.send({action: 'log',
                                        info: {level: 'error',
                                                message: serializeError(err),
                                                errorDescription: `Error running 'git log' for cloneUrl: ${process.env.cloneUrl}`,
                                                source: 'worker-instance',
                                                function: 'runUpdateProcedure'}});

                    transactionAborted = true;
                    transactionError.message = `Error running 'git log' for cloneUrl: ${process.env.cloneUrl}`;

                    throw new Error(`Error running 'git log' for cloneUrl: ${process.env.cloneUrl}`);
            }
            /*
                if (error) {
                    await worker.send({action: 'log', info: {level: 'error', message: serializeError(error), errorDescription: `Error running 'git log' for cloneUrl: ${process.env.cloneUrl}`,
                                                                source: 'worker-instance', function: 'runUpdateProcedure'}});
                    throw new Error(`Error running 'git log' for cloneUrl: ${process.env.cloneUrl}`);
                }
            */
            // What we want to parse out:
            // A list of commit objects in chronological (earliest -> latest) order
            // Each of these commit objects containing a fileChange object Array
            // Each file_change object Array contains file modified as well as the type of modification

            var lines = gitLogResponse.stdout.toString().trim().split("\n"); // stdout.split("\n");
            var commitObjects = parseCommitObjects(lines);
            // trackedFile[0].operationList is chronological commit operations, earliest --> latest
            var trackedFiles = getFileChangeList(commitObjects);
            
            await worker.send({action: 'log', info: {level: 'info', message: ` - repoId, trackedFiles: ${repoId}\n${JSON.stringify(trackedFiles)}`,
                                source: 'worker-instance', function: 'runUpdateProcedure'}});

            try {
                brokenSnippets = await runSnippetValidation(process.env.installationId, repoDiskPath, repoObj, headCommit, trackedFiles, worker, session);
                // (installationId, repoDiskPath, repoObj, headCommit, trackedFiles, worker)
            }
            catch (err) {
                await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error calling runSnippetValidation on repository: ${repoId}`,
                                                            source: 'worker-instance', function:'runSnippetValidation', }});
                transactionAborted = true;
                transactionError.message = `Error calling runSnippetValidation on repository: ${repoId}`;

                throw new Error(`Error calling runSnippetValidation on repository: ${repoId}`);
            }

            // Validate and update directory references here
            try {
                var validateResult = await validateDirectories(repoId, workspaceObj._id.toString(), repoDiskPath, headCommit, worker, session);
                addedReferences = addedReferences.concat(validateResult.newDirIds);
                brokenDocuments = brokenDocuments.concat( validateResult.brokenDocuments );
            }
            catch (err) {
                await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error running validateDirectories for cloneUrl: ${process.env.cloneUrl}`,
                                                            source: 'worker-instance', function: 'run'}});
                transactionAborted = true;
                transactionError.message = `Error running validateDirectories for cloneUrl: ${process.env.cloneUrl}`;

                throw new Error(`Error running validateDirectories for cloneUrl: ${process.env.cloneUrl}`);
            }

            var fileReferencesToCreate = trackedFiles.filter(file => file.isNewRef && !file.deleted);

            // When to Update (Only on Rename):
            // If !file.isNewRef && !file.deleted && file.ref != file.oldRef
            var fileReferencesToUpdate = trackedFiles.filter(file => !file.isNewRef && !file.deleted && file.oldRef != file.ref);

            // When Reference has been modified, (On Rename, or just modification):
            // If !file.isNewRef && !file.deleted && (file.operationList.slice(-1)[0].operation == 'Modify' || file.operationList.slice(-1)[0].operation == 'Rename')
            var fileReferencesModified = trackedFiles.filter(file => !file.isNewRef && !file.deleted && (file.operationList.slice(-1)[0].operation == 'Modify' || file.operationList.slice(-1)[0].operation == 'Rename'));

            worker.send({action: 'log', info: {level: 'info', message: `repoId, fileReferencesModified: ${repoId}, ${JSON.stringify(fileReferencesModified)}`,
                                                source: 'worker-instance', function: 'runUpdateProcedure'}});



            var fileReferencesToDelete = trackedFiles.filter(file => !file.isNewRef && file.deleted);

            var modifiedReferences = [];

            /*
            name: {type: String, index: true, required: true},
            repository: {type: ObjectId, ref: 'Repository', required: true},
            kind: {type: String, index: true, required: true},
            path: {type: String, index: true },
            parseProvider: {type: String, enum: ['create', 'update', 'semantic', 'doxygen'], required: true},
            */

            // Handling Newly Created File References
            if (fileReferencesToCreate.length > 0) {

                await worker.send({action: 'log', info: {level: 'info', 
                                                            message: `Updating 'file' References for creation on repository: ${repoObj.fullName}\n${JSON.stringify(fileReferencesToCreate.map(file => file.oldRef))}`,
                                                            source: 'worker-instance', function:'runUpdateProcedure', }})

                worker.send({action: 'log', info: {level: 'info', 
                                                        message: `Updating 'file' References for creation on repository #2: ${repoObj.fullName}\n${JSON.stringify(fileReferencesToCreate)}`,
                                                        source: 'worker-instance', function:'runUpdateProcedure', }})
                
                var refCreateData = [];
                for (i = 0; i < fileReferencesToCreate.length; i++) {
                    var pathSplit = fileReferencesToCreate[i].ref.split('/');
                    var fileName = pathSplit.slice(pathSplit.length - 1)[0];
                    refCreateData.push({name: fileName, repository: repoId, kind: "file", path: fileReferencesToCreate[i].ref, parseProvider: 'update'});
                }

                try {
                    const insertResults = await Reference.insertMany(refCreateData, {rawResult: true, session });
                    addedReferences = addedReferences.concat(Object.values(insertResults.insertedIds).map(id => id.toString()));
                    worker.send({action: 'log', info: {level: 'info', message: `Insert results for 'file' References on repository: ${repoId}\n${JSON.stringify(Object.values(insertResults.insertedIds))}`,
                                                        source: 'worker-instance', function:'runUpdateProcedure'}})
                }
                catch (err) {
                    await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error creating new 'file' References on repository: ${repoId}`,
                                                                source: 'worker-instance', function:'runUpdateProcedure', }});

                    transactionAborted = true;
                    transactionError.message = `Error creating new 'file' References on repository: ${repoId}`;

                    throw new Error(`Error creating new 'file' References on repository: ${repoId}`);
                }
            }

            // Handling Deleted File References
            if (fileReferencesToDelete.length > 0) {
                worker.send({action: 'log', info: {level: 'info', 
                                                    message: `Updating 'file' References for deletion on repository: ${repoObj.fullName}\n${JSON.stringify(fileReferencesToDelete.map(file => file.oldRef))}`,
                                                    source: 'worker-instance', function:'runUpdateProcedure', }})
                
                worker.send({action: 'log', info: {level: 'info', 
                                                    message: `Updating 'file' References for deletion on repository #2: ${repoObj.fullName}\n${JSON.stringify(fileReferencesToDelete)}`,
                                                    source: 'worker-instance', function:'runUpdateProcedure', }})

                var brokenReferences;
                try {
                    brokenReferences = await Reference.find({repository: repoId, status: 'valid', kind: 'file',
                                                            path: {$in: fileReferencesToDelete.map(file => file.oldRef)}}, null, { session }).exec();
                }
                catch (err) {
                    await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error fetching 'file' References to invalidate on repository: ${repoId}`,
                                                                source: 'worker-instance', function:'runUpdateProcedure', }});
                    transactionAborted = true;
                    transactionError.message = `Error fetching 'file' References to invalidate on repository: ${repoId}`;

                    throw new Error(`Error fetching 'file' References to invalidate on repository: ${repoId}`);
                }

                await worker.send({action: 'log', info: {level: 'info', 
                                                    message: `Fetched ${brokenReferences.length} ids for the following 'file' References to delete on repository: ${repoId}\n${JSON.stringify(fileReferencesToDelete.map(file => file.oldRef))}`,
                                                    source: 'worker-instance', function:'runUpdateProcedure', }})

                var refUpdateData = [];

                // Match the local file that has been broken to the Reference object that matches it
                for (i = 0; i < brokenReferences.length; i++) {
                    var currentSearchReference = brokenReferences[i];
                    var matchingLocalReference = fileReferencesToDelete.find(refObj => refObj.oldRef == currentSearchReference.path);
                    // Update Reference with new status and breakCommit sha
                    refUpdateData.push({_id: currentSearchReference._id, status: 'invalid',
                                        breakCommit: matchingLocalReference.operationList[matchingLocalReference.operationList.length - 1].sha});
                }

                worker.send({action: 'log', info: {level: 'info', 
                                                    message: `refUpdateData on repository: ${repoId}\n${JSON.stringify(refUpdateData)}`,
                                                    source: 'worker-instance', function:'runUpdateProcedure'}});


                // Invalidate all the References that have been broken
                const bulkReferenceInvalidateOps = refUpdateData.map(refObj => ({
            
                    updateOne: {
                            filter: { _id: ObjectId(refObj._id.toString()) },
                            // Where field is the field you want to update
                            update: { $set: { status: refObj.status, breakCommit: refObj.breakCommit } },
                            upsert: false
                    }
                }));
                if (bulkReferenceInvalidateOps.length > 0) {
                    try {
                        const invalidateResults = await Reference.collection.bulkWrite(bulkReferenceInvalidateOps, { session });
                        worker.send({action: 'log', info: {level: 'info',
                                                            message: `Invalidate results for bulk invalidate on 'file' References on repository: ${repoId}\n${JSON.stringify(invalidateResults)}`,
                                                            source: 'worker-instance', function:'runUpdateProcedure'}})
                    }
                    catch (err) {
                        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                                errorDescription: `Error invalidating 'file' References on repository: ${repoId}`,
                                                                source: 'worker-instance', function: 'runUpdateProcedure'}});
                        transactionAborted = true;
                        transactionError.message = `Error invalidating 'file' References on repository: ${repoId}`;

                        throw new Error(`Error invalidating 'file' References on repository: ${repoId}`);
                    }

                    try {
                        brokenDocuments = brokenDocuments.concat( await breakAttachedDocuments(repoId, workspaceObj._id.toString(), refUpdateData, worker, session) );
                    }
                    catch (err) {
                        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                                    errorDescription: `Error invalidating Documents attached to invalidated 'file' References on repository: ${repoId}`,
                                                                    source: 'worker-instance', function: 'breakAttachedDocuments'}});
                        transactionAborted = true;
                        transactionError.message = `Error invalidating Documents attached to invalidated 'file' References on repository: ${repoId}`;

                        throw new Error(`Error invalidating Documents attached to invalidated 'file' References on repository: ${repoId}`);
                    }
                }
            }

            // Handle getting File References that have been modified, so that we can find the Documents attached to them
            if (fileReferencesModified.length > 0) {
                worker.send({action: 'log', info: {level: 'info', 
                                                    message: `Fetching 'file' References that have been modified on repository: ${repoObj.fullName}\n${JSON.stringify(fileReferencesModified.map(file => file.oldRef))}`,
                                                    source: 'worker-instance', function:'runUpdateProcedure', }})

                try {
                    modifiedReferences = await Reference.find({repository: repoId, status: 'valid', kind: 'file',
                                                                path: {$in: fileReferencesModified.map(file => file.oldRef)}}, '_id', { session }).lean().exec();
                }
                catch (err) {
                    await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                                errorDescription: `Error fetching 'file' References that've been modified - repositoryId: ${repoId}`,
                                                                source: 'worker-instance', function:'runUpdateProcedure', }});
                    transactionAborted = true;
                    transactionError.message = `Error fetching 'file' References that've been modified - repositoryId: ${repoId}`;

                    throw new Error(`Error fetching 'file' References that've been modified - repositoryId: ${repoId}`);
                }

                worker.send({action: 'log', info: {level: 'info', 
                                                    message: `Found 'file' References for fileReferencesModified - repoId, modifiedReferences: ${repoId}\n${JSON.stringify(modifiedReferences)}`,
                                                    source: 'worker-instance', function:'runUpdateProcedure', }})

            }

            // Handling Updated File References, only updating on rename
            if (fileReferencesToUpdate.length > 0) {
                worker.send({action: 'log', info: {level: 'info', 
                                                        message: `Updating 'file' References for update on repository: ${repoObj.fullName}\n${JSON.stringify(fileReferencesToUpdate.map(file => file.oldRef))}`,
                                                        source: 'worker-instance', function:'runUpdateProcedure', }})

                worker.send({action: 'log', info: {level: 'info', 
                                                        message: `Updating 'file' References for update on repository #2: ${repoObj.fullName}\n${JSON.stringify(fileReferencesToUpdate)}`,
                                                        source: 'worker-instance', function:'runUpdateProcedure', }})

                var renamedReferences;
                try {
                    renamedReferences = await Reference.find({repository: repoId, status: 'valid', kind: 'file',
                                                                path: {$in: fileReferencesToUpdate.map(file => file.oldRef)}}, null, { session });
                }
                catch (err) {
                    await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                                errorDescription: `Error fetching 'file' References to update (rename) on repository: ${repoId}`,
                                                                source: 'worker-instance', function:'runUpdateProcedure', }});
                    transactionAborted = true;
                    transactionError.message = `Error fetching 'file' References to update (rename) on repository: ${repoId}`;

                    throw new Error(`Error fetching 'file' References to update (rename) on repository: ${repoId}`);
                }
                

                var refUpdateData = [];

                // Match the local file that has been broken to the Reference object that matches it
                for (i = 0; i < renamedReferences.length; i++) {
                    var currentSearchReference = renamedReferences[i];
                    var matchingLocalReference = fileReferencesToUpdate.find(refObj => refObj.oldRef == currentSearchReference.path);
                    
                    var pathSplit = fileReferencesToUpdate[i].ref.split('/');
                    var fileName = pathSplit.slice(pathSplit.length - 1)[0];
                    
                    // Update Reference with new status and breakCommit sha
                    refUpdateData.push({_id: currentSearchReference._id, status: 'valid',
                                        name: fileName,
                                        path: fileReferencesToUpdate[i].ref,
                                        parseProvider: 'update'});
                }

                worker.send({action: 'log', info: {level: 'info', 
                                                    message: `refUpdateData for Reference update on repository: ${repoId}\n${JSON.stringify(refUpdateData)}`,
                                                    source: 'worker-instance', function:'runUpdateProcedure'}});


                // Invalidate all the References that have been broken
                const bulkReferenceRenameOps = refUpdateData.map(refObj => ({
            
                    updateOne: {
                            filter: { _id: ObjectId(refObj._id.toString()) },
                            // Where field is the field you want to update
                            update: { $set: { status: refObj.status, name: refObj.name, path: refObj.path, parseProvider: refObj.parseProvider } },
                            upsert: false
                    }
                }));
                if (bulkReferenceRenameOps.length > 0) {
                    try {
                        const renameResults = await Reference.collection.bulkWrite(bulkReferenceRenameOps, { session });
                        worker.send({action: 'log', info: {level: 'info',
                                                            message: `Rename results for bulk rename on 'file' References on repository: ${repoId}\n${JSON.stringify(renameResults)}`,
                                                            source: 'worker-instance', function:'runUpdateProcedure'}})
                    }
                    catch (err) {
                        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error renaming 'file' References on repository: ${repoId}`,
                                                                    source: 'worker-instance', function: 'runUpdateProcedure'}});
                        transactionAborted = true;
                        transactionError.message = `Error renaming 'file' References on repository: ${repoId}`;

                        throw new Error(`Error renaming 'file' References on repository: ${repoId}`);
                    }
                }
                
            }

            // TODO: Need to Delete invalidated References that are not attached to any Document/anything else, otherwise they will keep taking up space.

            // Update Repository 'lastProcessedCommit'
            try {
                await Repository.findByIdAndUpdate(repoObj._id, { $set: { lastProcessedCommit: headCommit } }, { session });
            }
            catch (err) {
                await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                            errorDescription: `Error setting 'lastProcessedCommit' on repository, headCommit: ${repoId}, ${headCommit}`,
                                                            source: 'worker-instance', function: 'runUpdateProcedure'}});
                transactionAborted = true;
                transactionError.message = `Error setting 'lastProcessedCommit' on repository, headCommit: ${repoId}, ${headCommit}`;

                throw new Error(`Error setting 'lastProcessedCommit' on repository, headCommit: ${repoId}, ${headCommit}`);
            }

            // Delete Downloaded Repository
            try {
                const deleteRepository = spawnSync('rm', ['-rf', `${repoDiskPath}`], {cwd: repoDiskPath});
            }
            catch(err) {
                await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error deleting repository ${repoId} at:  ${repoDiskPath}`,
                                                            source: 'worker-instance', function: 'runUpdateProcedure'}});
                transactionAborted = true;
                transactionError.message = `Error deleting repository ${repoId} at:  ${repoDiskPath}`;

                throw new Error(`Error deleting repository ${repoId} at:  ${repoDiskPath}`);
            }


            // Get all Modified Documents

            if (modifiedReferences.length > 0) {
                try {
                    modifiedDocuments = await Document.find( { _id: { $in: modifiedReferences.map(refObj => ObjectId(refObj._id.toString())) } }, "_id", { session })
                                                        .lean().exec();
                }
                catch (err) {
                    await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                                errorDescription: `Error finding Documents attached to Modified References -  repositoryId, repoDiskPath, modifiedReferences: ${repoId}, ${repoDiskPath}, ${JSON.stringify(modifiedReferences)}`,
                                                                source: 'worker-instance', function: 'runUpdateProcedure'}});
                    transactionAborted = true;
                    transactionError.message = `Error finding Documents attached to Modified References -  repositoryId, repoDiskPath, modifiedReferences: ${repoId}, ${repoDiskPath}, ${JSON.stringify(modifiedReferences)}`;

                    throw new Error(`Error finding Documents attached to Modified References -  repositoryId, repoDiskPath, modifiedReferences: ${repoId}, ${repoDiskPath}, ${JSON.stringify(modifiedReferences)}`);
                }
            }

            worker.send({action: 'log', info: {level: 'info', 
                                                message: `Creating Check with modifiedDocuments: repoId, modifiedDocuments: ${repoId}\n${JSON.stringify(modifiedDocuments)}`,
                                                source: 'worker-instance', function:'runUpdateProcedure', }})

            // Remove any documentIds in 'modifiedDocuments' that match documentIds in 'brokenDocuments'
            modifiedDocuments = _.difference(modifiedDocuments.map(docObj => docObj._id.toString()), brokenDocuments);


            worker.send({action: 'log', info: {level: 'info', 
                                                message: `Creating Check with modifiedDocuments: repoId, modifiedDocuments: ${repoId}\n${JSON.stringify(modifiedDocuments)}`,
                                                source: 'worker-instance', function:'runUpdateProcedure', }})


            // For routing
            checkCreateData.repoId = repoId;

            // Actual body data
            checkCreateData.installationId = process.env.installationId;
            checkCreateData.commit = headCommit

            checkCreateData.modifiedDocuments = modifiedDocuments;
            checkCreateData.brokenDocuments = brokenDocuments;
            
            checkCreateData.brokenSnippets = brokenSnippets;
            
            checkCreateData.message = process.env.message;
            checkCreateData.pusher = process.env.pusher;
            
            checkCreateData.addedReferences = addedReferences.map(refId => refId.toString());

            // console.log(`Successfully Updated Worker magic - fullName, headCommit: ${repoObj.fullName}, ${headCommit}`);
            // throw new Error(`I want you to fail RAT.`);


            await worker.send({action: 'log', info: {level: 'info', message: `Update Reference Job Success - fullName, headCommit: ${repoObj.fullName}, ${headCommit}`,
                                                        source: 'worker-instance', function: 'runUpdateProcedure'}});
        });
    }

    catch (err) {
        session.endSession();
        if (transactionAborted) {
            throw new Error(transactionError.message);
        }
        else {
            throw err;
        }
    }

    session.endSession();
    if (transactionAborted) {
        throw new Error(transactionError.message);
    }

    // Create a Check at the end

    // Create Check
    try {
        var createCheckResponse = await backendClient.post(`/checks/${checkCreateData.repoId}/create`, checkCreateData);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                    errorDescription: `Error creating Check - repoId, installationId, commit:  ${checkCreateData.repoId}, ${process.env.installationId}, ${checkCreateData.commit}`,
                                                    source: 'worker-instance',
                                                    function: 'runUpdateProcedure'}});

        throw new Error(`Error creating Check - repoId, installationId, commit:  ${checkCreateData.repoId}, ${process.env.installationId}, ${checkCreateData.commit}`);
    }


    await worker.send({action: 'log', info: {level: 'info', 
                                                message: `Successfully created Check for ${checkCreateData.brokenDocuments.length} Documents and ${checkCreateData.brokenSnippets.length} Snippets - repoId, installationId, headCommit:  ${checkCreateData.repoId}, ${process.env.installationId}, ${checkCreateData.commit}`,
                                                source: 'worker-instance', function: 'runUpdateProcedure'}});

}

module.exports = {
    runUpdateProcedure
}