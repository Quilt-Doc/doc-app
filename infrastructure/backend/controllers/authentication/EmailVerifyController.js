// TODO: Need to validate email (both syntax, and for uniqueness)

const EmailVerify = require('../../models/authentication/EmailVerify');
const User = require('../../models/authentication/User');
const WorkspaceInvite = require('../../models/authentication/WorkspaceInvite');
const Workspace = require('../../models/Workspace');
const CLIENT_HOME_PAGE_URL = "http://localhost:3000";

var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const logger = require('../../logging/index').logger;


const crypto = require('crypto');

const sgMail = require('@sendgrid/mail');
checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}

beginEmailVerification = async (userId, userEmail) => {

    var hash = crypto.randomBytes(64).toString('hex');

    const msg = {
        to: userEmail, // Change to your recipient
        from: 'karan@getquilt.app', // Change to your verified sender
        subject: 'Verify Your Quilt Account Email',
        // text: 'and easy to do anywhere, even with Node.js',
        html: `<a href="https://api.getquilt.app/api/verify/${hash}">Verify</a>`,
    }

    try {
        await sgMail.send(msg);
    }
    catch (error) {
        console.error(error);
        if (error.response) {
            console.error(error.response.body)
            throw new Error(`Error Response when sending email - userId, userEmail, error.response.body: ${userId}, ${userEmail} \n ${error.response.body}`);
        }
        throw new Error(`Error sending email - userId, userEmail: ${userId}, ${userEmail}`);
    }
}


verifyEmail = async (req, res) => {
    var hash = req.params.verifyEmailHash;

    if (hash.length != 128) {
        return res.json({success: false, error: 'Invalid Link'});
    }

    var verifiedEmail;
    try {
        verifiedEmail = await EmailVerify.findOne({hash});
    }
    catch (err) {
        return res.json({success: false, error: `Error findOne query failed \n ${err}`});
    }

    if (!verifiedEmail) {
        return res.json({success: false, error: 'Link does not match an email.'});
    }

    var verifiedUserId = verifiedEmail.user.toString();

    var verifiedUser;
    try {
        verifiedUser = await User.findByIdAndUpdate(verifiedUserId, {$set: { verified: true } });
    }
    catch (err) {
        return res.json({success: false, error: `Error findByIdAndUpdate query failed \n ${err}`});
    }

    try {
        await EmailVerify.findByIdAndDelete(verifiedEmail._id.toString());
    }
    catch (err) {
        return res.json({success: false, error: `Error findByIdAndDelete query failed \n ${err}`});
    }

    let workspaceIds;
    try {
        workspaceIds = await WorkspaceInvite.find({invitedEmail: verifiedEmail});
    } catch (err) {
        return res.json({ success: false, 
            error: `verifyEmail Error: retrieval of workspaces did not work`, trace: err });
    }

    try {
        await  Workspace.updateMany({_id: { $in: workspaceIds }},  {$push: {memberUsers: ObjectId(verifiedUserId)}})
    } catch (err) {
        return res.json({ success: false, 
            error: `verifyEmail Error: workspace update did not work`, trace: err });
    }

    return res.redirect(CLIENT_HOME_PAGE_URL);
}

module.exports = {
    beginEmailVerification,
    verifyEmail
}