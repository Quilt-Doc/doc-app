const axios = require("axios");
const _ = require("lodash");
const isUrl = require("is-url");

const Sentry = require("@sentry/node");

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
    const trelloConnectProfile = await TrelloConnectProfile.findOne({
        user: userId,
        isReady: true,
    })
        .lean()
        .exec();

    return trelloConnectProfile;
};

acquireExternalTrelloBoards = async (profile) => {
    const { accessToken, sourceId: memberId } = profile;

    const boardsReponse = await trelloAPI.get(
        `/1/members/${memberId}/boards?key=${TRELLO_API_KEY}&token=${accessToken}&fields=id,name&lists=open&list_fields=id,name,pos`
    );

    const boards = boardsReponse.data;

    return boards;
};

acquireTrelloData = async (boardSourceId, accessToken, isMinimal) => {
    const requestIdParams = `${boardSourceId}?key=${TRELLO_API_KEY}&token=${accessToken}&fields=id,name,idMemberCreator,url`;

    const nestedListParam = "&lists=all&list_fields=id,name,pos";

    const nestedCardFields =
        "&card_fields=id,idList,dateLastActivity,desc,name,due,dueComplete,idMembers,labels,url";

    const nestedCardParam = `&cards=all&card_members=true&card_attachments=true${nestedCardFields}`;

    const nestedActionParam =
        "&actions=updateCard:idList&actions_limit=1000&action_member=false&action_memberCreator_fields=fullName,username";

    const nestedMemberParam = "&members=all";

    const nestedLabelParam =
        "&labels=all&label_fields=id,color,name&labels_limit=1000";

    const finalQuery = isMinimal
        ? `/1/boards/${requestIdParams}${nestedActionParam}`
        : `/1/boards/${requestIdParams}${nestedListParam}${nestedCardParam}${nestedActionParam}${nestedMemberParam}${nestedLabelParam}`;

    let boardResponse = await trelloAPI.get(finalQuery);

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

    let query = IntegrationUser.find();

    query.where("sourceId").in(memberSourceIds);

    query.where("source").equals("trello");

    foundMembers = await query.lean().exec();

    const foundMemberSourceIds = foundMembers.map((member) => member.sourceId);

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

                        const likelyLastName = splitName[splitName.length - 1];

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
                }

                return member.save();
            })
            .filter((request) => request != null)
    );

    members = [...members, ...foundMembers];

    members = _.mapKeys(members, "sourceId");

    return members;
};

extractTrelloBoard = async (
    members,
    id,
    name,
    boardCreatorSourceId,
    url,
    repositoryIds,
    userId
) => {
    const boardCreator = members[boardCreatorSourceId];

    let board = new IntegrationBoard({
        creator: boardCreator._id,
        name,
        source: "trello",
        link: url,
        sourceId: id,
        repositories: repositoryIds,
        integrationCreator: userId,
    });

    board = await board.save();

    return board;
};

extractTrelloLists = async (lists, board) => {
    lists = await Promise.all(
        lists.map((list) => {
            const { id: listSourceId, name } = list;

            list = new IntegrationColumn({
                name,
                source: "trello",
                sourceId: listSourceId,
                board: board._id,
            });

            return list.save();
        })
    );

    lists = _.mapKeys(lists, "sourceId");

    return lists;
};

getRepositories = async (repositoryIds) => {
    let query = Repository.find().lean().select("fullName _id");

    query.where("_id").in(repositoryIds);

    let currentRepositories = await query.exec();

    currentRepositories = _.mapKeys(currentRepositories, "fullName");

    return currentRepositories;
};

extractTrelloDirectAttachments = async (cards, repositoryIds, board) => {
    const currentRepositories = await getRepositories(repositoryIds);

    cards = parseDescriptionAttachments(cards);

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
            const { date, url } = attachment;

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
                    board: board._id,
                };

                if (date) attachment.sourceCreationDate = new Date(date);

                if (currentRepositories[fullName]) {
                    attachment.repository = currentRepositories[fullName]._id;
                }

                insertOps.push(attachment);

                seenUrls.add(url);
            } catch (e) {
                return null;
            }
        });
    });

    let attachments = await IntegrationAttachment.insertMany(insertOps);

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

modifyTrelloActions = (actions, cards) => {
    actions.map((action) => {
        const {
            date,
            data: {
                card: { id: cardSourceId },
                listAfter: { id, name: listName },
            },
        } = action;

        const card = cards[cardSourceId];

        if (card) {
            action = { listSourceId: id, listName, date: new Date(date) };

            if (card.actions) {
                card.actions.push(action);
            } else {
                card.actions = [action];
            }
        }
    });

    cards = Object.values(cards);

    cards.map((card) => {
        if (card.actions && card.actions.length > 2) {
            card.actions.sort((a, b) => {
                return a.date.getTime() > b.date.getTime() ? -1 : 1;
            });

            card.actions = card.actions.slice(0, 2);
        }
    });

    return cards;
};

extractTrelloLabels = async (labels, board) => {
    if (labels) {
        labels = await Promise.all(
            labels.map((label) => {
                const { color, name, id } = label;

                label = new IntegrationLabel({
                    color,
                    name,
                    sourceId: id,
                    source: "trello",
                    board: board._id,
                });

                return label.save();
            })
        );

        labels = labels.map((label) => {
            label.nameColor = `${label.name}-${label.color}`;

            return label;
        });

        labels = _.mapKeys(labels, "nameColor");

        return labels;
    } else {
        return {};
    }
};

addDays = (date, days) => {
    let result = new Date(date);

    result.setDate(result.getDate() + days);

    return result;
};

extractTrelloIntervals = async (cards, board) => {
    let insertOpsDict = {};

    cards.map((card) => {
        const { actions } = card;

        if (actions) {
            actions.map((action) => {
                let { date } = action;

                date = new Date(date);

                const start = addDays(date, -10);

                const identifier = `${start.getTime()}-${date.getTime()}`;

                insertOpsDict[identifier] = {
                    start,
                    end: date,
                    board: board._id,
                };

                if (card.intervalIdentifiers) {
                    card.intervalIdentifiers.push(identifier);
                } else {
                    card.intervalIdentifiers = [identifier];
                }
            });
        }
    });

    const insertOps = Object.values(insertOpsDict);

    let intervals = await IntegrationInterval.insertMany(insertOps);

    intervals.map((interval) => {
        interval.identifier = `${interval.start.getTime()}-${interval.end.getTime()}`;
    });

    intervals = _.mapKeys(intervals, "identifier");

    cards.map((card) => {
        const { intervalIdentifiers } = card;

        if (intervalIdentifiers) {
            card.intervalIds = intervalIdentifiers.map((intervalIdentifier) => {
                return intervals[intervalIdentifier]._id;
            });
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

handleTrelloReintegration = async (boards) => {
    // get the source Ids of the boards
    const boardSourceIds = boards.map((board) => board.sourceId);

    // create a boards object mapping keys
    const boardsObj = _.mapKeys(boards, "sourceId");

    // query for all integration boards that already exist and have a
    // sourceId equal to one of the boards requested for integration
    let query = IntegrationBoard.find();

    query.where("sourceId").in(boardSourceIds);

    let reintegratedBoards = await query.lean().exec();

    // map through existing boards and replace repositories with those
    // that need to be integrated
    reintegratedBoards.map((board) => {
        const { sourceId, repositories } = board;

        // get already integrated repos
        const integratedRepos = new Set(
            repositories.map((repoId) => repoId.toString())
        );

        // replace repositories field with requested repositories that don't include already integrated repos
        board.repositories = boardsObj[sourceId].repositoryIds.map(
            (repoId) => !integratedRepos.has(repoId)
        );
    });

    let integratedSourceIds = new Set(
        reintegratedBoards.map((board) => board.sourceId)
    );

    // new boards only
    boards = boards.filter((board) => !integratedSourceIds.has(board.sourceId));

    return { boards, reintegratedBoards };
};

module.exports = {
    acquireTrelloConnectProfile,
    acquireExternalTrelloBoards,
    acquireTrelloData,
    extractTrelloMembers,
    extractTrelloBoard,
    extractTrelloLists,
    extractTrelloDirectAttachments,
    getRepositories,
    extractTrelloLabels,
    modifyTrelloActions,
    extractTrelloIntervals,
    handleTrelloReintegration,
    //populateExistingTrelloDirectAttachments,
    deleteTrelloBoardComplete,
};
