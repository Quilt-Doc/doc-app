// TODO: Need to validate email (both syntax, and for uniqueness)

const User = require('../../models/authentication/User');
var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

createUser = (req, res) => {
    const { username, email, debugId} = req.body;
    if (!typeof username == 'undefined' && name !== null) return res.json({success: false, error: 'no user username provided'});
    if (!typeof email == 'undefined' && email !== null) return res.json({success: false, error: 'no user email provided'});

    let user = new User(
        {
            username: username,
            email: email,
        },
    );

    // Check if user-defined ids allowed
    if (process.env.DEBUG_CUSTOM_Id && process.env.DEBUG_CUSTOM_Id != 0) {
        if (debugId) user._id = ObjectId(debugId);
    }

    user.save((err, user) => {
        if (err) return res.json({ success: false, error: err });
        user.populate('workspaces', (err, user) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(user);
        });
    });
}


getUser = (req, res) => {
    const { id } = req.params;
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no user id provided'});

    User.findById(id, (err, user) => {
		if (err) return res.json({success: false, error: err});
		user.populate('workspaces', (err, user) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(user);
        });
    });
}

editUser = (req, res) => {
    const { id } = req.params;
    const { username, email} = req.body;
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no user id provided'});

    let update = {}
    if (username) update.username = username; 
    if (email) update.email = email;

    User.findByIdAndUpdate(id, { $set: update }, { new: true }, (err, user) => {
        if (err) return res.json({ success: false, error: err });
        user.populate('workspaces', (err, user) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(user);
        });
    });
}

attachWorkspace = (req, res) => {
    const { workspaceId } = req.body;
    const { id } = req.params;

    if (!typeof workspaceId == 'undefined' && workspaceId !== null) return res.json({success: false, error: 'no workspaceId to delete provided'});
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no user id provided'});
    let update = {}
    update.workspaces = ObjectId(workspaceId);
    User.findByIdAndUpdate(id, { $push: update }, { new: true }, (err, user) => {
        if (err) return res.json({ success: false, error: err });
        user.populate('workspaces', (err, user) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(user);
        });
    });
}


removeWorkspace = (req, res) => {
    const { workspaceId } = req.body;
    const { id } = req.params;

    if (!typeof workspaceId == 'undefined' && workspaceId !== null) return res.json({success: false, error: 'no workspaceId to delete provided'});
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no user id provided'});

    let update = {}
    update.workspaces = ObjectId(workspaceId);

    User.findByIdAndUpdate(id, { $pull: update }, { new: true }, (err, user) => {
        if (err) return res.json({ success: false, error: err });
        user.populate('workspaces', (err, user) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(user);
        });
    });
}

deleteUser = (req, res) => {
    const { id } = req.params;
    
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no user id provided'});

    User.findByIdAndRemove(id, (err, user) => {
        if (err) return res.json({ success: false, error: err });
        user.populate('workspaces', (err, user) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(user);
        });
    });
}

module.exports = { createUser, getUser, editUser, attachWorkspace, removeWorkspace, deleteUser}