const fs = require('fs');

const api = require('./apis/api');
var backendClient = api.requestBackendClient();


const fs_promises = require('fs').promises;

const { findNewSnippetRegion } = require('./snippet_validator');

const { getRepositoryObject, filterVendorFiles, parseCommitObjects,
        parseGithubFileChangeList, getFileChangeList } = require('./utils/validate_utils');



require('dotenv').config();
const { exec, execFile, spawnSync } = require('child_process');

const constants = require('./constants/index');

const tokenUtils = require('./utils/token_utils');
const Reference = require('./models/Reference');
const Document = require('./models/Document');

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


const breakAttachedDocuments = async (repoId, refUpdateData) => {
    // Find all Documents associated with References that have been broken
    var documentsToBreak = Document.find({repository: repoId, references: { $in: refUpdateData.map(refObj => ObjectId(refObj._id)) }});

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
        await Document.collection
            .bulkWrite(bulkDocumentInvalidateOps)
            .then(async (results) => {})
            .catch((err) => {
                throw new Error("Update Reference Job: Error bulk invalidating Documents");
            });
    }
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


const validateDirectories = async (repoId, repoDiskPath, headCommit) => {

    // Make sure repository is at correct commit
    const ensureCommit = spawnSync('git', ['reset', '--hard', `${headCommit}`], {cwd: repoDiskPath});

    const getFileTree = spawnSync('tree', ['-f', '-i', '-F'], {cwd: repoDiskPath});

    const fileTree = cp.stdout.toString().split('\n');

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

    var oldDirectories = await Reference.find({kind: "dir", status: 'valid', repository: `${repoId}`}, 'path').exec();

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
        await Reference.collection
            .bulkWrite(bulkReferenceInvalidateOps)
            .then(async (results) => {})
            .catch((err) => {
                throw new Error("Update Reference Job: Error bulk invalidating Directories");
            });
    }
    await breakAttachedDocuments(repoId, unmatchedDirectories);

    // Handle creating new directories

    createdDirectories = createdDirectories.map(dirPath => {
        var pathSplit = dirPath.split('/');
        var dirName = pathSplit.slice(pathSplit.length - 1)[0]
        return {name: dirName, path: dirPath, kind: 'dir',
                status: 'valid', repository: repoId, parseProvider: 'update'}
    });

    if (createdDirectories.length > 0) {
        await Reference.insertMany(createdDirectories)
        .then()
        .catch((err) => {
            throw new Error("Update Reference Job: Error bulk creating new Directories");
        });
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
*/

const run = async () => {

    // Get install client
    var installationClient = await api.requestInstallationClient(process.env.installationId);

    console.log('Got installation client');
    console.log('cloneUrl: ', process.env.cloneUrl);

    var repoObj = await getRepositoryObject(process.env.installationId, process.env.fullName);

    var repoId = repoObj._id;
    var repoCommit = repoObj.lastProcessedCommit;
  

    console.log('Finished getting Repository object');
    var headCommit = process.env.headCommit;

    // TODO: Remove this hardcoding
    repoCommit = 'a66ea370ff0e039f7e9e9f807d4c6863d0b07522';

    console.log('repoCommit: ', repoCommit);
    console.log('headCommit: ', headCommit);

    // Clone the Repository    
    var timestamp = Date.now().toString();    
    var repoDiskPath = 'git_repos/' + timestamp +'/';

    var installToken = await tokenUtils.getInstallToken(process.env.installationId);


    var cloneUrl = "https://x-access-token:" + installToken.value  + "@" + process.env.cloneUrl.replace("https://", "");
  
    const gitClone = spawnSync('git', ['clone', cloneUrl, repoDiskPath]);

    console.log('repoDiskPath: ', repoDiskPath);
    console.log(`Commit Range: ${repoCommit}..${headCommit}`);
    console.log('Commit Range 2: ', (repoCommit + '..' + headCommit));
    // git log -M --numstat --name-status --pretty=%H
    const child = execFile('git', ['log', '-M', '--numstat', '--name-status', '--pretty=%H',
    repoCommit + '..' + headCommit],
    { cwd: './' + repoDiskPath },
    async (error, stdout, stderr) => {
        // What we want to parse out:
        // A list of commit objects in chronological (earliest -> latest) order
        // Each of these commit objects containing a fileChange object Array
        // Each file_change object Array contains file modified as well as the type of modification

        console.log('git log output: ', stdout);
        var lines = stdout.split("\n");
        var commitObjects = parseCommitObjects(lines);
        // trackedFile[0].operationList is chronological commit operations, earliest --> latest
        var trackedFiles = getFileChangeList(commitObjects);
        console.log('Tracked Files: ');
        trackedFiles.forEach(file => {
            console.log(file);
            console.log(file.operationList);
            console.log();
        });

        var fileReferencesToCreate = trackedFiles.filter(file => file.isNewRef && !file.deleted);
        var fileReferencesToUpdate = trackedFiles.filter(file => !file.isNewRef && !file.deleted);
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
                await Reference.insertMany(references);
            }
            catch (err) {
                throw new Error('Update Reference Job: Error creating new File References');
            }

        }

        // Handling Deleted File References
        if (fileReferencesToDelete.length > 0) {

            var brokenReferences = await Reference.find({repository: repoId, status: 'valid', kind: 'file',
                                                        path: {$in: fileReferencesToDelete.map(file => file.oldRef)}});
            console.log('fileReferencesToDelete: ', );
            console.log(fileReferencesToDelete.map(file => file.oldRef));

            console.log('brokenReferenceIds: ');
            console.log(brokenReferences.map(reference => reference._id));

            var refUpdateData = [];

            // Match the local file that has been broken to the Reference object that matches it
            for (i = 0; i < brokenReferences.length; i++) {
                var currentSearchReference = brokenReferences[i];
                var matchingLocalReference = fileReferencesToDelete.find(refObj => refObj.oldRef == currentSearchReference.path);
                // Update Reference with new status and breakCommit sha
                refUpdateData.push({_id: currentSearchReference._id, status: 'invalid',
                                    breakCommit: matchingLocalReference.operationList[matchingLocalReference.operationList.length - 1].sha});
            }

            console.log('refUpdateData: ');
            console.log(refUpdateData);

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
                await Reference.collection
                    .bulkWrite(bulkReferenceInvalidateOps)
                    .then(async (results) => {})
                    .catch((err) => {
                        throw new Error("Update Reference Job: Error bulk invalidating References");
                    });
                    await breakAttachedDocuments(repoId, refUpdateData);
            }

            /*
            // Find all Documents associated with References that have been broken
            var documentsToBreak = Document.find({repository: repoId, references: { $in: refUpdateData.map(refObj => ObjectId(refObj._id)) }});

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
                await Document.collection
                    .bulkWrite(bulkDocumentInvalidateOps)
                    .then(async (results) => {})
                    .catch((err) => {
                        throw new Error("Update Reference Job: Error bulk invalidating Documents");
                    });
            }
            */

        }
    });

    /*
    var diffResponse = await installationClient.get(`/repos/${process.env.fullName}/compare/${repoCommit}...${headCommit}`);
    console.log('DIFF RESPONSE: ');
    console.log(diffResponse.data);


    var fileChanges = diffResponse.data.files;
    console.log('fileChanges: ', fileChanges);
    parseGithubFileChangeList(fileChanges);
    */
    // status: ['added', 'removed', 'modified', 'renamed']
    // if renamed --> `previous_filename` field holds previous name
    // sha: "bbcd538c8e72b8c175046e27cc8f907076331401"
}

module.exports = {
    run
}