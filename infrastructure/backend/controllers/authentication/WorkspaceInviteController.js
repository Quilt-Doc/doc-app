// TODO: Need to validate email (both syntax, and for uniqueness)

const WorkspaceInvite = require('../../models/authentication/WorkspaceInvite');
const Workspace = require('../../models/Workspace');
const User = require('../../models/authentication/User');

var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const logger = require('../../logging/index').logger;

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);


checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}

sendInvite = async (req, res) => {
    
    const workspaceId = req.workspaceObj._id.toString();

    const { email } = req.body;

    if (!checkValid(email)) return res.json({success: false, error: "No email provided"});

    // Check if a User with this (verified) email exists

    var userWithEmail;
    try {
        userWithEmail = await User.findOne({email, verified: true});
    }
    catch (err) {
        return res.json({success: false, error: `Error User findOne query failed - email: ${email}`});
    }

    // If a User exists, add them to the Workspace
    if (userWithEmail) {
        var updatedWorkspace;
        try {
            updatedWorkspace = await Workspace.findByIdAndUpdate(workspaceId, { $push: { memberUsers: ObjectId(userWithEmail._id.toString()) } }, { new: true });
        }
        catch (err) {
            return res.json({success: false, error: `Error Workspace findOneAndUpdate query failed - workspaceId, userId: ${workspaceId}, ${userWithEmail._id.toString()}`});
        }
    }

    // If a User doesn't exist, create an invitation object
    else {
        let workspaceInvite = new WorkspaceInvite(
            {
                workspace: ObjectId(workspaceId),
                invitedEmail: email
            },
        );
        
        try {
            workspaceInvite = await workspaceInvite.save();
        }
        catch (err) {
            return res.json({success: false, error: `Error saving WorkspaceInvite - workspaceId, email: ${workspaceId}, ${email}`});
        }
    }



    // Send the email regardless
    const msg = {
        to: email, // Change to your recipient
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

    return res.json({success: true});

}

module.exports = {
    sendInvite
}