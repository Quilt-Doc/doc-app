const fs = require('fs');

const fs_promises = require('fs').promises;

const { getRepositoryObject, filterVendorFiles, parseCommitObjects,
        parseGithubFileChangeList, getFileChangeList } = require('./utils/validate_utils');

const { runSnippetValidation } = require('./update_snippets');



require('dotenv').config();
const { exec, execFile, spawnSync } = require('child_process');

const constants = require('./constants/index');


const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

const tokenUtils = require('./utils/token_utils');

const Reference = require('./models/Reference');
const Document = require('./models/Document');
const Repository = require('./models/Repository');

const {serializeError, deserializeError} = require('serialize-error');

/*
// Remove old non-tree references
const removeOldNonTreeReferences = async () => {
}
*/

/*
Directory Update Procedure:
    Get List of Directory References as well as a String array of their previous Contents (files and directories)
    Step through commit by commit and get the file tree per commit
    For each Directory in list of Directory References, check if it still exists at same path
        If not found, check the other directories at the same level, and check if the list of their contents includes the contents of Directory currently being validated
            Also check that there does not exist a Reference for the same-level adjacent directory
    If the Directory Reference could not be found, set it to broken,
    If the Directory Reference was found, make no changes
    If the Directory Reference was renamed, update with the new name/path

    
    We don't need to worry right now about adding new Directories, but how will we add new Directory References?
        We can check at the end state of the commit, pull in a list of all the directories found in the file tree
            create new References for those that don't have a Reference already created or going to be created
    
    How do we address updating downstream directory paths on parent rename?

    Could we just use the rename parameters on files?
        This will catch any directory renames



*/


const breakAttachedDocuments = async (repoId, refUpdateData, worker) => {
    // Find all Documents associated with References that have been broken
    var documentsToBreak;
    try {
        documentsToBreak = await Document.find({repository: repoId, references: { $in: refUpdateData.map(refObj => ObjectId(refObj._id)) }});
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                    errorDescription: `Error finding invalidated References on repository: ${repoId}`,
                                                    source: 'worker-instance', function: 'breakAttachedDocuments'}});
        throw new Error(`Error finding invalidated References on repository: ${repoId}`);
    }
    // No need to update any info on documents that are already broken so filter them out
    documentsToBreak = documentsToBreak.filter(documentObj => documentObj.status != 'invalid');

    var docUpdateData = [];

    // Need to match the retrieved Documents to the References that broke them
    for (i = 0; i < documentsToBreak.length; i++) {
        var currentDocument = documentsToBreak[i];
        // References that have been broken that are attached to the currentDocument
        var attachedReferences = refUpdateData.filter(refUpdate => currentDocument.references.includes(refUpdate._id ));
        // We will use the commit of the first broken Reference
        // TODO: Make sure this is the earliest commit sha
        if (attachedReferences.length > 0) docUpdateData.push({_id: currentDocument._id, status: 'invalid', breakCommit: attachedReferences[0].breakCommit});
    }

    const bulkDocumentInvalidateOps = docUpdateData.map(docObj => ({

        updateOne: {
                filter: { _id: docObj._id },
                // Where field is the field you want to update
                // TODO: Instead of using `new Date()` use the actual date on the git push
                update: { $set: { status: docObj.status, breakCommit: docObj.breakCommit, breakDate: new Date() } },
                upsert: false
        }
    }));
    if (bulkDocumentInvalidateOps.length > 0) {
        try {
            const bulkResult = await Document.collection.bulkWrite(bulkDocumentInvalidateOps);
            worker.send({action: 'log', info: {level: 'debug', message: `bulk Document invalidate results: ${bulkResult}`,
                                                source: 'worker-instance', function: 'breakAttachedDocuments'}});

        }
        catch(err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                        errorDescription: `Error bulk invalidating Documents on repository: ${repoId}`,
                                                        source: 'worker-instance', function: 'breakAttachedDocuments'}});
            throw new Error(`Error bulk invalidating Documents on repository: ${repoId}`);
        }
    }

    return docUpdateData;
}



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


const validateDirectories = async (repoId, repoDiskPath, headCommit, worker) => {

    // Make sure repository is at correct commit
    try {
        const ensureCommit = spawnSync('git', ['reset', '--hard', `${headCommit}`], {cwd: repoDiskPath});
    }
    catch(err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error resetting repository ${repoId} to commit ${headCommit}`,
                                                    source: 'worker-instance', function: 'validateDirectories'}});
        throw new Error(`Error resetting repository ${repoId} to commit ${headCommit}`);
    }

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

    // directories are not stored with a trailing slash
    newDirectories = newDirectories.map(dirPath => {
        if (dirPath.slice(-1) == '/') {
            return dirPath.slice(0, -1);
        }
        return dirPath;
    });

    // Get all directory Reference currently existing
    var oldDirectories;
    try {
        oldDirectories = await Reference.find({kind: "dir", status: 'valid', repository: `${repoId}`}, 'path').exec();
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error fetching 'dir' References on repository ${repoId}`,
                                                    source: 'worker-instance', function: 'validateDirectories'}});
        throw new Error(`Error fetching 'dir' References on repository ${repoId}`);
    }

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
                filter: { _id: dirObj._id },
                // Where field is the field you want to update
                update: { $set: { status: dirObj.status } },
                upsert: false
        }
    }));
    if (bulkDirectoryInvalidateOps.length > 0) {
        try {
            var bulkResult = await Reference.collection.bulkWrite(bulkDirectoryInvalidateOps);
            worker.send({action: 'log', info: {level: 'debug', message: `bulk 'dir' Reference invalidate results: ${bulkResult}`,
                                                source: 'worker-instance', function: 'validateDirectories'}})
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error bulk invalidating 'dir' References on repository: ${repoId}`,
                                                        source: 'worker-instance', function: 'validateDirectories'}});
            throw new Error(`Error bulk invalidating 'dir' References on repository: ${repoId}`);
        }

    }

    var brokeDocuments;
    try {
        brokenDocuments = await breakAttachedDocuments(repoId, unmatchedDirectories, worker);
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

    if (createdDirectories.length > 0) {
        try {
            const insertResults = await Reference.insertMany(createdDirectories);
            worker.send({action: 'log', info: {level: 'debug', message: `New 'dir' Reference bulk insert results repository: ${repoId}\n${insertResults}`,
                            source: 'worker-instance', function: 'validateDirectories'}});
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error bulk inserting new 'dir' References on repository: ${repoId}`,
                                                        source: 'worker-instance', function: 'validateDirectories'}});
            throw new Error(`Error bulk inserting new 'dir' References on repository: ${repoId}`);
        }
    }
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
    TODO: Update `lastProcessedCommit` on Repository at end
*/

const runUpdateProcedure = async () => {

    var worker = require('cluster').worker;

    await worker.send({action: 'receipt', receipt: process.env.receipt})


    await worker.send({action: 'log', info: {level: 'debug', message: `cloneUrl: ${process.env.cloneUrl}`,
                                        source: 'worker-instance', function: 'runUpdateProcedure'}});

    var repoObj;

    try {
        repoObj = await getRepositoryObject(process.env.installationId, process.env.fullName, worker);
    }
    catch(err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                    errorDescription: `Error fetching Repository from MongoDB - installationId, fullName: ${process.env.installationId}, ${process.env.fullName}`,
                                                    source: 'worker-instance', function: 'runUpdateProcedure'}})
        throw new Error(`Error fetching Repository from MongoDB - installationId, fullName: ${process.env.installationId}, ${process.env.fullName}`);
    }

    var repoId = repoObj._id;
    var repoCommit = repoObj.lastProcessedCommit;
  
    var headCommit = process.env.headCommit;

    // TODO: Remove this hardcoding
    repoCommit = 'a66ea370ff0e039f7e9e9f807d4c6863d0b07522';


    await worker.send({action: 'log', info: {level: 'info', message: `Using repoCommit..headCommit: ${repoCommit}..${headCommit}`,
                                        source: 'worker-instance', function: 'runUpdateProcedure'}});

    // Clone the Repository
    var timestamp = Date.now().toString();
    var repoDiskPath = 'git_repos/' + timestamp +'/';

    var installToken;
    try {
        installToken = await tokenUtils.getInstallToken(process.env.installationId, worker);
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                    errorDescription: `Error fetching Install Token for installationId: ${process.env.installationId}`,
                                                    source: 'worker-instance', function: 'runUpdateProcedure'}})
        throw new Error(`Error fetching Install Token for installationId: ${process.env.installationId}`);
    }

    var cloneUrl = "https://x-access-token:" + installToken.value  + "@" + process.env.cloneUrl.replace("https://", "");

    try {
        const gitClone = spawnSync('git', ['clone', cloneUrl, repoDiskPath]);
    }
    catch(err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error Cloning Git Repository at cloneUrl: ${process.env.cloneUrl}`,
                                                    source: 'worker-instance', function: 'runUpdateProcedure'}});
        throw new Error(`Error Cloning Git Repository at cloneUrl: ${process.env.cloneUrl}`);
    }

      

    worker.send({action: 'log', info: {level: 'info', message: `repoDiskPath: ${repoDiskPath}`,
                                        source: 'worker-instance', function: 'runUpdateProcedure'}});


    // git log -M --numstat --name-status --pretty=%H
    const child = execFile('git', ['log', '-M', '--numstat', '--name-status', '--pretty=%H',
    repoCommit + '..' + headCommit],
    { cwd: './' + repoDiskPath },
    async (error, stdout, stderr) => {

        if (error) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(error), errorDescription: `Error running 'git log' for cloneUrl: ${process.env.cloneUrl}`,
                                                        source: 'worker-instance', function: 'runUpdateProcedure'}});
            throw new Error(`Error running 'git log' for cloneUrl: ${process.env.cloneUrl}`);
        }

        // What we want to parse out:
        // A list of commit objects in chronological (earliest -> latest) order
        // Each of these commit objects containing a fileChange object Array
        // Each file_change object Array contains file modified as well as the type of modification

        var lines = stdout.split("\n");
        var commitObjects = parseCommitObjects(lines);
        // trackedFile[0].operationList is chronological commit operations, earliest --> latest
        var trackedFiles = getFileChangeList(commitObjects);
        

        try {
            await runSnippetValidation(process.env.installationId, repoDiskPath, repoObj, headCommit, trackedFiles, worker);
            // (installationId, repoDiskPath, repoObj, headCommit, trackedFiles, worker)
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error calling runSnippetValidation on repository: ${repoId}`,
                                                        source: 'worker-instance', function:'runSnippetValidation', }})
            throw new Error(`Error calling runSnippetValidation on repository: ${repoId}`);
        }

        //TODO: REMOVE THIS
        // worker.kill();

        // Validate and update directory references here
        try {
            await validateDirectories(repoId, repoDiskPath, headCommit, worker);
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error running validateDirectories for cloneUrl: ${process.env.cloneUrl}`,
                                                        source: 'worker-instance', function: 'run'}});
            throw new Error(`Error running validateDirectories for cloneUrl: ${process.env.cloneUrl}`);
        }

        var fileReferencesToCreate = trackedFiles.filter(file => file.isNewRef && !file.deleted);
        
        // When to Update:
        // If !file.isNewRef && !file.deleted && file.ref != file.oldRef
        // AND file.ref != file.oldRef
        var fileReferencesToUpdate = trackedFiles.filter(file => !file.isNewRef && !file.deleted && file.oldRef != file.ref);
    
        var fileReferencesToDelete = trackedFiles.filter(file => !file.isNewRef && file.deleted);

        /*
        name: {type: String, index: true, required: true},
        repository: {type: ObjectId, ref: 'Repository', required: true},
        kind: {type: String, index: true, required: true},
        path: {type: String, index: true },
        parseProvider: {type: String, enum: ['create', 'update', 'semantic', 'doxygen'], required: true},
        */

        // Handling Newly Created File References
        if (fileReferencesToCreate.length > 0) {
            var refCreateData = [];
            for (i = 0; i < fileReferencesToCreate.length; i++) {
                var pathSplit = fileReferencesToCreate[i].ref.split('/');
                var fileName = pathSplit.slice(pathSplit.length - 1)[0];
                refCreateData.push({name: fileName, repository: repoId, kind: "file", path: fileReferencesToCreate[i].ref, parseProvider: 'update'});
            }

            try {
               const insertResults = await Reference.insertMany(references);
               worker.send({action: 'log', info: {level: 'debug', message: `Insert results for 'file' References on repository: ${repoId}\n${insertResults}`,
                                                    source: 'worker-instance', function:'runUpdateProcedure'}})
            }
            catch (err) {
                await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error creating new 'file' References on repository: ${repoId}`,
                                                            source: 'worker-instance', function:'runUpdateProcedure', }})
                throw new Error(`Error creating new 'file' References on repository: ${repoId}`);
            }
        }

        // Handling Deleted File References
        if (fileReferencesToDelete.length > 0) {

            var brokenReferences;
            try {
                brokenReference = await Reference.find({repository: repoId, status: 'valid', kind: 'file',
                                                        path: {$in: fileReferencesToDelete.map(file => file.oldRef)}});
            }
            catch (err) {
                await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error fetching 'file' References to invalidate on repository: ${repoId}`,
                                                            source: 'worker-instance', function:'runUpdateProcedure', }});
                throw new Error(`Error fetching 'file' References to invalidate on repository: ${repoId}`);
            }

            worker.send({action: 'log', info: {level: 'info', 
                                                message: `Fetched ${brokenReferences.length} ids for the following 'file' References to delete on repository: ${repoId}\n${fileReferencesToDelete}`,
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
                        filter: { _id: refObj._id },
                        // Where field is the field you want to update
                        update: { $set: { status: refObj.status, breakCommit: refObj.breakCommit } },
                        upsert: false
                }
            }));
            if (bulkReferenceInvalidateOps.length > 0) {
                try {
                    const invalidateResults = await Reference.collection.bulkWrite(bulkReferenceInvalidateOps);
                    worker.send({action: 'log', info: {level: 'debug',
                                                        message: `Invalidate results for bulk invalidate on 'file' References on repository: ${repoId}\n${invalidateResults}`,
                                                        source: 'worker-instance', function:'runUpdateProcedure'}})
                }
                catch (err) {
                    await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                            errorDescription: `Error invalidating 'file' References on repository: ${repoId}`,
                                                            source: 'worker-instance', function: 'runUpdateProcedure'}});
                    throw new Error(`Error invalidating 'file' References on repository: ${repoId}`);
                }

                try {
                    await breakAttachedDocuments(repoId, refUpdateData, worker);
                }
                catch (err) {
                    await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                                errorDescription: `Error invalidating Documents attached to invalidated 'file' References on repository: ${repoId}`,
                                                                source: 'worker-instance', function: 'breakAttachedDocuments'}});
                    throw new Error(`Error invalidating Documents attached to invalidated 'file' References on repository: ${repoId}`);
                }
            }
        }

        // Handling Updated File References, only updating on rename
        if (fileReferencesToUpdate.length > 0) {
            var renamedReferences;
            try {
                renamedReferences = await Reference.find({repository: repoId, status: 'valid', kind: 'file',
                                                            path: {$in: fileReferencesToUpdate.map(file => file.oldRef)}});
            }
            catch (err) {
                await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                            errorDescription: `Error fetching 'file' References to update (rename) on repository: ${repoId}`,
                                                            source: 'worker-instance', function:'runUpdateProcedure', }})
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
                                    path: fileReferencesToCreate[i].ref,
                                    parseProvider: 'update'});
            }

            worker.send({action: 'log', info: {level: 'debug', 
                                                message: `refUpdateData for Reference update on repository: ${repoId}\n${refUpdateData}`,
                                                source: 'worker-instance', function:'runUpdateProcedure'}});
            

            // Invalidate all the References that have been broken
            const bulkReferenceRenameOps = refUpdateData.map(refObj => ({
        
                updateOne: {
                        filter: { _id: refObj._id },
                        // Where field is the field you want to update
                        update: { $set: { status: refObj.status, name: refObj.name, path: refObj.path, parseProvider: refObj.parseProvider } },
                        upsert: false
                }
            }));
            if (bulkReferenceRenameOps.length > 0) {
                try {
                    const renameResults = await Reference.collection.bulkWrite(bulkReferenceRenameOps);
                    worker.send({action: 'log', info: {level: 'debug',
                                                        message: `Rename results for bulk rename on 'file' References on repository: ${repoId}\n${renameResults}`,
                                                        source: 'worker-instance', function:'runUpdateProcedure'}})
                }
                catch (err) {
                    await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error renaming 'file' References on repository: ${repoId}`,
                                                                source: 'worker-instance', function: 'runUpdateProcedure'}});
                    throw new Error(`Error renaming 'file' References on repository: ${repoId}`);
                }
            }
            
        }

        // TODO: Need to Delete invalidated References that are not attached to any Document/anything else, otherwise they will keep taking up space.

        // Update Repository 'lastProcessedCommit'
        try {
            await Repository.findByIdAndUpdate(repoObj._id, { $set: { lastProcessedCommit: headCommit } });
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                        errorDescription: `Error setting 'lastProcessedCommit' on repository, headCommit: ${repoId}, ${headCommit}`,
                                                        source: 'worker-instance', function: 'runUpdateProcedure'}});
            throw new Error(`Error setting 'lastProcessedCommit' on repository, headCommit: ${repoId}, ${headCommit}`);
        }

        // Delete Downloaded Repository
        try {
            const deleteRepository = spawnSync('rm', ['-rf', `${repoDiskPath}`], {cwd: repoDiskPath});
        }
        catch(err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error deleting repository ${repoId} at:  ${repoDiskPath}`,
                                                        source: 'worker-instance', function: 'runUpdateProcedure'}});
            throw new Error(`Error deleting repository ${repoId} at:  ${repoDiskPath}`);
        }
    });
}

module.exports = {
    runUpdateProcedure
}