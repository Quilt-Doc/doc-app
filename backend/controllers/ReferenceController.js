const Reference = require('../models/Reference');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

var request = require("request");


checkValid = (item) => {
    if (item !== null && item !== undefined) {
        return true
    }
    return false
}

// NEW CONTROLLER METHODS

createReferences = (req, res) => {
    const { references } = req.body;
    if (!checkValid(references)) return res.json({success: false, error: 'no references provided'});

    var i;
    for (i = 0; i < references.lengt; i++) {
        var currentRef = references[i];
        if (!checkValid(currentRef.name)) return res.json({success: false, error: 'no reference name provided'});
        if (!checkValid(currentRef.repository)) return res.json({success: false, error: 'no reference repository provided'});
    }

    Reference.insertMany(references, (error, references) => {
        if (error) return res.json({ success: false, error });
        references.populate('repository').populate('tags', (error, references) => {
            if (error) return res.json({ success: false, error: error });
            return res.json({success: true, result: references});
        });
    })
}

getReference = (req, res) => {
    // const { id } = req.params;
    // if (!checkValid(id)) return res.json({success: false, error: 'no reference id provided'});
    
    // NEW
    const referenceId = req.referenceObj._id.toString();
    const repositoryIds = req.workspaceObj.repositories.map(repositoryObj => ObjectId(repositoryObj.toString()));
    
    Reference.findOne({_id: referenceId, repository: {$in: repositoryIds}}, (err, reference) => {
		if (err) return res.json({success: false, error: err});
        reference.populate('repository').populate('tags', (err, reference) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: reference})
        });
    });
}

/*path\/example\/[^\/]+$*/

retrieveCodeReferences = async (req, res) => {
    // let {referenceId} = req.body

    // let rootReference = await Reference.findOne({_id: referenceId})
    const rootReference = req.referenceObj;
    var repositoryIds = req.workspaceObj.repositories.map(repositoryObj => repositoryObj.toString());
    if (repositoryIds.indexof(rootReference._id.toString()) == -1 ) {
        return res.json({success: false, error: "retrieveCodeReferences Error: request on repository user does not have access to."});
    }


    console.log(rootReference)
    let query = Reference.find({})


    query.where('path').equals(rootReference.path)
    query.where('kind').ne('file')
    query.where('repository').equals(rootReference.repository)

    query.populate('repository').populate('definitionReferences').exec((err, references) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({success: true, result: references});
    });
}

retrieveReferences = async (req, res) => {

    let { textQuery, search, paths, name, path, kind, kinds, notKinds, 
        referenceId, repositoryId, truncated, repositoryIds, include, limit, skip } = req.body;
    let filter = {}

    var validRepositoryIds = req.workspaceObj.repositories.map(repositoryObj => repositoryObj.toString());

    var singleRepositoryFilter = false;
    var multipleRepositoryFilter = false;
    
    if (checkValid(kind)) filter.kind = kind;
    if (checkValid(name)) filter.name = name;
    if (checkValid(path)) filter.path = path;
    if (checkValid(repositoryId)) {
        
        // DONE: check that this repositoryId is valid
        if (validRepositoryIds.indexOf(repositoryId.toString()) == -1) {
            return res.json({success: false, error: "retrieveReferences Error: request on repository user does not have access to."});
        }
        filter.repository = ObjectId(repositoryId);
    }

    let regexQuery;


    if (checkValid(referenceId)) {
        let reference;
        if (referenceId !== ""){
            reference = await Reference.findOne({_id: referenceId});
            // DONE: verify Reference repository field is valid for workspace
            if (validRepositoryIds.indexOf(reference.repository.toString()) == -1) {
                return res.json({success: false, error: "retrieveReferences Error: request on repository user does not have access to."});
            }
        } else {
            reference = await Reference.findOne({repository: repositoryId, path: ""})
            // DONE: verify repositoryId is valid for workspace
            if (validRepositoryIds.indexOf(reference.repository.toString()) == -1) {
                return res.json({success: false, error: "retrieveReferences Error: request on repository user does not have access to."});
            }
        }

        let regex;

        if (reference.path === "") {
            regex = new RegExp(`^([^\/]+)?$`, 'i');
        } else {
            let refPath = reference.path.replace('/', '\/')
            regex = new RegExp(`^${refPath}(\/[^\/]+)?$`, 'i');
        }

        regexQuery = [{ path : { $regex: regex } }]
    }

    if (checkValid(truncated)) {
        let regex = new RegExp(`^[^\/]+$`, 'i');
        regexQuery = [{ path : { $regex: regex } }]
    }

    if (checkValid(textQuery)) {
        let regex = new RegExp(textQuery, 'i');
        regexQuery = [{ name: { $regex: regex } }, { path : { $regex: regex } }]
    }


    let query;

    if (checkValid(regexQuery)) {
        if (filter.repository) {
            query =  Reference.find({
                            $and : [
                                { $or: regexQuery },
                                filter
                            ]
                        });
        }
        // DONE: add an $in operator on searchable repositories here, if filter does not contain repository
        else {
            query = Reference.find({
                            $and : [
                                { $or: regexQuery},
                                filter,
                                { repository: {$in: validRepositoryIds} }
                            ]
            })
        }
    } else {
        if (filter.repository) {
            query = Reference.find(filter);
        }
        // DONE: if repository field not set in filter add an $in operator from workspace repositories
        else {
            query = Reference.find({
                $and : [
                    filter,
                    { repository: {$in: validRepositoryIds} }
                ]
            });
        }
    }

    if (checkValid(kinds)) query.where('kind').in(kinds);
    if (checkValid(notKinds)) query.where('kind').nin(notKinds);
    // DONE: check that these repositoryIds are all in workspace repositories
    if (checkValid(repositoryIds)) {
        var i;
        for (i = 0; i < repositoryIds.length; i++) {
            if (validRepositoryIds.indexOf(repositoryIds[i].toString()) == -1) {
                return res.json({success: false, error: "retrieveReferences Error: request on repository user does not have access to."});
            }
        }
        multipleRepositoryFilter = true;
        query.where('repository').in(repositoryIds);
    }
    else {
        query.where('repository').in(validRepositoryIds);
    }
    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));

    // DONE?: If at this point repositoryIds AND repositoryId have not been set, add an query.where('repository').in(repositories in workspace);
    query.populate('tags').populate('definitionReferences').exec((err, references) => {
        if (err) return res.json({ success: false, error: err });
        // console.log("REFERENCES", references)
        return res.json({success: true, result: references});

    });
}


retrieveReferencesDropdown = (req, res) => {
    let {limit, referenceIds, repositoryId,  sort, search} = req.body;
    
    let query;

    if (checkValid(search)) {
        query = Reference.find({name: { $regex: new RegExp(search, 'i')} })
    } else {
        query =  Reference.find();
    }


    if (checkValid(referenceIds)) query.where('_id').in(referenceIds);
    if (checkValid(repositoryId)) query.where('repository').equals(repositoryId);

    if (checkValid(limit)) query.limit(limit);
    //if (checkValid(sort)) query.sort(sort);
    
    query.populate('repository').populate('tags').exec((err, references) => {
        if (err) return res.json({ success: false, error: err });
        if ((checkValid(limit)) && checkValid(referenceIds) && referenceIds.length < limit){
            let query2;
            if (checkValid(search)) {
                query2 = Reference.find({name: { $regex: new RegExp(search, 'i')} })
            } else {
                query2 =  Reference.find();
            }
            if (checkValid(repositoryId)) query2.where('repository').equals(repositoryId);
            query2.limit(limit - referenceIds.length)
            query2.where('_id').nin(referenceIds);
            query2.populate('repository').populate('tags').exec((err, references2) => {
                references = [...references, ...references2];
                return res.json(references)
            })
        } else {
            return res.json(references);
        }
    })
}


editReference = (req, res) => {

    const referenceId = req.referenceObj._id;
    var repositoryIds = req.workspaceObj.repositories.map(repositoryObj => repositoryObj.toString());

    if (repositoryIds.indexof(referenceId) == -1 ) {
        return res.json({success: false, error: "editReference Error: request on repository user does not have access to."});
    }


    const {  name, path, kind, tags } = req.body;
    let update = {};
    if (name) update.name = name;
    if (path) update.path = path;
    if (kind) update.kind = kind;
    if (tags) update.tags = tags.map(tag => ObjectId(tag));
    Reference.findByIdAndUpdate(referenceId, { $set: update }, { new: true }, (err, reference) => {
        if (err) return res.json({ success: false, error: err });
        reference.populate('repository').populate( 'tags', (err, reference) => {
            if (err) return res.json(err);
            console.log(reference)
            return res.json({success: true, result: reference});

        });
    });
}


deleteReference = (req, res) => {
    // const { id } = req.params;

    const referenceId = req.referenceObj._id;
    var repositoryIds = req.workspaceObj.repositories.map(repositoryObj => repositoryObj.toString());

    if (repositoryIds.indexof(referenceId) == -1 ) {
        return res.json({success: false, error: "deleteReference Error: request on repository user does not have access to."});
    }

    Reference.findByIdAndRemove(referenceId, (err, reference) => {
		if (err) return res.json({success: false, error: err});
        reference.populate('repository').populate('tags', (err, reference) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: reference});
        });
    });
}


attachTag = (req, res) => {
	// const { id } = req.params
	// const { tagId } = req.body;
	// if (!checkValid(id)) return res.json({success: false, error: "attachTag error: no id provided.", result: null});
    // if (!checkValid(tagId)) return res.json({success: false, error: "attachTag error: no tagIds provided.", result: null});
    
    const referenceId = req.referenceObj._id.toString();
    const tagId = req.tagObj._id.toString();

	let update = {}
	update.tags = ObjectId(tagId);
	
	Reference.findOneAndUpdate({_id: referenceId}, { $push: update}, { new: true }, (err, reference) => {
		if (err) return res.json({ success: false, error: err });
		reference.populate('repository').populate('tags', (err, reference) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: reference});
        });
	})
}


removeTag = (req, res) => {
    /*
    const { id } = req.params
	const { tagId } = req.body;
	if (!checkValid(id)) return res.json({success: false, error: "removeTag error: no id provided.", result: null});
	if (!checkValid(tagId)) return res.json({success: false, error: "removeTag error: no tagIds provided.", result: null});
    */

    const referenceId = req.referenceObj._id.toString();
    const tagId = req.tagObj._id.toString();


    let update = {}
	update.tags = ObjectId(tagId);
	
	Reference.findOneAndUpdate({_id: referenceId}, { $pull: update}, { new: true }, (err, reference) => {
		if (err) return res.json({ success: false, error: err });
		reference.populate('repository').populate('tags', (err, reference) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: reference});
        });
	})
}


module.exports =
{

    createReferences,
    getReference,
    retrieveReferences,
    retrieveCodeReferences,
    editReference,
    deleteReference,
    attachTag, 
    removeTag,
    retrieveReferencesDropdown
    /*
    attachDocument,
    removeDocument*/
}