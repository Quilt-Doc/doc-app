const Linkage = require('../models/Linkage');
var mongoose = require('mongoose');
const { query } = require('express');
const { ObjectId } = mongoose.Types;

const { checkValid } = require('../../utils/utils');



createLinkage = (req, res) => {
    const { 
        creatorId, link, title, description, referenceIds, 
            repositoryId, tagIds, domain
    } = req.body;
    
    const workspaceId = req.workspaceObj._id;

    var validRepositoryIds = req.workspaceObj.repositories.map(repositoryObj => repositoryObj.toString());

    // Check that repositoryId is in accessible workspace
    if (repositoryId) {
        if (validRepositoryIds.indexOf(repositoryId.toString()) == -1) {
            return res.json({success: false, error: "createLinkage Error: request on repository user does not have access to."});
        }
    }
    
    // Check that authorId matches the userId in the JWT (only the user can create a document for themselves)
    if (creatorId != req.tokenPayload.userId) {
        return res.json({success: false, error: "createLinkage Error: userId in JWT doesn't match creatorId."});
    }

    if (checkValid(link))  return res.json({success: false, error: "createLinkage Error: link not provided."});
    if (checkValid(domain)) return res.json({success: false, error: "createLinkage Error: domain not provided."});

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
            return res.json({success: true, result: linkage});
        });
    });
}

getLinkage = (req, res) => {
    const linkageId = req.linkageObj._id;

    Linkage.findById(linkageId).populate('workspace').populate('references').populate('creator')
    .populate('repository').populate('tags').exec((err, linkage) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({success: true, result: linkage});
    });
}

editLinkage = (req, res) => {
    const linkageId = req.linkageObj._id;
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
            return res.json({success: true, result: linkage});
        });
    });
}

deleteLinkage = (req, res) => {
    const linkageId = req.linkageObj._id;
    Linkage.findByIdAndRemove(linkageId, (err, linkage) => {
        if (err) return res.json({ success: false, error: err });
        linkage.populate('workspace').populate('references').populate('creator')
        .populate('repository').populate('tags', (err, linkage) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: linkage});
        });
    });
}

retrieveLinkages = (req, res) => {
    const workspaceId = req.workspaceObj._id;
    const { repositoryId, domain, limit, skip } = req.body;

    query = Linkage.find();

    query.where('workspace').equals(workspaceId)

    if (checkValid(repositoryId)) query.where('repository').equals(repositoryId)
    if (checkValid(domain)) query.where('domain').equals(domain);
    if (checkValid(limit)) query.limit(Number(limit));
    if (checkValid(skip)) query.skip(Number(skip));

    query.populate('workspace').populate('references').populate('creator')
    .populate('repository').populate('tags').exec((err, linkages) => {
        if (err) return res.json({ success: false, error: err });
        return res.json({success: true, result: linkages});
    });
}

attachLinkageReference = (req, res) => {
    const linkageId = req.linkageObj._id;
    const referenceId = req.referenceObj._id;

	let update = {}
	update.references = ObjectId(referenceId);
	
	Linkage.findOneAndUpdate({_id: linkageId}, { $push: update}, { new: true }, (err, linkage) => {
		if (err) return res.json({ success: false, error: err });
		linkage.populate('workspace').populate('references').populate('creator')
        .populate('repository').populate('tags', (err, linkage) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: linkage});
        });
	})
}

removeLinkageReference = (req, res) => {
    const linkageId = req.linkageObj._id;
    const referenceId = req.referenceObj._id;

	let update = {}
	update.references = ObjectId(referenceId);
	
	Linkage.findOneAndUpdate({_id: linkageId}, { $pull: update}, { new: true }, (err, linkage) => {
		if (err) return res.json({ success: false, error: err });
		linkage.populate('workspace').populate('references').populate('creator')
        .populate('repository').populate('tags', (err, linkage) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: linkage});
        });
	})
}

attachLinkageTag = (req, res) => {
    const linkageId = req.linkageObj._id;
    const tagId = req.tagObj._id;

	let update = {}
	update.tags = ObjectId(tagId);
	
	Linkage.findOneAndUpdate({_id: linkageId}, { $push: update}, { new: true }, (err, linkage) => {
		if (err) return res.json({ success: false, error: err });
		linkage.populate('workspace').populate('references').populate('creator')
        .populate('repository').populate('tags', (err, linkage) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: linkage});
        });
	})
}

removeLinkageTag = (req, res) => {
    const linkageId = req.linkageObj._id;
    const tagId = req.tagObj._id;

	let update = {}
	update.tags = ObjectId(tagId);
	
	Linkage.findOneAndUpdate({_id: linkageId}, { $pull: update}, { new: true }, (err, linkage) => {
		if (err) return res.json({ success: false, error: err });
		linkage.populate('workspace').populate('references').populate('creator')
        .populate('repository').populate('tags', (err, linkage) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: linkage});
        });
	})
}

module.exports = { createLinkage, getLinkage, editLinkage, 
    deleteLinkage, retrieveLinkages, attachLinkageReference, removeLinkageReference, 
    attachLinkageTag, removeLinkageTag }