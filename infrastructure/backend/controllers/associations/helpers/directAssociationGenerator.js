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
    ticketsToCO = {};

    constructor(workspaceId, contexts) {
        super(workspaceId, contexts);
    }

    async generateDirectAssociations() {
        await super.acquireIntegrationObjects();

        await this.identifyScrapedRepositories();

        await this.updateScrapedAssociations();

        //acquire all code objects of each direct attachment in the ticket
        await this.queryDirectAttachments();

        //create and insert associations using tickets and associated code objects
        await this.insertDirectAssociations();
    }

    async identifyScrapedRepositories() {
        this.scrapedRepositories = {};

        for (let i = 0; i < this.contexts.length; i++) {
            let context = this.contexts[i];

            const { repositories: repositoryIds, board: boardId } = context;

            let query = BoardWorkspaceContext.find({
                isScraped: true,
                board: boardId,
            });

            query.where("board").equals(boardId);

            query.where("repositories").in(repositoryIds);

            const otherContexts = await query.lean().exec();

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

            this.scrapedRepositories[boardId] = new Set(
                repositoryIds.filter((repositoryId) => {
                    return otherContextRepos.has(repositoryId);
                })
            );
        }
    }

    async updateScrapedAssociations() {
        await Promise.all(
            this.boardIds.map((boardId) => {
                const repositoryIds = Array.from(
                    this.scrapedRepositories[boardId]
                );

                return Association.updateMany(
                    {
                        $and: [
                            { repositories: { $in: repositoryIds } },
                            { board: boardId },
                        ],
                    },
                    { $push: { workspaces: this.workspaceId } }
                );
            })
        );
    }

    async queryDirectAttachments() {
        // make a promise.all call to evaluate all queries for each
        // ticket together
        let queries = {
            pullRequest: {},
            commit: {},
            branch: {},
            issue: {},
        };

        const modelTypes = Object.keys(queries);

        this.tickets.map((ticket) => {
            const { attachments, board } = ticket;

            if (!attachments || attachments.length === 0) return;

            let coQueries = {
                pullRequest: [],
                commit: [],
                branch: [],
                issue: [],
            };

            attachments.map((attachment) => {
                const { modelType, repository, sourceId } = attachment;

                if (!repository) return;

                const isScraped =
                    this.scrapedRepositories[board] &&
                    this.scrapedRepositories[board].has(repository);

                if (!modelTypes.includes(modelType) || isScraped) return null;

                coQueries[modelType].push({
                    repository: ObjectId(repository),
                    sourceId,
                });

                if (modelType === "branch") {
                    coQueries["pullRequest"].push({
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

            Object.keys(coQueries).map((key) => {
                if (!coQueries[key] || coQueries[key].length === 0) return;

                const match = {
                    $match: {
                        $or: coQueries[key],
                    },
                };

                const project = { $project: { _id: 1, sourceId: 1 } };

                queries[key][ticket._id] = [match, project];
            });
        });

        for (let i = 0; i < modelTypes.length; i++) {
            const key = modelTypes[i];

            if (!_.isEmpty(queries[key])) {
                const aggregateResult = await this.coModelMapping[
                    key
                ].aggregate([
                    {
                        $facet: queries[key],
                    },
                ]);

                this.ticketsToCO[key] = aggregateResult[0];
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

        Object.keys(this.ticketsToCO).map((modelType) => {
            const ticketCOMapping = this.ticketsToCO[modelType];

            Object.keys(ticketCOMapping).map((ticketId) => {
                const ticketCodeObjects = ticketCOMapping[ticketId];

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
                        direct: true,
                    };

                    associations.push(association);

                    seen.add(codeObject._id.toString());
                });
            });
        });

        associations = await Association.insertMany(associations);

        return associations;
    }
}

module.exports = DirectAssociationGenerator;
