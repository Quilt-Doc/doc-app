const OAuth = require("oauth").OAuth;
const url = require("url");
const axios = require("axios");
const _ = require("lodash");

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const logger = require("../../../logging/index").logger;

const jobs = require("../../../apis/jobs");
const jobConstants = require("../../../constants/index").jobs;

const TrelloConnectProfile = require("../../../models/integrations/trello/TrelloConnectProfile");

const IntegrationUser = require("../../../models/integrations/integration_objects/IntegrationUser");
const IntegrationTicket = require("../../../models/integrations/integration_objects/IntegrationTicket");
const IntegrationBoard = require("../../../models/integrations/integration_objects/IntegrationBoard");
const IntegrationColumn = require("../../../models/integrations/integration_objects/IntegrationColumn");
const IntegrationEvent = require("../../../models/integrations/integration_objects/IntegrationEvent");
const IntegrationLabel = require("../../../models/integrations/integration_objects/IntegrationLabel");
const IntegrationAttachment = require("../../../models/integrations/integration_objects/IntegrationAttachment");

const BoardWorkspaceContext = require("../../../models/integrations/context/BoardWorkspaceContext");

const {
    TRELLO_API_KEY,
    TRELLO_SECRET,
    IS_PRODUCTION,
    LOCALHOST_HOME_PAGE_URL,
    PRODUCTION_HOME_PAGE_URL,
} = process.env;

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

getExternalTrelloBoards = async (req, res) => {
    const { userId, workspaceId } = req.params;

    let profile;

    console.log("USERID", userId);

    try {
        profile = await TrelloConnectProfile.findOne({
            user: userId,
            isReady: true,
        })
            .lean()
            .exec();
    } catch (err) {
        return res.json({
            success: false,
            error: "getExternalTrelloBoards Error: Find query failed",
            trace: err,
        });
    }

    if (!profile) return res.json({ success: true, result: null });

    const { accessToken, sourceId: memberId } = profile;

    let boardsReponse;

    try {
        boardsReponse = await trelloAPI.get(
            `/1/members/${memberId}/boards?key=${TRELLO_API_KEY}&token=${accessToken}&fields=id,name&lists=all&list_fields=id,name`
        );
    } catch (err) {
        console.log("ERROR", err);

        return res.json({
            success: false,
            error:
                "getExternalTrelloBoards Error: trello board API request failed",
            trace: err,
        });
    }

    let boards = boardsReponse.data;

    console.log("BOARDS", boards);

    let boardContexts;

    try {
        boardContexts = await BoardWorkspaceContext.find({
            workspace: workspaceId,
        })
            .lean()
            .select("board")
            .populate("board")
            .exec();
    } catch (err) {
        return res.json({
            success: false,
            error:
                "getExternalTrelloBoards Error: board context response query failed",
            trace: err,
        });
    }

    console.log("BOARD CONTEXTS", boardContexts);

    const integratedBoardIds = new Set(
        boardContexts.map((context) => {
            const { board } = context;

            const { sourceId } = board;

            return sourceId;
        })
    );

    console.log("Integrated Board Ids", integratedBoardIds);

    boards = boards.filter((board) => {
        const { id } = board;

        return !integratedBoardIds.has(id);
    });

    console.log("FINAL BOARDS", boards);

    return res.json({ success: true, result: boards });
};

beginTrelloConnect = async (req, res) => {
    const { user_id } = req.query;

    const userId = user_id;

    await oauth.getOAuthRequestToken(
        async (error, token, tokenSecret, results) => {
            if (error) {
                console.log("ERROR", error);
            }

            try {
                await TrelloConnectProfile.deleteMany({ user: userId });
            } catch (err) {
                console.log("ERROR", err);
            }

            let trelloConnectProfile = new TrelloConnectProfile({
                authorizeToken: token,
                authorizeTokenSecret: tokenSecret,
                user: ObjectId(userId),
            });

            try {
                trelloConnectProfile = await trelloConnectProfile.save();
            } catch (err) {
                console.log("ERROR", err);
            }

            res.redirect(
                `${authorizeURL}?oauth_token=${token}&name=${appName}&scope=${scope}&expiration=${expiration}`
            );
        }
    );
};

handleTrelloConnectCallback = async (req, res) => {
    const query = url.parse(req.url, true).query;

    const token = query.oauth_token;

    let trelloConnectProfile;

    try {
        trelloConnectProfile = await TrelloConnectProfile.findOne({
            authorizeToken: token,
        });
    } catch (err) {
        console.log("ERROR", err);
    }

    const { authorizeToken, authorizeTokenSecret, user } = trelloConnectProfile;

    // NOT POPULATED SO THEY ARE IDS

    const verifier = query.oauth_verifier;

    oauth.getOAuthAccessToken(
        authorizeToken,
        authorizeTokenSecret,
        verifier,
        async (error, accessToken, accessTokenSecret, results) => {
            if (error) console.log("ERROR", err);

            const response = await trelloAPI.get(
                `/1/members/me/?key=${TRELLO_API_KEY}&token=${accessToken}`
            );

            const {
                data: { id },
            } = response;

            trelloConnectProfile.accessToken = accessToken;
            trelloConnectProfile.accessTokenSecret = accessTokenSecret;
            trelloConnectProfile.sourceId = id;
            trelloConnectProfile.isReady = true;

            try {
                trelloConnectProfile = await trelloConnectProfile.save();
            } catch (err) {
                console.log("ERROR", err);
            }

            return res.redirect("http://getquilt.app");
        }
    );
};

triggerTrelloScrape = async (req, res) => {
    const { userId, workspaceId } = req.params;

    const { contexts } = req.body;

    const accessToken = await acquireAccessToken(userId);

    /*
    const existingBoards = await handleExistingBoards(accessToken, userId, boardWorkspaceContexts);

    boardWorkspaceContexts = boardWorkspaceContexts.filter(context => {
        !existingBoards.has(context.boardId)
    });*/

    console.log("ACCESS TOKEN", accessToken);

    console.log("WORKSPACEID", workspaceId);

    console.log("CONTEXTS", contexts);

    return res.json("BANG");
    //await bulkScrapeTrello(accessToken, userId, workspaceId, contexts);
};

cleanUp = async (members) => {
    if (members) {
        let query = IntegrationUser.deleteMany();

        const memberIds = members.map((member) => member._id);

        query.where("_id").in(memberIds);

        await query.exec();
    }
};

acquireAccessToken = async (userId) => {
    let trelloConnectProfile;

    try {
        trelloConnectProfile = await TrelloConnectProfile.findOne({
            user: userId,
            isReady: true,
        })
            .lean()
            .exec();
    } catch (err) {
        return res.json({
            success: false,
            error:
                "bulkScrapeTrello Error: TrelloConnectProfile.findOne query failed",
            trace: err,
        });
    }

    const { accessToken } = trelloConnectProfile;

    return accessToken;
};

handleExistingBoards = async (accessToken, userId, boardWorkspaceContexts) => {
    const boardIds = boardWorkspaceContexts.map((context) => context.boardId);

    let query = IntegrationBoard.find({});

    query.where("sourceId").in(boardIds);

    const existingBoards = await query.select("_id sourceId").lean().exec();

    const contexts = _.mapKeys(boardWorkspaceContexts, "boardId");

    existingBoards.map(async (board) => {
        const tickets = IntegrationTicket.find({
            board: board._id,
        }).exec();

        const lists = IntegrationList.find({
            board: board._id,
        })
            .lean()
            .exec();

        const relevantContext = contexts[board._id];

        await Promise.all(
            tickets.map((ticket) => {
                const { attachments } = ticket;

                return populateExistingTrelloDirectAttachments(
                    relevantContext,
                    attachments
                );
            })
        );

        const mappedTickets = _.mapKeys(tickets, "sourceId");

        const boardData = await acquireTrelloData(board._id, accessToken, true);

        const { actions } = boardData;

        const events = await extractTrelloEvent(
            board,
            lists,
            relevantContext.event
        );

        modifyTrelloActions(actions, mappedTickets);

        await Promise.all(
            tickets.map(async (ticket) => {
                const { sourceId } = ticket;

                const { actions } = mappedTickets[sourceId];

                const { intervals: existingIntervals } = ticket;

                const newIntervals = await extractTrelloIntervals(
                    actions,
                    events,
                    lists
                );

                ticket.intervals = [...newIntervals, ...existingIntervals];

                delete ticket.actions;

                return ticket.save();
            })
        );

        const boardWorkspaceContext = new BoardWorkspaceContext({
            board: board._id,
            events: events.map((event) => event._id),
            workspace: relevantContext.workspaceId,
            repositories: relevantContext.repositoryIds,
            creator: userId,
        });

        await boardWorkspaceContext.save();
    });

    return new Set(existingBoards.map((board) => board._id));
};

// boardWorkspaceContexts -> (boardId, event: {beginListId, endListId}, repositories: [repositoryIds],
bulkScrapeTrello = async (accessToken, userId, workspaceId, contexts) => {
    contexts.map(async (context) => {
        const { board: boardId } = context;

        const boardData = await acquireTrelloData(boardId, accessToken);

        let {
            actions,
            cards,
            lists,
            members,
            labels,
            id,
            name,
            idMemberCreator,
            url,
        } = boardData;

        //create IntegrationUsers for members
        members = await extractTrelloMembers(workspaceId, members);

        // create IntegrationBoard
        const board = await extractTrelloBoard(
            members,
            id,
            name,
            idMemberCreator,
            url
        );

        lists = await extractTrelloLists(lists, board);

        await extractTrelloDirectAttachments(cards);

        cards = _.mapKeys(cards, "id");

        await modifyTrelloActions(actions, cards, lists, event);

        //create IntegrationIntervals
        let { event, repositories } = context;

        event = extractTrelloEvent(board, lists, event);

        context = new BoardWorkspaceContext({
            board: board._id,
            event: event._id,
            workspace: workspaceId,
            repositories: repositories,
            creator: userId,
        });

        await context.save();

        await extractTrelloIntervals(event, Object.values(cards), lists);

        labels = await extractTrelloLabels(labels);

        let insertOps = [];

        Object.values(cards).map(async (card) => {
            let {
                id,
                idList,
                dateLastActivity,
                desc,
                name,
                attachmentIds,
                intervalIds,
                due,
                dueComplete,
                idMembers,
                url,
            } = card;

            const columnId = lists[idList]._id;

            const assigneeIds = idMembers.map(
                (memberId) => members[memberId]._id
            );

            const labelIds = card.labels
                ? card.labels.map(
                      (label) => labels[`${label.name}-${label.color}`]._id
                  )
                : [];

            let cardParams = {
                name,
                source: "trello",
                sourceId: id,
                description: desc,
                link: url,
                assignees: assigneeIds, // trelloCardMember, // trelloCardListUpdateDates: [{type: Date}],
                column: columnId,
                board: board._id,
            };

            if (due) cardParams.trelloCardDue = new Date(due);

            if (dueComplete) cardParams.trelloCardDueComplete = dueComplete;

            if (dateLastActivity)
                cardParams.trelloCardDateLastActivity = new Date(
                    dateLastActivity
                );

            if (attachmentIds && attachmentIds.length > 0)
                cardParams.attachments = attachmentIds;

            if (intervalIds && intervalIds.length > 0)
                cardParams.intervals = intervalIds;

            if (labelIds && labelIds.length > 0) cardParams.labels = labelIds;

            insertOps.push(cardParams);
        });

        let tickets;

        try {
            tickets = await IntegrationTicket.insertMany(insertOps);
        } catch (err) {
            console.log("ERROR", err);
        }

        return tickets;
    });
};

// TODO: If population > 1000, need to handle further data extraction (since, until)
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

    const finalQuery = minimal
        ? `/1/boards/${requestIdParams}${nestedActionParam}`
        : `/1/boards/${requestIdParams}${nestedListParam}${nestedCardParam}${nestedActionParam}${nestedMemberParam}${nestedLabelParam}`;

    const boardResponse = await trelloAPI.get(finalQuery);

    return boardResponse.data;
};

extractTrelloMembers = async (workspaceId, members) => {
    const currentWorkspace = await Workspace.findById(workspaceId)
        .lean()
        .select("memberUsers")
        .populate("memberUsers");

    const workspaceUsers = currentWorkspace.memberUsers;

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

                return member.save();
            })
        );
    } catch (err) {
        console.log("ERROR", err);
    }

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

modifyTrelloActions = (actions, cards) => {
    actions.map((action) => {
        const {
            date,
            data: {
                card,
                listAfter: { name: listName },
            },
        } = action;

        if (cards[card.id]) {
            const { actions } = cards[card.id];

            action = { listName, date };

            if (actions) {
                actions.push(action);
            } else {
                actions = [action];
            }
        }
    });
};

extractTrelloLabels = async (labels) => {
    if (labels) {
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

        labels = labels.map(
            (label) => (label.sourceId = `${label.name}-${label.color}`)
        );

        labels = _.mapKeys(labels, "sourceId");

        return labels;
    } else {
        return {};
    }
};

getContextRepositories = async (context) => {
    const { repositoryIds } = context;

    let query = Repository.find({}).lean().select("fullName");

    query.where("_id").in(repositoryIds);

    let currentRepositories = await query.exec();

    currentRepositories = _.map(currentRepositories, "fullName");
};

//context, attachments, desc
extractTrelloDirectAttachments = async (cards, context) => {
    const currentRepositories = await getContextRepositories(context);

    let insertOps = {};

    cards.map((card) => {
        const { attachments, description } = card;

        let seenUrls = {};

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
                let type = splitURL.slice(
                    splitURL.length - 2,
                    splitURL.length - 1
                )[0];

                const modelType =
                    type === "tree"
                        ? "branch"
                        : type === "issues"
                        ? "issue"
                        : type === "pull"
                        ? "pullRequest"
                        : type;

                const sourceId = splitURL.slice(splitURL.length - 1)[0];

                const fullName = splitURL
                    .slice(splitURL.length - 4, splitURL.length - 2)
                    .join("/");

                attachment = {
                    sourceCreationDate: new Date(date),
                    modelType,
                    link: url,
                    sourceId,
                };

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
        await IntegrationAttachment.insertMany(insertOps).lean();
    } catch (err) {
        console.log("ERROR");
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

extractTrelloIntervals = async (event, cards, lists) => {
    let seen = new Set();

    const { beginList: beginListId, endList: endListId } = event;

    const beginList = lists[beginListId];

    const endList = lists[endListId];

    let insertOps = [];

    cards.map((card) => {
        const { actions } = card;

        let interval = {
            start: null,
            end: null,
            event: event._id,
        };

        actions.map((action) => {
            const { listName, date } = action;

            const { start, end } = interval;

            if (listName == beginList.name) {
                if (!start || start.getTime() > date.getTime()) {
                    interval.start = date;
                }
            }

            if (listName == endList.name) {
                if (!end || end.getTime() < date.getTime()) {
                    interval.end = date;
                }
            }
        });

        if (interval.end && interval.start) {
            const intervalIdentifier = `${interval.start.getTime()}-${interval.end.getTime()}`;

            if (!seen.has(intervalIdentifier)) {
                insertOps.push(interval);

                card.intervalIdentifier = `${interval.start.getTime()}-${interval.end.getTime()}`;

                seen.add(intervalIdentifier);
            }
        }
    });

    let intervals = IntegrationInterval.insertMany(insertOps);

    intervals.map((interval) => {
        interval.identifier = `${interval.start.getTime()}-${interval.end.getTime()}`;
    });

    intervals = _.mapKeys(intervals, "identifier");

    cards.map((card) => {
        if (card.intervalIdentifier) {
            card.intervalIds = [intervals[intervalIdentifier]];
        }
    });
};

module.exports = {
    beginTrelloConnect,
    handleTrelloConnectCallback,
    getExternalTrelloBoards,
    triggerTrelloScrape,
};

/*
/*
            let boardsReponse;

            try {
                boardsReponse = await trelloAPI.get(
                    `/1/members/${memberId}/boards?key=${TRELLO_API_KEY}&token=${accessToken}&fields=id,name`
                );
            } catch (err) {
                return res.json({
                    success: false,
                    error:
                        "handleTrelloConnectCallback Error: trello board API request failed",
                    trace: err,
                });
            }

            let boards = boardsReponse.data;

            return { success: true, result: boards };*/
/*
            let trelloIntegration = new TrelloIntegration({
                boardIds: idBoards,
                profileId: id,
                user: ObjectId(userId),
                workspace: ObjectId(workspaceId),
                repositories: [],
                trelloConnectProfile: ObjectId(trelloConnectProfile._id),
            });

            try {
                trelloIntegration = await trelloIntegration.save();
            } catch (err) {
                console.log("ERROR", err);
            }

            console.log("TRELLO INTEGRATION", trelloIntegration);

            const boardRequests = idBoards.map((boardId) =>
                trelloAPI.get(
                    `/1/boards/${boardId}?key=${TRELLO_API_KEY}&token=${accessToken}`
                )
            );

            const boardResponses = await Promise.all(boardRequests);

            const boards = boardResponses.map((boardResponse) => {
                return boardResponse.data;
            });

            quiltProductBoard = boards.filter(
                (board) => board.name === "Quilt Product"
            )[0];

            // trelloIntegrationId, requiredBoardIdList, relevantLists
            var runTrelloScrapeData = {};
            runTrelloScrapeData[
                "trelloIntegrationId"
            ] = trelloIntegration._id.toString();
            runTrelloScrapeData["requiredBoardIdList"] = [quiltProductBoard.id];
            runTrelloScrapeData["relevantLists"] = [
                { type: "start", name: "In-Progress" },
                { type: "end", name: "Done" },
            ];
            runTrelloScrapeData["jobType"] = jobConstants.JOB_SCRAPE_TRELLO;

            try {
                await jobs.dispatchTrelloScrapeJob(runTrelloScrapeData);
            } catch (err) {
                await logger.error({
                    source: "backend-api",
                    message: err,
                    errorDescription: `Error dispatching scrape trello job - trelloIntegrationId, requiredBoardIdList, relevantLists: ${trelloIntegrationId}, ${JSON.stringify(
                        requiredBoardIdList
                    )}, ${JSON.stringify(relevantLists)}`,
                    function: "handleTrelloConnectCallback",
                });

                return res.json({
                    success: false,
                    error: `Error dispatching scrape trello job - trelloIntegrationId, requiredBoardIdList, relevantLists: ${trelloIntegrationId}, ${JSON.stringify(
                        requiredBoardIdList
                    )}, ${JSON.stringify(relevantLists)}`,
                });
            }

            /*
            await bulkScrapeTrello(trelloIntegration, [quiltProductBoard.id], 
                [{type: "start", name: "In-Progress", id}, {type: "end", name: "Done", id}]);

            

           res.redirect(LOCALHOST_HOME_PAGE_URL);
           
           
           
           
           
    if (attachments) {
        attachments = await Promise.all(
            attachments
                .map((attachment) => {
                    const { date, url, name } = attachment;

                    if (!url || !url.includes("https://github.com"))
                        return null;

                    const splitURL = url.split("/");

                    try {
                        let type = splitURL.slice(
                            splitURL.length - 2,
                            splitURL.length - 1
                        )[0];

                        const modelType =
                            type === "tree"
                                ? "branch"
                                : type === "issues"
                                ? "issue"
                                : type === "pull"
                                ? "pullRequest"
                                : type;

                        const sourceId = splitURL.slice(splitURL.length - 1)[0];

                        const fullName = splitURL
                            .slice(splitURL.length - 4, splitURL.length - 2)
                            .join("/");

                        attachment = new IntegrationAttachment({
                            sourceCreationDate: new Date(date),
                            modelType,
                            link: url,
                            sourceId,
                        });

                        if (!currentRepositories[fullName])
                            return attachment.save();

                        attachment.repository =
                            currentRepositories[fullName]._id;

                        return attachment.save();
                    } catch (err) {
                        return null;
                    }
                })
                .filter((request) => request != null)
        );
    } else {
        attachments = [];
    }
           */
