//classes
const AssociationGenerator = require("./associationGenerator");

//association
const Association = require("../../../models/associations/Association");
const BoardWorkspaceContext = require("../../../models/integrations/context/BoardWorkspaceContext");
const PullRequest = require("../../../models/PullRequest");

class DirectAssociationGenerator extends AssociationGenerator {
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

        this.contexts.map(async (context) => {
            const { repositories: repositoryIds, board: boardId } = context;

            let query = BoardWorkspaceContext.find({
                isScraped: true,
                board: boardId,
            });

            query.where(board).equals(boardId);

            query.where(repositories).in(repositoryIds);

            const otherContexts = await query.lean().exec();

            let otherContextRepos = [];

            otherContexts.map((otherContext) => {
                return [...otherContextRepos, ...otherContext.repositories];
            });

            otherContextRepos = new Set(otherContextRepos);

            this.scrapedRepositories[boardId] = new Set(
                repositoryIds.filter((repositoryId) => {
                    otherContextRepos.has(repositoryId);
                })
            );
        });
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

        const codeObjects = await Promise.all(
            this.tickets.map((ticket) => {
                const { attachments, board } = ticket;

                let branchPRRequests = [];

                let ticketCORequests = attachments.map((attachment) => {
                    const { modelType, repository, sourceId } = attachment;

                    const acceptedTypes = [
                        "pullRequest",
                        "commit",
                        "branch",
                        "issue",
                    ];

                    const isScraped =
                        this.scrapedRepositories[board] &&
                        this.scrapedRepositories[board].has(repository);

                    if (!acceptedTypes.includes(type) || isScraped) {
                        return null;
                    }

                    // acquire the model for the attachment currently inspected
                    const attachmentModel = this.coModelMapping[modelType];

                    let query = attachmentModel.find({
                        sourceId,
                        repository,
                    });

                    query.select("_id");

                    if (modelType === "branch") {
                        let secondQuery = PullRequest.find({
                            $or: [{ baseRef: sourceId }, { headRef: sourceId }],
                        });

                        secondQuery.select("_id");

                        secondQuery.exec();

                        branchPRRequests.push(secondQuery);
                    }

                    return query.exec();
                });

                ticketCORequests = [...ticketCORequests, ...branchPRRequests];

                return Promise.all(ticketCORequests);
            })
        );

        this.codeObjects = codeObjects;
    }

    /*
        associations that still exist need to be added with regard to workspace
    */

    async insertDirectAssociations() {
        let associations = [];

        this.codeObjects.map((ticketCodeObjects, i) => {
            //extract relevant ticket for code object grouping
            const ticket = this.tickets[i];

            const seen = new Set();

            ticketCodeObjects.map((codeObject) => {
                if (!codeObject && !seen.has(codeObject._id)) return;

                let association = {
                    workspaces: [this.workspaceId],
                    firstElement: ticket._id,
                    firstElementType: "IntegrationTicket",
                    secondElement: codeObject._id,
                    secondElementType: codeObject.constructor.modelName,
                    quality: 1,
                    associationLevel: 1,
                };

                associations.push(association);

                seen.add(codeObject._id);
            });
        });

        associations = await Association.insertMany(associations).lean();

        return associations;
    }
}

module.exports = DirectAssociationGenerator;
