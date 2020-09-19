const url = require('url');

var request = require("request");

const apis = require('../apis/api');

const jobs = require('../apis/jobs');
const jobConstants = require('../constants/index').jobs;

const api = apis.requestGithubClient();

const apiURL = 'https://api.github.com';
const localURL = 'https://localhost:3001/api'
const repoBaseURL = 'https://github.com/'

const fs = require('fs');
const fsPath = require('fs-path');

const { exec, execFile } = require('child_process');

const Repository = require('../models/Repository');
const Reference = require('../models/Reference');
const Document = require('../models/Document');

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

var EventLogger = undefined;
var log = undefined;
if (process.env.RUN_AS_REMOTE_BACKEND === 1) {
    EventLogger = require('node-windows').EventLogger;
    log = new EventLogger('DocApp EventLogger Hello!');
}
const { v4 } = require('uuid');
const { json } = require('body-parser');


/*repositorySearch = (req, res) => {
    console.log(req.body);
    const { RepositorysitoryName } = req.body;
    const response = await api.get('/repos//create', formValues );

    if (!typeof repositoryName == 'undefined' && repositoryName !== null) return res.json({success: false, error: 'no repo repositoryName provided'});
    
    return res.json({status: 'SUCCESS'});
}*/

checkValid = (item) => {
    if (item !== null && item !== undefined) {
        return true
    }
    return false
}

// Needs to use installation token
createRepository = async (req, res) => {
    const {fullName, installationId, htmlUrl, cloneUrl, icon} = req.body;
    if (!checkValid(fullName)) return res.json({success: false, error: 'no repository fullName provided'});
    if (!checkValid(installationId)) return res.json({success: false, error: 'no repository installationId provided'});

    let repository = new Repository({
        fullName,
        installationId,
        icon
    });

    if (htmlUrl) repository.htmlUrl = htmlUrl;
    if (cloneUrl) repository.cloneUrl = cloneUrl;


    var installationClient = await apis.requestInstallationClient(installationId);
    
    const listCommitResponse = await installationClient.get('/repos/' + fullName + '/commits')
                                    .catch(err => console.log("Error getting repository commits: ", err));
    var latestCommitSha = listCommitResponse.data[0]['sha'];

    repository.lastProcessedCommit = latestCommitSha;

    repository.save(async (err, repository) => {
        if (err) return res.json({ success: false, error: err });

        installationClient.get(`/repos/${fullName}`).then((response) => {
            //console.log("FIRST RESPONSE", response.data)
            // Get all commits from default branch
            var cloneUrl = response.data.clone_url;

            console.log('repo')
            
            repository.cloneUrl = cloneUrl;
            repository.save();

            var runSemanticData = {};
            runSemanticData['fullName'] = fullName;
            runSemanticData['installationId'] = installationId.toString();
            runSemanticData['cloneUrl'] = cloneUrl;
            // This needs to be used in the worker
            runSemanticData['defaultBranch'] = response.data.default_branch;
            runSemanticData['jobType'] =  JOB_SEMANTIC;

            installationClient.get(`/repos/${fullName}/commits/${response.data.default_branch}`).then((response) => {
                
                console.log('Latest Commit obj: ');
                console.log(response.data.commit);
                // Extract tree SHA from most recent commit
                let treeSHA = response.data.commit.tree.sha


                //"--", "--json-symbols"
                // Extract contents using tree SHA
                console.log("REPO NAME OWNER", fullName)
                let repoName = fullName.split("/").slice(1)[0]
                console.log(repoName);
                installationClient.get(`/repos/${fullName}/git/trees/${treeSHA}?recursive=true`).then((response) => {
                    
                    let treeReferences = response.data.tree.map(item => {
                        
                        let pathSplit = item.path.split('/')
                        let name = pathSplit.slice(pathSplit.length - 1)[0]
                        let path = pathSplit.join('/');
                        let kind = item.type == 'blob' ? 'file' : 'dir'
                        return {name, path, kind, repository: ObjectId(repository._id)}
                    })

                    // Save repository contents as items in our database
                    Reference.insertMany(treeReferences, (errInsertItems, treeReferences) => {
                        if (errInsertItems) {
                            console.log('Error inserting tree References: ');
                            console.log(errInsertItems);
                             return res.json({ success: false, error: errInsertItems });
                        }
                        console.log('Success: Inserted treeReferences.length: ', treeReferences.length);
                    });


                    // SEMANTIC
                    // defaultBranch, fullName, cloneUrl, installationId, jobType

                    repository.semanticJobStatus = jobConstants.JOB_STATUS_RUNNING;
                    repository.save();
                    jobs.dispatchSemanticJob(runSemanticData, log);
                
                })
            })
        })
        
    });
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
        const reference = await Reference.findOne({_id: referenceId}).populate('repository');
        pathInRepo = reference.path;
    }


    // var installationClient = await apis.requestInstallationClient(installationId);
    var installationClient = await apis.requestInstallationClient(11148646);
    var fileResponse = await installationClient.get(`/repos/${fullName}/contents/${pathInRepo}`)
            .catch(err => {
                return res.json({success: false, error: 'getRepositoryFile error fetching fileSha: ' + err});
            });
    if(!fileResponse.data.hasOwnProperty('sha')) {
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


getRepository = (req, res) => {

    const repositoryId = req.repositoryObj._id.toString();

    Repository.findById(repositoryId, (err, repository) => {
        if (err) return res.json({success: false, error: err});
        return res.json({success: true, result: repository});
    });
}


deleteRepository = (req, res) => {
    const repositoryId = req.repositoryObj._id.toString();

    Repository.findByIdAndRemove(repositoryId, (err, repository) => {
        if (err) return res.json({success: false, error: err});
        repository.populate('workspace', (err, repository) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: repository});
        });
    });
}



retrieveRepositories = (req, res) => {
    const {fullName, installationId, fullNames} = req.body;

    var repositoriesInWorkspace = req.workspaceObj.repositories.map(repositoryId => repositoryId.toString());

    query = Repository.find();
    if (fullName) query.where('fullName').equals(fullName);
    if (installationId) query.where('installationId').equals(installationId);
    if (fullNames) query.where('fullName').in(fullNames)


    query.populate('workspace').exec((err, repositories) => {
        console.log("REPOSITORIES", repositories);
        // Make sure returned repositories are scoped to workspace on the request
        repositories = repositories.filter(repositoryObj => repositoriesInWorkspace.includes(repositoryObj._id.toString()) != -1);
        if (err) return res.json({ success: false, error: err });
        return res.json({success: true, result: repositories});
    });
}

jobRetrieveRepositories = (req, res) => {
    const {fullName, installationId, fullNames} = req.body;


    query = Repository.find();
    if (fullName) query.where('fullName').equals(fullName);
    if (installationId) query.where('installationId').equals(installationId);
    if (fullNames) query.where('fullName').in(fullNames)


    query.populate('workspace').exec((err, repositories) => {
        console.log("REPOSITORIES", repositories);
        // Make sure returned repositories are scoped to workspace on the request
        if (err) return res.json({ success: false, error: err });
        console.log('Returning Repositories');
        return res.json({success: true, result: repositories});
    });
}


validateRepositories = async (req, res) => {
    let repositories = [];


    let ids = Object.keys(req.body.selected)
    for (let i = 0; i < ids.length; i++){
        let id = ids[i]
        let fullName = req.body.selected[id]
        let repository = await Repository.findOne({fullName: fullName, installationId: req.body.installationId})

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


        var repository = await Repository.findOne({fullName, installationId})
                                .catch(err => {
                                    return res.json({ success: false, error: 'Error updateRepository could not find repository: ' + err });
                                });

        repository.snippetJobStatus = jobConstants.JOB_STATUS_RUNNING;
        await repository.save()
                .catch(err => {
                    return res.json({success: false, error: 'Error setting repository snippetJobStatus = JOB_STATUS_RUNNING ' + err});
                });

        var runSnippetData = {};
        runSnippetData['fullName'] = fullName;
        runSnippetData['installationId'] = installationId;
        runSnippetData['headCommit'] = headCommit;
        runSnippetData['cloneUrl'] = cloneUrl;
        runSnippetData['jobType'] = jobConstants.JOB_UPDATE_SNIPPETS.toString();

        repository.updateSnippetJobStatus = jobConstants.JOB_STATUS_RUNNING;
        await repository.save();
        // await jobs.dispatchSemanticJob(runSnippetData, log);

        // 

        var runReferencesData = {};
        runReferencesData['fullName'] = fullName;
        runReferencesData['installationId'] = installationId;
        // runReferencesData['headCommit'] = headCommit;
        runReferencesData['headCommit'] = '9d87a041d7f12f1f59df90fb2e9485d9b067ac37';
        runReferencesData['cloneUrl'] = cloneUrl;
        runReferencesData['jobType'] = jobConstants.JOB_UPDATE_REFERENCES.toString();

        repository.updateReferencesJobStatus = jobConstants.JOB_STATUS_RUNNING;
        repository.save();
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
    getRepositoryFile, createRepository, getRepository,
    deleteRepository, retrieveRepositories,
    validateRepositories, pollRepositories, updateRepository,
    jobRetrieveRepositories
}