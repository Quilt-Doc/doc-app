// TODO: Need to validate email (both syntax, and for uniqueness)

const User = require('../models/User');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

createUser = (req, res) => {
    const { username, email} = req.body;
    if (!typeof username == 'undefined' && name !== null) return res.json({success: false, error: 'no user username provided'});
    if (!typeof email == 'undefined' && email !== null) return res.json({success: false, error: 'no user email provided'});

    let user = new User(
        {
            username: username,
            email: email,
        },
    );

    user.save((err, user) => {
        if (err) return res.json({ success: false, error: err });
        user.populate('workspaces', (err, user) => {
            if (err) return res.json({ success: false, error: err });
            return res.json(user);
        });
    });
}

removeWorkspace = (req, res) => {
    const { workspaceID } = req.body;
    const { id } = req.params;

    if (!typeof workspaceID == 'undefined' && workspaceID !== null) return res.json({success: false, error: 'no workspaceID to delete provided'});
    if (!typeof id == 'undefined' && id !== null) return res.json({success: false, error: 'no user id provided'});

    let update = {}
    update.workspaces = ObjectId(workspaceID);

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


module.exports = { createUser, removeWorkspace, deleteUser}