const OAuth = require("oauth").OAuth;
const url = require("url");
const axios = require("axios");
const _ = require("lodash");

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const logger = require("../../../logging/index").logger;

const jobs = require("../../../apis/jobs");
const jobConstants = require("../../../constants/index").jobs;

const TrelloIntegration = require("../../../models/integrations/trello/TrelloIntegration");
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

getTrelloConnectProfile = async (req, res) => {
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
        console.log("ERROR", err);
        return res.json({
            success: false,
            error: "getTrelloConnectProfile Error: Find query failed",
            trace: err,
        });
    }

    if (!profile) return res.json({ success: true, result: null });

    const { accessToken, sourceId: memberId } = profile;

    let boardsReponse;

    try {
        boardsReponse = await trelloAPI.get(
            `/1/members/${memberId}/boards?key=${TRELLO_API_KEY}&token=${accessToken}&fields=id,name`
        );
    } catch (err) {
        console.log("ERROR", err);

        return res.json({
            success: false,
            error:
                "getTrelloConnectProfile Error: trello board API request failed",
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
                "getTrelloConnectProfile Error: board context response query failed",
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
                `${authorizeURL}?oauth_token=${token}&name=${appName}&scope=${scope}&expiration=${expiration}&state=bing`
            );
        }
    );
};

handleTrelloConnectCallback = async (req, res) => {
    const query = url.parse(req.url, true).query;

    console.log("QUERY", query);

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

            console.log("MEMBER RESPONSE", response.data);

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

            console.log("FINAL TRELLO CONNECT PROFILE", trelloConnectProfile);

            return res.redirect("http://getquilt.app");
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
                [{type: "start", name: "In-Progress"}, {type: "end", name: "Done"}]);

            */

            res.redirect(LOCALHOST_HOME_PAGE_URL);
        }
    );
};

// do we want to save the actual boards we care about somewhere?
/*
bulkScrapeTrello = async (
  trelloIntegration,
  requiredBoardIds,
  relevantLists
) => {
  const { workspace, repositories } = trelloIntegration;

  const workspaceId = workspace;
  const repositoryIds = repositories;

  relevantLists = _.map(relevantLists, "name");

  let { boardIds, trelloConnectProfile } = trelloIntegration;

  //console.log("BOARDIDS", boardIds);
  if (requiredBoardIds)
    boardIds = boardIds.filter((boardId) => requiredBoardIds.includes(boardId));

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

  // TODO: If population > 1000, need to handle further data extraction (since, until)
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

            if (likelyUsers.length > 0) member.user = likelyUsers[0]._id;
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

          if (relevantLists[name]) list.type = relevantLists[name].type;

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

      const assigneeIds = idMembers.map((memberId) => members[memberId]._id);

      const cardEventIds = eventIds.map((eventId) => events[eventId]._id);

      if (attachments && attachments.length > 0) {
        attachments = await Promise.all(
          attachments
            .map((attachment) => {
              const { date, url, name } = attachment;

              if (!url.includes("https://github.com")) return null;

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

                const identifier = splitURL.slice(splitURL.length - 1)[0];
                const fullName = splitURL
                  .slice(splitURL.length - 4, splitURL.length - 2)
                  .join("/");

                if (!currentRepositories[fullName]) return null;

                const repositoryId = currentRepositories[fullName]._id;

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
        cardParams.trelloCardDateLastActivity = new Date(dateLastActivity);
      if (attachments && attachments.length > 0)
        cardParams.attachments = attachments.map(
          (attachment) => attachment._id
        );
      if (labels && labels.length > 0) cardParams.labels = labelIds;

      insertOps.push(cardParams);
    });

    try {
      let result = await IntegrationTicket.insertMany(insertOps);
      result = result.filter((res) => res.trelloCardAttachments.length > 0);
      result.map((res) => {
        console.log("RESULT", result);
        console.log("RESULT ATTACHMENTS", result.trelloCardAttachments);
      });
    } catch (err) {
      console.log("ERROR", err);
    }
  }
};
*/
module.exports = {
    beginTrelloConnect,
    handleTrelloConnectCallback,
    getTrelloConnectProfile,
};
