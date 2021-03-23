//sentry
const Sentry = require("@sentry/node");

//models
const Workspace = require("../../../models/Workspace");

// google api
const { google } = require("googleapis");

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

const REDIRECT_URL =
    "http://localhost:3001/api/integrations/connect/google/callback";

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URL
);

// helpers
const {
    beginGoogleConnect,
    handleGoogleConnectCallback,
} = require("./GoogleAuthorizationController");

const {
    acquireGoogleConnectProfile,
    acquireExternalGoogleDrives,
    extractSharedDriveUsers,
    extractGoogleDrive,
    extractGoogleRawDocuments,
    extractPersonalDriveUsers,
    storeGoogleDocuments,
} = require("./GoogleControllerHelpers");

const { logger } = require("../../../fs_logging");

checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true;
    }
    return false;
};

getExternalGoogleDrives = async (req, res) => {
    const { userId, workspaceId } = req.params;

    logger.info(`Entered with userId: ${userId} workspaceId: ${workspaceId}`, {
        func: "getExternalGoogleDrives",
    });

    let profile;

    try {
        profile = await acquireGoogleConnectProfile(userId);
    } catch (e) {
        Sentry.captureException(e);

        logger.info(`Error during acquireGoogleConnectProfile.`, {
            func: "getExternalGoogleDrives",
            e: e,
        });

        return res.json({ success: false, error: e });
    }

    logger.info(`Does profile exist: ${checkValid(profile)}`, {
        func: "getExternalGoogleDrives",
        obj: profile,
    });

    if (!profile) return res.json({ success: true, result: null });

    logger.info(`Acquired profile with accessToken: ${profile.accessToken}.`, {
        func: "getExternalGoogleDrives",
        obj: profile,
    });

    let drives;

    try {
        drives = await acquireExternalGoogleDrives(profile);
    } catch (e) {
        Sentry.captureException(e);

        logger.info(`Could not extract external drives with profile.`, {
            func: "getExternalGoogleDrives",
            e: e,
        });

        return res.json({ success: true, error: e });
    }

    logger.info(`Acquired number of drives: ${drives.length}.`, {
        func: "getExternalGoogleDrives",
        obj: drives,
    });

    let workspace;

    try {
        workspace = await Workspace.findById(workspaceId)
            .lean()
            .select("drives")
            .populate("drives")
            .exec();
    } catch (e) {
        Sentry.captureException(e);

        logger.info(
            `Could not query workspace with workspaceId: ${workspaceId}.`,
            {
                func: "getExternalGoogleDrives",
                e: e,
            }
        );

        return res.json({ success: true, error: e });
    }

    logger.info(`Acquired workspace successfully.`, {
        func: "getExternalGoogleDrives",
        obj: workspace,
    });

    let integratedDriveSourceIds = workspace.drives
        ? workspace.drives.map((drive) => drive.sourceId)
        : [];

    logger.info(
        `Currently integrated drives length: ${integratedDriveSourceIds.length}.`,
        {
            func: "getExternalGoogleDrives",
            obj: workspace.drives,
        }
    );

    integratedDriveSourceIds = new Set(integratedDriveSourceIds);

    drives = drives.filter((drive) => {
        const { id } = drive;

        return !integratedDriveSourceIds.has(id);
    });

    logger.info(`Filtered drives length: ${drives.length}.`, {
        func: "getExternalGoogleDrives",
        obj: drives,
    });

    return res.json({ success: true, result: drives });
};

triggerGoogleScrape = async (req, res) => {
    const { userId, workspaceId } = req.params;

    // drives is [{ sourceId, repositoryIds }]
    let { drives } = req.body;

    let profile;

    try {
        profile = await acquireGoogleConnectProfile(userId);
    } catch (e) {
        Sentry.captureException(e);

        return res.json({ success: false, error: e });
    }

    /* CAN DO REINTEGRATION LATER
    let reintegratedDrives;

    try {
        const output = await handleTrelloReintegration(drives);

        drives = output.drives;

        reintegratedDrives = output.reintegratedDrives;
    } catch (e) {
        Sentry.captureException(e);

        console.log("FAILURE 2", e);

        return res.json({ success: false, error: e });
    }*/

    let result;

    try {
        result = await bulkScrapeGoogle(profile, drives, workspaceId);
    } catch (e) {
        Sentry.captureException(e);

        return res.json({ success: false, error: e });
    }

    // set up webhooks
    //await setupTrelloWebhook(profile, result, userId);

    // need to finally mutate workspace to add boards

    let workspace;

    try {
        workspace = Workspace.findById(workspaceId).select("drives").exec();
    } catch (e) {
        Sentry.captureException(e);

        return res.json({ success: false, error: e });
    }

    driveIds = result.map((drive) => drive._id);

    //reintegratedDriveIds = reintegratedDrives.map((drive) => drive._id);

    workspace.drives = [
        ...workspace.drives,
        ...driveIds,
        //...reintegratedDriveIds,
    ];

    try {
        workspace = workspace.save();
    } catch (e) {
        Sentry.captureException(e);
    }

    return res.json({
        success: true,
        result: { workspace, drives: [...result] },
    });
};

bulkScrapeGoogle = async (profile, drives, workspaceId) => {
    const { accessToken, refreshToken, scope, idToken } = profile;

    const workspace = Workspace.findById(workspaceId)
        .lean()
        .populate("memberUsers");

    const tokens = {
        access_token: accessToken,
        refresh_token: refreshToken,
        scope,
        id_token: idToken,
    };

    oauth2Client.setCredentials(tokens);

    const driveAPI = google.drive({ version: "v3", auth: oauth2Client });

    const docsAPI = google.docs({ version: "v1", auth: oauth2Client });

    let result = [];

    for (let i = 0; i < drives.length; i++) {
        const { isPersonal, sourceId: driveId, repositoryIds } = drives[i];

        let members;

        if (!isPersonal) {
            members = await extractSharedDriveUsers(
                driveAPI,
                driveId,
                workspace
            );
        }

        let drive = await extractGoogleDrive(
            driveAPI,
            drives[i],
            repositoryIds,
            userId,
            isPersonal
        );

        let documents = await extractGoogleRawDocuments(
            driveAPI,
            driveId,
            isPersonal
        );

        // populate members if personal
        if (isPersonal) {
            members = await extractPersonalDriveUsers(workspace, documents);
        }

        documents = await storeGoogleDocuments(
            docsAPI,
            drive,
            members,
            documents
        );

        result.push(drive);
    }

    return drives;
};

module.exports = {
    beginGoogleConnect,
    handleGoogleConnectCallback,
    getExternalGoogleDrives,
};
