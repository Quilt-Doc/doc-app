const http = require('http')
const OAuth = require('oauth').OAuth
const url = require('url')
const axios = require('axios');
const Fuse = require('fuse.js')
const jaccardDistance = require('@extra-string/jaccard-distance');

const apis = require('../../apis/api');

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const Integration = require('../../models/Integration');
const Ticket = require('../../models/Ticket');

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

const loginCallback =  `http://localhost:3001/api/integrations/trello/callback`;
const oauth = new OAuth(requestURL, accessURL, key, secret, "1.0A", loginCallback, "HMAC-SHA1");

const oauth_secrets = {};

const trelloAPI = axios.create({
    baseURL: "https://api.trello.com"
})

authorizeTrello = (req, res) => {
    const { user_id, workspace_id } = req.query;

    const userId = user_id;
    const workspaceId = workspace_id;

    oauth.getOAuthRequestToken((error, token, tokenSecret, results) => {
        oauth_secrets[token] =  { tokenSecret, userId, workspaceId };

        res.redirect(`${authorizeURL}?oauth_token=${token}&name=${appName}&scope=${scope}&expiration=${expiration}`);
    });
};

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

addDays = (date, days) => {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
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

trelloCallback = (req, res) => {

    const query = url.parse(req.url, true).query;
    const token = query.oauth_token;
    const { tokenSecret, userId, workspaceId } = oauth_secrets[token];
    const verifier = query.oauth_verifier;

    oauth.getOAuthAccessToken(token, tokenSecret, verifier, async (error, accessToken, accessTokenSecret, results) => {
        // In a real app, the accessToken and accessTokenSecret should be stored

        const response = await trelloAPI.get(`/1/members/me/?key=${TRELLO_API_KEY}&token=${accessToken}`);
        const { data: {id, idBoards}} = response;

        let integration = new Integration(
            {
                profileId: id,
                user: ObjectId(userId),
                workspace: ObjectId(workspaceId),
                type: "trello",
                token: accessToken,
                tokenSecret: accessTokenSecret,
            }
        )

        try {
            await integration.save();
        } catch (err) {
            console.log(err);
        }

        
        const boardRequests = idBoards.map(boardId => trelloAPI.get(`/1/boards/${boardId}?key=${TRELLO_API_KEY}&token=${accessToken}`));

        const boardResponses = await Promise.all(boardRequests);

        const boards = boardResponses.map(boardResponse => {
            return boardResponse.data;
        });

        quiltProductBoard = boards.filter(board => board.name === "Quilt Product")[0];

        //KG ID '5f35d7fd1a17f60fec421676'
        //FS ID '5f35d8548635737e2f8b3917'
        //KG MID '5d4922eebeac60897c798a9f'
        //FS MID '5b3e259cfab278a1fd812a01'

        //const memberResponse = await trelloAPI.get(`/1/boards/${quiltProductBoard.id}/memberships?key=${TRELLO_API_KEY}&token=${accessToken}`);

        const cardResponse = await trelloAPI.get(`/1/boards/${quiltProductBoard.id}/cards/all?key=${TRELLO_API_KEY}&token=${accessToken}`);
        
        let cards = cardResponse.data;

        /*
        cards = cards.map((card, i) => {
            card.dateLastActivity = new Date(card.dateLastActivity)
            return card;
        });*/

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
    });
};

createIntegration = async (req, res) => {
    console.log("ENTERED HERE CREATE INTEGRATION");
    console.log("PARAMS", req.params);
    console.log("BODY", req.body);
    console.log("URL",  url.parse(req.url, true));
}

module.exports = {
    createIntegration,
    authorizeTrello,
    trelloCallback
}