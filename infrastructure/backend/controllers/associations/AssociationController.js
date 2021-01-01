//code objects
const PullRequest = require("../../models/PullRequest");
const Branch = require("../../models/Branch");
const Commit = require("../../models/Commit");
const GithubIssue = require("../../models/integrations_fs/github/GithubIssue");

//association
const Association = require("../../models/associations/Association");

//integrations
const TrelloIntegration = require("../../models/integrations_fs/trello/TrelloIntegration");

//use
require("@tensorflow/tfjs");
const use = require("@tensorflow-models/universal-sentence-encoder");

//utility
const similarity = require("compute-cosine-similarity");
const normalize = require("array-normalize");
const { mean } = require("lodash");
const { std } = require("mathjs");
// 'creator assignees intervals labels comments attachments'

const coModelMapping = {
    issue: GithubIssue,
    pullRequest: PullRequest,
    commit: Commit,
    branch: Branch,
};

const acceptedTypes = {
    trello: {
        integrationModel: TrelloIntegration,
        integrationField: "trelloIntegration",
    },
};

generateAssociations = async (integrationId, integrationType) => {
    await Promise.all([
        generateDirectAssociations(integrationId, integrationType),
        generateLikelyAssociations(integrationId, integrationType),
    ]);
};

// used to find direct associations
generateDirectAssociations = async (integrationId, integrationType) => {
    const [tickets, integration] = await acquireIntegrationObjects(
        integrationId,
        integrationType
    );

    //acquire all code objects of each direct attachment in the ticket
    const codeObjects = await queryDirectAttachments(tickets);

    //create and insert associations using tickets and associated code objects
    await insertDirectAssociations(codeObjects, tickets, integration);
};

acquireIntegrationObjects = async (integrationId, integrationType) => {
    // do some validation to make sure that the correct source is specified
    if (!(integrationType in acceptedTypes)) {
        throw new Error("Not Correct IntegrationType");
    }

    const { integrationModel, integrationField } = acceptedTypes[
        integrationType
    ];

    // use the integrationModel and integrationField to find tickets (with only
    // attachment and _id information ) of
    // the new integration
    const integration = await integrationModel
        .find({ _id: integrationId })
        .lean()
        .exec();

    let query = IntegrationTicket.find({ [integrationField]: integration._id })
        .lean()
        .exec();

    query.select("attachments intervals _id");

    query.populate({ path: "attachments intervals" });

    const tickets = await query.lean().exec();

    return [tickets, integration];
};

queryDirectAttachments = async (tickets) => {
    // make a promise.all call to evaluate all queries for each
    // ticket together
    const codeObjects = await Promise.all(
        tickets.map((ticket) => {
            const { attachments } = ticket;

            // make a promise.all for all the attachment queries for
            // current ticket in map function
            return Promise.all(
                attachments.map((attachment) => {
                    const { type, repository, identifier } = attachment;

                    if (
                        !["pullRequest", "commit", "branch", "issue"].includes(
                            type
                        )
                    ) {
                        //throw new Error("Not Correct Attachment Type")
                        return null;
                    }

                    // acquire the model for the attachment currently inspected
                    const attachmentModel = coModelMapping[type];

                    let query = attachmentModel.find({
                        sourceId: identifier,
                        repository,
                    });

                    query.select("_id");

                    return query.exec();
                })
            );
        })
    );

    return codeObjects;
};

insertDirectAssociations = async (codeObjects, tickets, integration) => {
    const { workspace } = integration;

    let associations = [];

    codeObjects.map((ticketCodeObjects, i) => {
        //extract relevant ticket for code object grouping
        const ticket = tickets[i];

        ticketCodeObjects.map((codeObject) => {
            if (!codeObject) return;

            let association = {
                workspace,
                firstElement: ticket._id,
                firstElementType: "IntegrationTicket",
                secondElement: codeObject._id,
                secondElementType: codeObject.constructor.modelName,
                quality: 1,
                associationLevel: 1,
            };

            associations.push(association);
        });
    });

    associations = await Association.insertMany(associations).lean();

    return associations;
};

// Used to find highly likely associations using date, people, and simple semantic content (name, )
generateLikelyAssociations = async (req, res) => {
    const { integrationId, integrationType } = req.body;

    let [tickets, integration] = await acquireIntegrationObjects(
        integrationId,
        integrationType
    );

    tickets = await acquireLikelyCodeObjects(tickets);

    await generateSemanticAssociations(tickets);

    return res.json({ success: true, result: tickets });
};

acquireLikelyCodeObjects = async (tickets) => {
    const likelyCodeObjects = await Promise.all(
        tickets.map((ticket) => {
            const { attachments, intervals, creator, assignees } = ticket;

            const members = Array.from(new Set([creator, ...assignees]));

            const intervalFilters = intervals.map((interval) => {
                let { start, end } = interval;

                start = addDays(start, -10);

                end = addDay(end, 10);

                return {
                    sourceCreationDate: {
                        $gt: start,
                        $lt: end,
                    },
                };
            });

            const attachmentIds = attachments.map(
                (attachment) => attachment.identifier
            );

            const codeObjectModels = [PullRequest, GithubIssue, Commit, Branch];

            const queries = codeObjectModels.map((model) => {
                let query = model.find({ $or: intervalFilters });

                query.where("members").in(members);

                query.where("sourceId").nin(attachmentIds);

                query.lean().exec();
            });

            return Promise.all(queries);
        })
    );

    tickets = tickets.map((ticket, i) => {
        const [
            likelyPullRequests,
            likelyIssues,
            likelyCommits,
            likelyBranches,
        ] = likelyCodeObjects[i];

        ticket = {
            ...ticket,
            likelyPullRequests,
            likelyIssues,
            likelyCommits,
            likelyBranches,
        };

        return ticket;
    });

    return tickets;
};

addDays = (date, days) => {
    let result = new Date(date);

    result.setDate(result.getDate() + days);

    return result;
};

generateSemanticAssociations = async (tickets) => {
    let uniqueCodeObjectMapping = {
        likelyPullRequests: {},
        likelyIssues: {},
        likelyCommits: {},
        likelyBranches: {},
    };

    storeUniqueCodeObjects(tickets, uniqueCodeObjectMapping);

    const ticketNames = tickets.map((ticket) => ticket.name);

    const ticketDescs = tickets.map(
        (ticket) => `${ticket.name} ${ticket.description}`
    );

    const [embeddedNames, embeddedDescs] = await acquireEmbeddings(
        ticketNames,
        ticketDescs,
        uniqueCodeObjectMapping
    );

    Object.values(uniqueCodeObjectMapping).map((codeObjects, i) => {
        Object.values(codeObjects).map((codeObject, j) => {
            codeObject.embeddedName = embeddedNames[i + 1][j];

            codeObject.embeddedDesc = embeddedDescs[i + 1][j];
        });
    });

    const [
        normalizedNameScores,
        normalizedDescScores,
        normalizedAllScores,
    ] = calculateSimilarityScores(
        uniqueCodeObjectMapping,
        tickets,
        embeddedNames,
        embeddedDescs
    );

    await insertSemanticAssociations(
        uniqueCodeObjectMapping,
        tickets,
        normalizedNameScores,
        normalizedDescScores,
        normalizedAllScores
    );
};

storeUniqueCodeObjects = (tickets, uniqueCodeObjectMapping) => {
    tickets.map((ticket) => {
        Object.keys(uniqueCodeObjectMapping).map((key) => {
            const likelyCodeObjects = ticket[key];

            likelyCodeObjects.map((likelyCodeObject) => {
                const { _id: codeId } = likelyCodeObject;

                if (!codeId in uniqueCodeObjectMapping[key]) {
                    uniqueCodeObjectMapping[key][codeId] = likelyCodeObject;
                }
            });
        });
    });
};

acquireEmbeddings = async (
    ticketNames,
    ticketDescs,
    uniqueCodeObjectMapping
) => {
    const model = await use.load();

    let embeddedNames = [model.embed(ticketNames)];

    let embeddedDescs = [model.embed(ticketDescs)];

    Object.values(uniqueCodeObjectMapping).map((codeObjects) => {
        let codeObjectNames = [];

        let codeObjectDescs = [];

        Object.values(codeObjects).map((codeObject) => {
            const { description, name } = codeObject;

            codeObjectNames.push(name);

            codeObjectDescs.push(
                description && description.length > 1
                    ? `${name} ${description}`
                    : ""
            );
        });

        embeddedNames.push(model.embed(codeObjectNames));

        embeddedDescs.push(model.embed(uniqueCODescs));
    });

    embeddedNames = Promise.all(embeddedNames);

    embeddedDescs = Promise.all(embeddedDescs);

    return [embeddedNames, embeddedDescs];
};

calculateSimilarityScores = (
    uniqueCodeObjectMapping,
    tickets,
    embeddedNames,
    embeddedDescs
) => {
    let allNameScores = [];

    let allDescScores = [];

    tickets.map((ticket, i) => {
        const embeddedTicketName = embeddedNames[0][i];

        const embeddedTicketDesc = embeddedDescs[0][i];

        Object.keys(uniqueCodeObjectMapping).map((key) => {
            ticket[key].map((co) => {
                const {
                    embeddedName,
                    embeddedDesc,
                    description,
                } = uniqueCodeObjectMapping[key][co._id];

                const nameScore = similarity(embeddedTicketName, embeddedName);

                allNameScores.push(nameScore);

                co.nameScoreIndex = allNameScores.length - 1;

                if (description && description.length > 0) {
                    const descScore = similarity(
                        embeddedTicketDesc,
                        embeddedDesc
                    );

                    allDescScores.push(descScore);

                    co.descScoreIndex = allDescScores.length - 1;
                }
            });
        });
    });

    const normalizedNameScores = normalize(allNameScores);

    const normalizedDescScores = normalize(allDescScores);

    const normalizedAllScores = [
        ...normalizedNameScores,
        ...normalizedDescScores,
    ];

    return [normalizedNameScores, normalizedDescScores, normalizedAllScores];
};

insertSemanticAssociations = async (
    uniqueCodeObjectMapping,
    tickets,
    normalizedNameScores,
    normalizedDescScores,
    normalizedAllScores
) => {
    let associations = [];

    let meanAllScores = mean(normalizedAllScores);

    let stdAllScores = std(normalizedAllScores);

    const modelMapping = {
        likelyPullRequests: "PullRequest",
        likelyIssues: "GithubIssue",
        likelyCommits: "Commit",
        likelyBranches: "Branch",
    };

    tickets.map((ticket) => {
        Object.keys(uniqueCodeObjectMapping).map((key) => {
            const { _id: ticketId, workspace } = ticket;

            ticket[key].map((co) => {
                const {
                    description,
                    nameScoreIndex,
                    descScoreIndex,
                    _id: coId,
                } = co;

                const nameScore = normalizedNameScores[nameScoreIndex];

                let store = false;

                let quality = nameScore;

                //85th percentile
                if (nameScore > 1.036) {
                    store = true;
                } else if (description && description.length > 0) {
                    const descriptionScore =
                        normalizedDescScores[descScoreIndex];

                    const descriptionZScore =
                        (descriptionScore - meanAllScores) / stdAllScores;

                    //90th percentile
                    if (descriptionZScore > 1.282) {
                        store = true;

                        quality = descriptionScore;
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
                    };

                    associations.push(association);
                }
            });
        });
    });

    try {
        await Association.insertMany(associations).lean();
    } catch (err) {
        console.log("ERROR");
    }
};

module.exports = {
    generateAssociations,
};
