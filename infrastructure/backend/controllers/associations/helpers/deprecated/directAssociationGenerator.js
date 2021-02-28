//classes
const AssociationGenerator = require("./associationGenerator");

//association
const Association = require("../../../models/associations/Association");
const BoardWorkspaceContext = require("../../../models/integrations/context/BoardWorkspaceContext");
const PullRequest = require("../../../models/PullRequest");

const _ = require("lodash");

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

class DirectAssociationGenerator extends AssociationGenerator {
    //Map of Model Type -> Map of Ticket Ids -> Array of Code Objects
    // -> { "PullRequest" : { "1": [co1, co2] } }
    modelTicketMap = {};

    constructor(workspaceId, boards) {
        super(workspaceId, boards);
    }

    async generateDirectAssociations() {
        await this.acquireIntegrationObjects();

        await this.identifyScrapedRepositories();

        await this.updateScrapedAssociations();

        //acquire all code objects of each direct attachment in the ticket
        await this.queryDirectAttachments();

        //create and insert associations using tickets and associated code objects
        await this.insertDirectAssociations();
    }

    async identifyScrapedRepositories() {
        this.scrapedRepositories = {};

        // iterates through contexts
        for (let i = 0; i < this.contexts.length; i++) {
            let context = this.contexts[i];

            const { repositories: repositoryIds, board: boardId } = context;

            // retrieves other, scraped contexts that have the same board
            let query = BoardWorkspaceContext.find({
                isScraped: true,
                board: boardId,
            });

            query.where("board").equals(boardId);

            query.where("repositories").in(repositoryIds);

            const otherContexts = await query.lean().exec();

            // identifies repositories of other contexts
            let otherContextRepos = [];

            otherContexts.map((otherContext) => {
                otherContextRepos = [
                    ...otherContextRepos,
                    ...otherContext.repositories,
                ];
            });

            otherContextRepos = otherContextRepos.map((repoId) =>
                repoId.toString()
            );

            otherContextRepos = new Set(otherContextRepos);

            // since relationship between board and repo has been created
            // in other context, can create this.scrapedRepositories field
            this.scrapedRepositories[boardId] = new Set(
                repositoryIds.filter((repositoryId) => {
                    return otherContextRepos.has(repositoryId);
                })
            );
        }
    }

    // updates associations with board and repository in scraped repositories
    async updateScrapedAssociations() {
        await Promise.all(
            this.boardIds.map((boardId) => {
                const repositoryIds = Array.from(
                    this.scrapedRepositories[boardId]
                );

                return Association.updateMany(
                    {
                        $and: [
                            { repository: { $in: repositoryIds } },
                            { board: boardId },
                        ],
                    },
                    { $push: { workspaces: this.workspaceId } }
                );
            })
        );
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

            if (!attachments || attachments.length === 0) return;

            let modelQueries = {
                pullRequest: [],
                commit: [],
                branch: [],
                issue: [],
            };

            // map through attachments of each ticket
            attachments.map((attachment) => {
                const { modelType, repository, sourceId } = attachment;

                if (!repository) return;

                // make sure association for attachment doesn't already exist
                const isScraped =
                    this.scrapedRepositories[board] &&
                    this.scrapedRepositories[board].has(repository);

                if (!modelTypes.includes(modelType) || isScraped) return null;

                // add query for code object with sourceId and repository
                modelQueries[modelType].push({
                    repository: ObjectId(repository),
                    sourceId,
                });

                // add query for pull request if branch for base/head Ref
                if (modelType === "branch") {
                    modelQueries["pullRequest"].push({
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
            Object.keys(modelQueries).map((modelType) => {
                if (
                    !modelQueries[modelType] ||
                    modelQueries[modelType].length === 0
                )
                    return;

                // create match query for ticket
                const match = {
                    $match: {
                        $or: modelQueries[modelType],
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

        const mongModelMapping = {
            pullRequest: "PullRequest",
            issue: "IntegrationTicket",
            commit: "Commit",
            branch: "Branch",
        };

        const ticketMap = _.mapKeys(this.tickets, "_id");

        Object.keys(this.modelTicketMap).map((modelType) => {
            const ticketCodeObjectMap = this.modelTicketMap[modelType];

            Object.keys(ticketCodeObjectMap).map((ticketId) => {
                const ticketCodeObjects = ticketCodeObjectMap[ticketId];

                const seen = new Set();

                ticketCodeObjects.map((codeObject) => {
                    if (!codeObject || seen.has(codeObject._id.toString()))
                        return;

                    let association = {
                        workspaces: [this.workspaceId],
                        firstElement: ticketId,
                        firstElementModelType: "IntegrationTicket",
                        secondElement: codeObject._id,
                        secondElementModelType: mongModelMapping[modelType],
                        repository: codeObject.repository,
                        board: ticketMap[ticketId].board._id,
                        direct: true,
                    };

                    associations.push(association);

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
