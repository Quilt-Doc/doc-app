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

//Deprecated
createReferences = (req, res) => {
    const { ref_list } = req.body;
    if (!typeof ref_list == 'undefined' && ref_list !== null) return res.json({success: false, error: 'no reference ref_list provided'});
    console.log('ref_list');
    console.log(ref_list);
    var ref_obj_list = ref_list.map(ref => {
        var {name, kind, path, lineNum, repository} = ref;
        if (!typeof name == 'undefined' && name !== null) return res.json({success: false, error: 'no reference name provided'});
        if (!typeof repository == 'undefined' && repository !== null) return res.json({success: false, error: 'no reference repository provided'});

        let reference = new Reference({
            name: name,
            repository: ObjectId(repository)

        });

        if (lineNum) reference.lineNum = lineNum;
        if (kind) reference.kind = kind;
        if (path) reference.path = path;

        return reference;
    })

    console.log('REF OBJ LIST');
    console.log(ref_obj_list);
    Reference.create( ref_obj_list, (err, reference) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(reference);
    });
}

getReferences = (req, res) => {

    const { text, repository } = req.body;
    var text_query = text;


    if (!typeof repository == 'undefined' && repository !== null) return res.json({success: false, error: 'no reference repository provided'});
    if (!(text)) {
        text_query = '';
    }

    console.log('repository: ', repository);
    console.log('text: ', text);

    var re = new RegExp(text, 'i');

    Reference.find(
        {
            $and : [
                { $or: [{ name: { $regex: re } }, { kind: { $regex: re } }, { path: { $regex: re } }] },
                { repository: repository }
            ]
        }
        ).sort('kind').exec(function(err, references) {
        console.log('results: ')
        console.log(references);
        res.json(references);
    });
}

// NEW CONTROLLER METHODS

createReferences2 = (req, res) => {
    const { references } = req.body;
    if (!typeof references == 'undefined' && references !== null) return res.json({success: false, error: 'no references provided'});
    Reference.insertMany(references, (error, references) => {
        if (error) return res.json({ success: false, error });
        references.populate('repository').populate('tags', (error, references) => {
            if (error) return res.json({ success: false, error: error });
            return res.json(references);
        });
    })
}

getReference = (req, res) => {
    const { id } = req.params;
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no reference id provided'});
    Reference.findById(id, (err, reference) => {
		if (err) return res.json({success: false, error: err});
        reference.populate('repository').populate('tags', (err, reference) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(reference)
        });
    });
}

getContents = async (req, res) => {

    var { referenceId } = req.body;
    let reference = await Reference.findOne({_id: referenceId}).populate('repository')
    let defaultBranch = "master"

    let downloadLink = `https://raw.githubusercontent.com/${reference.repository.fullName}/${defaultBranch}/${reference.path}`
    //https://raw.githubusercontent.com/kgodara/snippet-logic-test/master/post_commit.py

    
    //console.log('downloadLink: ', downloadLink);
    request.get(downloadLink).pipe(res);
}

/*path\/example\/[^\/]+$*/

retrieveCodeReferences = async (req, res) => {
    let {referenceId} = req.body

    let rootReference = await Reference.findOne({_id: referenceId})
    console.log(rootReference)
    let query = Reference.find({})


    query.where('path').equals(rootReference.path)
    query.where('kind').ne('file')
    query.where('repository').equals(rootReference.repository)

    query.populate('repository').populate('definitionReferences').exec((err, references) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(references);
    });
}

retrieveReferences = async (req, res) => {
    
    let { textQuery, search, paths, name, path, kind, kinds, notKinds, 
        referenceId, repositoryId, truncated, repositoryIds, include, limit, skip } = req.body;
    let filter = {}
    
    if (checkValid(kind)) filter.kind = kind;
    if (checkValid(name)) filter.name = name;
    if (checkValid(path)) filter.path = path;
    if (checkValid(repositoryId)) filter.repository = ObjectId(repositoryId)

    let regexQuery;
    

    if (checkValid(referenceId)) {
        let reference;
        if (referenceId !== ""){
            reference = await Reference.findOne({_id: referenceId})
        } else {
            reference = await Reference.findOne({repository: repositoryId, path: ""})
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
        query =  Reference.find({
                        $and : [
                            { $or: regexQuery },
                            filter
                        ]
                    });
    } else {
        query = Reference.find(filter)
    }
    
    if (checkValid(kinds)) query.where('kind').in(kinds);
    if (checkValid(notKinds)) query.where('kind').nin(notKinds);
    if (checkValid(repositoryIds)) query.where('repository').in(repositoryIds);
    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));


    query.populate('tags').populate('definitionReferences').exec((err, references) => {
        if (err) return res.json({ success: false, error: err });
        console.log("REFERENCES", references)
        return res.json(references);
    
    });
}



editReference = (req, res) => {
    const { id } = req.params;
    const {  name, path, kind, tags } = req.body;
    let update = {};
    if (name) update.name = name;
    if (path) update.path = path;
    if (kind) update.kind = kind;
    if (tags) update.tags = tags.map(tag => ObjectId(tag));
    Reference.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, reference) => {
        if (err) return res.json({ success: false, error: err });
        reference.populate('repository').populate( 'tags', (err, reference) => {
            if (err) return res.json(err);
            console.log(reference)
            return res.json(reference);

        });
    });
}


deleteReference = (req, res) => {
    const { id } = req.params;
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no repository item id provided'});
    Reference.findByIdAndRemove(id, (err, reference) => {
		if (err) return res.json({success: false, error: err});
        reference.populate('repository').populate('tags', (err, reference) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(reference);
        });
    });
}


attachTag = (req, res) => {
	const { id } = req.params
	const { tagId } = req.body;
	if (!checkValid(id)) return res.json({success: false, error: "attachTag error: no id provided.", result: null});
	if (!checkValid(tagId)) return res.json({success: false, error: "attachTag error: no tagIds provided.", result: null});

	let update = {}
	update.tags = ObjectId(tagId);
	
	Reference.findOneAndUpdate({_id: id}, { $push: update}, { new: true }, (err, reference) => {
		if (err) return res.json({ success: false, error: err });
		reference.populate('repository').populate('tags', (err, reference) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(reference);
        });
	})
}


removeTag = (req, res) => {
	const { id } = req.params
	const { tagId } = req.body;
	if (!checkValid(id)) return res.json({success: false, error: "removeTag error: no id provided.", result: null});
	if (!checkValid(tagId)) return res.json({success: false, error: "removeTag error: no tagIds provided.", result: null});

	let update = {}
	update.tags = ObjectId(tagId);
	
	Reference.findOneAndUpdate({_id: id}, { $pull: update}, { new: true }, (err, reference) => {
		if (err) return res.json({ success: false, error: err });
		reference.populate('repository').populate('tags', (err, reference) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(reference);
        });
	})
}


/*
attachDocument = (req, res) => {
    const { referenceIds, documentId } = req.body;

    let filter = { _id: { $in: referenceIds }}

    let update = {}
    if (documentId) update.documents = ObjectId(documentId);

    Reference.updateMany(filter, { $push: update }, { new: true }, (err, modified) => {

        if (err) return res.json({ success: false, error: err });
        console.log("MODIFIED STATUS", modified)

        let query =  Reference.find(filter);
        query.populate('repository').populate('documents').exec((err, references) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(references)
        })
    })
}


removeDocument = (req, res) => {
    const { referenceIds, documentId } = req.params;
    let filter = { _id: { $in: referenceIds }}
    let update = {}
    if (documentId) update.documents = ObjectId(documentId);
    Reference.updateMany(filter, { $pull: update }, { new: true }, (err, modified) => {

        if (err) return res.json({ success: false, error: err });
        console.log("MODIFIED STATUS", modified)

        let query =  Reference.find(filter);
        query.populate('repository').populate('documents').exec((err, references) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(references)
        })
    })
}


*/

module.exports =
{
    // DEPRECATED
    createReferences,
    getReferences,
    // NEW
    createReferences2,
    getReference,
    retrieveReferences,
    editReference,
    deleteReference,
    getContents,
    retrieveCodeReferences,
    attachTag, 
    removeTag
    /*
    attachDocument,
    removeDocument*/
}