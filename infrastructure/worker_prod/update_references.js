const fs = require('fs');

const fs_promises = require('fs').promises;

const { getRepositoryObject, filterVendorFiles, parseCommitObjects,
        parseGithubFileChangeList, getFileChangeList } = require('./utils/validate_utils');

const { runSnippetValidation } = require('./update_snippets');



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


const {serializeError, deserializeError} = require('serialize-error');

let db = mongoose.connection;

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

const breakAttachedDocuments = async (repoId, refUpdateData, worker, session) => {
    // Find all Documents associated with References that have been broken
    var documentsToBreak;
    try {
        documentsToBreak = await Document.find({repository: repoId, references: { $in: refUpdateData.map(refObj => ObjectId(refObj._id)) }}, null, { session }).exec();
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
                filter: { _id: ObjectId(docObj._id.toString()) },
                // Where field is the field you want to update
                // TODO: Instead of using `new Date()` use the actual date on the git push
                update: { $set: { status: docObj.status, breakCommit: docObj.breakCommit, breakDate: new Date() } },
                upsert: false
        }
    }));
    if (bulkDocumentInvalidateOps.length > 0) {
        try {
            const bulkResult = await Document.collection.bulkWrite(bulkDocumentInvalidateOps, { session });
            worker.send({action: 'log', info: {level: 'info', message: `bulk Document invalidate results: ${JSON.stringify(bulkResult)}`,
                                                source: 'worker-instance', function: 'breakAttachedDocuments'}});

        }
        catch(err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                        errorDescription: `Error bulk invalidating Documents on repository: ${repoId}`,
                                                        source: 'worker-instance', function: 'breakAttachedDocuments'}});
            throw new Error(`Error bulk invalidating Documents on repository: ${repoId}`);
        }

        // Update UserStats here

        // We need to get the Document's authors

        var deletedIds = docUpdateData.map(docData => docData._id.toString());

        var deletedDocumentInfo;

        try {
            deletedDocumentInfo = await Document.find({_id: {$in: deletedIds}}, null, { session }).select("author status").lean().exec();
        }
        catch (err) {
            worker.send({ action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                    errorDescription: `Error Document find query failed repositoryId, deletedIds: ${repoId}, ${JSON.stringify(deletedIds)}`,
                                                    function: 'breakAttachedDocuments'}});

            throw new Error(`Error Document find query failed repositoryId, deletedIds: ${repoId}, ${JSON.stringify(deletedIds)}`);
        }

        var userBrokenDocumentNums = {};
        var userBrokenDocumentUpdateList = [];
    
        deletedDocumentInfo.filter(infoObj => infoObj.status == 'invalid')
                            .forEach(infoObj => {
                                userBrokenDocumentNums[infoObj.author.toString()] = (userBrokenDocumentNums[infoObj.author.toString()] || 0) + 1;
                            });
        Object.keys(userBrokenDocumentNums).forEach(key => {
            userBrokenDocumentUpdateList.push({ userId: key, updateNum: userBrokenDocumentNums[key] });
        });
    
        if (userBrokenDocumentUpdateList.length > 0) {
            var userUpdates = userBrokenDocumentUpdateList;

            // mongoose bulkwrite for one many update db call
            try {
                const bulkDecrementOps = userUpdates.map((update) => {
                    return ({
                        updateOne: {
                            filter: { user: ObjectId(update.userId.toString()) },
                            // Where field is the field you want to update
                            update: { $inc: { documentsBrokenNum: update.updateNum } },
                            upsert: false
                        }
                    })
                });
               await UserStats.bulkWrite(bulkDecrementOps, { session });
            }
            catch (err) {
                worker.send({ action: 'log', info: {    level: 'error',
                                                        source: 'worker-instance',
                                                        message: serializeError(err),
                                                        errorDescription: `Error bulk updating User Stats for repositoryId, userUpdates: ${repoId}, ${JSON.stringify(userUpdates)}`,
                                                        function: 'breakAttachedDocuments'}});

                throw new Error(`Error bulk updating User Stats for repositoryId, userUpdates: ${repoId}, ${JSON.stringify(userUpdates)}`);
            }

            await worker.send({action: 'log', info: { level: 'info',
                                                        source: 'worker-instance',
                                                        message: `Successfully updated 'UserStats.documentsBrokenNum' for ${userUpdates.length} Users - repositoryId: ${repoId}`,
                                                        function: 'breakAttachedDocuments'}});
        }



    }
    await worker.send({ action: 'log', info: {level: 'info',
                                                source: 'worker-instance',
                                                message: `Invalidated ${docUpdateData.length} Documents.`,
                                                function: 'breakAttachedDocuments'
                                                }});
    return docUpdateData.map(docData => docData._id.toString());
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


const validateDirectories = async (repoId, repoDiskPath, headCommit, worker, session) => {

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
        brokenDocuments = brokenDocuments.concat( await breakAttachedDocuments(repoId, unmatchedDirectories, worker, session) );
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
    TODO: Update `lastProcessedCommit` on Repository at end
*/

const runUpdateProcedure = async () => {

    var worker = require('cluster').worker;

    var brokenDocuments = [];
    var brokenSnippets = [];
    var addedReferences = [];

    var backendClient = apis.requestBackendClient();

    var checkCreateData = {};


    await worker.send({action: 'log', info: {level: 'debug', message: `cloneUrl: ${process.env.cloneUrl}`,
                                        source: 'worker-instance', function: 'runUpdateProcedure'}});


    const session = await db.startSession();

    var transactionAborted = false;
    var transactionError = {message: ''};
    try {
        await session.withTransaction(async () => {

            var repoObj;

            try {
                repoObj = await getRepositoryObject(process.env.installationId, process.env.fullName, worker);
            }
            catch(err) {
                await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                            errorDescription: `Error fetching Repository from MongoDB - installationId, fullName: ${process.env.installationId}, ${process.env.fullName}`,
                                                            source: 'worker-instance', function: 'runUpdateProcedure'}})
                transactionAborted = true;
                transactionError.message = `Error fetching Repository from MongoDB - installationId, fullName: ${process.env.installationId}, ${process.env.fullName}`;

                throw new Error(`Error fetching Repository from MongoDB - installationId, fullName: ${process.env.installationId}, ${process.env.fullName}`);
            }

            var repoId = repoObj._id;
            var repoCommit = repoObj.lastProcessedCommit;
        
            var headCommit = process.env.headCommit;


            await worker.send({action: 'log', info: {level: 'info', message: `Using repoCommit..headCommit: ${repoCommit}..${headCommit}`,
                                                source: 'worker-instance', function: 'runUpdateProcedure'}});

            // Clone the Repository
            var timestamp = Date.now().toString();
            var repoDiskPath = 'git_repos/' + timestamp +'/';

            var installToken;
            try {
                installToken = await tokenUtils.getInstallToken(process.env.installationId, worker, session);
            }
            catch (err) {
                await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                            errorDescription: `Error fetching Install Token for installationId: ${process.env.installationId}`,
                                                            source: 'worker-instance', function: 'runUpdateProcedure'}});
                
                transactionAborted = true;
                transactionError.message = `Error fetching Install Token for installationId: ${process.env.installationId}`

                throw new Error(`Error fetching Install Token for installationId: ${process.env.installationId}`);
            }

            var cloneUrl = "https://x-access-token:" + installToken.value  + "@" + process.env.cloneUrl.replace("https://", "");

            try {
                // Format to only clone one specific branch
                // git clone -b opencv-2.4 --single-branch https://github.com/Itseez/opencv.git
                const gitClone = spawnSync('git', ['clone', '-b', repoObj.defaultBranch, '--single-branch', cloneUrl, repoDiskPath]);
            }
            catch(err) {
                await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error Cloning Git Repository at cloneUrl: ${process.env.cloneUrl}`,
                                                            source: 'worker-instance', function: 'runUpdateProcedure'}});

                transactionAborted = true;
                transactionError.message = `Error Cloning Git Repository at cloneUrl: ${process.env.cloneUrl}`;

                throw new Error(`Error Cloning Git Repository at cloneUrl: ${process.env.cloneUrl}`);
            }

            // Make sure repository is at correct commit
            try {
                const ensureCommit = spawnSync('git', ['reset', '--hard', `${headCommit}`], {cwd: repoDiskPath});
            }
            catch(err) {
                await worker.send({action: 'log', info: {level: 'error',
                                                            message: serializeError(err),
                                                            errorDescription: `Error hard resetting to headCommit - repoId, cloneUrl, headCommit: ${repoId}, ${process.env.cloneUrl}, ${headCommit}`,
                                                            source: 'worker-instance', function: 'runUpdateProcedure'}});
                
                transactionAborted = true;
                transactionError.message = `Error hard resetting to headCommit - repoId, cloneUrl, headCommit: ${repoId}, ${process.env.cloneUrl}, ${headCommit}`;

                throw new Error(`Error hard resetting to headCommit - repoId, cloneUrl, headCommit: ${repoId}, ${process.env.cloneUrl}, ${headCommit}`);
            }

            // Verify that we have successfully set the Repository to the correct commit
            var getCurrentCommitResponse;
            try {
                getCurrentCommitResponse = spawnSync('git', ['log', '-1', '--pretty=%H'], {cwd: './' + repoDiskPath});
            }
            catch (err) {
                await worker.send({action: 'log', info: {level: 'error',
                                                            message: serializeError(err),
                                                            errorDescription: `Error getting local repository current commit - repoId, headCommit, cloneUrl: ${repoId}, ${process.env.cloneUrl}, ${headCommit}`,
                                                            source: 'worker-instance', function: 'runUpdateProcedure'}});
                
                transactionAborted = true;
                transactionError.message = `Error getting local repository current commit - repoId, headCommit, cloneUrl: ${repoId}, ${process.env.cloneUrl}, ${headCommit}`;
                    
                throw new Error(`Error getting local repository current commit - repoId, headCommit, cloneUrl: ${repoId}, ${process.env.cloneUrl}, ${headCommit}`);
            }

            var currentCommitSha = getCurrentCommitResponse.stdout.toString().trim();

            if (currentCommitSha != headCommit) {
                await worker.send({action: 'log', info: {level: 'error',
                                                            message: serializeError(err),
                                                            errorDescription: `Error local repository commit sha doesn't match headCommit - repoId, localCommit, headCommit: ${repoId}, ${currentCommitSha}, ${headCommit}`,
                                                            source: 'worker-instance',
                                                            function: 'runUpdateProcedure'}});
                transactionAborted = true;
                transactionError.message = `Error local repository commit sha doesn't match headCommit - repoId, localCommit, headCommit: ${repoId}, ${currentCommitSha}, ${headCommit}`;

                throw new Error(`Error local repository commit sha doesn't match headCommit - repoId, localCommit, headCommit: ${repoId}, ${currentCommitSha}, ${headCommit}`);
            }



            worker.send({action: 'log', info: {level: 'info', message: `repoDiskPath: ${repoDiskPath}`,
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
                var validateResult = await validateDirectories(repoId, repoDiskPath, headCommit, worker, session);
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
                        brokenDocuments = brokenDocuments.concat( await breakAttachedDocuments(repoId, refUpdateData, worker) );
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

            // For routing
            checkCreateData.repoId = repoId;

            // Actual body data
            checkCreateData.installationId = process.env.installationId;
            checkCreateData.commit = headCommit
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