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
    console.log('Beginning Verification');

    var hash = crypto.randomBytes(64).toString('hex');

    const msg = {
        to: userEmail, // Change to your recipient
        from: 'karan@getquilt.app', // Change to your verified sender
        subject: 'Verify Your Quilt Account Email',
        // text: 'and easy to do anywhere, even with Node.js',
        html: `<a href="https://api.getquilt.app/api/verify/${hash}">Verify</a>`,
    }


    try {
        const emailVerify = await new EmailVerify({
            user: ObjectId(userId.toString()),
            hash,
            email: userEmail,
        }).save();
    }
    catch (err) {
        return res.json({success: false, error: `Error EmailVerify.save() query failed \n ${err}`});
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
        verifiedUser = await User.findById(verifiedUserId).exec();

        // Make sure that the EmailVerify.email matches the user's current email, return if the hash is outdated (old email)
        if (verifiedEmail.email != verifiedUser.email) {
            return res.json({success: false, error: `Invalid verification (email on User doesn't match) link.`});
        }

        verifiedUser = await User.findByIdAndUpdate(verifiedUserId, {$set: { verified: true } });
    }
    catch (err) {
        return res.json({success: false, error: `Error findById query failed \n ${err}`});
    }

    try {
        await EmailVerify.findByIdAndDelete(verifiedEmail._id.toString());
    }
    catch (err) {
        return res.json({success: false, error: `Error findByIdAndDelete query failed \n ${err}`});
    }

    let workspaceInvites;
    try {
        workspaceInvites = await WorkspaceInvite.find({invitedEmail: verifiedEmail.email});
    }
    catch (err) {
        return res.json({ success: false, 
            error: `verifyEmail Error: retrieval of Workspace Invites did not work`, trace: err });
    }

    var workspaceIds = workspaceInvites.map(workspaceInviteObj => workspaceInviteObj.workspace.toString());

    await logger.info({source: 'backend-api',
                        message: `Adding user with email ${verifiedEmail.email} to workspaceIds: ${JSON.stringify(workspaceIds)}`,
                        function: 'verifyEmail'});

    try {
        await  Workspace.updateMany({_id: { $in: workspaceIds.map(id => ObjectId(id)) }},  {$push: {memberUsers: ObjectId(verifiedUserId)}})
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