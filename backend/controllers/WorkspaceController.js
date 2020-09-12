
const Workspace = require('../models/Workspace');
const Reference = require('../models/Reference');
const Document = require('../models/Document');
const Tag = require('../models/Tag');
const Linkage = require('../models/Linkage')

var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const quickScore = require("quick-score").quickScore;

const PAGE_SIZE = 10;

checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}

escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


createWorkspace = (req, res) => {
    const {name, creatorId, debugId, repositoryIds, icon, key} = req.body;

    if (!typeof name == 'undefined' && name !== null) return res.json({success: false, error: 'no workspace name provided'});
    if (!typeof creatorId == 'undefined' && creatorId !== null) return res.json({success: false, error: 'no workspace creator Id provided'});

    let workspace = new Workspace({
        name: name,
        creator: ObjectId(creatorId),
        memberUsers: [ObjectId(creatorId)],
        key
    });

    if (icon >= 0) workspace.icon = icon;
    if (repositoryIds) workspace.repositories = repositoryIds.map(id => ObjectId(id))
    
    // Check if user-defined ids allowed
    if (process.env.DEBUG_CUSTOM_Id && process.env.DEBUG_CUSTOM_Id != 0) {
        if (debugId) workspace._id = ObjectId(debugId);
    }

    workspace.save((err, workspace) => {
        if (err) return res.json({ success: false, error: err });

        workspace.populate('creator').populate('repositories').populate('memberUsers', (err, workspace) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: workspace});
        });
    });
}

getWorkspace = (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();

    Workspace.findById(workspaceId, (err, workspace) => {
		if (err) return res.json({success: false, error: err});
        workspace.populate('creator').populate('repositories')
                .populate('memberUsers', (err, workspace) => {
                if (err) return res.json({ success: false, error: err });
                return res.json({success: true, result: workspace});
            });
    });
}

searchWorkspace = async (req, res) => {
    const { userQuery, repositoryId, tagIds, referenceIds, creatorIds, returnLinkages, includeImage,
        returnReferences, returnDocuments, docSkip, refSkip, linkageSkip, limit, sort, mix } = req.body;
    
    const workspaceId = req.workspaceObj._id.toString();

    if (!checkValid(workspaceId)) return res.json({success: false, result: null, error: 'searchWorkspace: error no workspaceId provided.'});
    if (!checkValid(userQuery)) return res.json({success: false, result: null, error: 'searchWorkspace: error no userQuery provided.'});
    if (!checkValid(returnReferences)) return res.json({success: false, result: null, error: 'searchWorkspace: error no returnReferences provided.'});
    if (!checkValid(returnDocuments)) return res.json({success: false, result: null, error: 'searchWorkspace: error no returnDocuments provided.'});
    if (!checkValid(returnLinkages)) return res.json({success: false, result: null, error: 'searchWorkspace: error no returnLinkages provided.'});

    let documents = [];
    let references = [];
    let linkages = [];

    if (returnDocuments) {
        let documentAggregate;
        
        if (checkValid(userQuery) && userQuery !== "") {
            documentAggregate = Document.aggregate([
                { 
                    $search: {
                        "compound": {
                            "should": [ 
                                {
                                "autocomplete": {
                                        "query": userQuery,
                                        "path": "title"
                                    }
                                },
                                {
                                    "text": {
                                        "query": userQuery,
                                        "path": "content"
                                    }
                                }
                            ],
                            "minimumShouldMatch": 1
                        } 
                    }  
                },
            ]);
        } else {
            documentAggregate = Document.aggregate([]);
        }

        documentAggregate.addFields({isDocument: true,  score: { $meta: "searchScore" }});

        if (checkValid(repositoryId)) documentAggregate.match({repository: new mongoose.Types.ObjectId(repositoryId)});

        if (checkValid(workspaceId)) documentAggregate.match({workspace: new mongoose.Types.ObjectId(workspaceId)});

        if (checkValid(tagIds)) documentAggregate.match({
            tags: { $in: tagIds.map((tagId) => new mongoose.Types.ObjectId(tagId)) }
        });

        if (checkValid(referenceIds)) documentAggregate.match({
            references: { $in: referenceIds.map((refId) => new mongoose.Types.ObjectId(refId)) }
        });

        if (checkValid(creatorIds)) documentAggregate.match({
            author: { $in: creatorIds.map((creatorId) =>  new mongoose.Types.ObjectId(creatorId)) }
        });
        
        if (checkValid(sort)) documentAggregate.sort(sort);

        if (checkValid(docSkip))  documentAggregate.skip(docSkip);

        if (checkValid(limit))  documentAggregate.limit(limit);

        documents = await documentAggregate.exec();

        documents = await Document.populate(documents, 
            {
                path: "author references workspace repository tags"
            }
        );
        // Need to include time filtering
    }

    
    if (returnReferences) {
        
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
        
        if (checkValid(repositoryId)) referenceAggregate.match({repository: new mongoose.Types.ObjectId(repositoryId)});
        

        if (checkValid(tagIds)) referenceAggregate.match({
            tags: { $in: tagIds.map((tagId) => new mongoose.Types.ObjectId(tagId)) }
        });

        if (checkValid(referenceIds)) referenceAggregate.match({
            _id: { $in: referenceIds.map((refId) => new mongoose.Types.ObjectId(refId)) }
        });
        
        if (checkValid(sort)) referenceAggregate.sort(sort);


        if (checkValid(refSkip))  referenceAggregate.skip(refSkip);

        if (checkValid(limit))  referenceAggregate.limit(limit)
        
        references = await referenceAggregate.exec()

        references = await Reference.populate(references, 
                {
                    path: "repository tags"
                }
            )
        // Need to include time filtering
    }
    /*
    if (returnLinkages) {

        let linkageAggregate = Linkage.aggregate([
                { 
                    $search: {
                        "autocomplete": {
                                "query": userQuery,
                                "path": "title"
                        }
                    } 
                }
            ])
        
        if (checkValid(repositoryId)) linkageAggregate.match({repositoryId});
        if (checkValid(workspaceId)) linkageAggregate.match({workspaceId});

        if (checkValid(tagIds)) linkageAggregate.match({
            tags: { $in: tagIds }
        });
        if (checkValid(referenceIds)) linkageAggregate.match({
            references: { $in: referenceIds }
        });
        if (checkValid(creators)) linkageAggregate.match({
            creator: { $in: creators }
        });

        linkageAggregate.skip(linkageSkip).sort(sort).limit(limit)

        linkages = await linkageAggregate.exec()
        // Need to include time filtering
    }
    */

    if (checkValid(userQuery)) {

        references.map((ref) => 
            console.log(`REFERENCE SCORE , ${quickScore(ref.name, userQuery)},  REFERENCE NAME, ${ref.name}, 
            REFERENCE SCORE2, ${ref.score}`));

        documents.map((doc) => {
            console.log(`DOCUMENT SCORE, ${
                quickScore(doc.title, userQuery)},
                REF SCORE2, ${doc.score},
                DOCUMENT NAME", ${doc.title}`)
        })
    }
   
    
    let searchResults = {}

    let newDocSkip = 0;
    let newRefSkip = 0;
    let newLinkageSkip = 0;

    let finalResult = {}
    // NEED TO INCLUDE PROPER SORTING ON MIX
    if (mix) {
        searchResults = [...documents, ...linkages, ...references];
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
            } else if (seResult.isLinkage) {
                newLinkageSkip += 1;
            }
        })

        finalResult = {searchResults, docSkip: newDocSkip, refSkip: newRefSkip, linkageSkip: newLinkageSkip};
    } else {
        searchResults.documents = documents;
        //searchResults.linkages = linkages;
        searchResults.references = references;
        finalResult = searchResults;
    }

    
    return res.json({success: true, result: finalResult});
}

deleteWorkspace = (req, res) => {
    
    const workspaceId = req.workspaceObj._id.toString();

    Workspace.findByIdAndRemove(workspaceId, (err, workspace) => {
		if (err) return res.json({success: false, error: err});
        workspace.populate('creator').populate('repositories')
            .populate('memberUsers', (err, workspace) => {
            if (err) return res.json({ success: false, error: err });
                return res.json({success: true, result: workspace});
            });
    });
}


// Put request
// Population only on returns
addUser = (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();
    const { userId } = req.body;

    if (!typeof userId == 'undefined' && userId !== null) return res.json({success: false, error: 'no user id provided'});

    let update = {};
    if (userId) update.memberUsers = ObjectId(userId);

    Workspace.findByIdAndUpdate(workspaceId, { $push: update }, { new: true }, (err, workspace) => {
        if (err) return res.json({ success: false, error: err });
        workspace.populate('creator').populate('repositories')
                .populate('memberUsers', (err, workspace) => {
                if (err) return res.json({ success: false, error: err });
                return res.json({success: true, result: workspace});
        });
    });
}

removeUser = (req, res) => {
    const workspaceId = req.workspaceObj._id.toString();
    const { userId } = req.body;
    
    if (!typeof userId == 'undefined' && userId !== null) return res.json({success: false, error: 'no user id provided'});

    let update = {};
    if (userId) update.memberUsers = ObjectId(userId);

    Workspace.findByIdAndUpdate(workspaceId, { $pull: update }, { new: true }, (err, workspace) => {
        if (err) return res.json({ success: false, error: err });
        workspace.populate('creator').populate('repositories')
                .populate('memberUsers', (err, workspace) => {
                if (err) return res.json({ success: false, error: err });
                return res.json({success: true, result: workspace});
            });
    });
}

// Check that the JWT userId is in the memberUsers for all workspaces returned
retrieveWorkspaces = (req, res) => {
    
    const {name, creatorId, memberUserIds} = req.body;
    query = Workspace.find();
    if (name) query.where('name').equals(name);
    if (creatorId) query.where('creator').equals(creatorId);
    if (memberUserIds) query.where('memberUsers').in(memberUserIds)

    query.populate('creator').populate('memberUsers').populate('repositories').exec((err, workspaces) => {
        if (err) return res.json({ success: false, error: err });
        
        var requesterUserId = req.tokenPayload.userId.toString();
        
        console.log('Workspaces before filter: ');
        console.log(workspaces);

        workspaces = workspaces.filter(currentWorkspace => {
            var currentMemberUsers = currentWorkspace.memberUsers.map(userObj => userObj._id.toString());
            // Only return if requesterUserId is in the memberUsers of the workspace
            return (currentMemberUsers.includes(requesterUserId) != -1);
        });

        console.log('Workspaces after filter: ');
        console.log(workspaces);

        return res.json({success: true, result: workspaces});
    });
}

module.exports = {createWorkspace, searchWorkspace, getWorkspace, deleteWorkspace, addUser, removeUser, retrieveWorkspaces}
