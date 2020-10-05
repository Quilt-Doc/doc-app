// TODO: Need to validate email (both syntax, and for uniqueness)

const WorkspaceInvite = require('../../models/authentication/WorkspaceInvite');
const User = require('../../models/authentication/User');

var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const logger = require('../../logging/index').logger;


checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}

sendInvite = async (req, res) => {
    
    const workspaceId = req.workspaceObj._id.toString();

    const { email } = req.body;

    // Check if a User with this (verified) email exists

    var userWithEmail;
    try {
        userWithEmail = await User.findOne({email});
    }
    catch (err) {
        return res.json({success: false, error: `Error User findOne query failed - email: ${email}`});
    }

    // If a User exists, add them to the Workspace
    if (userWithEmail) {

    }

    // If a User doesn't exist, create an invitation object
    else {

    }



    // Send the email regardless
    const msg = {
        to: userEmail, // Change to your recipient
        from: 'karan@getquilt.app', // Change to your verified sender
        subject: `You've been invited to ${req.workspaceObj.name} on Quilt`,
        // text: 'and easy to do anywhere, even with Node.js',
        html: `<strong>Click this link to join on Quilt.</strong><br><a href="https://getquilt.app">Join</a>`,
      }

    try {
        await sgMail.send(msg);
    }
    catch (error) {
        console.error(error);
        if (error.response) {
            console.error(error.response.body)
            return res.json({success: false,
                                error: `Error Response when sending email - email, error.response.body: ${email} \n ${error.response.body}`});
        }
        return res.json({success: false,
            error: `Error Response when sending email - email, error.response.body: ${email} \n ${error.response.body}`});
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
        verifiedUser = await User.findByIdAndUpdate(verifiedUserId, {$set: { active: true } });
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

    return res.json({success: true, result: verifiedUser});
}

module.exports = {
    beginEmailVerification,
    verifyEmail
}