const OAuth = require("oauth").OAuth;
const url = require("url");
const axios = require("axios");

const Sentry = require("@sentry/node");

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const TrelloConnectProfile = require("../../../models/integrations/trello/TrelloConnectProfile");

const { TRELLO_API_KEY, TRELLO_SECRET } = process.env;

const requestURL = "https://trello.com/1/OAuthGetRequestToken";
const accessURL = "https://trello.com/1/OAuthGetAccessToken";
const authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";
const appName = "Quilt";
const scope = "read";
const expiration = "never";

const key = TRELLO_API_KEY;
const secret = TRELLO_SECRET;

const loginCallback = `http://localhost:3001/api/integrations/connect/trello/callback`;
const oauth = new OAuth(
    requestURL,
    accessURL,
    key,
    secret,
    "1.0A",
    loginCallback,
    "HMAC-SHA1"
);

const trelloAPI = axios.create({
    baseURL: "https://api.trello.com",
});

// Initial Authorization Methods

beginTrelloConnect = async (req, res) => {
    const { user_id } = req.query;

    const userId = user_id;

    try {
        await oauth.getOAuthRequestToken(
            async (error, token, tokenSecret, results) => {
                if (error) Sentry.captureMessage(error);

                try {
                    // user has only one connect profile for now
                    await TrelloConnectProfile.deleteMany({ user: userId });
                } catch (e) {
                    Sentry.captureException(e);
                }

                let trelloConnectProfile = new TrelloConnectProfile({
                    authorizeToken: token,
                    authorizeTokenSecret: tokenSecret,
                    user: ObjectId(userId),
                });

                try {
                    trelloConnectProfile = await trelloConnectProfile.save();
                } catch (e) {
                    Sentry.captureException(e);
                }

                console.log(
                    "SAVED TRELLO CONNECT PROFILE?",
                    trelloConnectProfile
                );

                res.redirect(
                    `${authorizeURL}?oauth_token=${token}&name=${appName}&scope=${scope}&expiration=${expiration}`
                );
            }
        );
    } catch (e) {
        Sentry.captureException(e);
    }
};

handleTrelloConnectCallback = async (req, res) => {
    const query = url.parse(req.url, true).query;

    const token = query.oauth_token;

    let trelloConnectProfile;

    try {
        trelloConnectProfile = await TrelloConnectProfile.findOne({
            authorizeToken: token,
        });
    } catch (e) {
        Sentry.captureException(e);
    }

    const { authorizeToken, authorizeTokenSecret } = trelloConnectProfile;

    const verifier = query.oauth_verifier;

    oauth.getOAuthAccessToken(
        authorizeToken,
        authorizeTokenSecret,
        verifier,
        async (error, accessToken, accessTokenSecret, results) => {
            if (error) Sentry.captureMessage(error);

            let response;

            try {
                response = await trelloAPI.get(
                    `/1/members/me/?key=${TRELLO_API_KEY}&token=${accessToken}`
                );
            } catch (e) {
                Sentry.captureException(e);
            }

            const {
                data: { id },
            } = response;

            trelloConnectProfile.accessToken = accessToken;
            trelloConnectProfile.accessTokenSecret = accessTokenSecret;
            trelloConnectProfile.sourceId = id;
            trelloConnectProfile.isReady = true;

            try {
                trelloConnectProfile = await trelloConnectProfile.save();
            } catch (e) {
                Sentry.captureException(e);
            }

            console.log(
                "FINISHED TRELLO CONNECT PROFILE",
                trelloConnectProfile
            );

            return res.redirect("http://getquilt.app");
        }
    );
};

handleTrelloDeauthorization = async (boardId) => {
    let board;

    try {
        board = await IntegrationBoard.findById(boardId);
    } catch (e) {
        throw new Error(e);
    }

    board.isDeauthorized = true;

    try {
        await boad.save();
    } catch (e) {
        throw new Error(e);
    }
};

handleTrelloReauthorization = async (boardId) => {
    console.log("BOO");
};

module.exports = {
    beginTrelloConnect,
    handleTrelloConnectCallback,
};
