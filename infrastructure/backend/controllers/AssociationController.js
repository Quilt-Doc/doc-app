//code objects
const PullRequest = require('../models/PullRequest');
const Branch = require('../models/Branch');
const Commit = require('../models/Commit');
const GithubIssue = require('../models/integrations/GithubIssue');

//association
const Association = require('../models/associations/Association');

//integrations
const TrelloIntegration = require('../models/integrations_fs/trello/TrelloIntegration');

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
    var result = new Date(date);
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

    query.populate('intervals');

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

        const [likelyPullRequests, likelyIssues, 
            likelyCommits, likelyBranches] = likelyAssociations[i];

        ticket = {...ticket, likelyPullRequests, likelyIssues, 
            likelyCommits, likelyBranches}

        return ticket;

    });

    return res.json({success: true, result: tickets});
}


insertSemanticAssociations = (req, res) => {

    const { associations } = req.body;

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