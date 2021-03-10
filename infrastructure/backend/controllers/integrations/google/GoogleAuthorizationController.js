const { google } = require("googleapis");

const url = require("url");

const axios = require("axios");

const mongoose = require("mongoose");

const { ObjectId } = mongoose.Types;

//sentry
const Sentry = require("@sentry/node");

//models
const GoogleConnectProfile = require("../../../models/integrations/google/GoogleConnectProfile");

const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env;

const REDIRECT_URL =
    "http://localhost:3001/api/integrations/connect/google/callback";

const oauth2 = google.oauth2("v2");

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URL
);

const { logger } = require("../../../fs_logging");

beginGoogleConnect = (req, res) => {
    const { workspace_id, user_id } = req.query;

    const workspaceId = workspace_id;

    const userId = user_id;

    logger.info(`Entered with userId: ${userId} workspaceId: ${workspaceId}`, {
        func: "beginGoogleConnect",
    });

    if (!userId || !workspaceId) {
        Sentry.captureMessage("userId and/or workspaceId not provided.");

        logger.error(`userId and/or workspaceId not provided.`, {
            func: "beginGoogleConnect",
        });

        return;
    }

    let state = {};

    //if (userId) state.userId = userId;
    if (workspaceId) state.workspaceId = workspaceId;

    if (userId) state.userId = userId;

    state = Buffer.from(JSON.stringify(state)).toString("base64");

    scope = [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/documents",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email",
    ];

    const URL = oauth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope,
        state,
    });

    logger.info(`Generated authorization URL.`, {
        func: "beginGoogleConnect",
        obj: URL,
    });

    res.redirect(URL);
};

// OAUTH CALLBACK USING REDIRECT URI

handleGoogleConnectCallback = async (req, res) => {
    const query = url.parse(req.url, true).query;
    //console.log("QUERY", query);

    const { code, state } = query;

    let extraction;

    try {
        extraction = await oauth2Client.getToken(code);
    } catch (e) {
        logger.error(`Was not able to extract parameters from query code.`, {
            func: "handleGoogleConnectCallback",
            e,
        });

        Sentry.captureException(e);
    }

    const { tokens } = extraction;

    const { access_token, refresh_token, scope, id_token } = tokens;

    logger.info(
        `Extracted tokens access_token: ${access_token}, refresh_token: ${refresh_token}, scope: ${scope}, id_token: ${id_token}.`,
        {
            func: "handleGoogleConnectCallback",
        }
    );

    const { workspaceId, userId } = JSON.parse(
        Buffer.from(state, "base64").toString()
    );

    logger.info(
        `Retrieved workspaceId: ${workspaceId} and userId: ${userId} from state.`,
        {
            func: "handleGoogleConnectCallback",
        }
    );

    /* Can use this for axios calls to google api
    const config = {
        headers: {
            Authorization: `Bearer ${access_token}`
        }
    }*/

    oauth2Client.setCredentials(tokens);

    let response;

    try {
        response = await oauth2.userinfo.get({ auth: oauth2Client });
    } catch (e) {
        logger.error(`Failed to extract user.`, {
            func: "handleGoogleConnectCallback",
            e,
        });

        Sentry.captureException(e);
    }

    const googleUser = response.data;

    let googleConnectProfile = new GoogleConnectProfile({
        accessToken: access_token,
        refreshToken: refresh_token,
        idToken: id_token,
        scope,
        sourceId: googleUser.id,
        user: ObjectId(userId),
        isReady: true,
    });

    try {
        googleConnectProfile = await googleConnectProfile.save();
    } catch (e) {
        logger.error(`Failed to save googleConnectProfile.`, {
            func: "handleGoogleConnectCallback",
            e,
        });

        Sentry.captureException(e);
    }

    logger.info(`Saved googleConnectProfile.`, {
        func: "handleGoogleConnectCallback",
        obj: googleConnectProfile,
    });

    return res.redirect("http://getquilt.app");
};

module.exports = {
    beginGoogleConnect,
    handleGoogleConnectCallback,
};
