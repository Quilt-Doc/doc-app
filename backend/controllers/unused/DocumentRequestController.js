const url = require('url');

var request = require("request");

const apis = require('../apis/api');

const api = apis.requestGithubClient();

const apiURL = 'https://api.github.com';
const localURL = 'https://localhost:3001/api'
const repoBaseURL = 'https://github.com/'

const fs = require('fs');
const fsPath = require('fs-path');

const { exec, execFile } = require('child_process');

const DocumentRequest = require('../models/DocumentRequest');
const Repository = require('../models/Repository');
const Reference = require('../models/Reference');
const Snippet = require('../models/Snippet');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const { json } = require('body-parser');

checkValid = (item) => {
    if (item !== null && item !== undefined) {
        return true
    }
    return false
}

/*
    created: {type: Date, default: Date.now },
    author: {type: ObjectId, ref: 'User', required: true},
    title: {type: String, required: true},
    markup: String,
    status: {type: String, required: true},
    references: [{type: ObjectId, ref: 'Reference'}],
    snippets: [{type: Objectid, ref: 'Snippet'}],
    workspace: {type: ObjectId, ref: 'Workspace'},
    repository: {type: ObjectId, ref: 'Repository'},
    tags: [{type: ObjectId, ref: 'Tag'}],
    mentions: [{type: ObjectId, ref: 'User'}]
*/

createDocumentRequest = (req, res) => {
	const { authorId, title, markup, referenceIds, 
		workspaceId, repositoryId, tagIds, mentionIds, snippetIds } = req.body;

	if (!checkValid(authorId)) return res.json({success: false, error: "createDocument error: no authorId provided.", result: null});
	if (!checkValid(title)) return res.json({success: false, error: "createDocument error: no title provided.", result: null});
	if (!checkValid(workspaceId)) return res.json({success: false, error: "createDocument error: no workspaceId provided.", result: null});
	//if (!checkValid(repositoryId)) return res.json({success: false, error: "createDocument error: no repositoryId provided.", result: null});

	let documentRequest = new DocumentRequest({
		author: ObjectId(authorId),
		title,
		workspace: ObjectId(workspaceId),
		
		status: 'OPEN'
	});

	if (checkValid(repositoryId)) documentRequest.repository = ObjectId(repositoryId);
	if (markup) documentRequest.markup = markup;
	if (referenceIds) documentRequest.references = referenceIds.map(ref => ObjectId(ref));
	if (tagIds) documentRequest.tags = tagIds.map(tag => ObjectId(tag));
	if (mentionIds) documentRequest.mentions = mentiondIds.map(mention => ObjectId(mention));
	if (snippetIds) documentRequest.snippets = snippet

	documentRequest.save((err, documentRequest) => {
        if (err) return res.json({ success: false, error: err });
        documentRequest.populate('workspace').populate('repository')
        .populate('references').populate('tags')
        .populate('mentions', (err, documentRequest) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(documentRequest);
        });
    });
}

// tags, mentions, references add, remove in separate calls



attachTag = (req, res) => {
	const { id } = req.params
	const { tagId } = req.body;
	if (!checkValid(id)) return res.json({success: false, error: "attachTag error: no id provided.", result: null});
	if (!checkValid(tagId)) return res.json({success: false, error: "attachTag error: no tagIds provided.", result: null});

	let update = {}
	update.tags = ObjectId(tagId);
	
	DocumentRequest.findOneAndUpdate({_id: id}, { $push: update}, { new: true }, (err, request) => {
		if (err) return res.json({ success: false, error: err });
		request.populate('workspace').populate('repository')
        .populate('references').populate('tags')
        .populate('mentions', (err, request) => {
			if (err) return res.json(err);
			//console.log(request)
			console.log(id)
			console.log(request)
            return res.json(request);
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
	
	DocumentRequest.findOneAndUpdate({_id: id}, { $pull: update}, { new: true }, (err, request) => {
		if (err) return res.json({ success: false, error: err });
		request.populate('workspace').populate('repository')
        .populate('references').populate('tags')
        .populate('mentions', (err, request) => {
            if (err) return res.json(err);
            return res.json(request);
        });
	})
}



addMentions = async (req, res) => {
	const { documentRequestId, mentionIds} = req.body;
	if (!checkValid(documentRequestId)) return res.json({success: false, error: "addMentions error: no documentRequestId provided.", result: null});
	if (!checkValid(mentionIds)) return res.json({success: false, error: "addMentions error: no mentionIds provided.", result: null});

	return await DocumentRequest.findOneAndUpdate({_id: ObjectId(documentRequestId)}, { $push: { mentions: mentionIds.map(mention => ObjectId(mention)) } });

}

removeMentions = async (req, res) => {
	const { documentRequestId, mentionIds } = req.body;
	if (!checkValid(documentRequestId)) return res.json({success: false, error: "removeMentions error: no documentRequestId provided.", result: null});
	if (!checkValid(mentionIds)) return res.json({success: false, error: "removeMentions error: no mentionIds provided.", result: null});

	return await DocumentRequest.findOneAndUpdate({_id: ObjectId(documentRequestId)}, { $pull: { mentions: mentionIds.map(mention => ObjectId(mention)) } });
}

addReferences = async (req, res) => {
	const { documentRequestId, referenceIds } = req.body;
	if (!checkValid(documentRequestId)) return res.json({success: false, error: "addReferences error: no documentRequestId provided.", result: null});
	if (!checkValid(referenceIds)) return res.json({success: false, error: "addReferences error: no referenceIds provided.", result: null});

	return await DocumentRequest.findOneAndUpdate({_id: ObjectId(documentRequestId)}, { $push: { references: referenceIds.map(reference => ObjectId(reference)) } });
}

removeReferences = async (req, res) => {
	const { documentRequestId, referenceIds } = req.body;
	if (!checkValid(documentRequestId)) return res.json({success: false, error: "removeReferences error: no documentRequestId provided.", result: null});
	if (!checkValid(referenceIds)) return res.json({success: false, error: "removeReferences error: no referenceIds provided.", result: null});

	return await DocumentRequest.findOneAndUpdate({_id: ObjectId(documentRequestId)}, { $pull: { references: referenceIds.map(reference => ObjectId(reference)) } });
}

addSnippets = async (req, res) => {
	const { documentRequestId, snippetIds } = req.body;
	if (!checkValid(documentRequestId)) return res.json({success: false, error: "addSnippets error: no documentRequestId provided.", result: null});
	if (!checkValid(snippetIds)) return res.json({success: false, error: "addSnippets error: no snippetIds provided.", result: null});

	return await DocumentRequest.findOneAndUpdate({_id: ObjectId(documentRequestId)}, { $push: { snippets: snippetIds.map(snippet => ObjectId(snippet)) } });
}

removeSnippets = async (req, res) => {
	const { documentRequestId, snippetIds } = req.body;
	if (!checkValid(documentRequestId)) return res.json({success: false, error: "removeSnippets error: no documentRequestId provided.", result: null});
	if (!checkValid(snippetIds)) return res.json({success: false, error: "removeSnippets error: no snippetIds provided.", result: null});

	return await DocumentRequest.findOneAndUpdate({_id: ObjectId(documentRequestId)}, { $pull: { snippets: snippetIds.map(snippet => ObjectId(snippet)) } });
}



/*
    title: {type: String, required: true},
    markup: String,
    status: {type: String, required: true},
    references: [{type: ObjectId, ref: 'Reference'}],
    snippets: [{type: Objectid, ref: 'Snippet'}],
    workspace: {type: ObjectId, ref: 'Workspace'},
    repository: {type: ObjectId, ref: 'Repository'},
    tags: [{type: ObjectId, ref: 'Tag'}],
    mentions: [{type: ObjectId, ref: 'User'}]
*/
editDocumentRequest = (req, res) => {
	const {id} = req.params
	const { title, markup, status,
			referenceIds, snippetIds, workspaceId, repositoryId,
			tagIds, mentionIds } = req.body;
	if (!checkValid(id)) return res.json({success: false, error: "addSnippets error: no snippetIds provided.", result: null});

	let update = {};
	if (title) update.title = title;
    if (markup) update.markup = markup;
    if (status) update.status = status;
    if (referenceIds) update.references = referencesIds.map(ref => ObjectId(ref));
    if (snippetIds) update.snippets = snippetIds.map(snippet => ObjectId(snippet));
    if (workspaceId) update.workspace = ObjectId(workspaceId);
    if (repositoryId) update.repository = ObjectId(repositoryId);
    if (tagIds) update.tags = tagIds.map(tag => ObjectId(tag));
    if (mentionIds) update.mentions = mentionIds.map(mention => ObjectId(mention));


    DocumentRequest.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, documentRequest) => {
        if (err) return res.json({ success: false, error: err });
        documentRequest.populate('workspace').populate('repository')
        .populate('references').populate('tags')
        .populate('mentions', (err, documentRequest) => {
            if (err) return res.json(err);
            return res.json(documentRequest);
        });
    });
}

deleteDocumentRequest = async (req, res) => {
	const { id } = req.params;
	if (!checkValid(id)) return res.json({success: false, error: "deleteDocument error: no id provided.", result: null});
	return  res.json(await DocumentRequest.deleteOne({_id: ObjectId(id)}).populate('workspace').populate('repository')
	.populate('references').populate('tags')
	.populate('mentions').exec());
}

getDocumentRequest = async (req, res) => {
	const { id } = req.params
	if (!checkValid(id)) return res.json({success: false, error: "getDocumentRequest error: no id provided.", result: null});
	return res.json(await DocumentRequest.findOne({_id: ObjectId(id)}).populate('workspace').populate('repository')
	.populate('references').populate('tags')
	.populate('mentions').exec());
}


retrieveDocumentRequests = async (req, res) => {
	let { workspaceId } = req.body;
    let query = DocumentRequest.find();

	if (checkValid(workspaceId)) query.where('workspace').equals(workspaceId)


	return res.json(await query.populate('workspace').populate('repository')
	.populate('references').populate('tags')
	.populate('mentions').exec());
}


module.exports = {
	createDocumentRequest, attachTag, removeTag, addMentions, removeMentions,
	addReferences, removeReferences, addSnippets, removeSnippets,
	editDocumentRequest, deleteDocumentRequest, getDocumentRequest, retrieveDocumentRequests
}