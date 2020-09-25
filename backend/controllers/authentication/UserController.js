// TODO: Need to validate email (both syntax, and for uniqueness)

const User = require('../../models/authentication/User');
var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;


getUser = async (req, res) => {
    const userId = req.userObj._id.toString();

    let returnedUser;

    try {
        returnedUser = await  User.findById(userId).populate('workspaces').lean().exec()
    } catch (err) {
        return res.json({success: false, error: "getUser Error: findbyId query failed", trace: err});
    }
   
    return res.json({success: true, result: returnedUser});
}

editUser = async (req, res) => {
    const userId = req.userObj._id.toString();
    const { username, email} = req.body;

    let update = {}
    if (username) update.username = username; 
    if (email) update.email = email;

    let returnedUser;

    try {
        returnedUser = await  User.findByIdAndUpdate(userId, { $set: update }, { new: true })
            .populate('workspaces').lean().exec();
    } catch (err) {
        return res.json({success: false, error: "editUser Error: findbyIdAndUpdate query failed", trace: err});
    }
   
    return res.json({success: true, result: returnedUser});
}

attachUserWorkspace = async (req, res) => {
    const userId = req.userObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();

    let update = {}
    update.workspaces = ObjectId(workspaceId);

    let returnedUser;

    try {
        returnedUser = await User.findByIdAndUpdate(userId, { $push: update }, { new: true })
            .populate('workspaces').lean().exec();
    } catch (err) {
        return res.json({success: false, error: "attachUserWorkspace Error: findbyIdAndUpdate query failed", trace: err});
    }
   
    return res.json({success: true, result: returnedUser});

}


removeUserWorkspace = async (req, res) => {
    const userId = req.userObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();

    let update = {}
    update.workspaces = ObjectId(workspaceId);

    let returnedUser;

    try {
        returnedUser = await User.findByIdAndUpdate(userId, { $pull: update }, { new: true })
            .populate('workspaces').lean().exec();
    } catch (err) {
        return res.json({success: false, error: "removeUserWorkspace Error: findbyIdAndUpdate query failed", trace: err});
    }
   
    return res.json({success: true, result: returnedUser});
}

deleteUser = async (req, res) => {
    const userId = req.userObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();

    let update = {}
    update.workspaces = ObjectId(workspaceId);

    let returnedUser;

    try {
        returnedUser = await  User.findByIdAndRemove(userId).select('_id').lean().exec()
    } catch (err) {
        return res.json({success: false, error: "deleteUser Error: findbyIdAndRemove query failed", trace: err});
    }
   
    return res.json({success: true, result: returnedUser});
}

module.exports = {getUser, editUser, attachUserWorkspace, removeUserWorkspace, deleteUser}