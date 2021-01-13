//classes
const AssociationGenerator = require("./associationGenerator");

//mongoose
const PullRequest = require("../../../models/PullRequest");
const Branch = require("../../../models/Branch");
const Commit = require("../../../models/Commit");
const GithubIssue = require("../../../models/integrations/github/GithubIssue");

//association
const Association = require("../../../models/associations/Association");

//use
require("@tensorflow/tfjs");

const use = require("@tensorflow-models/universal-sentence-encoder");

//utility
const similarity = require("compute-cosine-similarity");
const normalize = require("array-normalize");
const { mean } = require("lodash");
const { std } = require("mathjs");

class LikelyAssociationGenerator extends AssociationGenerator {
    uniqueCodeObjectMapping = {
        likelyPullRequests: {},
        likelyIssues: {},
        likelyCommits: {},
        likelyBranches: {},
    };

    constructor(integrationId, integrationType) {
        super(integrationId, integrationType);
    }

    async generateLikelyAssociations() {
        await super.acquireIntegrationObjects();

        await setLikelyCodeObjects();

        await generateSemanticAssociations(this.tickets);
    }

    async setLikelyCodeObjects() {
        const likelyCodeObjects = await Promise.all(
            this.tickets.map((ticket) => {
                const { attachments, intervals, creator, assignees } = ticket;

                const members = Array.from(new Set([creator, ...assignees]));

                const intervalFilters = intervals.map((interval) => {
                    let { start, end } = interval;

                    start = addDays(start, -10);

                    end = addDays(end, 10);

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

                const codeObjectModels = [
                    PullRequest,
                    GithubIssue,
                    Commit,
                    Branch,
                ];

                const queries = codeObjectModels.map((model) => {
                    let query = model.find({ $or: intervalFilters });

                    query.where("members").in(members);

                    query.where("sourceId").nin(attachmentIds);

                    query.lean().exec();
                });

                return Promise.all(queries);
            })
        );

        this.tickets = this.tickets.map((ticket, i) => {
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
    }

    addDays = (date, days) => {
        let result = new Date(date);

        result.setDate(result.getDate() + days);

        return result;
    };

    async generateSemanticAssociations() {
        storeUniqueCodeObjects();

        const [embeddedNames, embeddedDescs] = await acquireEmbeddings();

        Object.values(this.uniqueCodeObjectMapping).map((codeObjects, i) => {
            Object.values(codeObjects).map((codeObject, j) => {
                codeObject.embeddedName = embeddedNames[i + 1][j];

                codeObject.embeddedDesc = embeddedDescs[i + 1][j];
            });
        });

        const [
            normalizedNameScores,
            normalizedDescScores,
            normalizedAllScores,
        ] = calculateSimilarityScores(embeddedNames, embeddedDescs);

        await insertSemanticAssociations(
            normalizedNameScores,
            normalizedDescScores,
            normalizedAllScores
        );
    }

    //stores all unique code objects in correct field in
    //class mapping
    storeUniqueCodeObjects() {
        this.tickets.map((ticket) => {
            Object.keys(this.uniqueCodeObjectMapping).map((key) => {
                const likelyCodeObjects = ticket[key];

                likelyCodeObjects.map((likelyCodeObject) => {
                    const { _id: codeId } = likelyCodeObject;

                    if (!(codeId in this.uniqueCodeObjectMapping[key])) {
                        this.uniqueCodeObjectMapping[key][
                            codeId
                        ] = likelyCodeObject;
                    }
                });
            });
        });
    }

    async acquireEmbeddings() {
        const model = await use.load();

        const ticketNames = this.tickets
            .map((ticket) => ticket.name)
            .slice(0, 9);

        const ticketDescs = this.tickets
            .map((ticket) => `${ticket.name} ${ticket.description}`)
            .slice(0, 9);

        console.log(ticketNames);

        console.time("Mixed Batch");

        const examples = [
            ...ticketNames,
            ...ticketNames,
            ...ticketNames,
            ...ticketNames,
            ...ticketNames,
        ];

        await model.embed(examples);

        console.timeEnd("Mixed Batch");

        /*
        console.time("Sep Batch");

        await model.embed(ticketNames);

        await model.embed(ticketNames);

        await model.embed(ticketNames);

        await model.embed(ticketNames);

        await model.embed(ticketNames);

        console.timeEnd("Sep Batch");
        */
        /*
        const [embeddedNames, embeddedDescs] = await Promise.all([
            model.embed(ticketNames),
            model.embed(ticketDescs),
        ]);

        console.log("EMBEDDED NAMES", embeddedNames);

        console.log("EMBEDDED DESCS", embeddedDescs);
        */
        /*
        const embeddedNames = await (await model.embed(ticketNames)).array();
        //await model.embed(ticketNames); //, await model.embed(ticketDescs)];

        console.log("EMBEDDEDNAMES", embeddedNames[0]);
       
        const ticketDescs = this.tickets.map(
            (ticket) => `${ticket.name} ${ticket.description}`
        );

        let embeddedNames = [model.embed(ticketNames)];

        let embeddedDescs = [model.embed(ticketDescs)];

        Object.values(this.uniqueCodeObjectMapping).map((codeObjects) => {
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

            embeddedDescs.push(model.embed(codeObjectDescs));
        });

        embeddedNames = Promise.all(embeddedNames);

        embeddedDescs = Promise.all(embeddedDescs);

        return [embeddedNames, embeddedDescs];*/
    }

    calculateSimilarityScores(embeddedNames, embeddedDescs) {
        let allNameScores = [];

        let allDescScores = [];

        this.tickets.map((ticket, i) => {
            const embeddedTicketName = embeddedNames[0][i];

            const embeddedTicketDesc = embeddedDescs[0][i];

            Object.keys(this.uniqueCodeObjectMapping).map((key) => {
                ticket[key].map((co) => {
                    const {
                        embeddedName,
                        embeddedDesc,
                        description,
                    } = this.uniqueCodeObjectMapping[key][co._id];

                    const nameScore = similarity(
                        embeddedTicketName,
                        embeddedName
                    );

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

        return [
            normalizedNameScores,
            normalizedDescScores,
            normalizedAllScores,
        ];
    }

    async insertSemanticAssociations(
        normalizedNameScores,
        normalizedDescScores,
        normalizedAllScores
    ) {
        let associations = [];

        let meanAllScores = mean(normalizedAllScores);

        let stdAllScores = std(normalizedAllScores);

        const modelMapping = {
            likelyPullRequests: "PullRequest",
            likelyIssues: "GithubIssue",
            likelyCommits: "Commit",
            likelyBranches: "Branch",
        };

        this.tickets.map((ticket) => {
            Object.keys(this.uniqueCodeObjectMapping).map((key) => {
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
    }
}

module.exports = LikelyAssociationGenerator;
