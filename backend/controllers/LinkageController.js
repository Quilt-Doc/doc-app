const Linkage = require('../models/Linkage');
var mongoose = require('mongoose');
const { query } = require('express');
const { ObjectId } = mongoose.Types;

checkValid = (item) => {
    if (item !== null && item !== undefined) {
        return true
    }
    return false
}


createLinkage = (req, res) => {
    const { 
        creatorId, link, title, description, referenceIds, workspaceId, 
            repositoryId, tagIds, domain
     } = req.body;
    
    let linkage = new Linkage(
        {       
           workspace: ObjectId(workspaceId),
           repository: ObjectId(repositoryId),
           link,
           domain,
           creator: ObjectId(creatorId)
        },
    );

    if (checkValid(title)) linkage.title = title;
    if (checkValid(description)) linkage.description = description;
    if (checkValid(referenceIds)) linkage.references = 
        referenceIds.map(ref => ObjectId(ref));
    if (checkValid(tagIds)) linkage.tags = 
        tagIds.map(tag => ObjectId(tag));

    linkage.save((err, linkage) => {
        if (err) return res.json({ success: false, error: err });
        linkage.populate('workspace').populate('references').populate('creator')
            .populate('repository').populate('tags', (err, linkage) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(linkage);
        });
    });
}

getLinkage = (req, res) => {
    Linkage.findById(req.params.linkageId).populate('workspace').populate('references').populate('creator')
    .populate('repository').populate('tags').exec((err, linkage) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(linkage);
    });
}

editLinkage = (req, res) => {
    const { linkageId } = req.params;
    const { link, title, description, repositoryId, domain } = req.body;
    
    let update = {};
    if (checkValid(link)) update.link = link;
    if (checkValid(title)) update.title = title;
    if (checkValid(domain)) update.domain = domain;
    if (checkValid(description)) update.description = description;
    if (checkValid(repositoryId)) update.repository = ObjectId(repositoryId)

    Linkage.findByIdAndUpdate(linkageId, { $set: update }, { new: true }, (err, linkage) => {
        if (err) return res.json({ success: false, error: err });
        linkage.populate('workspace').populate('references').populate('creator')
        .populate('repository').populate('tags', (err, linkage) => {
            if (err) return res.json(err);
            return res.json(linkage);
        });
    });
}

deleteLinkage = (req, res) => {
    const { linkageId } = req.params;
    Linkage.findByIdAndRemove(linkageId, (err, linkage) => {
        if (err) return res.json({ success: false, error: err });
        linkage.populate('workspace').populate('references').populate('creator')
        .populate('repository').populate('tags', (err, linkage) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(linkage);
        });
    });
}

retrieveLinkages = (req, res) => {
    const { repositoryId, workspaceId, domainlimit, skip } = req.body;
    query = Linkage.find();

    if (checkValid(workspaceId)) query.where('workspace').equals(workspaceId)
    if (checkValid(repositoryId)) query.where('repository').equals(repositoryId)
    if (checkValid(domaiin)) query.where('domain').equals(domain);
    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));

    query.populate('workspace').populate('references').populate('creator')
    .populate('repository').populate('tags').exec((err, linkages) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(linkages);
    });
}

attachLinkageReference = (req, res) => {
    const { id } = req.params
	const { referenceId } = req.body;
	if (!checkValid(id)) return res.json({success: false, error: "error: no id provided.", result: null});
	if (!checkValid(tagId)) return res.json({success: false, error: "error: no referenceId provided.", result: null});

	let update = {}
	update.references = ObjectId(referenceId);
	
	Linkage.findOneAndUpdate({_id: id}, { $push: update}, { new: true }, (err, linkage) => {
		if (err) return res.json({ success: false, error: err });
		linkage.populate('workspace').populate('references').populate('creator')
        .populate('repository').populate('tags', (err, linkage) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(linkage);
        });
	})
}

removeLinkageReference = (req, res) => {
    const { id } = req.params
	const { referenceId } = req.body;
	if (!checkValid(id)) return res.json({success: false, error: "error: no id provided.", result: null});
	if (!checkValid(tagId)) return res.json({success: false, error: "error: no referenceId provided.", result: null});

	let update = {}
	update.references = ObjectId(referenceId);
	
	Linkage.findOneAndUpdate({_id: id}, { $pull: update}, { new: true }, (err, linkage) => {
		if (err) return res.json({ success: false, error: err });
		linkage.populate('workspace').populate('references').populate('creator')
        .populate('repository').populate('tags', (err, linkage) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(linkage);
        });
	})
}

attachLinkageTag = (req, res) => {
    const { id } = req.params
	const { tagId } = req.body;
	if (!checkValid(id)) return res.json({success: false, error: "error: no id provided.", result: null});
	if (!checkValid(tagId)) return res.json({success: false, error: "error: no tagId provided.", result: null});

	let update = {}
	update.tags = ObjectId(tagId);
	
	Linkage.findOneAndUpdate({_id: id}, { $push: update}, { new: true }, (err, linkage) => {
		if (err) return res.json({ success: false, error: err });
		linkage.populate('workspace').populate('references').populate('creator')
        .populate('repository').populate('tags', (err, linkage) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(linkage);
        });
	})
}

removeLinkageTag = (req, res) => {
    const { id } = req.params
	const { tagId } = req.body;
	if (!checkValid(id)) return res.json({success: false, error: "error: no id provided.", result: null});
	if (!checkValid(tagId)) return res.json({success: false, error: "error: no tagId provided.", result: null});

	let update = {}
	update.tags = ObjectId(tagId);
	
	Linkage.findOneAndUpdate({_id: id}, { $pull: update}, { new: true }, (err, linkage) => {
		if (err) return res.json({ success: false, error: err });
		linkage.populate('workspace').populate('references').populate('creator')
        .populate('repository').populate('tags', (err, linkage) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(linkage);
        });
	})
}

module.exports = { createLinkage, getLinkage, editLinkage, 
    deleteLinkage, retrieveLinkages, attachLinkageReference, removeLinkageReference, 
    attachLinkageTag, removeLinkageTag }