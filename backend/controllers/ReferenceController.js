const Reference = require('../models/Reference');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

var request = require("request");

// DEPRECATED
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
        references.populate('repository', (error, references) => {
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
        reference.populate('repository', (err, reference) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(reference)
        });
    });
}

getContents = async (req, res) => {

    var { referenceID } = req.body;
    let reference = await Reference.findOne({_id: referenceID}).populate('repository')
    let defaultBranch = "master"

    let downloadLink = `https://raw.githubusercontent.com/${reference.repository.fullName}/${defaultBranch}/${reference.path}`
    //https://raw.githubusercontent.com/kgodara/snippet-logic-test/master/post_commit.py
  
    
    //console.log('downloadLink: ', downloadLink);
    request.get(downloadLink).pipe(res);
}

/*path\/example\/[^\/]+$*/

retrieveCodeReferences = async (req, res) => {
    let {referenceID} = req.body

    let rootReference = await Reference.findOne({_id: referenceID})
    console.log(rootReference)
    let query = Reference.find({})

    console.log(rootReference.path)
    console.log(rootReference.repository)

    query.where('path').equals(rootReference.path)
    query.where('kind').ne('file')
    query.where('repository').equals(rootReference.repository)

    query.populate('repository').populate('definitionReferences').exec((err, references) => {
        if (err) return res.json({ success: false, error: err });
        console.log("REFERENCES", references)
        return res.json(references);
        
    });
}

retrieveReferences = async (req, res) => {
    let { textQuery, name, path, truncatedPath, kind, kinds, currentDirectoryID, repositoryID, limit, skip } = req.body;

    let filter = {}
    if (kind) filter.kind = kind;
    
    if (name) filter.name = name;
    if (path || path === '') filter.path = path;
    if (kind) filter.kind = kind;
    if (repositoryID) filter.repository = ObjectId(repositoryID)

    let query;
    if (textQuery || currentDirectoryID || truncatedPath) {
        let regexQuery;
        
        if (textQuery) {
            let regex = new RegExp(textQuery, 'i');
            regexQuery = [{ name: { $regex: regex } }, { path : { $regex: regex } }]
        }
    
        if (currentDirectoryID) {
            let currentDir = await Reference.findOne({_id: currentDirectoryID})
            let dirPath = (currentDir.path + '/').replace('/', '\/')
            let regex = new RegExp(`^${dirPath}[^\/]+$`, 'i');
            regexQuery = [{ path : { $regex: regex } }]
        }

        if (truncatedPath) {
            let regex = new RegExp(`^[^\/]+$`, 'i');
            regexQuery = [{ path : { $regex: regex } }]
        }
        
        query =  Reference.find({
                        $and : [
                            { $or: regexQuery },
                            filter
                        ]
                    });
    } else {
        query = Reference.find({filter})
    }
    
    if (kinds) query.where('kind').in(kinds)
    if (limit) query.limit(Number(limit));
    if (skip) query.skip(Number(skip));

    query.populate('repository').exec((err, references) => {
        console.log("REFERENCES", references)
        console.log(err)
        if (err) return res.json({ success: false, error: err });
        return res.json(references);
    });
}



editReference = (req, res) => {
    const { id } = req.params;
    const {  name, path, kind } = req.body;
    let update = {};
    if (name) update.name = name;
    if (path) update.path = path;
    if (kind) update.kind = kind;
    Reference.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, reference) => {
        if (err) return res.json({ success: false, error: err });
        reference.populate('repository', (err, reference) => {
            if (err) return res.json(err);
            return res.json(reference);
        });
    });
}


deleteReference = (req, res) => {
    const { id } = req.params;
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no repository item id provided'});
    Reference.findByIdAndRemove(id, (err, reference) => {
		if (err) return res.json({success: false, error: err});
        reference.populate('repository', (err, reference) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(reference);
        });
    });
}

/*
attachDocument = (req, res) => {
    const { referenceIDs, documentID } = req.body;

    let filter = { _id: { $in: referenceIDs }}

    let update = {}
    if (documentID) update.documents = ObjectId(documentID);

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
    const { referenceIDs, documentID } = req.params;
    let filter = { _id: { $in: referenceIDs }}
    let update = {}
    if (documentID) update.documents = ObjectId(documentID);
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
    retrieveCodeReferences
    /*
    attachDocument,
    removeDocument*/
}