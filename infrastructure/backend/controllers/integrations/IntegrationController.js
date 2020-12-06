const http = require('http')
const OAuth = require('oauth').OAuth
const url = require('url')
const axios = require('axios');

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const Integration = require('../../models/Integration');

const { TRELLO_API_KEY, TRELLO_SECRET, IS_PRODUCTION,
    LOCALHOST_HOME_PAGE_URL, PRODUCTION_HOME_PAGE_URL } = process.env;

const requestURL = "https://trello.com/1/OAuthGetRequestToken";
const accessURL = "https://trello.com/1/OAuthGetAccessToken";
const authorizeURL = "https://trello.com/1/OAuthAuthorizeToken";
const appName = "Quilt";
const scope = 'read';
const expiration = 'never';

const key = TRELLO_API_KEY;
const secret = TRELLO_SECRET;

const loginCallback =  `http://localhost:3001/api/integrations/trello/callback`;
const oauth = new OAuth(requestURL, accessURL, key, secret, "1.0A", loginCallback, "HMAC-SHA1");

const oauth_secrets = {};

const trelloAPI = axios.create({
    baseURL: "https://api.trello.com"
})

authorizeTrello = (req, res) => {
    const { user_id, workspace_id } = req.query;

    const userId = user_id;
    const workspaceId = workspace_id;

    oauth.getOAuthRequestToken((error, token, tokenSecret, results) => {
        oauth_secrets[token] =  { tokenSecret, userId, workspaceId };

        res.redirect(`${authorizeURL}?oauth_token=${token}&name=${appName}&scope=${scope}&expiration=${expiration}`);
    });
};

trelloCallback = (req, res) => {

    const query = url.parse(req.url, true).query;
    const token = query.oauth_token;
    const { tokenSecret, userId, workspaceId } = oauth_secrets[token];
    const verifier = query.oauth_verifier;

    oauth.getOAuthAccessToken(token, tokenSecret, verifier, async (error, accessToken, accessTokenSecret, results) => {
        // In a real app, the accessToken and accessTokenSecret should be stored
        console.log("RESULTS", results);

        const response = await trelloAPI.get(`/1/members/me/?key=${TRELLO_API_KEY}&token=${accessToken}`);
        const { data: {id, idBoards}} = response;

        

        let integration = new Integration(
            {
                profileId: id,
                user: ObjectId(userId),
                workspace: ObjectId(workspaceId),
                type: "trello",
                token: accessToken,
                tokenSecret: accessTokenSecret,
            }
        )
        try {
            await integration.save();
        } catch (err) {
            console.log(err);
        }

        

        res.redirect(LOCALHOST_HOME_PAGE_URL);

        /*
        oauth.getProtectedResource("https://api.trello.com/1/members/me", "GET", accessToken, accessTokenSecret, (error, data, response) => {
            console.log(accessToken)
            console.log(accessTokenSecret)
            console.log("DATA", data);
            // Now we can respond with data to show that we have access to your Trello account via OAuth
            res.send(data)
        });*/
    });
};

createIntegration = async (req, res) => {
    console.log("ENTERED HERE CREATE INTEGRATION");
    console.log("PARAMS", req.params);
    console.log("BODY", req.body);
    console.log("URL",  url.parse(req.url, true));
}

module.exports = {
    createIntegration,
    authorizeTrello,
    trelloCallback
}