const axios = require("axios");
const _ = require("lodash");

const Workspace = require("../models/Workspace");
const Repository = require("../models/Repository");

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const { serializeError, deserializeError } = require("serialize-error");

const IntegrationAttachment = require("../models/integrations/integration_objects/IntegrationAttachment");
const IntegrationTicket = require("../models/integrations/integration_objects/IntegrationTicket");
const IntegrationUser = require("../models/integrations/integration_objects/IntegrationUser");
const IntegrationColumn = require("../models/integrations/integration_objects/IntegrationColumn");
const IntegrationBoard = require("../models/integrations/integration_objects/IntegrationBoard");
const IntegrationEvent = require("../models/integrations/integration_objects/IntegrationEvent");

const TrelloIntegration = require("../models/integrations/trello/TrelloIntegration");
const TrelloConnectProfile = require("../models/integrations/trello/TrelloConnectProfile");

const trelloAPI = axios.create({
    baseURL: "https://api.trello.com",
});

const getTrelloIntegrationObj = async (trelloIntegrationId) => {
    var trelloIntegrationObj;
    try {
        trelloIntegrationObj = await TrelloIntegration.findById(
            trelloIntegrationId
        )
            .lean()
            .exec();
    } catch (err) {
        console.log(`err: `);
        console.log(err);
        throw err;
    }
    return trelloIntegrationObj;
};

bulkScrapeTrello = async () => {
    const { TRELLO_API_KEY } = process.env;

    var worker = require("cluster").worker;

    var trelloIntegrationObj = await getTrelloIntegrationObj(
        process.env.trelloIntegrationId
    );

    const { workspace, repositories } = trelloIntegrationObj;

    const workspaceId = workspace;
    const repositoryIds = repositories;

    let { boardIds, trelloConnectProfile } = trelloIntegrationObj;

    var relevantLists = JSON.parse(process.env.relevantLists);
    relevantLists = _.map(relevantLists, "name");

    var requiredBoardIds = JSON.parse(process.env.requiredBoardIdList);

    //console.log("BOARDIDS", boardIds);
    if (requiredBoardIds)
        boardIds = boardIds.filter((boardId) =>
            requiredBoardIds.includes(boardId)
        );

    const trelloConnectProfileId = trelloConnectProfile;

    try {
        trelloConnectProfile = await TrelloConnectProfile.findById(
            trelloConnectProfileId
        )
            .lean()
            .select("accessToken")
            .exec();
    } catch (err) {
        console.log("ERROR", err);
    }

    const { accessToken } = trelloConnectProfile;

    //TODO: If population > 1000, need to handle further data extraction (since, until)
    // want all correct actions of the board
    // want all lists of the board
    // want all cards of the board
    // want all attachments of the cards

    for (let i = 0; i < boardIds.length; i++) {
        const boardId = boardIds[i];

        const requestIdParams = `${boardId}?key=${TRELLO_API_KEY}&token=${accessToken}&fields=id,name,idMemberCreator,url`;
        const nestedListParam = "&lists=all&list_fields=id,name";

        const nestedCardFields =
            "&card_fields=id,idList,dateLastActivity,desc,name,due,dueComplete,idMembers,labels,url";
        const nestedCardParam = `&cards=all&card_members=true&card_attachments=true${nestedCardFields}`;

        const nestedActionParam =
            "&actions=updateCard:idList&actions_limit=1000&action_member=false&action_memberCreator_fields=fullName,username";

        const nestedMemberParam = "&members=all";

        const nestedLabelParam =
            "&labels=all&label_fields=color,name&labels_limit=1000";

        const boardResponse = await trelloAPI.get(
            `/1/boards/${requestIdParams}${nestedListParam}${nestedCardParam}${nestedActionParam}${nestedMemberParam}${nestedLabelParam}`
        );

        let { actions, cards, lists, members, labels } = boardResponse.data;

        //create IntegrationUsers for members

        currentWorkspace = await Workspace.findById(workspaceId)
            .lean()
            .select("memberUsers")
            .populate("memberUsers");

        workspaceUsers = currentWorkspace.memberUsers;

        try {
            members = await Promise.all(
                members.map((member) => {
                    const { id, username, fullName } = member;

                    member = new IntegrationUser({
                        sourceId: id,
                        source: "trello",
                        userName: username,
                        name: fullName,
                    });

                    const splitName = fullName.split(" ");

                    if (splitName.length > 0) {
                        const likelyFirstName = splitName[0];

                        const likelyLastName = splitName[-1];

                        const likelyUsers = workspaceUsers.filter((user) => {
                            return (
                                (user.firstName === likelyFirstName &&
                                    user.lastName === likelyLastName) ||
                                user.username === username
                            );
                        });

                        if (likelyUsers.length > 0)
                            member.user = likelyUsers[0]._id;
                    }

                    return member.save();
                })
            );
        } catch (err) {
            console.log("ERROR", err);
        }

        members = _.mapKeys(members, "sourceId");

        // create IntegrationBoard
        let board;
        try {
            const { id, name, idMemberCreator, url } = boardResponse.data;

            const boardCreator = members[idMemberCreator];

            board = new IntegrationBoard({
                creator: boardCreator._id,
                name,
                source: "trello",
                link: url,
                sourceId: id,
            });

            board = await board.save();
        } catch (err) {
            console.log("ERROR", err);
        }

        // create IntegrationColumn
        try {
            lists = await Promise.all(
                lists.map((list) => {
                    const { id, name } = list;

                    list = new IntegrationColumn({
                        name,
                        source: "trello",
                        sourceId: id,
                        board: board._id,
                    });

                    if (relevantLists[name])
                        list.type = relevantLists[name].type;

                    return list.save();
                })
            );
        } catch (err) {
            console.log("ERR", err);
        }

        lists = _.mapKeys(lists, "sourceId");

        cards = _.mapKeys(cards, "id");

        //create IntegrationEvents
        let events;

        try {
            events = await Promise.all(
                actions
                    .map((action) => {
                        const {
                            data: {
                                listAfter: { name },
                                card,
                            },
                            id,
                            idMemberCreator,
                        } = action;

                        if (relevantLists[name]) {
                            let actionCreator = members[idMemberCreator];

                            let event = new IntegrationEvent({
                                action: "movement",
                                source: "trello",
                                sourceId: id,
                                sourceCreationDate: new Date(action.date),
                                type: relevantLists[name].type,
                                creator: actionCreator._id,
                            });

                            if (cards[card.id].eventIds) {
                                cards[card.id].eventIds.push(id);
                            } else {
                                cards[card.id].events = [id];
                            }

                            return event.save();
                        } else {
                            return null;
                        }
                    })
                    .filter((event) => event != null)
            );
        } catch (err) {
            console.log("ERROR", err);
        }

        events = _.mapKeys(events, "sourceId");

        try {
            labels = await Promise.all(
                labels.map((label) => {
                    const { color, name } = label;

                    label = new IntegrationLabel({
                        color,
                        text: name,
                        source: "trello",
                    });

                    label.save();
                })
            );
        } catch (err) {
            console.log("ERROR", err);
        }

        //TODO: POSSIBLE DUPLICATES
        labels = _.mapKeys(labels, "text");

        let insertOps = [];

        let query = Repository.find({}).lean().select("fullName");

        query.where("_id").in(repositoryIds);

        let currentRepositories = await query.exec();

        currentRepositories = _.map(currentRepositories, "fullName");

        Object.values(cards).map(async (card) => {
            let {
                id,
                idList,
                dateLastActivity,
                desc,
                name,
                attachments,
                due,
                dueComplete,
                idMembers,
                url,
                eventIds,
            } = card;

            const cardListId = lists[idList]._id;

            const assigneeIds = idMembers.map(
                (memberId) => members[memberId]._id
            );

            const cardEventIds = eventIds.map((eventId) => events[eventId]._id);

            if (attachments && attachments.length > 0) {
                attachments = await Promise.all(
                    attachments
                        .map((attachment) => {
                            const { date, url, name } = attachment;

                            if (!url.includes("https://github.com"))
                                return null;

                            const splitURL = url.split("/");

                            try {
                                let type = splitURL.slice(
                                    splitURL.length - 2,
                                    splitURL.length - 1
                                )[0];

                                type =
                                    type === "tree"
                                        ? "branch"
                                        : type === "issues"
                                        ? "issue"
                                        : type === "pull"
                                        ? "pullRequest"
                                        : type;

                                const identifier = splitURL.slice(
                                    splitURL.length - 1
                                )[0];
                                const fullName = splitURL
                                    .slice(
                                        splitURL.length - 4,
                                        splitURL.length - 2
                                    )
                                    .join("/");

                                if (!currentRepositories[fullName]) return null;

                                const repositoryId =
                                    currentRepositories[fullName]._id;

                                attachment = new IntegrationAttachment({
                                    sourceCreationDate: new Date(date),
                                    type,
                                    repository: repositoryId,
                                    link: url,
                                    identifier,
                                });

                                return attachment;
                            } catch (err) {
                                return null;
                            }
                        })
                        .filter((request) => request != null)
                );
            }

            const labelIds = card.labels.map((label) => labels[label.name]._id);

            let cardParams = {
                workspace: workspaceId,
                repositories: repositoryIds,

                name,
                source: "trello",
                sourceId: id,
                description: desc,
                link: url,
                assignees: assigneeIds, // trelloCardMember
                events: cardEventIds, // trelloCardListUpdateDates: [{type: Date}],
                column: cardListId,
                board: board._id,

                trelloIntegration: trelloIntegration._id,
            };

            if (due) cardParams.trelloCardDue = new Date(due);
            if (dueComplete) cardParams.trelloCardDueComplete = dueComplete;
            if (dateLastActivity)
                cardParams.trelloCardDateLastActivity = new Date(
                    dateLastActivity
                );
            if (attachments && attachments.length > 0)
                cardParams.attachments = attachments.map(
                    (attachment) => attachment._id
                );
            if (labels && labels.length > 0) cardParams.labels = labelIds;

            insertOps.push(cardParams);
        });

        try {
            let result = await IntegrationTicket.insertMany(insertOps);
            result = result.filter(
                (res) => res.trelloCardAttachments.length > 0
            );
            result.map((res) => {
                console.log("RESULT", result);
                console.log("RESULT ATTACHMENTS", result.trelloCardAttachments);
            });
        } catch (err) {
            console.log("ERROR", err);
        }
    }
};

module.exports = {
    bulkScrapeTrello,
};
