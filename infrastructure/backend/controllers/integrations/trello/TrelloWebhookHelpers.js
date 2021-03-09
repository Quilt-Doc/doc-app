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
const Branch = require("../../../models/Branch");
const Commit = require("../../../models/Commit");
const PullRequest = require("../../../models/PullRequest");

const { acquireTrelloConnectProfile } = require("./TrelloControllerHelpers");

const { logger } = require("../../../fs_logging");

const {
    TRELLO_API_KEY,
    LOCALHOST_API_URL,
    TRELLO_SECRET,
    NGROK_URL,
} = process.env;

const trelloAPI = axios.create({
    baseURL: "https://api.trello.com",
});

const { checkValid } = require("../../../utils/utils");

setupTrelloWebhook = async (profile, boards, userId) => {
    logger.info("Entered with params.", {
        func: "setupTrelloWebhook",
        obj: {
            profile,
            boards,
            userId,
        },
    });

    const { accessToken } = profile;

    logger.info("Using accessToken.", {
        func: "setupTrelloWebhook",
        obj: accessToken,
    });

    for (let i = 0; i < boards.length; i++) {
        const board = boards[i];

        const { sourceId, _id: boardId } = board;

        const description = encodeURIComponent(
            `Webhook for board with trello sourceId: ${sourceId}`
        );

        const callbackURL = `${NGROK_URL}/api/integrations/${boardId}/${userId}/trello/handle_webhook`;

        const idModel = sourceId;

        logger.info("Creating webhook with description.", {
            func: "setupTrelloWebhook",
            obj: description,
        });

        logger.info(`Creating webhook with callbackURL.`, {
            func: "setupTrelloWebhook",
            obj: callbackURL,
        });

        logger.info(`Creating webhook with idModel.`, {
            func: "setupTrelloWebhook",
            obj: idModel,
        });

        const route = `/1/webhooks/?key=${TRELLO_API_KEY}&token=${accessToken}&callbackURL=${encodeURIComponent(
            callbackURL
        )}&idModel=${idModel}&description=${description}`;

        logger.info(`Using webhook route.`, {
            func: "setupTrelloWebhook",
            obj: route,
        });

        try {
            const response = await trelloAPI.post(
                route,
                {},
                {
                    headers: {
                        Accept: "application/json",
                    },
                }
            );
        } catch (e) {
            logger.error(`Error sending response.`, {
                func: "setupTrelloWebhook",
                obj: e,
            });

            throw new Error(e);
        }
    }
};

deleteTrelloWebhook = async (boardId) => {
    logger.info(`Entered with boardId.`, {
        func: "deleteTrelloWebhook",
        obj: boardId,
    });

    let userId;

    let board;

    try {
        logger.info(`Entered board request.`, {
            func: "deleteTrelloWebhook",
        });

        board = await IntegrationBoard.findById(boardId)
            .select("integrationCreator sourceId")
            .lean()
            .exec();

        logger.info(`Acquired board with creator.`, {
            func: "deleteTrelloWebhook",
            obj: board.integrationCreator,
        });

        userId = board.integrationCreator;
    } catch (e) {
        logger.error(`Error during board query.`, {
            func: "deleteTrelloWebhook",
            obj: e,
        });

        throw new Error(e);
    }

    let profile;

    try {
        profile = await acquireTrelloConnectProfile(userId);
    } catch (e) {
        throw new Error(e);
    }

    logger.info(`Acquired profile.`, {
        func: "deleteTrelloWebhook",
        obj: profile,
    });

    const { accessToken } = profile;

    let webhooks;

    try {
        const response = await trelloAPI.get(
            `/1/tokens/${accessToken}/webhooks?key=${TRELLO_API_KEY}&token=${accessToken}`
        );

        webhooks = response.data;
    } catch (e) {
        throw new Error(e);
    }

    logger.info(`Acquired all token webhooks.`, {
        func: "deleteTrelloWebhook",
        obj: webhooks,
    });

    webhooks = webhooks.filter((hook) => hook.idModel == board.sourceId);

    logger.info(`Acquired all board webhooks.`, {
        func: "deleteTrelloWebhook",
        obj: webhooks,
    });

    for (let i = 0; i < webhooks.length; i++) {
        const { id } = webhooks[i];

        try {
            await trelloAPI.delete(
                `/1/webhooks/${id}?key=${TRELLO_API_KEY}&token=${accessToken}`
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

    const callbackURL = `${request.protocol}s://${request.get("host")}${
        request.originalUrl
    }`;

    logger.info(`Created callbackURL.`, {
        func: "verifyTrelloWebhookRequest",
        obj: callbackURL,
    });

    const content = JSON.stringify(request.body) + callbackURL;

    const doubleHash = base64Digest(content);

    const headerHash = request.headers["x-trello-webhook"];

    return doubleHash == headerHash;
};

handleWebhookUpdateBoard = async (boardId, profile, data) => {
    logger.info(`Entered with params.`, {
        func: "handleWebhookUpdateBoard",
        obj: {
            boardId,
            profile,
            data,
        },
    });

    const { id } = data["board"];

    const { accessToken } = profile;

    let externalBoard;

    try {
        const response = await trelloAPI.get(
            `/1/boards/${id}?key=${TRELLO_API_KEY}&token=${accessToken}&fields=name,url`
        );

        externalBoard = response.data;
    } catch (e) {
        throw new Error(e);
    }

    logger.info(`Queried externalBoard.`, {
        func: "handleWebhookUpdateBoard",
        obj: externalBoard,
    });

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

    logger.info(`Should we save?`, {
        func: "handleWebhookUpdateBoard",
        obj: save,
    });

    if (save) {
        try {
            board = await board.save();

            logger.info(`Updated Board Successfully`, {
                func: "handleWebhookUpdateBoard",
                obj: board,
            });
        } catch (e) {
            throw new Error(e);
        }
    }
};

handleWebhookCreateList = async (boardId, data) => {
    const { id, name } = data["list"];

    logger.info(`Entered with params.`, {
        func: "handleWebhookCreateList",
        obj: {
            id,
            name,
        },
    });

    let list = new IntegrationColumn({
        name,
        source: "trello",
        sourceId: id,
        board: boardId,
    });

    try {
        list = await list.save();

        logger.info(`Created list succesfully.`, {
            func: "handleWebhookCreateList",
            obj: list,
        });
    } catch (e) {
        logger.error(`Error during saving list.`, {
            func: "handleWebhookCreateList",
            obj: e,
        });

        throw new Error(e);
    }
};

handleWebhookDeleteList = async (data) => {
    const { id } = data["list"];

    logger.info(`Entered with params.`, {
        func: "handleWebhookDeleteList",
        obj: {
            id,
        },
    });

    try {
        await IntegrationColumn.findOneAndDelete({ sourceId: id });
    } catch (e) {
        throw new Error(e);
    }

    logger.info(`Completed deletion successfully.`, {
        func: "handleWebhookDeleteList",
    });
};

// may need to handle archiving list
handleWebhookUpdateList = async (data) => {
    const { id, name: externalName } = data["list"];

    logger.info(`Entered with params.`, {
        func: "handleWebhookUpdateList",
        obj: {
            id,
            externalName,
        },
    });

    let list;

    try {
        list = await IntegrationColumn.findOne({ sourceId: id })
            .select("name")
            .exec();
    } catch (e) {
        logger.error(`List query failed.`, {
            func: "handleWebhookUpdateList",
            obj: e,
        });

        throw new Error(e);
    }

    const { name } = list;

    if (checkValid(externalName) && externalName != name) {
        list.name = externalName;

        try {
            list = await list.save();

            logger.info(`Updated list successfully.`, {
                func: "handleWebhookUpdateList",
                obj: list,
            });
        } catch (e) {
            logger.error(`List update failed.`, {
                func: "handleWebhookUpdateList",
                obj: e,
            });

            throw new Error(e);
        }
    }
};

handleWebhookCreateLabel = async (boardId, profile, data) => {
    const { id } = data["label"];

    logger.info(`Entered with id.`, {
        func: "handleWebhookCreateLabel",
        obj: id,
    });

    const { accessToken } = profile;

    let externalLabel;

    try {
        const response = await trelloAPI.get(
            `/1/labels/${id}?key=${TRELLO_API_KEY}&token=${accessToken}`
        );

        externalLabel = response.data;

        logger.info(`externalLabel was queried.`, {
            func: "handleWebhookCreateLabel",
            obj: externalLabel,
        });

        logger.info(`externalLabel was queried.`, {
            func: "handleWebhookCreateLabel",
            obj: externalLabel,
        });
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

        logger.info(`Label was created successfully.`, {
            func: "handleWebhookCreateLabel",
            obj: label,
        });
    } catch (e) {
        throw new Error(e);
    }
};

handleWebhookDeleteLabel = async (data) => {
    const { id } = data["label"];

    logger.info(`Entered with labelSourceId`, {
        func: "handleWebhookDeleteLabel",
        obj: id,
    });

    try {
        await IntegrationLabel.findOneAndDelete({
            sourceId: id,
        });

        logger.info(`Deleted label successfully`, {
            func: "handleWebhookDeleteLabel",
        });
    } catch (e) {
        throw new Error(e);
    }
};

handleWebhookUpdateLabel = async (data) => {
    const { id, name: externalName, color: externalColor } = data["label"];

    logger.info(`Entered with id`, {
        func: "handleWebhookUpdateLabel",
        obj: id,
    });

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

            logger.info(`Updated label successfully.`, {
                func: "handleWebhookUpdateLabel",
                obj: label,
            });
        } catch (e) {
            throw new Error(e);
        }
    }
};

// at same level as data
handleWebhookCreateMember = async (externalMember) => {
    const { id, username, fullName } = externalMember;

    logger.info(`Entered with params.`, {
        func: "handleWebhookCreateMember",
        obj: {
            id,
            username,
            fullName,
        },
    });

    let memberExists;

    try {
        memberExists = await IntegrationUser.exists({ sourceId: id });

        logger.info(`memberExists: ${memberExists}`, {
            func: "handleWebhookCreateMember",
        });
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
            member = await member.save();

            logger.info(`Member was saved succesfully`, {
                func: "handleWebhookCreateMember",
                obj: member,
            });
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

// TODO: NEED TO UPDATE
parseDescriptionAttachments = (desc) => {
    console.log(
        "parseDescriptionAttachments: Entered parseDescriptionAttachments with desc: ",
        desc
    );

    if (!desc || desc.length == 0) return [];

    let tokens = desc
        .split("\n")
        .map((token) => token.split(" "))
        .flat();

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

    const { id } = data["card"];

    /*
    console.log(
        `\nhandleWebhookCreateCard: Entered with boardId: ${boardId} id: ${id}`
    );*/

    let externalCard;

    try {
        const response = await trelloAPI.get(
            `/1/cards/${id}?key=${TRELLO_API_KEY}&token=${accessToken}&fields=all&actions=updateCard:idList&actions_limit=1000&action_member=false`
        );

        externalCard = response.data;

        //console.log(`\nhandleWebhookCreateCard: externalCard: `, externalCard);
    } catch (e) {
        throw new Error(e);
    }

    const {
        dueComplete,
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
        sourceId: id,
        name,
        link: url,
        board: boardId,
        source: "trello",
    });

    if (checkValid(dueComplete)) {
        card.trelloCardDueComplete = dueComplete;
    }

    if (checkValid(dateLastActivity)) {
        card.trelloCardDateLastActivity = new Date(dateLastActivity);
    }

    if (checkValid(desc)) {
        card.description = desc;

        const attachmentUrls = parseDescriptionAttachments(desc);

        /*
        console.log(
            "\nhandleWebhookCreateCard: attachmentUrls: ",
            attachmentUrls
        );*/

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

            card.column = column._id;
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

        let intervals = relevantActions.map((action) => {
            return new IntegrationInterval({
                start: addDays(new Date(action.date), -10),
                end: new Date(action.date),
                board: boardId,
            });
        });

        intervals = await Promise.all(
            intervals.map((interval) => interval.save())
        );

        card.intervals = intervals.map((interval) => interval._id);
    }

    try {
        card = await card.save();

        console.log(
            `\nhandleWebhookCreateCard: Card was saved successfully: `,
            card
        );
    } catch (e) {
        throw new Error(e);
    }

    await generateAttachmentAssociations(newAttachments, card, boardId);
};

handleWebhookUpdateCard = async (boardId, profile, data) => {
    const { accessToken } = profile;

    const { id } = data["card"];

    console.log(`\nhandleWebhookUpdateCard: Entered with cardSourceId: ${id}`);

    let externalCard;

    try {
        const response = await trelloAPI.get(
            `/1/cards/${id}?key=${TRELLO_API_KEY}&token=${accessToken}&fields=all&actions=updateCard:idList&actions_limit=1000&action_member=false`
        );

        externalCard = response.data;

        console.log(`\nhandleWebhookUpdateCard: externalCard: `, externalCard);
    } catch (e) {
        throw new Error(e);
    }

    const {
        idList,
        dateLastActivity,
        desc,
        name: externalName,
        due,
        dueComplete,
        url,
    } = externalCard;

    let { actions } = externalCard;

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

    console.log(`\nhandleWebhookUpdateCard: Does card exist?: `, card);

    if (!card) return;

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
                .lean();

            card.column = column._id;

            console.log("\nhandleWebhookUpdateCard: card.column: ", column._id);
        } catch (e) {
            throw new Error(e);
        }

        console.log(
            `\nhandleWebhookUpdateCard: list movement actions: `,
            actions
        );

        if (data["listAfter"] && actions.length > 0) {
            actions.map((action) => {
                action.date = new Date(action.date);
            });

            actions.sort((a, b) => {
                return a.date.getTime() > b.date.getTime() ? -1 : 1;
            });

            const { date } = actions.slice(0, 1)[0];

            interval = new IntegrationInterval({
                start: addDays(new Date(date), -10),
                end: new Date(date),
                board: boardId,
            });

            try {
                interval = await interval.save();

                console.log(
                    `\nhandleWebhookUpdateCard: Created interval successfully : `,
                    interval
                );
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
                    .filter((attUrl) => !alreadyAttached.has(attUrl))
                    .map((attUrl) => {
                        const newAttachment = new IntegrationAttachment({
                            link: attUrl,
                            board: boardId,
                        });

                        return newAttachment.save();
                    })
            );

            console.log(
                `\nhandleWebhookUpdateCard: Created attachments successfully : `,
                newAttachments
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
            console.log(`\nhandleWebhookUpdateCard: Before Save: `, card);

            card = await card.save();

            console.log(
                `\nhandleWebhookUpdateCard: Updated card successfully : `,
                card
            );
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

    console.log(
        `\nhandleWebhookAddAttachment: Entered with cardSourceId: ${cardSourceId} url: ${url}`
    );

    if (!url || !url.includes("https://github.com")) return;

    let card;

    try {
        console.log(await IntegrationTicket.count({ sourceId: cardSourceId }));

        card = await IntegrationTicket.findOne({
            sourceId: cardSourceId,
        });
    } catch (e) {
        throw new Error(e);
    }

    console.log(
        `\nhandleWebhookAddAttachment: Does card have property?: ${card.hasOwnProperty(
            "attachments"
        )}`
    );

    Object.keys(card).map((key) => console.log("\n KEY:", key));

    console.log(
        `\nhandleWebhookAddAttachment: card.attachments before: `,
        card["attachments"]
    );

    console.log(`\nhandleWebhookAddAttachment: Does card exist?: ${card}`);

    if (!card) return;

    let seenURLs;

    try {
        console.log(
            `\nhandleWebhookAddAttachment: card.attachments before: `,
            card.attachments
        );

        seenURLs = await IntegrationAttachment.find({
            _id: { $in: card.attachments },
        });

        console.log(
            `\nhandleWebhookAddAttachment: attachments before: `,
            seenURLs
        );

        seenURLs = seenURLs.map((att) => att.link);

        console.log(`\nhandleWebhookAddAttachment: SeenURLs : ${seenURLs}`);
    } catch (e) {
        throw new Error(e);
    }

    console.log(
        `\nhandleWebhookAddAttachment: Does SeenURLs include url?: ${seenURLs.includes(
            url
        )}`
    );

    if (seenURLs.includes(url)) return;

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

    console.log(
        `\nhandleWebhookAddAttachment:  card.attachments : `,
        card.attachments
    );

    try {
        card = await IntegrationTicket.findOneAndUpdate(
            { _id: card._id },
            { $push: { attachments: attachment._id } },
            { new: true }
        ).lean();

        console.log(
            `\nhandleWebhookAddAttachment: Card updated successfully: `,
            card
        );
    } catch (e) {
        throw new Error(e);
    }

    await generateAttachmentAssociations([attachment], card, boardId);
};

handleWebhookDeleteCard = async (data) => {
    const { id } = data["card"];

    console.log(`\nhandleWebhookDeleteCard: Entered with cardSourceId: ${id}`);

    let ticket;

    try {
        ticket = await IntegrationTicket.findOne({ sourceId: id });
    } catch (e) {
        throw new Error(e);
    }

    console.log(`\nhandleWebhookDeleteCard: Queried Card :`, ticket);

    const modelMap = {
        attachments: IntegrationAttachment,
        intervals: IntegrationInterval,
    };

    try {
        await Promise.all(
            Object.keys(modelMap).map((key) => {
                const model = modelMap[key];

                const modelIds = ticket[key];

                return model.deleteMany({ _id: { $in: modelIds } });
            })
        );
    } catch (e) {
        throw new Error(e);
    }

    try {
        const associations = await Association.deleteMany({
            firstElement: ticket._id,
        });

        console.log(
            `\nhandleWebhookDeleteCard: Deleted associations: `,
            associations
        );
    } catch (e) {
        throw new Error(e);
    }

    try {
        await IntegrationTicket.findOneAndDelete({ sourceId: id });
    } catch (e) {
        throw new Error(e);
    }

    console.log(`\nhandleWebhookDeleteCard: Deleted card successfully.`);
};

handleWebhookAddLabel = async (data) => {
    const {
        card: { id: cardSourceId },
        label: { id: labelSourceId },
    } = data;

    /*
    console.log(
        `\nhandleWebhookAddLabel: Entered with labelSourceId: ${labelSourceId} cardSourceId: ${cardSourceId}`
    );*/

    let label;

    try {
        label = await IntegrationLabel.findOne({
            sourceId: labelSourceId,
        });
    } catch (e) {
        throw new Error(e);
    }

    //console.log(`\nhandleWebhookAddLabel: Queried label: `, label);

    if (label) {
        let card;

        try {
            card = await IntegrationTicket.findOne({
                sourceId: cardSourceId,
            });
        } catch (e) {
            throw new Error(e);
        }

        //console.log(`\nhandleWebhookAddLabel: Does card exist? `, card);

        if (!card) return;

        /*   console.log(
            `\nhandleWebhookAddLabel: Labels already integrated in card: `,
            card.labels
        ); */

        const convLabels = card.labels.map((label) => label.toString());

        /*    console.log(
            `\nhandleWebhookAddLabel: Is queried label already included: `,
            convLabels.includes(label._id.toString())
        );
 */
        if (convLabels.includes(label._id.toString())) return;

        //card.labels.push(label._id);

        try {
            card = await IntegrationTicket.findOneAndUpdate(
                { _id: card._id },
                { $push: { labels: label._id } },
                { new: true }
            ).lean();

            /*    console.log(
                `\nhandleWebhookAddLabel: Updated card successfully: `,
                card
            ); */
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

    console.log(
        `\nhandleWebhookRemoveLabel: Entered with labelSourceId: ${labelSourceId} cardSourceId: ${cardSourceId}`
    );

    let label;

    try {
        label = await IntegrationLabel.findOne({
            sourceId: labelSourceId,
        });
    } catch (e) {
        throw new Error(e);
    }

    console.log(`\nhandleWebhookRemoveLabel: Queried Label: `, label);

    if (label) {
        let card;

        try {
            card = await IntegrationTicket.findOne({
                sourceId: cardSourceId,
            });
        } catch (e) {
            throw new Error(e);
        }

        if (!card) return;

        /*
        card.labels = card.labels.filter(
            (labelId) => labelId.toString() != label._id.toString()
        );*/

        try {
            //card = await card.save();

            card = await IntegrationTicket.findOneAndUpdate(
                { _id: card._id },
                { $pull: { labels: label._id } },
                { new: true }
            ).lean();

            console.log(
                `\nhandleWebhookRemoveLabel: Updated card successfully: `,
                card
            );
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

    /*    console.log(
        `\nhandleWebhookAddMember: Entered with cardSourceId: ${cardSourceId} memberSourceId: ${memberSourceId}`
    ); */

    let member;

    try {
        member = await IntegrationUser.findOne({
            sourceId: memberSourceId,
        });
    } catch (e) {
        throw new Error(e);
    }
    /* 
    console.log("\nhandleWebhookAddMember: Member that was queried: ", member);
 */
    if (member) {
        let card;

        try {
            card = await IntegrationTicket.findOne({
                sourceId: cardSourceId,
            });
        } catch (e) {
            throw new Error(e);
        }
        /* 
        console.log("\nhandleWebhookAddMember: Does card exist?: ", card);
 */
        if (!card) {
            return;
        }

        const convMembers = card.members.map((member) => member.toString());
        /* 
        console.log(
            "\nhandleWebhookAddMember: Does members include?: ",
            convMembers.includes(member._id.toString())
        ); */

        if (convMembers.includes(member._id.toString())) {
            return;
        }

        //card.members.push(member._id);

        try {
            card = await IntegrationTicket.findOneAndUpdate(
                { _id: card._id },
                { $push: { members: member._id } },
                { new: true }
            ).lean();

            //card = await card.save();

            /*             console.log(
                "\nhandleWebhookAddMember: Updated card successfully : ",
                card
            ); */
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

    console.log(
        `\nhandleWebhookRemoveMember: Entered with cardSourceId: ${cardSourceId} memberSourceId: ${memberSourceId}`
    );

    let member;

    try {
        member = await IntegrationUser.findOne({
            sourceId: memberSourceId,
        });
    } catch (e) {
        throw new Error(e);
    }

    console.log(
        "\nhandleWebhookRemoveMember: Member that was queried: ",
        member
    );

    if (member) {
        let card;

        try {
            card = await IntegrationTicket.findOne({
                sourceId: cardSourceId,
            });
        } catch (e) {
            throw new Error(e);
        }

        console.log("\nhandleWebhookRemoveMember: Does card exist?: ", card);

        if (!card) return;

        /*
        card.members = card.members.filter(
            (memberId) => memberId.toString() != member._id.toString()
        );*/

        try {
            card = await IntegrationTicket.findOneAndUpdate(
                { _id: card._id },
                { $pull: { members: member._id } },
                { new: true }
            ).lean();

            //card = await card.save();

            console.log(
                "\nhandleWebhookRemoveMember: Updated card successfully: ",
                card
            );
        } catch (e) {
            throw new Error(e);
        }
    }
};

generateAttachmentAssociations = async (attachments, card, boardId) => {
    /*  console.log("\ngenerateAttachmentAssociations: attachments: ", attachments);

    console.log("\ngenerateAttachmentAssociations: card: ", card);

    console.log("\ngenerateAttachmentAssociations: boardId: ", boardId); */

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

        //console.log("SPLIT URL", splitURL);

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

            att.modelType = modelType;

            att.sourceId = sourceId;

            let repository;

            try {
                repository = await Repository.findOne({ fullName: fullName });
            } catch (e) {
                console.log("Error", e);

                throw new Error(e);
            }

            if (repository) {
                att.repository = repository._id;
            }

            attReqs.push(att.save());
        } catch (e) {
            continue;
        }
    }

    try {
        attachments = await Promise.all(attReqs);
        /*  console.log(
            `\ngenerateAttachmentAssociations: Attachments were updated with appropriate data: `,
            attachments
        ); */
    } catch (e) {
        throw new Error(e);
    }

    const modelTypeToModel = {
        branch: Branch,
        issue: IntegrationTicket,
        pullRequest: PullRequest,
        commit: Commit,
    };

    const mongModelMapping = {
        branch: "Branch",
        issue: "IntegrationTicket",
        pullRequest: "PullRequest",
        commit: "Commit",
    };

    let assocInsertOps = [];

    for (let i = 0; i < attachments.length; i++) {
        const { repository, sourceId, modelType } = attachments[i];

        let codeObject;

        if (modelType == "issue") {
            codeObject = await IntegrationTicket.findOne({
                sourceId,
                source: "github",
                repositoryId: repository,
            });
        } else {
            codeObject = await modelTypeToModel[modelType].findOne({
                sourceId,
                repository,
            });
        }

        const alreadyExists = await Association.exists({
            firstElement: card._id,
            firstElementModelType: "IntegrationTicket",
            secondElement: codeObject._id,
            secondElementModelType: mongModelMapping[modelType],
            repository: codeObject.repository,
        });

        if (codeObject && !alreadyExists) {
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
        const associations = await Association.insertMany(assocInsertOps);

        /*  console.log(
            `\ngenerateAttachmentAssociations: Associations were made: `,
            associations
        ); */
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
