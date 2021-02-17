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
                */

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


/*

    const codeAttachments = parseCodeAttachments(tickets);
    
    //TODO: NEED TO DEAL WITH REPOS
    
    let pullRequests = await Promise.all(Array.from(codeAttachments['pullRequests']).map(pullRequestIdentifier => {

        const split = pullRequestIdentifier.split('-');

        const repositoryId = split[0];

        const pullRequestNumber = split[1];

        return PullRequest.find({ pullRequestNumber, repository: repositoryId }).lean();
       
    }));

    pullRequests = pullRequests.map(pr => {
        const { pullRequestNumber, repository } = pr;

        pr.identifier = `${pullRequestNumber}-${repository}`;

        return pr;
    });

    pullRequests = _.map(pullRequests, 'identifier');

    let commits = await Promise.all(Array.from(codeAttachments['commits']).map(commitIdentifier => {

        const split = commitIdentifier.split('-');

        const repositoryId = split[0];

        const commitSHA = split[1];

        return Commit.find({ sha: commitSHA, repository: repositoryId }).lean();
       
    }));

    commits = _.map(commits, 'sha');

    let issues = await Promise.all(Array.from(codeAttachments['issues']).map(issueIdentifier => {

        const split = issueIdentifier.split('-');

        const repositoryId = split[0];

        const issueNumber = split[1];

        return GithubIssue.find({ number: issueNumber, repository: repositoryId }).lean();
       
    }));

    issues = issues.map(issue => {
        const { number, repository } = issue;

        issue.identifier = `${number}-${repository}`;

        return issue;
    });

    issues = _.map(issues, 'identifier');

    let branches = await Promise.all(Array.from(codeAttachments['branches']).map(branchIdentifier => {

        const split = branchIdentifier.split('-');

        const repositoryId = split[0];

        const ref = split[1];

        return Branch.find({ ref, repository: repositoryId }).lean();
       
    }));

    branches = branches.map(branch => {

        const { ref, repository } = branch;

        branch.identifier = `${ref}-${repository}`;

        return branch;

    });

    branches = _.map(branches, 'identifier');

    let codeData = { pullRequests, commits, issues, branches };

    let associationRequests = [];

    tickets.map(ticket => {
        const { attachments } = ticket;

        attachments.map(attachment => {
            const { identifier, type, repository, link } = attachment;

            key = type === "commit" ? identifier : `${identifier}-${repository}`;

            codeObjectKey = type === "branch" ? "branches" : `${type}s`;

            let allCodeObjects = codeData[codeObjectKey];

            let codeObject = allCodeObjects[key];

            let secondElementType = type === "issue" ? "GithubIssue" 
            : type === "pullRequest" ? "PullRequest"
            : type === "commit" ? "Commit"
            : "Branch"

            let associationReq = {
                workspace,

                firstElement: ticket._id,
                firstElementType: "IntegrationTicket",
            
                secondElement: codeObject._id,
                secondElementType,
            
                quality: 1,
            
                associationLevel: 1,
            
                attachmentLink: link,
            };

            associationRequests.push(associationReq);
        })
    })


    
*/


parseCodeAttachments = (tickets) => {
    let codeAttachments = {
        issues: new Set(), 
        pullRequests: new Set(), //PRS
        commits: new Set(),
        branches: new Set() //BRANCHES
    };

    
    tickets.map(ticket => {
        const { attachments } = ticket;

        if (attachments && attachments.length > 0) {

            attachments.map(attachment => {

                const { link, type, repository, identifier } = attachment;
                            
                let key = type === "issue" ? "issues" 
                    : type === "pullRequest" ? "pullRequests"
                    : type === "commit" ? "commits"
                    : "branches"

                githubData[key].add(`${repository}-${identifier}`);

            });
        }
    });

    return codeAttachments;
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




//generate association pipeline:

/*for each ticket we want to:
extract all github attachments directly associated

extract all github prs, issues, commits in date range with correct member

do semantic matching
*/

generateTrelloAssociations = (trelloIntegration) => {

    const { workspace } = trelloIntegration;

    let query = IntegrationTicket.find({ trelloIntegration: trelloIntegration._id }).lean();

    query.populate({path: 'creator assignees intervals labels comments attachments'});

    const tickets = await query.exec();

    //get all pull requests
    //get all commits
    //get all issues
    //get all branches
    //ticket 
    //assumption same number of intervals for each ticket

    //const installationId = "12648453";
    //const fullName = "Quilt-Doc/doc-app";

      
    const allAttachments = await Promise.all(tickets.map(ticket => {

        const { attachments } = ticket;

        return Promise.all(attachments.map(attachment => {

            const { link, type, repository, identifier } = attachment;
                    
            if (!["pullRequest", "commit", "branch", "issue"].includes(type)) {

                console.log("ERROR");

            }

            if (type === "issue") {

                return GithubIssue.find({ number: identifier, repository }).lean();
            
            } else if (type === "pullRequest") {

                return PullRequest.find({ pullRequestNumber: identifier, repository }).lean();

            } else if (type === "commit") {

                return Commit.find({ sha: identifier, repository }).lean();

            } else {

                return Branch.find({ ref: identifier, repository }).lean();

            }

        }));

    }));


    let associations = [];

    allAttachments.map((ticketAttachments, i) => {

        const currentTicket = tickets[i];

        ticketAttachments.map(attachment => {

            let association = {
                workspace,
                firstElement: currentTicket._id,
                firstElementType: "IntegrationTicket",
                secondElement: attachment._id,
                secondElementType: attachment.constructor.modelName,
                quality: 1,
                associationLevel: 1
            };

            associations.push(association);
        });

    });

    associations = await Association.insertMany(associations);

    const filteredCommits = await filterCommits(relevantCardData, filteredActions);
            
    const finalData = mergeData(githubData, filteredCommits);

    //const associations = JSON.stringify(finalData);

    const relevant = JSON.stringify(relevantCardData);
}


generateSemanticAssociations = (req, res) => {

    const { integrationId, integrationType } = req.body;

    const acceptedTypes = { 
        trello: { integrationModel: TrelloIntegration, integrationField: "trelloIntegration" }
    }

    if (!(integrationType in acceptedTypes)) {
        console.log("ERROR OCCURRED");
    }

    const { integrationModel, integrationField } = acceptedTypes[integrationType];

    const integration = integrationModel.findById(integrationId).lean().exec();

    let tickets = IntegrationTicket.find({ [integrationField]: integrationId }).lean().exec();

    //assuming multiple intervals, process each interval in separate batch
    const ticketsData = await Promise.all(tickets.map(ticket => {

        const { intervals, creator, assignees } = ticket;

        const members = Array.from(new Set([ creator, ...assignees ]));

        const intervalFilters = intervals.map(interval => {
            let { start, end } = interval;

            start = addDays(start, -10);

            end = addDay(end, 10);

            return {
                sourceCreationDate: {
                    '$gt': start,
                    '$lt': end
                }
            }
        });

        let pullRequestQuery = PullRequest.find({'$or': intervalFilters});

        pullRequestQuery.where('members').in(members);

        let issueQuery = GithubIssue.find({'$or': intervalFilters});

        issueQuery.where('members').in(members);

        let commitQuery = Commit.find({'$or': intervalFilters});

        commitQuery.where('creator').in(members);

        let branchQuery = Branch.find({'$or': intervalFilters});

        branchQuery.where('creator').in(members);

        return Promise.all([pullRequestQuery, issueQuery, commitQuery, branchQuery]);

    }));

    tickets = tickets.map((ticket, i) => {
        ticket.codeObjectData = ticketsData[i];
        return ticket;
    });

    return res.json({success: true, result: tickets});
}

addDays = (date, days) => {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
