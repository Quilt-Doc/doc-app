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

const { checkValid } = require("../../../utils/utils");

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

handleWebhookUpdateBoard = async (boardId, data) => {
    let board;

    try {
        board = await IntegrationBoard.findById(boardId)
            .select("name sourceId link")
            .exec();
    } catch (e) {
        throw new Error(e);
    }

    let externalBoard = data["board"];

    const { url: externalLink, name: externalName } = externalBoard;

    const { link, name } = board;

    let save = false;

    if (checkValid(externalLink) && link != externalLink) {
        board.link = externalLink;

        save = true;
    }

    if (checkValid(externalName) && name != externalName) {
        board.name = externalName;

        save = true;
    }

    if (save) {
        try {
            board = await board.save();
        } catch (e) {
            throw new Error(e);
        }
    }
};

handleWebhookCreateList = async (boardId, data) => {
    const { id, name } = data["list"];

    let list = new IntegrationColumn({
        name,
        source: "trello",
        sourceId: id,
        board: boardId,
    });

    try {
        list = await list.save();
    } catch (e) {
        throw new Error(e);
    }
};

handleWebhookDeleteList = async (boardId, data) => {
    const { id } = data["list"];

    try {
        await IntegrationColumn.findOneAndDelete({ sourceId: id });
    } catch (e) {
        throw new Error(e);
    }
};

handleWebhookUpdateList = async (boardId, data) => {
    const { id, name: externalName } = data["list"];

    let list;

    try {
        list = await IntegrationColumn.findOne({ sourceId: id })
            .select("name")
            .exec();
    } catch (e) {
        throw new Error(e);
    }

    const { name } = list;

    if (checkValid(externalName) && externalName != name) {
        list.name = externalName;

        try {
            list = await list.save();
        } catch (e) {
            throw new Error(e);
        }
    }
};

handleWebhookCreateLabel = async (boardId, data) => {
    const { color, name, id } = data["label"];

    let label = new IntegrationLabel({
        color,
        name,
        sourceId: id,
        source: "trello",
        board: boardId,
    });

    try {
        label = await label.save();
    } catch (e) {
        throw new Error(e);
    }
};

handleWebhookDeleteLabel = async (boardId, data) => {
    const { id } = data["label"];

    try {
        await IntegrationLabel.findOneAndDelete({
            board: boardId,
            sourceId: id,
        });
    } catch (e) {
        throw new Error(e);
    }
};

handleWebhookUpdateLabel = async (boardId, data) => {
    const { id, name: externalName, color: externalColor } = data["label"];

    let label;

    try {
        label = await IntegrationLabel.findOne({ sourceId: id })
            .select("name, color")
            .exec();
    } catch (e) {
        throw new Error(e);
    }

    const { name, color } = label;

    let save = false;

    if (checkValid(externalName) && externalName != name) {
        label.name = externalName;

        save = true;
    }

    if (checkValid(externalColor) && externalColor != color) {
        label.color = externalColor;

        save = true;
    }

    if (save) {
        try {
            label = await label.save();
        } catch (e) {
            throw new Error(e);
        }
    }
};

handleWebhookCreateMember = (boardId, data) => {
    const { id, username, fullName } = data["member"];

    let memberExists;

    try {
        memberExists = IntegrationUser.exists({ sourceId: id });
    } catch (e) {
        throw new Error(e);
    }

    if (!memberExists) {
        let member = new IntegrationUser({
            sourceId: id,
            source: "trello",
            userName: username,
            name: fullName,
        });

        try {
            member = member.save();
        } catch (e) {
            throw new Error(e);
        }
    }
};

handleWebhookUpdateMember = (boardId, data) => {
    const { username, fullName, id } = data["member"];

    let member;

    try {
        member = await IntegrationUser.findOne({ sourceId: id }).select("name userName");
    } catch (e) {
        throw new Error(e);
    }

    const { userName, name } = member;

    let save = false;

    if (checkValid(username) && username != userName) {
        member.userName = username;

        save = true;
    }

    if (checkValid(name) && name != fullName) {
        member.name = fullName;

        save = true;
    }
    
    if (save) {
        try {
            member = await member.save();
        } catch(e) {
            throw new Error(e);
        }
    }
};

module.exports = {
    setupTrelloWebhook,
    verifyTrelloWebhookRequest,
    handleWebhookUpdateBoard,
    handleWebhookCreateList,
    handleWebhookDeleteList,
    handleWebhookUpdateList,
    handleWebhookCreateLabel,
    handleWebhookDeleteLabel,
    handleWebhookUpdateLabel,
    handleWebhookCreateMember,
    handleWebhookUpdateMember,
};
