const http = require('http')
const OAuth = require('oauth').OAuth
const url = require('url')
const axios = require('axios');
const _ = require('lodash');

const jaccardDistance = require('@extra-string/jaccard-distance');

const apis = require('../../apis/api');

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const TrelloIntegration = require('../../../models/integrations_fs/trello/TrelloIntegration');
const TrelloConnectProfile = require('../../../models/integrations_fs/trello/TrelloConnectProfile');

const IntegrationUser = require('../../../models/integrations_fs/integration_objects/IntegrationUser');
const IntegrationTicket = require('../../../models/integrations_fs/integration_objects/IntegrationTicket');
const IntegrationBoard = require('../../../models/integrations_fs/integration_objects/IntegrationBoard');
const IntegrationColumn = require('../../../models/integrations_fs/integration_objects/IntegrationColumn');
const IntegrationEvent = require('../../../models/integrations_fs/integration_objects/IntegrationEvent');
const IntegrationLabel = require('../../../models/integrations_fs/integration_objects/IntegrationLabel');

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

const loginCallback =  `http://localhost:3001/api/integrations/connect/trello/callback`;
const oauth = new OAuth(requestURL, accessURL, key, secret, "1.0A", loginCallback, "HMAC-SHA1");

const trelloAPI = axios.create({
    baseURL: "https://api.trello.com"
})


beginTrelloConnect = async (req, res) => {
    const { user_id, workspace_id } = req.query;

    const userId = user_id;
    const workspaceId = workspace_id;

    oauth.getOAuthRequestToken((error, token, tokenSecret, results) => {

        if (error) {
            console.log("ERROR", error);
        }


        let trelloConnectProfile = new TrelloConnectProfile({
            authorizeToken: token,
            authorizeTokenSecret: tokenSecret,
            user: ObjectId(userId),
            workspace: ObjectId(workspaceId)
        });


        try {
            trelloConnectProfile = trelloConnectProfile.save();
        } catch (err) { 
            console.log("ERROR", err);
        }

        res.redirect(`${authorizeURL}?oauth_token=${token}&name=${appName}&scope=${scope}&expiration=${expiration}`);
    });
};


handleTrelloConnectCallback = async (req, res) => {

    const query = url.parse(req.url, true).query;
    const token = query.oauth_token;

    let trelloConnectProfile;
    
    try {
        trelloConnectProfile = await TrelloConnectProfile.findOne({authorizeToken: token});
    } catch (err){
        console.log("ERROR", err);
    }

    const { authorizeToken, authorizeTokenSecret, user, workspace } = trelloConnectProfile;

    // NOT POPULATED SO THEY ARE IDS
    const userId = user;
    const workspaceId = workspace;

    const verifier = query.oauth_verifier;

    oauth.getOAuthAccessToken(authorizeToken, authorizeTokenSecret, verifier, 
        async (error, accessToken, accessTokenSecret, results) => {
            // In a real app, the accessToken and accessTokenSecret should be stored

            if (error) console.log("ERROR", err);

            trelloConnectProfile.accessToken = accessToken;
            trelloConnectProfile.accessTokenSecret = accessTokenSecret;

            try {
                trelloConnectProfile = await trelloConnectProfile.save();
            } catch (err) {
                console.log("ERROR", err);
            }

            const response = await trelloAPI.get(`/1/members/me/?key=${TRELLO_API_KEY}&token=${accessToken}`);
            const { data: {id, idBoards}} = response;

            let trelloIntegration = new TrelloIntegration(
                {
                    boardIds: idBoards,
                    profileId: id,
                    user: ObjectId(userId),
                    workspace: ObjectId(workspaceId),
                    repositories: [],
                    trelloConnectProfile: ObjectId(trelloConnectProfile._id)
                }
            )

            try {
                trelloIntegration = await trelloIntegration.save();
            } catch (err) {
                console.log("ERROR", err);
            }
            
            console.log("TRELLO INTEGRATION", trelloIntegration);

            
            const boardRequests = idBoards.map(boardId => trelloAPI.get(
                `/1/boards/${boardId}?key=${TRELLO_API_KEY}&token=${accessToken}`));

            const boardResponses = await Promise.all(boardRequests);

            const boards = boardResponses.map(boardResponse => {
                return boardResponse.data;
            });

            quiltProductBoard = boards.filter(board => board.name === "Quilt Product")[0];
            
            await bulkScrapeTrello(trelloIntegration, [quiltProductBoard.id], 
                [{type: "start", name: "In-Progress"}, {type: "end", name: "Done"}]);

            //KG ID '5f35d7fd1a17f60fec421676'
            //FS ID '5f35d8548635737e2f8b3917'
            //KG MID '5d4922eebeac60897c798a9f'
            //FS MID '5b3e259cfab278a1fd812a01'

            //const memberResponse = await trelloAPI.get(`/1/boards/${quiltProductBoard.id}/memberships?key=${TRELLO_API_KEY}&token=${accessToken}`);

            //const cardResponse = await trelloAPI.get(`/1/boards/${quiltProductBoard.id}/cards/all?key=${TRELLO_API_KEY}&token=${accessToken}`);
            
            //let cards = cardResponse.data;

            /*
            cards = cards.map((card, i) => {
                card.dateLastActivity = new Date(card.dateLastActivity)
                return card;
            });*/

            /*
            cards.sort((a, b) => {
                const dateA = new Date(a.dateLastActivity);
                const dateB = new Date(b.dateLastActivity);
        
                if (dateA.getTime() < dateB.getTime()) {
                    return -1
                } else {
                    return 1;
                }
            });

            //cards = cards.filter(card => card.name === "Create PoC to Display JIRA Tickets");

            cards = cards.slice(0, 10);

            for (let i = 0; i < cards.length; i++) {
                const testCard = cards[i];
                console.log("COUNT", i);
                //USEFUL FIELDS
                const { dateLastActivity, desc, name, due, idMembers, labels, url } = testCard;

                const attachmentResponse =  await trelloAPI.get(`/1/cards/${testCard.id}/attachments?key=${TRELLO_API_KEY}&token=${accessToken}`);
                const attachments = attachmentResponse.data;
                const githubData = parseGithubAttachments(attachments);
                //console.log("ATTACHMENTS", attachmentResponse.data);

                //Gives me the movement
                const actionResponse =  await trelloAPI.get(`/1/cards/${testCard.id}/actions?filter=updateCard:idList&key=${TRELLO_API_KEY}&token=${accessToken}`);
                let actions = actionResponse.data;

                //WHEN IS THE CARD ACTIVE?
                //EXCLUDE WHEN DONE OCCURS AFTER IN PROGRESS
                let filteredActions = actions.filter(action => {
                    const { data: {listAfter}} = action;
                    return ((listAfter.name === "Done") || (listAfter.name === "In-Progress"));
                });

                if (filteredActions.length < 2) {
                    filteredActions = getMostRecentActions(actions);
                } else {
                    filteredActions = getMostRecentActions(filteredActions);
                }

                const relevantCardData = { id: testCard.id, dateLastActivity, desc, name, due, idMembers, labels, url };
                
                const filteredCommits = await filterCommits(relevantCardData, filteredActions);
                
                const finalData = mergeData(githubData, filteredCommits);

                const associations = JSON.stringify(finalData);

                const relevant = JSON.stringify(relevantCardData);

                
                let ticket = new Ticket(
                    {
                        integration: integration._id,
                        associations,
                        relevant,
                        //repository
                        workspace: ObjectId(workspaceId),
                        type: "trello"
                    }
                )
                
                await ticket.save();
                
                console.log("FINAL DATA", finalData);
            }

                /*
            const cardResponses = await Promise.all(cardRequests);

            cardResponses.map((cardResponse, i) => {
                const boardCards = cardResponse.data;
                console.log("BOARD CARDS", boardCards);
                return boardCards;
            });*/
            
            res.redirect(LOCALHOST_HOME_PAGE_URL);

            /*
            oauth.getProtectedResource("https://api.trello.com/1/members/me", "GET", accessToken, accessTokenSecret, (error, data, response) => {
                console.log(accessToken)
                console.log(accessTokenSecret)
                console.log("DATA", data);
                // Now we can respond with data to show that we have access to your Trello account via OAuth
                res.send(data)
            });*/
        }
    );
};


// do we want to save the actual boards we care about somewhere?
bulkScrapeTrello = async (trelloIntegration, requiredBoardIds, relevantLists) => {
    const { workspace, repositories } = trelloIntegration;

    const workspaceId = workspace;
    const repositoryIds = repositories;

    relevantLists = _.map(relevantLists, "name");

    let { boardIds, trelloConnectProfile } = trelloIntegration;

    //console.log("BOARDIDS", boardIds);
    if (requiredBoardIds) boardIds = boardIds.filter(boardId => requiredBoardIds.includes(boardId));

    const trelloConnectProfileId = trelloConnectProfile;

    try {
        trelloConnectProfile = await TrelloConnectProfile.findById(trelloConnectProfileId).lean().select('accessToken').exec();
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
    
        const nestedCardFields = "&card_fields=id,idList,dateLastActivity,desc,name,due,dueComplete,idMembers,labels,url";
        const nestedCardParam = `&cards=all&card_members=true&card_attachments=true${nestedCardFields}`;
    
        const nestedActionParam = "&actions=updateCard:idList&actions_limit=1000&action_member=false&action_memberCreator_fields=fullName,username";
    
        const nestedMemberParam = "&members=all";

        const nestedLabelParam = "&labels=all&label_fields=color,name&labels_limit=1000";

        const boardResponse = await trelloAPI.get(`/1/boards/${requestIdParams}${nestedListParam}${nestedCardParam}${nestedActionParam}${nestedMemberParam}${nestedLabelParam}`);

        let { actions, cards, lists, members, labels } = boardResponse.data;

        //create IntegrationUsers for members

        currentWorkspace = await Workspace.findById(workspaceId).lean().select('memberUsers').populate('memberUsers');

        workspaceUsers = currentWorkspace.memberUsers;

        try {
            members = await Promise.all(members.map(member => {
                const { id, username, fullName } = member;

                member = new IntegrationUser({
                    sourceId: id,
                    source: "trello",
                    userName: username,
                    name: fullName,
                });

                const splitName = fullName.split(' ');

                if (splitName.length > 0) {
                    const likelyFirstName = splitName[0];

                    const likelyLastName = splitName[-1];

                    const likelyUsers = workspaceUsers.filter(user => {
                        return ((user.firstName === likelyFirstName && user.lastName === likelyLastName) 
                            || user.username === username)
                    });

                    if (likelyUsers.length > 0) member.user = likelyUsers[0]._id;
                }

                return member.save()

            }));

        } catch (err) {
            console.log("ERROR", err);
        }

        members = _.mapKeys(members, 'sourceId');


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

            board = await board.save()
        } catch (err) {
            console.log("ERROR", err);
        }

        // create IntegrationColumn
        try {

            lists = await Promise.all(lists.map(list => {
                const { id, name } = list;

                list = new IntegrationColumn({
                    name,
                    source: "trello",
                    sourceId: id,
                    board: board._id,
                });

                if (relevantLists[name]) list.type = relevantLists[name].type;
                
                return list.save()
            }));
        
        } catch (err) {

            console.log("ERR", err);

        }

        lists = _.mapKeys(lists, 'sourceId');

        cards = _.mapKeys(cards, 'id');

        //create IntegrationEvents
        let events;

        try {    
            events = await Promise.all(actions.map(action => {

                const { data : { listAfter: { name }, card }, id, idMemberCreator } = action;
                
                if (relevantLists[name]) {
                    let actionCreator = members[idMemberCreator];

                    let event = new IntegrationEvent({
                        action: "movement", 
                        source: "trello",
                        sourceId: id,
                        sourceCreationDate: new Date(action.date),
                        type: relevantLists[name].type,
                        creator: actionCreator._id
                    });

                    if (cards[card.id].eventIds) {
                        cards[card.id].eventIds.push(id);
                    } else {
                        cards[card.id].events = [id];
                    }

                    return event.save();
                } else { 
                    return null
                }
            }).filter(event => event != null));
        
        } catch (err) {
            console.log("ERROR", err);
        }

        events = _.mapKeys(events, 'sourceId');

        try {
            labels = await Promise.all(labels.map(label => {

                const { color, name } = label;

                label = new IntegrationLabel({
                    color,
                    text: name,
                    source: "trello"
                });

                label.save();

            }));
        } catch (err) {
            console.log("ERROR", err);
        }

        //TODO: POSSIBLE DUPLICATES
        labels = _.mapKeys(labels, 'text');
    
        let insertOps = [];
    
        Object.values(cards).map(card => {
            let { id, idList, dateLastActivity, desc, name, attachments,
                due, dueComplete, idMembers, url, eventIds } = card;
    
            const cardListId = lists[idList]._id;
    
            const assigneeIds = idMembers.map(memberId => members[memberId]._id);

            const cardEventIds = eventIds.map(eventId => events[eventId]._id);

            if (attachments && attachments.length > 0) {

                attachments = attachments.filter(attachment => {
                    const { url } = attachment;
                    return (url && url.includes("https://github.com"));
                });
    
                attachments = attachments.map(attachment => {
                    const { date, url, name } = attachment;
    
                    return { date, url, name };
                });

            }
    
            const labelIds = card.labels.map(label => labels[label.name]._id);

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

                trelloIntegration: trelloIntegration._id
            }
    
            if (due) cardParams.trelloCardDue = new Date(due);
            if (dueComplete) cardParams.trelloCardDueComplete = dueComplete;
            if (dateLastActivity) cardParams.trelloCardDateLastActivity = new Date(dateLastActivity);
            if (attachments && attachments.length > 0) cardParams.attachments = attachments;
            if (labels && labels.length > 0) cardParams.labels = labelIds;
    
            insertOps.push(cardParams);
        });
    
    
        try {
            let result = await IntegrationTicket.insertMany(insertOps);
            result = result.filter(res => res.trelloCardAttachments.length > 0);
            result.map(res => {
                console.log("RESULT", result);
                console.log("RESULT ATTACHMENTS", result.trelloCardAttachments);
            })
        } catch (err) {
            console.log("ERROR", err);
        }
    }
}

parseGithubAttachments = (attachments) => {
    let githubData = {
        issues: [], 
        pull: [], //PRS
        commit: [],
        tree: [] //BRANCHES
    };

    attachments.map(attachment => {
        const { url } = attachment;
        if (url.includes("https://github.com")) {
            const splitURL = url.split('/');

            try {
                const type = splitURL.slice(splitURL.length - 2, splitURL.length - 1)[0];
                console.log("TYPE", type);
                if (type in githubData) {
                    const { id, date, idMember, name, url } = attachment;
                    githubData[type].push({ id, date, idMember, name, url, quality: 1 });
                }
            } catch (err) {
                console.log(err);
            }
        
        }
    });

    return githubData;
}


getMostRecentActions = (actions) => {
    actions = [...actions];
    
    actions.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        if (dateA.getTime() < dateB.getTime()) {
            return -1
        } else {
            return 1;
        }
    });
    //console.log("ACTIONS", actions);

    const sliced = actions.slice(0,2);
    //console.log("SLICED", sliced);
    return sliced;
}


filterCommits = async (relevantCardData, filteredActions) => {
    const { id, dateLastActivity, desc, name, due, idMembers, labels, url } = relevantCardData;
    const users = {'5d4922eebeac60897c798a9f': "kgodara", '5b3e259cfab278a1fd812a01': "fsanal"};
    
    const authorFilter = idMembers.length === 1 ? `&author=${users[idMembers[0]]}` : "";
    //get Date Range
    let since;
    let until;
    let quality;

    if (filteredActions.length === 2) {
        const sinceDate = new Date(filteredActions[0].date);
        since = sinceDate.toISOString();

        const untilDate = addDays(filteredActions[1].date, 4);
        until = untilDate.toISOString();

        quality = 2;
    } else {
        //primitively do creation to last activity or due date if available
        const hexDate = id.slice(0,8);
        const decDate = parseInt(hexDate, 16);

        const sinceDate = new Date(decDate * 1000);
        since = sinceDate.toISOString();

       
        const untilDate = due ? addDays(due, 4) : addDays(dateLastActivity, 4);
        until = untilDate.toISOString();

        quality = 3;
    }


    //hardcoded for testing purposes;
    const installationId = "12648453";
    const fullName = "Quilt-Doc/doc-app";

    let installationClient = await apis.requestInstallationClient(installationId);

    //= await installationClient.post(`/repos/${fullName}/check-runs`, beginObject);

    let branchResponse = await installationClient.get(`/repos/${fullName}/branches`);
    let branches = branchResponse.data;

    //TO ELIMINATE BRANCHES WE CAN CHECK BEHIND FROM MASTER
    //DATES MAY NOT COINCIDE DIRECTLY
    //console.log("BRANCHES", branches);
    let commits = {};


    for (let i = 0; i < branches.length; i++) {
        const branch = branches[i];
        const {name, commit: {sha}} = branch;
        let commitResponse = await installationClient.get(`/repos/${fullName}/commits?since=${since}&until=${until}&sha=${sha}${authorFilter}`);
        let commitData = commitResponse.data;


        /*
        let commits = commitData.map(dataPoint => {
            const { sha, commit: {message}} = dataPoint;
            return {sha, message};
        });
        
        
        const options = {
            includeScore: true,
            // equivalent to `keys: [['author', 'tags', 'value']]`
            keys: ['message']
        }
    
        const fuse = new Fuse(commits, options);

        console.log("NAME", name);
        const searchResults = fuse.search(name);

        console.log("RESULTS", searchResults);
        searchResults.map(({commit, sha, score}) => commits[sha] = {commit, sha, score});
        */

        commitData.map(({commit, sha}) => {
            //branch and message
            const { message } = commit;
            
            
            //const descScore = jaccardDistance(desc, message);
            const distance = jaccardDistance(name, message);
            commits[sha] = { commit, jaccardDistance: distance, quality };
            
        })
    }

    console.log("ABOUT TO RETURN ", commits);
    return commits;

    /*
        - Commit Date
        - Commit Person
        - Commit Name
        - Branch Name
        - Commit Comments
        - Relevant File Names
        - Relevant File Changes
        - Relevant File Raw Content
    */

}


addDays = (date, days) => {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}


mergeData = (githubData, filteredCommits) => {
    let githubDataCommits = githubData['commit'].map(({url}) => url.split('/').slice(-1)[0]);

    filteredCommits = Object.values(filteredCommits);

    filteredCommits.map(({commit, jaccardDistance, quality}) => {
        console.log("FILTER COMMIT", commit);

        const sha = commit.url.split('/').slice(-1)[0];
        if (!githubDataCommits.includes(sha)) {
            githubData['commit'].push({commit, jaccardDistance, quality});
        }
    });
   
    return githubData;
}


module.exports = {
    beginTrelloConnect,
    handleTrelloConnectCallback
}


/*batchCalls = {};

    let callNumber = 0;

    boardIds.map((boardId, i) => {

        const requestIdParams = `${boardId}?key=${TRELLO_API_KEY}&token=${accessToken}&fields=id,name`;
        const nestedListParam = "&lists=all&list_fields=id,name";
    
        const nestedCardFields = "&card_fields=id,idList,dateLastActivity,desc,name,due,dueComplete,idMembers,labels,url";
        const nestedCardParam = `&cards=all&card_members=true&card_attachments=true${nestedCardFields}`;
    
        const nestedActionParam = "&actions=updateCard:idList&actions_limit=1000&action_member=false&action_memberCreator_fields=fullName,username";
    
        const nestedMemberParam = "&members=all";
    
        const singleCallURL = `/boards/${boardId}${nestedListParam}${nestedCardParam}${nestedActionParam}${nestedMemberParam}`;

        if (i % 10 === 0) callNumber += 1;

        if (batchCalls[callNumber]) {
            batchCalls[callNumber].push(singleCallURL);
        } else {
            batchCalls[callNumber] = [singleCallURL];
        }
    })

    console.log("BATCH CALLS", batchCalls);

    Object.values(batchCalls).map(async (call) => {

        const batchURL = `/1/batch?key=${TRELLO_API_KEY}&token=${accessToken}&urls=${call.join(',')}`
        console.log("BATCH URL", batchURL);

        const batchResponse = await trelloAPI.get(batchURL);
        console.log("BATCH RESPONSE", batchResponse.data);
  
        
    });
*/