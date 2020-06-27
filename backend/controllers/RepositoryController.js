const url = require('url');

var request = require("request");

const apis = require('../apis/api');
const parseUtils = require('../utils/parse_code');

const api = apis.requestClient();
const sqs = apis.requestSQSServiceObject();
const queueUrl = "https://sqs.us-east-1.amazonaws.com/695620441159/dataUpdate.fifo";

const apiURL = 'https://api.github.com';
const localURL = 'https://localhost:3001/api'
const githubBaseURL = 'https://github.com/'

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



// Needs to use installation token
createRepository = async (req, res) => {
    const {fullName, installationId, htmlURL, cloneURL, debugID, icon} = req.body;

    if (!typeof fullName == 'undefined' && fullName !== null) return res.json({success: false, error: 'no repository fullName provided'});
    if (!typeof installationId == 'undefined' && installationId !== null) return res.json({success: false, error: 'no repository installationId provided'});


    let repository = new Repository({
        fullName,
        installationId,
        icon
    });

    if (htmlURL) repository.htmlURL = htmlURL;
    if (cloneURL) repository.cloneURL = cloneURL;


    // Check if user-defined ids allowed
    if (process.env.DEBUG_CUSTOM_ID && process.env.DEBUG_CUSTOM_ID != 0) {
        if (debugID) repository._id = ObjectId(debugID);
    }

    repository.save((err, repository) => {
        if (err) return res.json({ success: false, error: err });

        var installationClient = await apis.requestInstallationClient(installationId);

        // Get all commits from default branch
        installationClient.get(`/repos/${fullName}/commits`).then((response) => {

            // Extract tree SHA from most recent commit
            let treeSHA = response.data[0].commit.tree.sha

            // Extract contents using tree SHA
            installationClient.get(`/repos/${repositoryNameOwner}/git/trees/${treeSHA}?recursive=true`).then((response) => {
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
                    return res.json(repository);
                })
            })
        })
    });
}

// Deprecated
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

// Deprecated
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


// Needs to use API call with correct media type, not `githubusercontent`
getRepositoryFile = (req, res) => {
    var { downloadLink} = req.body;
    if (typeof downloadLink == 'undefined' || downloadLink == null) return res.json({success: false, error: 'no repo downloadLink provided'});
    // if (typeof repositoryName == 'undefined' || repositoryName == null) return res.json({success: false, error: 'no repo repositoryName provided'});
    
    console.log('downloadLink: ', downloadLink);
    request.get(downloadLink).pipe(res);
}


getRepositoryRefs = (req, res) => {
    
    //console.log(process.env);
    if (!(parseInt(process.env.CALL_DOXYGEN, 10))) {
        return res.json({success: false, error: 'doxygen disabled on this backend'});
    }

    var { fullName, installationId } = req.body;
    console.log('getRepositoryRefs received content: ', req.body);
    if (typeof fullName == 'undefined' || fullName == null) return res.json({success: false, error: 'no repo fullName provided'});
    if (typeof installationId == 'undefined' || installationId == null) return res.json({success: false, error: 'no repo installationId provided'});

    var timestamp = Date.now().toString();

    var getRefsData = {
        'fullName': fullName,
        'installationId': installationId,
    }
    var uuid = v4();
    var sqsRefsData = {
        MessageAttributes: {
          "fullName": {
            DataType: "String",
            StringValue: getRefsData.fullName
          },
          "installationId": {
            DataType: "String",
            StringValue: getRefsData.installationId
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

getRepository = (req, res) => {
    // try{req.body = JSON.parse(Object.keys(req.body)[0])}catch(err){req.body = req.body}
    console.log(req.body);
    const { id } = req.params;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no repository id provided'});
    Repository.findById(id, (err, repository) => {
		if (err) return res.json({success: false, error: err});
        return res.json(repository);
    });
}


deleteRepository = (req, res) => {
    const { id } = req.params;

    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no repository id provided'});
    Repository.findByIdAndRemove(id, (err, repository) => {
		if (err) return res.json({success: false, error: err});
        return res.json(repository);
    });
}



retrieveRepositories = (req, res) => {
    const {fullName, installationId} = req.body;
    // (parentID, repositoryID, textQuery, tagIDs, snippetIDs)

    query = Repository.find();
    if (fullName) query.where('fullName').equals(fullName);
    if (installationId) query.where('installationId').equals(installationId);

    query.exec((err, repositories) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(repositories);
    });
}

// Needs to use installation token
updateRepositoryCommit = (req, res) => {
    //console.log(req.body);
    var {installationId, fullName } = req.body;
    if (!typeof installationId == 'undefined' && installationId !== null) return res.json({success: false, error: 'no repo installationId provided'});
    if (!typeof fullName == 'undefined' && fullName !== null) return res.json({success: false, error: 'no repo fullName provided'});

    // fullName = repoLink.substring(repoLink.indexOf('.com/')+ 5);

    var query = { fullName: fullName, installationId: installationId };

    //console.log('FINAL REQ URL: ', commitUrl);
    var installationClient = await apis.requestInstallationClient(installationId);

    installationClient.get('repos/' + fullName + '/commits')
    .then(function (response) {
        //console.log('repoUpdateCommit response: ');
        //console.log(response.data);
        var latestSha = response.data[0]['sha'];
        //console.log('latestSha: ', latestSha);

        let update = {};
        update.lastProcessedCommit = latestSha;
        Repository.findOneAndUpdate(query, { $set: update }, { new: true }, (err, updatedRepository) => {
            if (err) return res.json({ success: false, error: err });
            updatedRepository.populate('creator', (err, updatedRepository) => {
                if (err) return res.json(err);
                return res.json(updatedRepository);
            });
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