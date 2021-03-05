/*
const axios = require("axios");

const _ = require("lodash");

const isUrl = require("is-url");

const crypto = require("crypto");

const IntegrationUser = require("../../../models/integrations/integration_objects/IntegrationUser");
const IntegrationBoard = require("../../../models/integrations/integration_objects/IntegrationBoard");
const IntegrationColumn = require("../../../models/integrations/integration_objects/IntegrationColumn");
const IntegrationLabel = require("../../../models/integrations/integration_objects/IntegrationLabel");
const IntegrationAttachment = require("../../../models/integrations/integration_objects/IntegrationAttachment");
const IntegrationInterval = require("../../../models/integrations/integration_objects/IntegrationInterval");
const IntegrationTicket = require("../../../models/integrations/integration_objects/IntegrationTicket");
const Repository = require("../../../models/Repository");
const Association = require("../../../models/associations/Association");

const { acquireTrelloConnectProfile } = require("./TrelloControllerHelpers");

const { TRELLO_API_KEY, LOCALHOST_API_URL, TRELLO_SECRET } = process.env;

const trelloAPI = axios.create({
    baseURL: "https://api.trello.com",
});

const { checkValid } = require("../../../utils/utils");

setupTrelloWebhook = async (profile, boards, userId) => {
    const { accessToken } = profile;

    for (let i = 0; i < boards.length; i++) {
        const board = boards[i];

        const { sourceId, _id: boardId } = board;

        const description = `Webhook for board with trello sourceId: ${sourceId}`;

        const callbackURL = `${LOCALHOST_API_URL}/integrations/${boardId}/${userId}/trello/handle_webhook`;

        const idModel = sourceId;

        try {
            await trelloAPI.post(
                `/1/tokens/${accessToken}/webhooks/?key=${TRELLO_API_KEY}&token=${accessToken}&callbackURL=${callbackURL}&idModel=${idModel}&description=${description}`
            );
        } catch (e) {
            throw new Error(e);
        }
    }
};

deleteTrelloWebhook = async (boardId) => {
    let userId;

    try {
        const board = await IntegrationBoard.findById(boardId)
            .select("integrationCreator")
            .lean()
            .exec();

        userId = board.integrationCreator;
    } catch (e) {
        throw new Error(e);
    }

    let profile;

    try {
        profile = await acquireTrelloConnectProfile(userId);
    } catch (e) {
        throw new Error(e);
    }

    const { accessToken } = profile;

    let webhooks;

    try {
        webhooks = await trelloAPI.get(`/1/tokens/${accessToken}/webhooks`);
    } catch (e) {
        throw new Error(e);
    }

    // Should be only 1
    webhooks = webhooks.filter((hook) => hook.idModel == boardId);

    for (let i = 0; i < webhooks.length; i++) {
        const { id } = webhooks[i];

        try {
            await trelloAPI.delete(`/1/webhooks/${id}`);
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

handleWebhookUpdateBoard = async (boardId, profile, data) => {
    const { id } = data["board"];

    const { accessToken } = profile;

    let externalBoard;

    try {
        externalBoard = await trelloAPI.get(
            `/1/cards/${id}?key=${TRELLO_API_KEY}&token=${accessToken}&fields=name,url`
        );
    } catch (e) {
        throw new Error(e);
    }

    const { url: externalLink, name: externalName } = externalBoard;

    let board;

    try {
        board = await IntegrationBoard.findById(boardId)
            .select("name sourceId link")
            .exec();
    } catch (e) {
        throw new Error(e);
    }

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

handleWebhookDeleteList = async (data) => {
    const { id } = data["list"];

    try {
        await IntegrationColumn.findOneAndDelete({ sourceId: id });
    } catch (e) {
        throw new Error(e);
    }
};

// may need to handle archiving list
handleWebhookUpdateList = async (data) => {
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

handleWebhookCreateLabel = async (boardId, profile, data) => {
    const { id } = data["label"];

    const { accessToken } = profile;

    let externalLabel;

    try {
        externalLabel = await trelloAPI.get(
            `/1/labels/${id}?key=${TRELLO_API_KEY}&token=${accessToken}`
        );
    } catch (e) {
        throw new Error(e);
    }

    const { color, name } = externalLabel;

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

handleWebhookDeleteLabel = async (data) => {
    const { id } = data["label"];

    try {
        await IntegrationLabel.findOneAndDelete({
            sourceId: id,
        });
    } catch (e) {
        throw new Error(e);
    }
};

handleWebhookUpdateLabel = async (data) => {
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

// at same level as data
handleWebhookCreateMember = (externalMember) => {
    const { id, username, fullName } = externalMember;

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

handleWebhookUpdateMember = async (externalMember) => {
    const { username, fullName, id } = externalMember;

    let member;

    try {
        member = await IntegrationUser.findOne({ sourceId: id }).select(
            "name userName"
        );
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
        } catch (e) {
            throw new Error(e);
        }
    }
};

addDays = (date, days) => {
    let result = new Date(date);

    result.setDate(result.getDate() + days);

    return result;
};

parseDescriptionAttachments = (desc) => {
    let tokens = desc.split(" ");

    tokens = tokens
        .filter((token) => isUrl(token))
        .filter((token) => token.includes("https://github.com"));

    const attachments = tokens.map((token) => {
        return token;
    });

    return attachments;
};

// may need to add attachments
handleWebhookCreateCard = async (boardId, profile, data) => {
    const { accessToken } = profile;

    const { id, name } = data["card"];

    let externalCard;

    try {
        externalCard = await trelloAPI.get(
            `/1/cards/${id}?key=${TRELLO_API_KEY}&token=${accessToken}&fields=all&actions=updateCard:idList&actions_limit=1000&action_member=false`
        );
    } catch (e) {
        throw new Error(e);
    }

    const {
        closed,
        dateLastActivity,
        desc,
        due,
        idLabels,
        idList,
        idMembers,
        actions,
        name,
        url,
    } = externalCard;

    let card = new IntegrationTicket({
        name,
        link: url,
    });

    if (checkValid(closed)) {
        card.trelloCardDueComplete = closed;
    }

    if (checkValid(dateLastActivity)) {
        card.trelloCardDateLastActivity = new Date(dateLastActivity);
    }

    if (checkValid(desc)) {
        card.description = desc;

        const attachmentUrls = parseDescriptionAttachments(desc);

        try {
            newAttachments = await Promise.all(
                attachmentUrls.map((attUrl) => {
                    const newAttachment = new IntegrationAttachment({
                        link: attUrl,
                        board: boardId,
                    });

                    return newAttachment.save();
                })
            );
        } catch (e) {
            throw new Error(e);
        }

        card.attachments = newAttachments.map((att) => att._id);
    }

    if (checkValid(due)) {
        card.trelloCardDue = new Date(due);
    }

    if (checkValid(idLabels) && idLabels.length > 0) {
        try {
            const labels = await IntegrationLabel.find({
                sourceId: { $in: idLabels },
            })
                .select("_id")
                .lean()
                .exec();

            card.labels = labels.map((label) => label._id);
        } catch (e) {
            throw new Error(e);
        }
    }

    if (checkValid(idList)) {
        try {
            const column = await IntegrationColumn.findOne({
                sourceId: idList,
            })
                .select("_id")
                .lean()
                .exec();

            card.column = column;
        } catch (e) {
            throw new Error(e);
        }
    }

    if (checkValid(idMembers) && idMembers.length > 0) {
        try {
            const members = await IntegrationUser.find({
                sourceId: { $in: idMembers },
            })
                .select("_id")
                .lean()
                .exec();

            card.members = members.map((member) => member._id);
        } catch (e) {
            throw new Error(e);
        }
    }

    if (checkValid(actions) && actions.length > 0) {
        actions.map(
            (action) => (action.date = new Date(action.date).getTime())
        );

        actions.sort((a, b) => {
            return a.date.getTime() > b.date.getTime() ? -1 : 1;
        });

        const relevantActions = actions.slice(0, 2);

        const intervals = relevantActions.map((action) => {
            return new IntegrationInterval({
                start: addDays(new Date(action.date), -10),
                end: new Date(action.date),
                board: boardId,
            });
        });

        const intervals = await Promise.all(
            intervals.map((interval) => interval.save())
        );

        card.intervals = intervals.map((interval) => interval._id);
    }

    try {
        card = await card.save();
    } catch (e) {
        throw new Error(e);
    }

    await generateAttachmentAssociations(card.attachments, card, boardId);
};

handleWebhookUpdateCard = async (boardId, profile, data) => {
    const { accessToken } = profile;

    const { id } = data["card"];

    let externalCard;

    try {
        externalCard = await trelloAPI.get(
            `/1/cards/${id}?key=${TRELLO_API_KEY}&token=${accessToken}&fields=all&actions=updateCard:idList&actions_limit=1000&action_member=false`
        );
    } catch (e) {
        throw new Error(e);
    }

    const {
        idList,
        dateLastActivity,
        desc,
        actions,
        name: externalName,
        due,
        dueComplete,
        url,
    } = externalCard;

    let card;

    try {
        card = await IntegrationTicket.findOne({ sourceId: id })
            .populate({ path: "column attachments" })
            .select(
                "column trelloCardDateLastActivity description name trelloCardDue trelloCardDueComplete link intervals attachments"
            );
    } catch (e) {
        throw new Error(e);
    }

    const {
        column: { sourceId: listSourceId, _id: listId },
        trelloCardDateLastActivity,
        description,
        name,
        trelloCardDue,
        trelloCardDueComplete,
        link,
    } = card;

    let save = false;

    let interval;

    let newAttachments;

    if (checkValid(idList) && idList != listSourceId) {
        try {
            const column = await IntegrationColumn.findOne({
                sourceId: idList,
            })
                .select("_id")
                .lean()
                .exec();

            card.column = column._id;
        } catch (e) {
            throw new Error(e);
        }

        if (actions.length > 0) {
            actions = actions.map(
                (action) => (action.date = new Date(action.date))
            );

            actions.sort((a, b) => {
                return a.date.getTime() > b.date.getTime() ? -1 : 1;
            });

            const { date } = action.slice(0, 1)[0];

            interval = new IntegrationInterval({
                start: addDays(new Date(date), -10),
                end: new Date(date),
                board: boardId,
            });

            try {
                interval = await interval.save();
            } catch (e) {
                throw new Error(e);
            }

            card.intervals.push(interval);
        }

        save = true;
    } else {
        card.column = listId;
    }

    if (
        checkValid(dateLastActivity) &&
        new Date(dateLastActivity).getTime() !=
            trelloCardDateLastActivity.getTime()
    ) {
        card.trelloCardDateLastActivity = new Date(dateLastActivity);

        save = true;
    }

    if (checkValid(desc) && desc != description) {
        card.description = desc;

        const attachmentUrls = parseDescriptionAttachments(desc);

        const alreadyAttached = new Set(card.attachments.map((att) => att.url));

        try {
            newAttachments = await Promise.all(
                attachmentUrls
                    .filter((attUrl) => {
                        !alreadyAttached.includes(attUrl);
                    })
                    .map((attUrl) => {
                        const newAttachment = new IntegrationAttachment({
                            link: attUrl,
                            board: boardId,
                        });

                        return newAttachment.save();
                    })
            );
        } catch (e) {
            throw new Error(e);
        }

        card.attachments = [
            ...newAttachments.map((att) => att._id),
            ...card.attachments.map((att) => att._id),
        ];

        save = true;
    } else {
        card.attachments = card.attachments.map((att) => att._id);
    }

    if (checkValid(externalName) && name != externalName) {
        card.name = externalName;

        save = true;
    }

    if (
        checkValid(due) &&
        new Date(due).getTime() != new Date(trelloCardDue).getTime()
    ) {
        card.trelloCardDue = new Date(due);

        save = true;
    }

    if (checkValid(dueComplete) && dueComplete != trelloCardDueComplete) {
        card.trelloCardDueComplete = dueComplete;

        save = true;
    }

    if (checkValid(url) && url != link) {
        card.link = url;

        save = true;
    }

    if (save) {
        try {
            card = card.save();
        } catch (e) {
            throw new Error(e);
        }
    }

    await generateAttachmentAssociations(newAttachments, card, boardId);
};

handleWebhookAddAttachment = async (boardId, data) => {
    const { card: externalCard, attachment: externalAttachment } = data;

    const { id: cardSourceId } = externalCard;

    const { url } = externalAttachment;

    if (!url || !url.includes("https://github.com")) return;

    let attachment;

    try {
        attachment = new IntegrationAttachment({
            link: url,
            board: boardId,
        });

        try {
            attachment = await attachment.save();
        } catch (e) {
            throw new Error(e);
        }
    } catch (e) {
        throw new Error(e);
    }

    let card;

    try {
        card = await IntegrationTicket.find({ sourceId: cardSourceId });
    } catch (e) {
        throw new Error(e);
    }

    card.attachments.push(attachment._id);

    try {
        card = await card.save();
    } catch (e) {
        throw new Error(e);
    }

    await generateAttachmentAssociations([attachment], card, boardId);
};

handleWebhookDeleteCard = async (data) => {
    const { id } = data["card"];

    let ticket;

    try {
         ticket = await IntegrationTicket.findOne({ sourceId: id});
    } catch (e) {
         throw new Error(e);
    }
    
    const modelMap = {
        attachments: IntegrationAttachment,
        intervals: IntegrationInterval,
    }

    try {
        await Promise.all(Object.keys(modelMap).map((key) => {
        
            const model = modelMap[key];

            const modelIds = ticket[key];

            return model.deleteMany({ _id: { $in: modelIds }});
        }));
    } catch (e) {
        throw new Error(e);
    }

    try {
        Association.deleteMany({ firstElement: ticket._id });
    } catch (e) {
        throw new Error(e);
    }

    try {
        await IntegrationTicket.findOneAndDelete({ sourceId: id });
    } catch (e) {
        throw new Error(e);
    }
};

handleWebhookAddLabel = async (data) => {
    const {
        card: { id: cardSourceId },
        label: { id: labelSourceId },
    } = data;

    let label;

    try {
        label = await IntegrationLabel.findOne({
            sourceId: labelSourceId,
        });
    } catch (e) {
        throw new Error(e);
    }

    if (label) {
        let card;

        try {
            card = await IntegrationTicket.findOne({
                sourceId: cardSourceId,
            });
        } catch (e) {
            throw new Error(e);
        }

        card.labels.push(label._id);

        try {
            card = await card.save();
        } catch (e) {
            throw new Error(e);
        }
    }
};

handleWebhookRemoveLabel = async (data) => {
    const {
        card: { id: cardSourceId },
        label: { id: labelSourceId },
    } = data;

    let label;

    try {
        label = await IntegrationLabel.findOne({
            sourceId: labelSourceId,
        });
    } catch (e) {
        throw new Error(e);
    }

    if (label) {
        let card;

        try {
            card = await IntegrationTicket.findOne({
                sourceId: cardSourceId,
            });
        } catch (e) {
            throw new Error(e);
        }

        card.labels = card.labels.filter((labelId) => labelId != label._id);

        try {
            card = await card.save();
        } catch (e) {
            throw new Error(e);
        }
    }
};

handleWebhookAddMember = async (data) => {
    const {
        card: { id: cardSourceId },
        idMember: memberSourceId,
    } = data;

    let member;

    try {
        member = await IntegrationMember.findOne({
            sourceId: memberSourceId,
        });
    } catch (e) {
        throw new Error(e);
    }

    if (member) {
        let card;

        try {
            card = await IntegrationTicket.findOne({
                sourceId: cardSourceId,
            });
        } catch (e) {
            throw new Error(e);
        }

        card.members.push(member._id);

        try {
            card = await card.save();
        } catch (e) {
            throw new Error(e);
        }
    }
};

handleWebhookRemoveMember = async (data) => {
    const {
        card: { id: cardSourceId },
        idMember: memberSourceId,
    } = data;

    let member;

    try {
        member = await IntegrationMember.findOne({
            sourceId: memberSourceId,
        });
    } catch (e) {
        throw new Error(e);
    }

    if (member) {
        let card;

        try {
            card = await IntegrationTicket.findOne({
                sourceId: cardSourceId,
            });
        } catch (e) {
            throw new Error(e);
        }

        card.members = card.members.filter(
            (memberId) => memberId != member._id
        );

        try {
            card = await card.save();
        } catch (e) {
            throw new Error(e);
        }
    }
};

generateAttachmentAssociations = async (attachments, card, boardId) => {
    const modelTypeMap = {
        tree: "branch",
        issues: "issue",
        pull: "pullRequest",
        commit: "commit",
    };

    let attReqs = [];

    for (let i = 0; i < attachments.length; i++) {
        const att = attachments[i];

        const { link: url } = att;

        const splitURL = url.split("/");

        try {
            if (splitURL.length < 2) return null;

            let githubType = splitURL.slice(
                splitURL.length - 2,
                splitURL.length - 1
            )[0];

            const modelType = modelTypeMap[githubType];

            if (!modelType) return;

            const sourceId = splitURL.slice(splitURL.length - 1)[0];

            const fullName = splitURL
                .slice(splitURL.length - 4, splitURL.length - 2)
                .join("/");

            attachment.modelType = modelType;

            attachment.sourceId = sourceId;

            let repository;

            try {
                repository = await Repository.findOne({ fullName: fullName });
            } catch (e) {
                throw new Error(e);
            }

            if (repository) {
                attachment.repository = repository._id;
            }

            attReqs.push(attachment.save());
        } catch (e) {
            continue;
        }
    }

    try {
        attachments = await Promise.all(attReqs);
    } catch (e) {
        throw new Error(e);
    }

    const modelTypeToModel = {
        branch: Branch,
        issue: IntegrationTicket,
        pullRequest: PullRequest,
        commit: Commit,
    };

    let assocInsertOps = [];

    for (let i = 0; i < attachments.length; i++) {
        const { repository, sourceId, modelType } = attachments[i];

        let codeObject;

        if (modelType == "issue") {
            codeObject = await IntegrationTicket.findOne({
                sourceId,
                repositoryId: repository,
            });
        } else {
            codeObject = await modelTypeToModel[modelType].findOne({
                sourceId,
                repository,
            });
        }

        if (codeObject) {
            assocInsertOps.push({
                firstElement: card._id,
                firstElementModelType: "IntegrationTicket",
                secondElement: codeObject._id,
                secondElementModelType: mongModelMapping[modelType],
                repository: codeObject.repository,
                board: boardId,
                direct: true,
            });
        }
    }

    try {
        Association.insertMany(assocInsertOps);
    } catch (e) {
        throw new Error(e);
    }
};

module.exports = {
    setupTrelloWebhook,
    verifyTrelloWebhookRequest,
    deleteTrelloWebhook,
    handleWebhookUpdateBoard,
    handleWebhookCreateList,
    handleWebhookDeleteList,
    handleWebhookUpdateList,
    handleWebhookCreateLabel,
    handleWebhookDeleteLabel,
    handleWebhookUpdateLabel,
    handleWebhookCreateMember,
    handleWebhookUpdateMember,
    handleWebhookCreateCard,
    handleWebhookUpdateCard,
    handleWebhookDeleteCard,
    handleWebhookAddAttachment,
    handleWebhookAddLabel,
    handleWebhookRemoveLabel,
    handleWebhookAddMember,
    handleWebhookRemoveMember,
};
*/
