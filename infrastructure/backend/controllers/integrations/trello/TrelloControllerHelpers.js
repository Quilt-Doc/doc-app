const axios = require("axios");
const _ = require("lodash");
const isUrl = require("is-url");

const mongoose = require("mongoose");

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

const { TRELLO_API_KEY } = process.env;

const trelloAPI = axios.create({
    baseURL: "https://api.trello.com",
});

acquireTrelloConnectProfile = async (userId) => {
    let trelloConnectProfile;

    try {
        trelloConnectProfile = await TrelloConnectProfile.findOne({
            user: userId,
            isReady: true,
        })
            .lean()
            .exec();
    } catch (e) {
        console.log(`acquireTrelloConnectProfile Error: ${e}`);
    }

    return trelloConnectProfile;
};

acquireExternalTrelloBoards = async (profile) => {
    const { accessToken, sourceId: memberId } = profile;

    let boardsReponse;

    try {
        boardsReponse = await trelloAPI.get(
            `/1/members/${memberId}/boards?key=${TRELLO_API_KEY}&token=${accessToken}&fields=id,name&lists=open&list_fields=id,name`
        );
    } catch (err) {
        return res.json({
            success: false,
            error:
                "getExternalTrelloBoards Error: trello board API request failed",
            trace: err,
        });
    }

    let boards = boardsReponse.data;

    return boards;
};

acquireTrelloData = async (boardId, accessToken, isMinimal) => {
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

    const finalQuery = isMinimal
        ? `/1/boards/${requestIdParams}${nestedActionParam}`
        : `/1/boards/${requestIdParams}${nestedListParam}${nestedCardParam}${nestedActionParam}${nestedMemberParam}${nestedLabelParam}`;

    const boardResponse = await trelloAPI.get(finalQuery);

    return boardResponse.data;
};

extractTrelloMembers = async (workspaceId, members, profile) => {
    const currentWorkspace = await Workspace.findById(workspaceId)
        .lean()
        .select("memberUsers")
        .populate({ path: "memberUsers", model: User });

    const workspaceUsers = currentWorkspace.memberUsers;

    const memberSourceIds = members.map((member) => member.id);

    let foundMembers = [];

    try {
        let query = IntegrationUser.find();

        query.where("sourceId").in(memberSourceIds);

        query.where("source").equals("trello");

        foundMembers = await query.lean().exec();
    } catch (e) {
        console.log(e);
    }

    const foundMemberSourceIds = foundMembers.map((member) => member.sourceId);

    try {
        members = await Promise.all(
            members
                .map((member) => {
                    const { id, username, fullName } = member;

                    if (foundMemberSourceIds.includes(id)) {
                        return null;
                    }

                    member = new IntegrationUser({
                        sourceId: id,
                        source: "trello",
                        userName: username,
                        name: fullName,
                    });

                    if (id === profile.sourceId) {
                        member.user = profile.user;
                    } else {
                        const splitName = fullName.split(" ");

                        if (splitName.length > 0) {
                            const likelyFirstName = splitName[0];

                            const likelyLastName =
                                splitName[splitName.length - 1];

                            const likelyUsers = workspaceUsers.filter(
                                (user) => {
                                    return (
                                        (user.firstName === likelyFirstName &&
                                            user.lastName === likelyLastName) ||
                                        user.username === username
                                    );
                                }
                            );

                            if (likelyUsers.length > 0)
                                member.user = likelyUsers[0]._id;
                        }
                    }

                    return member.save();
                })
                .filter((request) => request != null)
        );
    } catch (err) {
        console.log("ERROR", err);
    }

    members = [...members, ...foundMembers];

    members = _.mapKeys(members, "sourceId");

    return members;
};

extractTrelloBoard = async (members, id, name, idMemberCreator, url) => {
    let board;

    try {
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

    return board;
};

extractTrelloLists = async (lists, board) => {
    lists = lists ? lists : [];
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

                return list.save();
            })
        );
    } catch (err) {
        console.log("ERR", err);
    }

    lists = _.mapKeys(lists, "sourceId");

    return lists;
};

getContextRepositories = async (context) => {
    const { repositories: repositoryIds } = context;

    let query = Repository.find({}).lean().select("fullName _id");

    query.where("_id").in(repositoryIds);

    let currentRepositories = await query.exec();

    currentRepositories = _.mapKeys(currentRepositories, "fullName");

    return currentRepositories;
};

parseDescriptionAttachments = (cards) => {
    cards.map((card) => {
        const { desc, attachments } = card;

        let tokens = desc.split(" ");

        tokens = tokens.filter((token) => isUrl(token));

        tokens = tokens.map((token) => {
            return { url: token };
        });

        card.attachments = [...attachments, ...tokens];
    });

    return cards;
};

extractTrelloDirectAttachments = async (cards, context) => {
    const currentRepositories = await getContextRepositories(context);

    cards = parseDescriptionAttachments(cards);
    //console.log("CURRENT REPOS", currentRepositories);

    let insertOps = [];

    let seenUrls = new Set();

    cards.map((card) => {
        const { attachments } = card;

        const modelTypeMap = {
            tree: "branch",
            issues: "issue",
            pull: "pullRequest",
            commit: "commit",
        };

        attachments.map((attachment) => {
            const { date, url, name } = attachment;

            if (
                !url ||
                !url.includes("https://github.com") ||
                seenUrls.has(url)
            )
                return;

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

                attachment = {
                    modelType,
                    link: url,
                    sourceId,
                };

                if (date) attachment.sourceCreationDate = new Date(date);

                if (currentRepositories[fullName]) {
                    attachment.repository = currentRepositories[fullName]._id;
                }

                insertOps.push(attachment);

                seenUrls.add(url);
            } catch (err) {
                return null;
            }
        });
    });

    let attachments;

    try {
        attachments = await IntegrationAttachment.insertMany(insertOps);
    } catch (e) {
        console.log(e);
    }

    attachments = _.mapKeys(attachments, "link");

    cards.map((card) => {
        card.attachmentIds = card.attachments
            .map((attachment) => {
                const { url } = attachment;

                if (attachments[url]) {
                    return attachments[url]._id;
                }

                return null;
            })
            .filter((attachmentId) => attachmentId != null);
    });

    return { attachments, cards };
};

modifyTrelloActions = (actions, cards, event) => {
    const { beginListId, endListId } = event;

    actions.map((action) => {
        const {
            date,
            data: {
                card,
                listAfter: { id, name: listName },
            },
        } = action;

        if (cards[card.id] && (id == beginListId || id == endListId)) {
            const { actions: cardActions } = cards[card.id];

            let actionDate = new Date(date);

            action = { listId: id, listName, date: actionDate };

            if (cardActions) {
                cardActions.push(action);
            } else {
                cards[card.id].actions = [action];
            }
        }
    });

    return cards;
};

extractTrelloEvent = async (board, lists, event) => {
    let { beginListId, endListId } = event;

    const beginList = lists[beginListId];

    const endList = lists[endListId];

    event = await IntegrationEvent.findOne({
        beginList: beginList._id,
        endList: endList._id,
    })
        .lean()
        .exec();

    if (!event) {
        event = new IntegrationEvent({
            board: board._id,
            beginList: beginList._id,
            endList: endList._id,
            source: "trello",
            action: "movement",
        });

        event = await event.save();
    }

    return event;
};

extractTrelloLabels = async (labels) => {
    if (labels) {
        labels = await Promise.all(
            labels.map((label) => {
                const { color, name } = label;

                label = new IntegrationLabel({
                    color,
                    name,
                    source: "trello",
                });

                return label.save();
            })
        );

        labels = labels.map((label) => {
            label.sourceId = `${label.name}-${label.color}`;

            return label;
        });

        labels = _.mapKeys(labels, "sourceId");

        return labels;
    } else {
        return {};
    }
};

extractTrelloIntervals = async (event, cards, lists) => {
    cards = Object.values(cards);

    lists = Object.values(lists);

    lists = _.mapKeys(lists, "_id");

    let seen = new Set();

    let { beginList: beginListId, endList: endListId } = event;

    beginListId = lists[beginListId].sourceId;

    endListId = lists[endListId].sourceId;

    let insertOps = [];

    cards.map((card) => {
        let { actions } = card;

        let interval = {
            start: null,
            end: null,
            event: event._id,
        };

        if (!actions) return;

        actions.map((action) => {
            action.date = new Date(action.date);
        });

        actions = actions.sort((a, b) => {
            return a.date.getTime() < b.date.getTime() ? -1 : 1;
        });

        actions.map((action) => {
            let { listId, date } = action;

            const { start } = interval;

            if (listId == beginListId && !start) interval.start = date;

            if (listId == endListId) interval.end = date;
        });

        if (
            interval.end &&
            interval.start &&
            interval.start.getTime() < interval.end.getTime()
        ) {
            const intervalIdentifier = `${interval.start.getTime()}-${interval.end.getTime()}`;

            if (!seen.has(intervalIdentifier)) {
                insertOps.push(interval);

                card.intervalIdentifier = `${interval.start.getTime()}-${interval.end.getTime()}`;

                seen.add(intervalIdentifier);
            }
        }
    });

    let intervals = await IntegrationInterval.insertMany(insertOps);

    intervals.map((interval) => {
        interval.identifier = `${interval.start.getTime()}-${interval.end.getTime()}`;
    });

    intervals = _.mapKeys(intervals, "identifier");

    cards.map((card) => {
        const { intervalIdentifier } = card;

        if (intervalIdentifier) {
            card.intervalIds = [intervals[intervalIdentifier]._id];
        }
    });

    return { cards: _.mapKeys(cards, "id"), intervals };
};

deleteTrelloBoardComplete = async ({
    members,
    board,
    lists,
    attachments,
    cards,
    event,
    intervals,
    labels,
}) => {
    if (members) {
        const memberIds = members.map((member) => member._id);

        await IntegrationUser.deleteMany({ _id: { $in: memberIds } });
    }

    if (board) {
        await IntegrationBoard.deleteOne({ _id: board._id });
    }

    if (lists) {
        const listIds = lists.map((list) => list._id);

        await IntegrationColumn.deleteMany({ _id: { $in: listIds } });
    }

    if (attachments) {
        const attachmentIds = attachments.map((attachment) => attachment._id);

        await IntegrationAttachment.deleteMany({ _id: { $in: attachmentIds } });
    }

    if (cards) {
        const ticketIds = cards.map((card) => card._id);

        await IntegrationTicket.deleteMany({ _id: { $in: ticketIds } });
    }

    if (event) {
        await IntegrationEvent.deleteOne({ _id: event._id });
    }

    if (intervals) {
        const intervalIds = intervals.map((interval) => interval._id);

        await IntegrationInterval.deleteMany({ _id: { $in: intervalIds } });
    }

    if (labels) {
        const labelIds = labels.map((label) => label._id);

        await IntegrationLabel.deleteMany({ _id: { $in: labelIds } });
    }

    if (board) {
        await BoardWorkspaceContext.deleteMany({ board });
    }
};

populateExistingTrelloDirectAttachments = async (context, attachments) => {
    const currentRepositories = await getContextRepositories(context);

    const bulkOps = attachments
        .map((attachment) => {
            const { link: url, _id: attachmentId } = attachment;

            const splitURL = url.split("/");

            const fullName = splitURL
                .slice(splitURL.length - 4, splitURL.length - 2)
                .join("/");

            if (!currentRepositories[fullName]) return null;

            return {
                updateOne: {
                    filter: { _id: attachmentId },
                    // Where field is the field you want to update
                    update: { $set: { repository } },
                    upsert: false,
                },
            };
        })
        .filter((request) => request != null);

    await IntegrationAttachment.bulkWrite(bulkOps);
};

module.exports = {
    acquireTrelloConnectProfile,
    acquireExternalTrelloBoards,
    acquireTrelloData,
    extractTrelloMembers,
    extractTrelloBoard,
    extractTrelloLists,
    extractTrelloDirectAttachments,
    getContextRepositories,
    extractTrelloEvent,
    extractTrelloLabels,
    modifyTrelloActions,
    extractTrelloIntervals,
    populateExistingTrelloDirectAttachments,
    deleteTrelloBoardComplete,
};
