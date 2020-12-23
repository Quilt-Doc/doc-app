//code objects
const PullRequest = require('../../models/PullRequest');
const Branch = require('../../models/Branch');
const Commit = require('../../models/Commit');
const GithubIssue = require('../../models/integrations/GithubIssue');

//association
const Association = require('../../models/associations/Association');

//integrations
const TrelloIntegration = require('../../models/integrations_fs/trello/TrelloIntegration');

//use
require('@tensorflow/tfjs');
const use = require('@tensorflow-models/universal-sentence-encoder');

//utility
const similarity = require("compute-cosine-similarity");
const normalize = require('array-normalize')
const { mean } = require('lodash');
const { std } = require('mathjs');
// 'creator assignees intervals labels comments attachments'

generateDirectAssociations = (integrationId, integrationType) => {

    const acceptedTypes = { 
        trello: { integrationModel: TrelloIntegration, integrationField: "trelloIntegration" }
    }

    if (!(integrationType in acceptedTypes)) {
        throw new Error("Not Correct IntegrationType")
    }

    const { integrationModel, integrationField } = acceptedTypes[integrationType];

    const integration = await integrationModel.find({ _id: integrationId }).lean().exec();

    const { workspace } = integration;

    let query = IntegrationTicket.find({ [integrationField]: integration._id }).lean().exec();

    query.populate({path: 'attachments'});

    const tickets = await query.exec();

    //const installationId = "12648453";
    //const fullName = "Quilt-Doc/doc-app";

    const attachmentTypeMapping = {
        issue: {
            attachmentModel: GithubIssue,
            identifierName: "number",
            attachmentModelName: "GithubIssue",
        },
        pullRequest: {
            attachmentModel: PullRequest,
            identifierName: "pullRequestNumber",
            attachmentModelName: "PullRequest"
        },
        commit: {
            attachmentModel: Commit,
            identifierName: "sha",
            attachmentModelName: "Commit"
        },
        branch: {
            attachmentModel: Branch,
            identifierName: "ref",
            attachmentModelName: "Branch"
        }
    }

    let attachmentTypes = [];      

    const allAttachments = await Promise.all(tickets.map(ticket => {

        const { attachments } = ticket;

        let singleAttachmentTypes = []
        
        let promise = Promise.all(attachments.map(attachment => {

            const { type, repository, identifier } = attachment;
                    
            singleAttachmentTypes.push(type);

            if (!["pullRequest", "commit", "branch", "issue"].includes(type)) {
                //throw new Error("Not Correct Attachment Type")
                return null;
            }

            const { attachmentModel, identifierName } = attachmentTypeMapping[type];

            let query = attachmentModel.find({ [identifierName]: identifier, repository});

            query.select('_id');

            return query.lean().exec();

        }));

        attachmentTypes.push(singleAttachmentTypes);

        return promise;
    }));


    let associations = [];

    allAttachments.map((ticketAttachments, i) => {

        const currentTicket = tickets[i];

        const currentAttachmentTypes = attachmentTypes[i];

        ticketAttachments.map((attachment, j) => {

            if (!attachment) return;

            const secondElementType = currentAttachmentTypes[j];

            let association = {
                workspace,
                firstElement: currentTicket._id,
                firstElementType: "IntegrationTicket",
                secondElement: attachment._id,
                secondElementType,
                quality: 1,
                associationLevel: 1
            };

            associations.push(association);
        });

    });

    associations = await Association.insertMany(associations).lean();
}


addDays = (date, days) => {

    let result = new Date(date);

    result.setDate(result.getDate() + days);

    return result;

}


generateLikelyAssociations = (req, res) => {

    const { integrationId, integrationType } = req.body;

    const acceptedTypes = { 
        trello: { integrationModel: TrelloIntegration, integrationField: "trelloIntegration" }
    }

    if (!(integrationType in acceptedTypes)) {
        console.log("ERROR OCCURRED");
    }

    const { integrationModel, integrationField } = acceptedTypes[integrationType];

    const integration = integrationModel.findById(integrationId).lean().exec();

    let query = IntegrationTicket.find({ [integrationField]: integrationId });

    query.populate('intervals attachments');

    const tickets = query.lean().exec();

    //assuming multiple intervals, process each interval in separate batch
    const likelyAssociations = await Promise.all(tickets.map(ticket => {

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
        
        pullRequestQuery.lean().exec();


        let issueQuery = GithubIssue.find({'$or': intervalFilters});

        issueQuery.where('members').in(members);

        issueQuery.lean().exec();


        let commitQuery = Commit.find({'$or': intervalFilters});

        commitQuery.where('creator').in(members);

        commitQuery.lean().exec();


        let branchQuery = Branch.find({'$or': intervalFilters});

        branchQuery.where('creator').in(members);

        branchQuery.lean().exec();


        return Promise.all([pullRequestQuery, issueQuery, commitQuery, branchQuery]);

    }));

    tickets = tickets.map((ticket, i) => {

        const { attachments } = ticket;

        const trueIdentifiers = attachments.map((attachment) => {
            const { type, repository, identifier } = attachment;

            return `${type}/${repository}/${identifier}`;
        })

        let [likelyPullRequests, likelyIssues, 
            likelyCommits, likelyBranches] = likelyAssociations[i];

        
        likelyPullRequests = likelyPullRequests.filter(pr => {

            const { sourceId, repository } = pr;

            !trueIdentifiers.includes(`pullRequest/${repository}/${sourceId}`);

        });

        likelyIssues = likelyIssues.filter(issue => {

            const { sourceId, repository } = issue;

            !trueIdentifiers.includes(`issue/${repository}/${sourceId}`);

        });

        likelyCommits = likelyCommits.filter(commit => {

            const { sourceId, repository } = commit;

            !trueIdentifiers.includes(`commit/${repository}/${sourceId}`);

        });

        likelyCommits = likelyBranches.filter(branch => {

            const { sourceId, repository } = branch;

            !trueIdentifiers.includes(`branch/${repository}/${sourceId}`);

        });

        ticket = {...ticket, likelyPullRequests, likelyIssues, 
            likelyCommits, likelyBranches}

        return ticket;

    });

    return res.json({success: true, result: tickets});
}

//TODO:
//descriptions only add -- we'd like it such that bad descriptions are accounted for
//can be done by adding the mean of the descriptions to those that don't have a description

generateSemanticAssociations = async (tickets) => {

    let uniqueCodeObjectMapping = {
        likelyPullRequests: {},
        likelyIssues: {},
        likelyCommits: {},
        likelyBranches: {}
    }

    const model = await use.load();

    let ticketNames = [];
    let ticketDescs = [];

    tickets.map((ticket, i) => {

        const { name, description } = ticket;

        ticketNames.push(name);

        ticketDescs.push(`${name} ${description}`);

        Object.keys(uniqueCodeObjectMapping).map(key => {

            const likelyCodeObjects = ticket[key];

            likelyCodeObjects.map(likelyCode => {

                const { _id: codeId } = likelyCode;

                if (!codeId in uniqueCodeObjectMapping[key]) {

                    uniqueCodeObjectMapping[key][codeId] = likelyCode;

                }

            });

        });

    });


    const embeddedTicketNames = await model.embed(ticketNames);

    const embeddedTicketDescs = await model.embed(ticketDescs);


    Object.keys(uniqueCodeObjectMapping).map(async (key) => {

        const uniqueCodeObjects = uniqueCodeObjectMapping[key];

        let uniqueCONames = [];

        let uniqueCODescs = [];
        
        Object.keys(uniqueCodeObjects).map(coKey => {

            const uniqueCodeObject = uniqueCodeObjects[coKey];

            const { description, name } = uniqueCodeObject;

            uniqueCONames.push(name);

            uniqueCODescs.push((description && description.length > 1) ? `${name} ${description}` : "");

        });

        const embeddedNames = await model.embed(uniqueCONames);

        const embeddedDescs = await model.embed(uniqueCODescs);

        Object.keys(uniqueCodeObjects).map((coKey, i) => {

            uniqueCodeObjectMapping[key][coKey].embeddedName = embeddedNames[i];
            
            uniqueCodeObjectMapping[key][coKey].embeddedDesc = embeddedDescs[i];

        });

    });

    let allNameScores = [];

    let allDescScores = [];

    
    tickets.map((ticket, i) => {

        const embeddedTicketName = embeddedTicketNames[i];

        const embeddedTicketDesc = embeddedTicketDescs[i];

        Object.keys(uniqueCodeObjectMapping).map(key => {

            ticket[key].map(co => {

                const { embeddedName, embeddedDesc, description } = 
                    uniqueCodeObjectMapping[key][co._id];

                const nameScore = similarity(embeddedTicketName, embeddedName);

                allNameScores.push(nameScore);

                co.nameScoreIndex = allNameScores.length - 1;

                if (description && description.length > 0) {

                    const descScore = similarity(embeddedTicketDesc, embeddedDesc);
                    
                    allDescScores.push(descScore);

                    co.descScoreIndex = allDescScores.length - 1;
                    
                }

            });

        });

    });
    
    let normalizedNameScores = normalize(allNameScores);

    let normalizedDescScores = normalize(allDescScores);

    let normalizedAllScores = [...normalizedNameScores, ...normalizedDescScores];

    let meanAllScores = mean(normalizedAllScores);

    let stdAllScores = std(normalizedAllScores);
    
    let associations = [];
    
    const modelMapping = {
        likelyPullRequests: "PullRequest",
        likelyIssues: "GithubIssue",
        likelyCommits: "Commit",
        likelyBranches: "Branch"
    }

    tickets.map(ticket => {

        Object.keys(uniqueCodeObjectMapping).map(key => {

            const { _id: ticketId, workspace } = ticket;

            ticket[key].map(co => {

                const { description, nameScoreIndex, descScoreIndex, _id: coId } = co;

                const nameScore = normalizedNameScores[nameScoreIndex]

                let store = false;

                let quality = nameScore;

                //85th percentile
                if (nameScore > 1.036) {

                    store = true;

                } else if (description && description.length > 0) {

                    const descriptionScore = normalizedDescScores[descScoreIndex];

                    const descriptionZScore = 
                        (descriptionScore - meanAllScores)/stdAllScores;

                    //90th percentile
                    if (descriptionZScore > 1.282) {

                        store = true;

                        quality = descriptionScore

                    }
                    
                }

                if (store) {

                    const association = {
                        workspace,
                        firstElement: ticketId,
                        firstElementType: "IntegrationTicket",
                        secondElement: coId,
                        secondElementType: modelMapping[key],
                        quality,
                    }

                    associations.push(association);

                }

            });

        })

    })

    await insertSemanticAssociations(associations);
}

insertSemanticAssociations = async (associations) => {

    try {
        await Association.insertMany(associations).lean();
    } catch (err) {
        console.log("ERROR");
    }
    
} 




module.exports = {
    generateDirectAssociations,
    generateLikelyAssociations,
    insertSemanticAssociations
}