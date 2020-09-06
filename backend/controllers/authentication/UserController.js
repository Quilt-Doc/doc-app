// TODO: Need to validate email (both syntax, and for uniqueness)

const User = require('../../models/authentication/User');
var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;


getUser = (req, res) => {
    const userId = req.userObj._id.toString();

    User.findById(userId, (err, user) => {
		if (err) return res.json({success: false, error: err});
		user.populate('workspaces', (err, user) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: user});
        });
    });
}

editUser = (req, res) => {
    const userId = req.userObj._id.toString();
    const { username, email} = req.body;

    let update = {}
    if (username) update.username = username; 
    if (email) update.email = email;

    User.findByIdAndUpdate(userId, { $set: update }, { new: true }, (err, user) => {
        if (err) return res.json({ success: false, error: err });
        user.populate('workspaces', (err, user) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: user});
        });
    });
}

attachWorkspace = (req, res) => {

    const userId = req.userObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();

    let update = {}
    update.workspaces = ObjectId(workspaceId);
    User.findByIdAndUpdate(userId, { $push: update }, { new: true }, (err, user) => {
        if (err) return res.json({ success: false, error: err });
        user.populate('workspaces', (err, user) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: user});
        });
    });
}


removeWorkspace = (req, res) => {

    const userId = req.userObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();

    let update = {}
    update.workspaces = ObjectId(workspaceId);

    User.findByIdAndUpdate(userId, { $pull: update }, { new: true }, (err, user) => {
        if (err) return res.json({ success: false, error: err });
        user.populate('workspaces', (err, user) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: user});
        });
    });
}

deleteUser = (req, res) => {
    const userId = req.userObj._id.toString();

    User.findByIdAndRemove(userId, (err, user) => {
        if (err) return res.json({ success: false, error: err });
        user.populate('workspaces', (err, user) => {
            if (err) return res.json({ success: false, error: err });
            return res.json({success: true, result: user});
        });
    });
}

module.exports = {getUser, editUser, attachWorkspace, removeWorkspace, deleteUser}