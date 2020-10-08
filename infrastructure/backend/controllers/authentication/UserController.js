// TODO: Need to validate email (both syntax, and for uniqueness)

const User = require('../../models/authentication/User');
var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const logger = require('../../logging/index').logger;
const beginEmailVerification = require('./EmailVerifyController').beginEmailVerification;

checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}


getUser = async (req, res) => {
    const userId = req.userObj._id.toString();

    let returnedUser;

    try {
        returnedUser = await User.findById(userId).populate('workspaces').lean().exec()
    } catch (err) {
        await logger.error({source: 'backend-api', message: err, errorDescription: `Error Failed to fetch User - userId: ${userId}`, function: 'getUser'});
        return res.json({success: false, error: "getUser Error: findbyId query failed", trace: err});
    }
   
    return res.json({success: true, result: returnedUser});
}

editUser = async (req, res) => {
    console.log('EDIT USER CALLED');
    const userId = req.userObj._id.toString();
    const { username, email, firstName, lastName, onboarded, verified, 
        domain, bio, organization, position
    } = req.body;   

    let update = {}
    if (checkValid(username)) update.username = username; 
    if (checkValid(email)) {
        update.email = email;
        try {
            await beginEmailVerification(userId, email);
        } catch (err) {
            return res.json({ success: false, error:"editUser: beginEmailVerification of email for edit failed", trace: err })
        }
    }
    if (checkValid(firstName)) update.firstName = firstName;
    if (checkValid(lastName)) update.lastName = lastName;
    if (checkValid(onboarded)) update.onboarded = onboarded;

    let returnedUser;

    try {
        returnedUser = await  User.findByIdAndUpdate(userId, { $set: update }, { new: true })
            .populate('workspaces').lean().exec();
    } catch (err) {
        await logger.error({source: 'backend-api', message: err, errorDescription: `Error Failed to findByIdAndUpdate User - userId: ${userId}`, function: 'editUser'});
        return res.json({success: false, error: "editUser Error: findbyIdAndUpdate query failed", trace: err});
    }
    console.log("RETURNED USER",  returnedUser);
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
        await logger.error({source: 'backend-api', message: err, errorDescription: `Error Failed to findByIdAndUpdate User - userId: ${userId}`, function: 'attachUserWorkspace'});
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
        await logger.error({source: 'backend-api', message: err, errorDescription: `Error Failed to findByIdAndUpdate User - userId: ${userId}`, function: 'removeUserWorkspace'});
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
        await logger.error({source: 'backend-api', message: err, errorDescription: `Error Failed to findByIdAndRemove User - userId: ${userId}`, function: 'deleteUser'});
        return res.json({success: false, error: "deleteUser Error: findbyIdAndRemove query failed", trace: err});
    }
   
    return res.json({success: true, result: returnedUser});
}

module.exports = {getUser, editUser, attachUserWorkspace, removeUserWorkspace, deleteUser}