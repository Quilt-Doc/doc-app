
const Workspace = require('../models/Workspace');
const Repository = require('../models/Repository');
const Reference = require('../models/Reference');
const Document = require('../models/Document');
const Tag = require('../models/Tag');

const UserStatsController = require('./reporting/UserStatsController');

const createDocument = require('../controllers/DocumentController').createDocument;

var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const quickScore = require("quick-score").quickScore;

const PAGE_SIZE = 10;

const jobs = require('../apis/jobs');
const jobConstants = require('../constants/index').jobs;

const logger = require('../logging/index').logger;


checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}

escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


createWorkspace = async (req, res) => {
    const {name, creatorId, installationId, repositoryIds } = req.body;

    if (!checkValid(name)) return res.json({success: false, error: 'no workspace name provided'});
    if (!checkValid(installationId)) return res.json({success: false, error: 'no workspace installationId provided'});
    if (!checkValid(creatorId)) return res.json({success: false, error: 'no workspace creatorId provided'});

    let workspace = new Workspace({
        name: name,
        creator: ObjectId(creatorId),
        memberUsers: [ObjectId(creatorId)],
        setupComplete: false,
        repositories: repositoryIds.map(repoId => ObjectId(repoId))
    });

    // save workspace
    try {
        workspace = await workspace.save();
    } catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `error saving workspace - creator, repositories: ${creatorId}, ${JSON.stringify(repositories)}`,
                            function: 'createWorkspace'});
        return res.json({success: false, error: "createWorkspace error: save() on new workspace failed", trace: err});
    }

    // Create UserStats object for creator
    try {
        await UserStatsController.createUserStats({userId: creatorId, workspaceId: workspace._id.toString()});
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `error creating UserStats object creatorId, workspaceId: ${creatorId} ${workspace._id.toString()}`,
                            function: 'createWorkspace'});
        return res.json({success: false, error: `error creating UserStats object creatorId, workspaceId: ${creatorId} ${workspace._id.toString()}`, trace: err});
    }

    // Set all workspace Repositories 'currentlyScanning' to true
    var workspaceRepositories;
    try {
        workspaceRepositories = await Repository.updateMany({_id: { $in: repositoryIds}, scanned: false}, {$set: { currentlyScanning: true }});
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `error updating workspace repositories to 'currentlyScanning: true' repositoryIds: ${JSON.stringify(repositoryIds)}`,
                                function: 'createWorkspace'});
        return res.json({success: false, error: "createWorkspace error: Could not update workspace repositories", trace: err});
    }

    // Kick off Scan Repositories Job
    var scanRepositoriesData = {};
    scanRepositoriesData['installationId'] = installationId;
    scanRepositoriesData['repositoryIdList'] = repositoryIds;
    scanRepositoriesData['workspaceId'] = workspace._id.toString();
    scanRepositoriesData['jobType'] = jobConstants.JOB_SCAN_REPOSITORIES.toString();

    try {
        await jobs.dispatchScanRepositoriesJob(scanRepositoriesData);
    }

    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                                errorDescription: `error dispatching scanRepositoriesJob installationId, repositoryIds: ${installationId}, ${JSON.stringify(repositoryIds)}`,
                                function: 'createWorkspace'});
        return res.json({success: false, error: "createWorkspace error: Could not kick off scan repository job", trace: err});
    }


    // Returning workspace
    // populate workspace
    try {
        workspace = await Workspace.populate(workspace, {path: 'creator repositories memberUsers'});
    } catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `error populating workspace - creator, repositories: ${creatorId}, ${JSON.stringify(repositories)}`,
                            function: 'createWorkspace'});
        return res.json({success: false, error: "createWorkspace error: workspace population failed", trace: err});
    }

    //await logger.info({source: 'backend-api', });

    return res.json({success: true, result: workspace});
}

getWorkspace = async (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();

    let returnedWorkspace;
    try {
        returnedWorkspace =  await Workspace.findById(workspaceId)
            .populate({path: 'creator repositories memberUsers'}).lean().exec();
    } catch (err) {
        return res.json({success: false, error: "getWorkspace error: workspace findById query failed", trace: err});
    }

    return res.json({success: true, result: returnedWorkspace});
}


deleteWorkspace = async (req, res) => {

    const workspaceId = req.workspaceObj._id.toString();

    let deletedWorkspace;
    
    try {
        deletedWorkspace = await Workspace.findByIdAndRemove(workspaceId).select('_id').lean().exec();
    } catch (err) {
        return res.json({success: false, error: "deleteWorkspace error: workspace findByIdAndRemove query failed", trace: err});
    }

    return res.json({success: true, result: deletedWorkspace});
}


// Put request
// Population only on returns
addWorkspaceUser = async (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();
    const { userId } = req.params;

    if (checkValid(userId)) return res.json({success: false, error: 'no user id provided'});

    let returnedWorkspace;

    try {
        returnedWorkspace = await Workspace.findByIdAndUpdate(workspaceId, 
            { $push: {memberUsers: userId} }, { new: true }).select('_id memberUsers').populate({path: 'user'}).lean.exec();
    } catch (err) {
        return res.json({success: false, error: "addUser error: workspace findByIdAndUpdate query failed", trace: err});
    }

    // Create UserStats object for creator
    try {
        await UserStatsController.createUserStats({userId, workspaceId});
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `error creating UserStats object userId, workspaceId: ${userId} ${workspaceId}`,
                            function: 'addWorkspaceUser'});
        return res.json({success: false, error: `error creating UserStats object userId, workspaceId: ${userId} ${workspaceId}`, trace: err});
    }

    return res.json({success: true, result: returnedWorkspace});
}

removeWorkspaceUser = async (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();
    const { userId } = req.params;

    if (checkValid(userId)) return res.json({success: false, error: 'no user id provided'});

    let returnedWorkspace;

    try {
        returnedWorkspace = await Workspace.findByIdAndUpdate(workspaceId, 
            { $pull: {memberUsers: userId} }, { new: true }).select('_id memberUsers').populate({path: 'user'}).lean.exec();
    } catch (err) {
        return res.json({success: false, error: "addUser error: workspace findByIdAndUpdate query failed", trace: err});
    }   

    return res.json({success: true, result: returnedWorkspace});
}

// Check that the JWT userId is in the memberUsers for all workspaces returned
retrieveWorkspaces = async (req, res) => {

    const {name, creatorId, memberUserIds} = req.body;
    const requesterUserId = req.tokenPayload.userId;

    query = Workspace.find();

    if (name) query.where('name').equals(name);
    if (creatorId) query.where('creator').equals(creatorId);
    if (memberUserIds) query.where('memberUsers').in(memberUserIds);

    let returnedWorkspaces;

    try {
        returnedWorkspaces = await query.populate({path: 'creator memberUsers repositories'}).lean().exec();
    } catch (err) {
        return res.json({success: false, error: "retrieveWorkspaces error: workspace find query failed", trace: err});
    }

    returnedWorkspaces = returnedWorkspaces.filter(currentWorkspace => {
        var currentMemberUsers = currentWorkspace.memberUsers.map(userObj => userObj._id.toString());
        // Only return if requesterUserId is in the memberUsers of the workspace
        return (currentMemberUsers.includes(requesterUserId));
    });

    return res.json({success: true, result: returnedWorkspaces});
}


//FARAZ TODO: Selectively pull content
//FARAZ TODO: Need to place searchFunctions in correct controller and import
//FARAZ TODO: Need to figure out import (or maybe not?)
searchDocuments = async (req, res, searchWorkspace) => {
    const { userQuery, repositoryId, tagIds, returnDocuments, minimalDocuments, includeImage, searchContent,
        referenceIds, creatorIds, docSkip, limit, sort } = req.body;
    
    //console.log("PARAMS", req.body);
    const workspaceId = req.workspaceObj._id.toString();

    if (!returnDocuments) {
        let response = {success: true, result: []};

        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }

    let documentAggregate;
    
    if (checkValid(userQuery) && userQuery !== "") {
        // make search for title
        let shouldFilter = [ 
            {
            "autocomplete": {
                    "query": userQuery,
                    "path": "title"
                }
            }];

        // make search for textual content
        if (checkValid(searchContent) && searchContent) shouldFilter.push({
                "text": {
                    "query": userQuery,
                    "path": "content"
                }
            });
        
        documentAggregate = Document.aggregate([
            { 
                $search: {
                    "compound": {
                        "should": shouldFilter,
                        "minimumShouldMatch": 1
                    } 
                }  
            },
        ]);
    } else {
        documentAggregate = Document.aggregate([]);
    }

    documentAggregate.addFields({isDocument: true,  score: { $meta: "searchScore" }});
    
    documentAggregate.match({workspace: ObjectId(workspaceId)});
    
    if (checkValid(repositoryId)) documentAggregate.match({repository: ObjectId(repositoryId)});

    if (checkValid(tagIds)) documentAggregate.match({
        tags: { $in: tagIds.map((tagId) => ObjectId(tagId)) }
    });

    if (checkValid(referenceIds)) documentAggregate.match({
        references: { $in: referenceIds.map((refId) => ObjectId(refId)) }
    });

    if (checkValid(creatorIds)) documentAggregate.match({
        author: { $in: creatorIds.map((creatorId) =>  ObjectId(creatorId)) }
    });
    
    if (checkValid(sort)) documentAggregate.sort(sort);

    if (checkValid(docSkip))  documentAggregate.skip(docSkip);
    
    if (checkValid(limit))  documentAggregate.limit(limit);

    
    let minimalProjectionString = "_id created author title status isDocument";
    let populationString = "author references workspace repository tags";
    
    if (checkValid(minimalDocuments) && minimalDocuments) {
        if (checkValid(includeImage)) minimalProjectionString += " image";
        documentAggregate.project(minimalProjectionString);
        populationString = "author";
    }
    
    try {   
        documents = await documentAggregate.exec();
    } catch(err) {
        let response = { success: false, error: "searchDocuments: Failed to aggregate documents", trace: err};
        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }
   
    try {
        documents = await Document.populate(documents, 
            {
                path: populationString
            }
        );
    } catch (err) {
        let response = { success: false, error: "searchDocuments: Failed to populate documents", trace: err};
        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }

    let response = {success: true, result: documents};

    if (searchWorkspace) {
        return response;
    } else {
        return res.json(response);
    }
}

searchReferences = async (req, res, searchWorkspace) => {
    const { userQuery, repositoryId, tagIds, referenceIds,
        returnReferences, minimalReferences, refSkip, limit, sort } = req.body;

    if (!returnReferences) {
        let response = {success: true, result: []};
        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }

    let referenceAggregate;
    
    if (checkValid(userQuery) && userQuery !== "") {
        referenceAggregate = Reference.aggregate([
            { 
                $search: {
                    "autocomplete": {
                            "query": userQuery,
                            "path": "name"
                    }
                } 
            }
        ]);
    } else {
        referenceAggregate = Reference.aggregate([]);
    }
    
    referenceAggregate.addFields({isReference : true, score: { $meta: "searchScore" }});
    
    referenceAggregate.match({repository: ObjectId(repositoryId)});

    if (checkValid(tagIds)) referenceAggregate.match({
        tags: { $in: tagIds.map((tagId) => ObjectId(tagId)) }
    });

    if (checkValid(referenceIds)) referenceAggregate.match({
        _id: { $in: referenceIds.map((refId) => ObjectId(refId)) }
    });
    
    if (checkValid(sort)) referenceAggregate.sort(sort);

    if (checkValid(refSkip))  referenceAggregate.skip(refSkip);

    if (checkValid(limit))  referenceAggregate.limit(limit);
    
    if (checkValid(minimalReferences) && minimalReferences) referenceAggregate.project("name kind repository path _id created status isReference");

    let populationString = minimalReferences ? "repository tags" : "repository";

    try {
        references = await referenceAggregate.exec()
    } catch (err) {
        let response = { success: false, error: "searchReferences: Failed to aggregate references", trace: err};
        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }


    try {
        references = await Reference.populate(references, 
            {
                path: populationString
            }
        )
    } catch (err) {
        let response = { success: false, error: "searchReferences: Failed to populate references", trace: err};
        if (searchWorkspace) {
            return response;
        } else {
            return res.json(response);
        }
    }

    // Need to include time filtering
    let response = {success: true, result: references};

    if (searchWorkspace) {
        return response;
    } else {
        return res.json(response);
    }
}

//TODO: Search workspace return values needs to be reflected in reducer
searchWorkspace = async (req, res) => {
    const { userQuery, returnReferences, returnDocuments, limit, sort } = req.body;
    if (!checkValid(userQuery)) return res.json({success: false, result: null, error: 'userQuery: error no userQuery provided.'});
    if (!checkValid(returnReferences)) return res.json({success: false, result: null, error: 'returnReference: error no returnReferences provided.'});
    if (!checkValid(returnDocuments)) return res.json({success: false, result: null, error: 'returnDocuments: error no returnDocuments provided.'});

   
    let documentResponse = await searchDocuments(req, res, true);
  
    if (!documentResponse.success) {
        let {trace, error} = documentResponse;
        return res.json({success: false, error: `searchWorkspace: ${error}`, trace})
    }

    let documents  = documentResponse.result;
    //console.log("DOCS OUTPUT", documents.map(doc => doc.title));

    let referenceResponse = await searchReferences(req, res, true);

    if (!referenceResponse.success) {
        let {trace, error} = referenceResponse;
        return res.json({success: false, error: `searchWorkspace: ${error}`, trace})
    }

    let references = referenceResponse.result;


    let newDocSkip = 0;
    let newRefSkip = 0;

    let finalResult = {}
    // NEED TO INCLUDE PROPER SORTING ON MIX
    searchResults = [...documents, ...references];
    //console.log(searchResults);
    if (sort) {
        searchResults.sort((a, b) => {
            if (a.created.getTime() > b.created.getTime()) {
                return -1
            } else {
                return 1
            }
        })
    }
        
    searchResults = searchResults.slice(0, limit);

    searchResults.map((seResult) => {
        if (seResult.isDocument) {
            newDocSkip += 1;
        } else if (seResult.isReference) {
            newRefSkip += 1;
        }
    })

    finalResult = { searchResults, docSkip: newDocSkip, refSkip: newRefSkip };
    return res.json({success: true, result: finalResult});
}

module.exports = {createWorkspace, searchWorkspace, getWorkspace, 
    deleteWorkspace, addWorkspaceUser, removeWorkspaceUser, retrieveWorkspaces}
