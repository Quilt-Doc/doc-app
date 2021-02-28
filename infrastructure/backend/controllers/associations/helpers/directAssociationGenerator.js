//lodash
const _ = require("lodash");

//models
const Association = require("../../../models/associations/Association");

//ancestor class
const AssociationGenerator = require("./associationGenerator");

//mongoose
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

class DirectAssociationGenerator extends AssociationGenerator {
    // Map of Model Type -> Map of Ticket Ids -> Array of Code Objects
    // -> { "PullRequest" : { "1": [co1, co2] } }
    modelTicketMap = {};

    constructor(workspaceId, boards) {
        super(workspaceId, boards);
    }

    async generateDirectAssociations() {
        await this.acquireIntegrationObjects();

        //acquire all code objects of each direct attachment in the ticket
        await this.queryDirectAttachments();

        //create and insert associations using tickets and associated code objects
        await this.insertDirectAssociations();
    }

    async queryDirectAttachments() {
        let queries = {
            pullRequest: {},
            commit: {},
            branch: {},
            issue: {},
        };

        const modelTypes = Object.keys(queries);

        // map through tickets
        this.tickets.map((ticket) => {
            const { attachments, board } = ticket;

            // if no attachments skip
            if (!attachments || attachments.length === 0) return;

            // holds queries for each model filtered by ticket
            let ticketQueries = {
                pullRequest: [],
                commit: [],
                branch: [],
                issue: [],
            };

            // map through attachments of each ticket
            attachments.map((attachment) => {
                const { modelType, repository, sourceId } = attachment;

                // make sure association for attachment doesn't already exist
                if (
                    !repository ||
                    !modelTypes.includes(modelType) ||
                    !this.boards[board._id].repositories.includes(
                        repository.toString()
                    )
                ) {
                    return null;
                }

                // add query for code object with sourceId and repository
                ticketQueries[modelType].push({
                    repository: ObjectId(repository),
                    sourceId,
                });

                // add query for pull request if branch for base/head Ref
                if (modelType === "branch") {
                    ticketQueries["pullRequest"].push({
                        $and: [
                            { repository: ObjectId(repository) },
                            {
                                $or: [
                                    { baseRef: sourceId },
                                    { headRef: sourceId },
                                ],
                            },
                        ],
                    });
                }
            });

            // map through each code object model type
            Object.keys(ticketQueries).map((modelType) => {
                if (
                    !ticketQueries[modelType] ||
                    ticketQueries[modelType].length === 0
                )
                    return;

                // create match query for ticket
                const match = {
                    $match: {
                        $or: ticketQueries[modelType],
                    },
                };

                const project = { $project: { _id: 1, sourceId: 1 } };

                // store query for specific model for specific ticket in higher level queries
                queries[modelType][ticket._id] = [match, project];
            });
        });

        for (let i = 0; i < modelTypes.length; i++) {
            const modelType = modelTypes[i];

            if (!_.isEmpty(queries[modelType])) {
                // extract mongoose model to do query
                const aggregateResult = await this.codeObjectModelMapping[
                    modelType
                ].aggregate([
                    {
                        $facet: queries[modelType],
                    },
                ]);

                this.modelTicketMap[modelType] = aggregateResult[0];
            }
        }

        return queries;
    }

    async insertDirectAssociations() {
        let associations = [];

        //mapping of models to string name of mongoose constructor
        const mongModelMapping = {
            pullRequest: "PullRequest",
            issue: "IntegrationTicket",
            commit: "Commit",
            branch: "Branch",
        };

        // map tickets to _id
        const ticketMap = _.mapKeys(this.tickets, "_id");

        // map through the models of modelTicketMap
        Object.keys(this.modelTicketMap).map((modelType) => {
            // extract the mapping from ticketId to codeObject array for each model
            const ticketCodeObjectMap = this.modelTicketMap[modelType];

            // map over the ticketIds in the ticketCodeObjectMap
            Object.keys(ticketCodeObjectMap).map((ticketId) => {
                // extract the array of codeObjects of a certain modelType and
                // certain ticket using the ticketId
                const ticketCodeObjects = ticketCodeObjectMap[ticketId];

                const seen = new Set();

                ticketCodeObjects.map((codeObject) => {
                    if (!codeObject || seen.has(codeObject._id.toString()))
                        return;

                    let association = {
                        firstElement: ticketId,
                        firstElementModelType: "IntegrationTicket",
                        secondElement: codeObject._id,
                        secondElementModelType: mongModelMapping[modelType],
                        repository: codeObject.repository,
                        board: ticketMap[ticketId].board._id,
                        direct: true,
                    };

                    associations.push(association);

                    // check to make sure code object -- ticket relationship
                    // is not created > 1
                    seen.add(codeObject._id.toString());
                });
            });
        });

        associations = await Association.insertMany(associations);

        this.associations = associations;

        return associations;
    }
}

module.exports = DirectAssociationGenerator;
