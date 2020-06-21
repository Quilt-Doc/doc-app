const url = require('url');

var request = require("request");

const apis = require('../apis/api');
const parseUtils = require('../utils/parse_code');

const api = apis.requestClient();
const sqs = apis.requestSQSServiceObject();
const queueUrl = "https://sqs.us-east-1.amazonaws.com/695620441159/dataUpdate.fifo";

const apiURL = 'https://api.github.com';
const localURL = 'https://localhost:3001/api'
const repoBaseURL = 'https://github.com/'

const fs = require('fs');
const fsPath = require('fs-path');

const RepositoryItem = require('../models/RepositoryItem')
const Repository = require('../models/Repository');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

var EventLogger = undefined;
var log = undefined;
if (process.env.RUN_AS_REMOTE_BACKEND === 1) {
    EventLogger = require('node-windows').EventLogger;
    log = new EventLogger('DocApp EventLogger Hello!');
}
const { v4 } = require('uuid');

/*repositorySearch = (req, res) => {
    console.log(req.body);
    const { RepositorysitoryName } = req.body;
    const response = await api.get('/repos//create', formValues );

    if (!typeof repositoryName == 'undefined' && repositoryName !== null) return res.json({success: false, error: 'no repo repositoryName provided'});
    
    return res.json({status: 'SUCCESS'});
}*/

refreshRepositoryPath = (req, res) => {
    console.log(req.body);
    var { repositoryName, repositoryPath} = req.body;
    if (!typeof repositoryName == 'undefined' && repositoryName !== null) return res.json({success: false, error: 'no repo repositoryName provided'});
    if (typeof repositoryPath == 'undefined') repositoryPath = '';
    
    var reposCreate = url.resolve(apiURL, '/repos/create');
    console.log(reposCreate);
    
    var reposContents = url.resolve(url.resolve(reposCreate, repositoryName), 'contents/');
    console.log(reposContents);

    const reqURL = url.resolve(reposContents, repositoryPath);
    console.log('FINAL REQ URL: ', reqURL);

    api.get(reqURL)
    .then(function (response) {
        return res.json(response.data);
      })
      .catch(function (err) {
        return res.json({ success: false, error: err });
      });
}

refreshRepositoryPathNew = (req, res) => {
    console.log(req.body);
    var {repositoryPath} = req.body;
    if (!typeof repositoryPath == 'undefined' && repositoryPath !== null) return res.json({success: false, error: 'no repo repositoryPath provided'});
    
    if (repositoryPath[repositoryPath.length - 1] !== '/') {
        repositoryPath = repositoryPath + '/';
    }
    
    var secondNameFirst = repositoryPath.substring(repositoryPath.indexOf('/')+1);
    var secondName = secondNameFirst.substring(0, secondNameFirst.indexOf('/')+1);

    var repositoryName = repositoryPath.substring(0, repositoryPath.indexOf('/')+1) + secondName;
    //repositoryName = repositoryPath.substring(0,repositoryPath.indexOf('/')+1) + 

    repositoryPath = repositoryPath.substring(repositoryPath.indexOf(repositoryName)+repositoryName.length);


    var reposCreate = url.resolve(apiURL, '/repos/create');
    console.log(reposCreate);
    
    var reposContents = url.resolve(url.resolve(reposCreate, repositoryName), 'contents/');
    console.log(reposContents);

    const reqURL = url.resolve(reposContents, repositoryPath);
    console.log('FINAL REQ URL: ', reqURL);

    api.get(reqURL)
    .then(function (response) {
        return res.json(response.data);
      })
      .catch(function (err) {
        return res.json({ success: false, error: err });
      });
}


getRepositoryFile = (req, res) => {
    var { downloadLink} = req.body;
    if (typeof downloadLink == 'undefined' || downloadLink == null) return res.json({success: false, error: 'no repo downloadLink provided'});
    // if (typeof repositoryName == 'undefined' || repositoryName == null) return res.json({success: false, error: 'no repo repositoryName provided'});
    
    console.log('downloadLink: ', downloadLink);
    request.get(downloadLink).pipe(res);
}

parseRepositoryFile = (req, res) => {
    
    //console.log(process.env);
    if (!(parseInt(process.env.CALL_DOXYGEN, 10))) {
        return res.json({success: false, error: 'doxygen disabled on this backend'});
    }

    var { fileContents, fileName } = req.body;
    console.log('parseRepositoryFile received content: ', req.body);
    if (typeof fileContents == 'undefined' || fileContents == null) return res.json({success: false, error: 'no repo fileContents provided'});
    if (typeof fileName == 'undefined' || fileName == null) return res.json({success: false, error: 'no repo fileName provided'});

    fileName = Date.now() + '_' + fileName;

    fsPath.writeFile('doxygen_input/' + fileName, fileContents, function (err) {
        if (err) return console.log(err);
        console.log('File written to: ', fileName);
        var dir = './doxygen_xml';

        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }

        parseUtils.parseCode(fileName, res);

    });

}


getRepositoryRefs = (req, res) => {
    
    //console.log(process.env);
    if (!(parseInt(process.env.CALL_DOXYGEN, 10))) {
        return res.json({success: false, error: 'doxygen disabled on this backend'});
    }

    var { repoLink } = req.body;
    console.log('getRepositoryRefs received content: ', req.body);
    if (typeof repoLink == 'undefined' || repoLink == null) return res.json({success: false, error: 'no repo repoLink provided'});

    var timestamp = Date.now().toString();
    // log.info('Timestamp: ', timestamp);
    var apiCallLink = url.resolve(repoBaseURL, repoLink);

    var getRefsData = {
        'repoLink': repoLink,
        'apiCallLink': apiCallLink,
    }
    var uuid = v4();
    var sqsRefsData = {
        MessageAttributes: {
          "repoLink": {
            DataType: "String",
            StringValue: getRefsData.repoLink
          },
          "apiCallLink": {
            DataType: "String",
            StringValue: getRefsData.apiCallLink
          }
        },
        MessageBody: JSON.stringify(getRefsData),
        MessageDeduplicationId: timestamp,
        MessageGroupId: "getRefRequest_" + timestamp,
        QueueUrl: queueUrl
    };
    if (process.env.RUN_AS_REMOTE_BACKEND) log.info(`Refs | MessageDeduplicationId: ${timestamp}`);
    if (process.env.RUN_AS_REMOTE_BACKEND)  log.info(`Refs | MessageGroupId: getRefRequest_${timestamp}`);
    // Send the refs data to the SQS queue
    let sendSqsMessage = sqs.sendMessage(sqsRefsData).promise();

    sendSqsMessage.then((data) => {

        if (process.env.RUN_AS_REMOTE_BACKEND) log.info(`Refs | SUCCESS: ${data.MessageId}`);
        console.log(`Refs | SUCCESS: ${data.MessageId}`);
        res.json({success: true, msg: "Job successfully sent to queue: ", queueUrl});
    }).catch((err) => {
        if (process.env.RUN_AS_REMOTE_BACKEND) log.error(`Refs | ERROR: ${err}`);
        console.log(`Refs | ERROR: ${err}`);

        // Send email to emails API
        res.json({success: false, msg: "We ran into an error. Please try again."});
    });
    // parseUtils.getRefs(repoLink, apiCallLink, res);
}


createRepository = (req, res) => {
    const {name, workspaceID, link, debugID, icon} = req.body;

    // if (!typeof workspaceID == 'undefined' && workspaceID !== null) return res.json({success: false, error: 'no repository workspace provided'});
    if (!typeof name == 'undefined' && name !== null) return res.json({success: false, error: 'no repository name provided'});

    let repository = new Repository({
        name,
        link,
        icon
        // workspaceID: ObjectId(workspaceID)
    });


    // Check if user-defined ids allowed
    if (process.env.DEBUG_CUSTOM_ID && process.env.DEBUG_CUSTOM_ID != 0) {
        if (debugID) repository._id = ObjectId(debugID);
    }

    if (workspaceID) repository.workspace = ObjectId(workspaceID)

    let linkItems = link.split('/')

    // looks like pytorch/fairseq
    let repositoryNameOwner = linkItems.slice(linkItems.length - 3, linkItems.length - 1).join('/')


    repository.save((err, repository) => {
        if (err) return res.json({ success: false, error: err });

        // Get all commits from default branch 
        api.get(`${apiURL}/repos/${repositoryNameOwner}/commits`).then((response) => {

            // Extract tree SHA from most recent commit
            let treeSHA = response.data[0].commit.tree.sha

            // Extract contents using tree SHA
            api.get(`${apiURL}/repos/${repositoryNameOwner}/git/trees/${treeSHA}?recursive=true`).then((response) => {
                let repositoryItems = response.data.tree.map(item => {
                    let pathSplit = item.path.split('/')
                    let name = pathSplit.slice(pathSplit.length - 1)[0]
                    let path = pathSplit.slice(0, pathSplit.length - 1).join('/')
                    let kind = item.type === 'blob' ? 'file' : 'dir'
                    return {name, path, kind, repository: ObjectId(repository._id)}
                })
                
                // Save repository contents as items in our database
                RepositoryItem.insertMany(repositoryItems, (errInsertItems, repositoryItems) => {
                    if (errInsertItems) return res.json({ success: false, error: errInsertItems });
                    repository.populate('workspace', (errPopulation, repository) => {
                        if (errPopulation) return res.json({ success: false, error: errPopulation });

                        // return the repository object
                        return res.json(repository);
                    });
                })
            })
        })
    });
}

getRepository = (req, res) => {
    // try{req.body = JSON.parse(Object.keys(req.body)[0])}catch(err){req.body = req.body}
    console.log(req.body);
    const { id } = req.params;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no repository id provided'});
    Repository.findById(id, (err, repository) => {
		if (err) return res.json({success: false, error: err});
        repository.populate('workspace', (err, repository) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(repository);
        });
    });
}


deleteRepository = (req, res) => {
    const { id } = req.params;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no repository id provided'});
    Repository.findByIdAndRemove(id, (err, repository) => {
		if (err) return res.json({success: false, error: err});
        repository.populate('workspace', (err, repository) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(repository);
        });
    });
}



retrieveRepositories = (req, res) => {
    const {name, workspaceID, link} = req.body;
    // (parentID, repositoryID, textQuery, tagIDs, snippetIDs)

    query = Repository.find();
    if (name) query.where('name').equals(name);
    if (workspaceID) query.where('workspace').equals(workspaceID);

    if (link) {
        if (link[link.length - 1] != '/') {
            link = link + '/'
        }
        query.where('link').equals('github.com/' + link);
    }

    query.populate('workspace').exec((err, repositories) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(repositories);
    });
}


updateRepositoryCommit = (req, res) => {
    //console.log(req.body);
    var { repo_id, repo_link } = req.body;
    if (!typeof repo_id == 'undefined' && repo_id !== null) return res.json({success: false, error: 'no repo repo_id provided'});
    if (!typeof repo_link == 'undefined' && repo_link !== null) return res.json({success: false, error: 'no repo repo_link provided'});

    repo_link = repo_link.substring(repo_link.indexOf('.com/')+ 5);

    var commit_url = url.resolve(apiURL, 'repos/');
    commit_url = url.resolve(commit_url, repo_link);
    commit_url = url.resolve(commit_url, 'commits');

    //console.log('FINAL REQ URL: ', commit_url);

    api.get(commit_url)
    .then(function (response) {
        //console.log('repoUpdateCommit response: ');
        //console.log(response.data);
        var latest_sha = response.data[0]['sha'];
        //console.log('latest_sha: ', latest_sha);
        
        Codebase.findById(repo_id, (err, codebase) => {
            // console.log('last_processed_commit.length: ', )
            if (codebase.last_processed_commit.length == 0) {
                let update = {};
                update.last_processed_commit = latest_sha;
                Codebase.findByIdAndUpdate(repo_id, { $set: update }, { new: true }, (err, updated_codebase) => {
                    if (err) return res.json({ success: false, error: err });
                    updated_codebase.populate('creator', (err, updated_codebase) => {
                        if (err) return res.json(err);
                        return res.json(updated_codebase);
                    });
                });
            }
            else {
                return res.json({ success: true, msg: 'Already found commit: ' +  codebase.last_processed_commit});
            }
        }).catch(function (err) {
            return res.json({ success: false, error: err});
        });
      })
      .catch(function (err) {
        return res.json({ success: false, error: err });
      });

}



module.exports = {
    refreshRepositoryPath, getRepositoryFile, parseRepositoryFile, refreshRepositoryPathNew, getRepositoryRefs,
    createRepository, getRepository, deleteRepository, retrieveRepositories, updateRepositoryCommit
}



///