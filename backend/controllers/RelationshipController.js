
//Will need to update with populates in regards to relationships
//Will need to update in regards to text fields for if statements and variable setting
const Relationship = require('../models/Relationship');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;


createRelationship = (req, res) => {
    const { creatorID, sourceID, targetID, type, text } = req.body;
    let relationship = new Relationship(
        {
            creator: ObjectId(creatorID),
            source: ObjectId(sourceID),
            target: ObjectId(targetID),
            created: new Date(),
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
    const { sourceID, targetID, type, text } = req.body;
    let update = {};
    if (sourceID) update.source = ObjectId(sourceID);
    if (targetID) update.target = ObjectId(targetID);
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
    let { creatorID, sourceID, targetID, textQuery, type, text, limit, skip } = req.body;
    
    query = Relationship.find();
    if (creatorID) query.where('creator').equals(creatorID);
    if (sourceID) query.where('source').equals(sourceID);
    if (targetID) query.where('target').equals(targetID);
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
}