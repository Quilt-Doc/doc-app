const axios = require("axios");

const _ = require("lodash");

const isUrl = require("is-url");

const Sentry = require("@sentry/node");

const mongoose = require("mongoose");

const crypto = require("crypto");

const TrelloConnectProfile = require("../../../models/integrations/trello/TrelloConnectProfile");

const IntegrationUser = require("../../../models/integrations/integration_objects/IntegrationUser");
const IntegrationBoard = require("../../../models/integrations/integration_objects/IntegrationBoard");
const IntegrationColumn = require("../../../models/integrations/integration_objects/IntegrationColumn");
const IntegrationEvent = require("../../../models/integrations/integration_objects/IntegrationEvent");
const IntegrationLabel = require("../../../models/integrations/integration_objects/IntegrationLabel");
const IntegrationAttachment = require("../../../models/integrations/integration_objects/IntegrationAttachment");
const IntegrationInterval = require("../../../models/integrations/integration_objects/IntegrationInterval");
const IntegrationTicket = require("../../../models/integrations/integration_objects/IntegrationTicket");
const BoardWorkspaceContext = require("../../../models/integrations/context/BoardWorkspaceContext");
const Workspace = require("../../../models/Workspace");
const User = require("../../../models/authentication/User");
const Repository = require("../../../models/Repository");

const { TRELLO_API_KEY, LOCALHOST_API_URL, TRELLO_SECRET } = process.env;

const trelloAPI = axios.create({
    baseURL: "https://api.trello.com",
});

setupTrelloWebhook = async (profile, boards, workspaceId, userId) => {
    const { accessToken } = profile;

    for (let i = 0; i < boards.length; i++) {
        const board = boards[i];

        const { sourceId, _id: boardId } = board;

        try {
            await trelloAPI.post(
                `/1/tokens/${accessToken}/webhooks/?key=${TRELLO_API_KEY}`,
                {
                    description: `Webhook for board with trello sourceId: ${sourceId}`,
                    callbackURL: `${LOCALHOST_API_URL}/integrations/${workspaceId}/${userId}/trello/handle_webhook/${boardId}`,
                    idModel: sourceId,
                }
            );
        } catch (e) {
            throw new Error(e);
        }
    }
};

verifyTrelloWebhookRequest = (request) => {
    const base64Digest = (s) => {
        return crypto
            .createHmac("sha1", TRELLO_SECRET)
            .update(s)
            .digest("base64");
    };

    const callbackURL = `${request.protocol}://${request.get("host")}${
        request.originalUrl
    }`;

    const content = JSON.stringify(request.body) + callbackURL;

    const doubleHash = base64Digest(content);

    const headerHash = request.headers["x-trello-webhook"];

    return doubleHash == headerHash;
};

module.exports = {
    setupTrelloWebhook,
    verifyTrelloWebhookRequest,
};
