// TODO: Need to validate email (both syntax, and for uniqueness)

const User = require("../../models/authentication/User");
const Workspace = require("../../models/Workspace");

var mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const logger = require("../../logging/index").logger;
const beginEmailVerification = require("./EmailVerifyController")
    .beginEmailVerification;

const { checkValid } = require("../../utils/utils");

getUser = async (req, res) => {
    const userId = req.userObj._id.toString();

    let returnedUser;

    try {
        returnedUser = await User.findById(userId)
            .populate("workspaces")
            .lean()
            .exec();
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error Failed to fetch User - userId: ${userId}`,
            function: "getUser",
        });
        return res.json({
            success: false,
            error: "getUser Error: findbyId query failed",
            trace: err,
        });
    }

    return res.json({ success: true, result: returnedUser });
};

editUser = async (req, res) => {
    const userId = req.userObj._id.toString();
    const {
        username,
        email,
        firstName,
        lastName,
        onboarded,
        verified,
        domain,
        bio,
        organization,
        position,
        isOnboarded,
    } = req.body;

    let update = {};
    if (checkValid(username)) update.username = username;

    if (checkValid(email)) {
        // Check that another User with email doesn't exist
        var emailUsed = false;

        try {
            emailUsed = await User.exists({
                _id: { $ne: ObjectId(userId) },
                email: email,
            });
        } catch (err) {
            await logger.error({
                source: "backend-api",
                message: err,
                errorDescription: `Error User exists query failed - userId, email: ${userId}, ${email}`,
                function: "editUser",
            });

            return res.json({
                success: false,
                error: `Error User exists query failed`,
                trace: err,
            });
        }

        if (emailUsed) {
            return res.json({
                success: false,
                error: `User with email ${email} already exists.`,
                alert: `User with email ${email} already exists.`,
            });
        }

        update.email = email;
        update.verified = false;
    }

    if (checkValid(firstName)) update.firstName = firstName;

    if (checkValid(lastName)) update.lastName = lastName;

    if (checkValid(onboarded)) update.onboarded = onboarded;

    if (checkValid(organization)) update.organization = organization;

    if (checkValid(position)) update.position = position;

    if (checkValid(isOnboarded)) update.isOnboarded = isOnboarded;

    let returnedUser;

    try {
        returnedUser = await User.findByIdAndUpdate(
            userId,
            { $set: update },
            { new: true }
        )
            .populate("workspaces")
            .lean()
            .exec();
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error Failed to findByIdAndUpdate User - userId, update: ${userId}, ${JSON.stringify(
                update
            )}`,
            function: "editUser",
        });

        return res.json({
            success: false,
            error: "editUser Error: findbyIdAndUpdate query failed",
            trace: err,
        });
    }

    // Send Verification Email, if User email changed
    if (checkValid(email)) {
        try {
            await beginEmailVerification(userId, email);
        } catch (err) {
            await logger.error({
                source: "backend-api",
                message: err,
                errorDescription: `Error Failed to beginEmailVerification - userId, email: ${userId}, ${email}`,
                function: "editUser",
            });

            return res.json({
                success: false,
                error:
                    "editUser: beginEmailVerification of email for edit failed",
                trace: err,
            });
        }
    }

    return res.json({ success: true, result: returnedUser });
};

attachUserWorkspace = async (req, res) => {
    const userId = req.userObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();

    let update = {};
    update.workspaces = ObjectId(workspaceId);

    let returnedUser;

    try {
        returnedUser = await User.findByIdAndUpdate(
            userId,
            { $push: update },
            { new: true }
        )
            .populate("workspaces")
            .lean()
            .exec();
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error Failed to findByIdAndUpdate User - userId: ${userId}`,
            function: "attachUserWorkspace",
        });
        return res.json({
            success: false,
            error: "attachUserWorkspace Error: findbyIdAndUpdate query failed",
            trace: err,
        });
    }

    return res.json({ success: true, result: returnedUser });
};

removeUserWorkspace = async (req, res) => {
    const userId = req.userObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();

    let update = {};
    update.workspaces = ObjectId(workspaceId);

    let returnedUser;

    try {
        returnedUser = await User.findByIdAndUpdate(
            userId,
            { $pull: update },
            { new: true }
        )
            .populate("workspaces")
            .lean()
            .exec();
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error Failed to findByIdAndUpdate User - userId: ${userId}`,
            function: "removeUserWorkspace",
        });
        return res.json({
            success: false,
            error: "removeUserWorkspace Error: findbyIdAndUpdate query failed",
            trace: err,
        });
    }

    return res.json({ success: true, result: returnedUser });
};

deleteUser = async (req, res) => {
    const userId = req.userObj._id.toString();
    const workspaceId = req.workspaceObj._id.toString();

    let update = {};
    update.workspaces = ObjectId(workspaceId);

    let returnedUser;

    try {
        returnedUser = await User.findByIdAndRemove(userId)
            .select("_id")
            .lean()
            .exec();
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error Failed to findByIdAndRemove User - userId: ${userId}`,
            function: "deleteUser",
        });
        return res.json({
            success: false,
            error: "deleteUser Error: findbyIdAndRemove query failed",
            trace: err,
        });
    }

    // Remove user from all Workspaces they were in

    try {
        await Workspace.updateMany(
            { memberUsers: { $in: [ObjectId(userId)] } },
            { memberUsers: { $pull: ObjectId(userId) } }
        );
    } catch (err) {
        await logger.error({
            source: "backend-api",
            message: err,
            errorDescription: `Error Failed to remove User from Workspaces - userId: ${userId}`,
            function: "deleteUser",
        });
        return res.json({
            success: false,
            error: "Error Failed to remove User from Workspaces",
            trace: err,
        });
    }

    // Should we delete User's Documents / Snippets as well? Probably Not.

    return res.json({ success: true, result: returnedUser });
};

module.exports = {
    getUser,
    editUser,
    attachUserWorkspace,
    removeUserWorkspace,
    deleteUser,
};
