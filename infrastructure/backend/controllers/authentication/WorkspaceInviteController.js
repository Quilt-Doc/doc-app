// TODO: Need to validate email (both syntax, and for uniqueness)

const WorkspaceInvite = require('../../models/authentication/WorkspaceInvite');
const Workspace = require('../../models/Workspace');
const User = require('../../models/authentication/User');
const UserStatsController = require('../reporting/UserStatsController');

var mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const logger = require('../../logging/index').logger;

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const NotificationController = require('../reporting/NotificationController');

// grab the Mixpanel factory
const Mixpanel = require('mixpanel');

// create an instance of the mixpanel client
const mixpanel = Mixpanel.init(`${process.env.MIXPANEL_TOKEN}`);


checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}

// TODO: Create UserStats object on addition
sendInvite = async (req, res) => {

    const workspaceId = req.workspaceObj._id.toString();

    const { email } = req.body;

    if (!checkValid(email)) return res.json({success: false, error: "No email provided"});

    var addedToWorkspace = false;
    var updatedWorkspace;

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
        try {
            updatedWorkspace = await Workspace.findByIdAndUpdate(workspaceId, { $push: { memberUsers: ObjectId(userWithEmail._id.toString()) } }, { new: true });
            addedToWorkspace = true;
        }
        catch (err) {
            return res.json({success: false, error: `Error Workspace findOneAndUpdate query failed - workspaceId, userId: ${workspaceId}, ${userWithEmail._id.toString()}`});
        }

        // Update User's workspaces array
        try {
            userWithEmail = await User.findByIdAndUpdate(userWithEmail._id.toString(), { $push: { workspaces: ObjectId(updatedWorkspace._id.toString())} }).lean();
        }
        catch (err) {
            await logger.error({source: 'backend-api',
                                message: err,
                                errorDescription: `Error updating User workspaces array - userId, workspaceId: ${userWithEmail._id.toString()} ${updatedWorkspace._id.toString()}`,
                                function: 'sendInvite'});

            return res.json({success: false,
                            error: `Error updating User workspaces array - userId, workspaceId: ${userWithEmail._id.toString()} ${updatedWorkspace._id.toString()}`,
                            trace: err});
        }

        // Create a UserStats Object for the User & Workspace pair
        try {
            // No session to pass as third param
            await UserStatsController.createUserStats({userId: userWithEmail._id.toString(), workspaceId: updatedWorkspace._id.toString(), undefined});
        }
        catch (err) {
            await logger.error({source: 'backend-api', message: err,
                                errorDescription: `error creating UserStats object  - userId, workspaceId: ${userWithEmail._id.toString()} ${updatedWorkspace._id.toString()}`,
                                function: 'sendInvite'});
    
            return res.json({success: false,
                        error: `error creating UserStats object - userId, workspaceId: ${userWithEmail._id.toString()} ${updatedWorkspace._id.toString()}`,
                        trace: err});
        }


        // Create 'added_workspace' Notification
        var notificationData = [{
                type: 'added_workspace',
                user: userWithEmail._id.toString(),
                workspace: workspaceId.toString(),
        }];

        try {
            await NotificationController.createAddedNotifications(notificationData);
        }
        catch (err) {
            console.log('ADDED NOTIFICATION ERROR: ');
            console.log(err);
            await logger.error({source: 'backend-api',
                                error: err,
                                errorDescription: `Error createAddedNotifications failed - userWithEmailId, workspaceId: ${userWithEmail._id.toString()}, ${workspaceId.toString()}`,
                                function: 'verifyEmail'});

            return res.json({ success: false, 
                                error: `Error createAddedNotifications failed`,
                                trace: err });
        }


        // track an event with optional properties
        mixpanel.track('User Added to Workspace', {
            distinct_id: `${userWithEmail._id.toString()}`,
            workspaceId: `${updatedWorkspace._id.toString()}`,
            totalWorkspaceUsers: `${updatedWorkspace.memberUsers.length}`,
            workspaceName: `${updatedWorkspace.name}`,
        });
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

    // Return the updated Workspace to instantly update the frontend
    if (addedToWorkspace) {
        return res.json({success: true, result: updatedWorkspace});
    }
    else {
        return res.json({success: true});
    }

}

module.exports = {
    sendInvite
}