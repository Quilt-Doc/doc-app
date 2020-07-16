
//Will need to update with populates in regards to relationships
//Will need to update in regards to text fields for if statements and variable setting
/*
const Relationship = require('../../models/Relationship');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


createRelationship = (req, res) => {
    const { creatorId, sourceId, targetId, type, text } = req.body;

    if (!typeof creatorId == 'undefined' && creatorId !== null) return res.json({success: false, error: 'no relationship creatorId provided'});
    if (!typeof sourceId == 'undefined' && sourceId !== null) return res.json({success: false, error: 'no relationship sourceId provided'});
    if (!typeof targetId == 'undefined' && targetId !== null) return res.json({success: false, error: 'no relationship targetId provided'});


    let relationship = new Relationship(
        {
            creator: ObjectId(creatorId),
            source: ObjectId(sourceId),
            target: ObjectId(targetId)
        },
    );

    if (type) relationship.type = type;
    if (text) relationship.text = text;
    relationship.save((err, relationship) => {
        if (err) return res.json({ success: false, error: err });
        relationship.populate('creator', (err, relationship) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(relationship);
        });
    });
}

getRelationship = (req, res) => {
    Relationship.findById(req.params.id).populate('creator').exec((err, relationship) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(relationship);
    });
}



editRelationship = (req, res) => {
    const { id } = req.params;
    const { sourceId, targetId, type, text } = req.body;
    let update = {};
    if (sourceId) update.source = ObjectId(sourceId);
    if (targetId) update.target = ObjectId(targetId);
    if (type) update.type = type;
    if (text) update.text = text
    Relationship.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, relationship) => {
        if (err) return res.json({ success: false, error: err });
        relationship.populate('creator', (err, relationship) => {
            if (err) return res.json(err);
            return res.json(relationship);
        });
    });
}


deleteRelationship = (req, res) => {
    const { id } = req.params;
    Relationship.findByIdAndRemove(id, (err, relationship) => {
        if (err) return res.json({ success: false, error: err });
        relationship.populate('creator', (err, relationship) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(relationship);
        });
    });
}

retrieveRelationships = (req, res) => {
    let { creatorId, sourceId, targetId, textQuery, type, text, limit, skip } = req.body;
    
    query = Relationship.find();
    if (creatorId) query.where('creator').equals(creatorId);
    if (sourceId) query.where('source').equals(sourceId);
    if (targetId) query.where('target').equals(targetId);
    if (type) query.where('type').equals(type);
    if (text) query.where('text').equals(text)
    if (limit) query.limit(Number(limit));
    if (skip) query.skip(Number(skip));
    query.populate('creator').exec((err, relationships) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(relationships);
    });
}


module.exports = {
    createRelationship, getRelationship, editRelationship, deleteRelationship, retrieveRelationships
}*/