const Sentry = require("@sentry/node");
const Reference = require('../../models/Reference');

const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;


const { filterVendorFiles } = require('../validate_utils');



const generateRepositoryReferences = async (repositoryListCommits, unscannedRepositories, unscannedRepositoryIdList,
                                            installationIdLookup, installationClientList, session) => {
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
            return { url: `/repos/${repositoryObj.fullName}/git/trees/${repositoryObj.treeSha}?recursive=true`, repositoryId: repositoryObj._id.toString()};
        });

        // Set return value to undefined for invalid Repositories
        var requestPromiseList = urlList.map( async (urlObj) => {
            if (!urlObj) {
                return undefined;
            }

            // KARAN TODO: Replace installationClient with a method to fetch the correct installationClient by repositoryId

            var currentInstallationId = installationIdLookup[urlObj.repositoryId];
            return await installationClientList[currentInstallationId].get(urlObj.url);
        });
        repositoryTreeResponseList = await Promise.all(requestPromiseList);
    }
    catch (err) {

        console.log(err);

        Sentry.setContext("scan-repositories", {
            message: `scanRepositories failed fetching repository tree from Github API: "/repos/:owner/:name/git/trees/:tree_sha?recursive=true"`,
            urlList: urlList,
        });

        Sentry.captureException(err);

        throw new Error(`Error getting repository tree urlList: ${JSON.stringify(urlList)}`);
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

        Sentry.setContext("scan-repositories", {
            message: `scanRepositories failed inserting tree 'References' from repositories`,
            unscannedRepositoryIdList: unscannedRepositoryIdList,
        });

        Sentry.captureException(err);

        throw err;
    }

    console.log(`inserted ${insertedReferences.length} tree references`);
}


module.exports = {
    generateRepositoryReferences
}