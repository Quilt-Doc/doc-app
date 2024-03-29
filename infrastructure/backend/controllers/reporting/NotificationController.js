const Notification = require('../../models/reporting/Notification');

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const logger = require('../../logging/index').logger;

const { checkValid } = require('../../utils/utils');



createInvalidNotifications = async (notificationData) => {
    var bulkInsertResult;
    try {
        bulkInsertResult = await Notification.insertMany(notificationData);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                        errorDescription: `Error saving 'invalid_knowledge' Notification(s)`,
                        function: 'createInvalidNotifications'});
        throw new Error(`Error saving 'invalid_knowledge' Notification(s)`);
    }

    await logger.info({source: 'backend-api',
                        message: `Successfully created ${notificationData.length} 'invalid_knowledge' Notifications`,
                        function: 'createInvalidNotifications'});

    return bulkInsertResult;
}

createToDocumentNotification = async (notification) => {

    var createResponse;
    try {
        createResponse = await Notification.create(notification);
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error creating 'to_document' Notification`,
                            function: 'createToDocumentNotification'});

        throw new Error(`Error creating 'to_document' Notification`);
    }
    await logger.info({source: 'backend-api',
                        message: `Successfully created 'to_document' Notification`,
                        function: 'createToDocumentNotification'});

    return createResponse;
}

createRemovedNotifications = async (notificationData) => {

    var bulkInsertResult;
    try {
        bulkInsertResult = await Notification.insertMany(notificationData);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                        errorDescription: `Error saving 'removed_workspace' Notification(s)`,
                        function: 'createRemovedNotifications'});
        throw new Error(`Error saving 'removed_workspace' Notification(s)`);
    }

    await logger.info({source: 'backend-api',
                        message: `Successfully created ${notificationData.length} 'removed_workspace' Notifications`,
                        function: 'createRemovedNotifications'});

    return bulkInsertResult;
}

createAddedNotifications = async (notificationData) => {

    var bulkInsertResult;
    try {
        bulkInsertResult = await Notification.insertMany(notificationData);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                        errorDescription: `Error inserting 'removed_workspace' Notification(s)`,
                        function: 'createAddedNotifications'});
        throw new Error(`Error inserting 'added_workspace' Notification(s)`);
    }

    await logger.info({source: 'backend-api',
                        message: `Successfully created ${notificationData.length} 'added_workspace' Notification(s)`,
                        function: 'createAddedNotifications'});

    return bulkInsertResult;
}


hideAllNotifications = async (req, res) => {
    const { workspaceId, userId } = req.params;

    if (!checkValid(workspaceId)) return res.json({success: false, error: 'hideAllNotifications: no workspaceId provided'});
    if (!checkValid(userId)) return res.json({success: false, error: 'hideAllNotifications: no userId provided'});

    try {
        await Notification.updateMany({ workspace: workspaceId, user: userId, status: "visible"}, { $set: { status: 'hidden' } });
    } catch (err) {
        await logger.error({source: 'backend-api',
        message: err,
        errorDescription: `Error setting notifications to 'hidden' - workspaceId: ${workspaceId}, userId: ${userId}`,
        function: "hideAllNotifications"});

        return res.json({success: false, error: `hideAllNotifications: Error setting notifications to 'hidden' - workspaceId: ${workspaceId}, userId: ${userId}`});
    }

    return res.json({success: true, result: 0});
}


setNotificationsHidden = async (req, res) => {

    const { notificationIds } = req.body;

    if (!checkValid(notificationIds)) return res.json({success: false, error: 'no notification notificationIds provided'});

    var updatedNotifications;
    try {
        await Notification.updateMany({ _id: { $in: notificationIds.map(id => ObjectId(id.toString())) }}, { $set: { status: 'hidden' } });
        updatedNotifications = await Notification.find({_id: { $in: notificationIds.map(id => ObjectId(id.toString())) }}).lean().exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error setting Notifications to 'hidden' - notificationIds: ${JSON.stringify(notificationIds)}`,
                            function: "setNotificationsHidden"});

        return res.json({success: false, error: `Error setting Notifications to 'hidden' - notificationIds: ${JSON.stringify(notificationIds)}`});
    }

    return res.json({success: true, updatedNotifications});
}


retrieveNotifications = async (req, res) => {

    const userId = req.userObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();

    var { skip, limit } = req.body;

    if (!checkValid(userId)) return res.json({success: false, error: "no notification userId provided"});
    if (!checkValid(workspaceId)) return res.json({success: false, error: "no notification workspaceId provided"});

    if (!checkValid(skip)) skip = 0;
    if (!checkValid(limit)) limit = 10;

    var retrieveResponse;
    try {
        retrieveResponse = await Notification.find({ workspace: workspaceId, user: userId })
            .populate({path: 'check repository user workspace'})
            .limit(limit).skip(skip).sort({created: -1}).exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error retrieving Notifications - workspaceId, userId, limit, skip: ${workspaceId}, ${userId}, ${limit}, ${skip}`,
                            function: "retrieveNotifications"});
        return res.json({success: false, error: `Error retrieving Notifications - workspaceId, userId, limit, skip: ${workspaceId}, ${userId}, ${limit}, ${skip}`});
    }

    return res.json({success: true, result: retrieveResponse});
}

getPendingCount = async (req, res) => {
    const userId = req.userObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();

    if (!checkValid(userId)) return res.json({success: false, error: "no notification userId provided"});
    if (!checkValid(workspaceId)) return res.json({success: false, error: "no notification workspaceId provided"});

    var unseenNum;
    try {
        unseenNum = await Notification.countDocuments({user: ObjectId(userId), workspace: ObjectId(workspaceId), status: 'visible'}).exec();
    }
    catch (err) {
        await logger.error({source: 'backend-api',
                            message: err,
                            errorDescription: `Error counting unseen Notifications - workspaceId, userId: ${workspaceId}, ${userId}`,
                            function: "getUnseenNotificationCount"});

        return res.json({success: false, error: `Error counting unseen Notifications - workspaceId, userId: ${workspaceId}, ${userId}`});
    }
    return res.json({success: true, result: unseenNum});
}



module.exports = { createInvalidNotifications, createToDocumentNotification, createRemovedNotifications,
                    createAddedNotifications, setNotificationsHidden, retrieveNotifications, getPendingCount, hideAllNotifications };
