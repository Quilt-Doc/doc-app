require("dotenv").config();

// mongoose
const mongoose = require("mongoose");

// models
const Workspace = require("../../../models/Workspace");
const Repository = require("../../../models/Repository");
const IntegrationTicket = require("../../../models/integrations/integration_objects/IntegrationTicket");
const Association = require("../../../models/associations/Association");

const PullRequest = require("../../../models/PullRequest");
const Commit = require("../../../models/Commit");
const Branch = require("../../../models/Branch");

// util helpers
const {
    deleteWorkspace,
    createWorkspace,
} = require("../../../__tests__config/utils");
const { logger } = require("../../../logging");

// env variables
const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

const runPrivateScrape = async () => {
    const { createdWorkspaceId, repositoryIds } = await createWorkspace([
        "kgodara-testing/brodal_queue",
        "kgodara-testing/issue-scrape",
        "Quilt-Doc/doc-app",
    ]);

    const [workspace, repositories] = await Promise.all([
        Workspace.findById(createdWorkspaceId),
        Repository.find({
            _id: { $in: repositoryIds },
        }),
    ]);

    process.env.TEST_WORKSPACE = JSON.stringify(workspace);

    process.env.TEST_REPOSITORIES = JSON.stringify(repositories);
};

// set up mongodb connection
beforeAll(async () => {
    const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

    await mongoose.connect(dbRoute, { useNewUrlParser: true });

    let db = mongoose.connection;

    db.once("open", () => console.log("connected to the database"));

    db.on("error", console.error.bind(console, "MongoDB connection error:"));

    await runPrivateScrape();

    process.env.isTesting = true;
});

// clean up and store results
afterAll(async () => {
    const workspaces = await Workspace.find({ creator: TEST_USER_ID });

    for (let i = 0; i < workspaces.length; i++) {
        await deleteWorkspace(workspaces[i]._id);
    }
});

describe("Basic public association generation validation", () => {
    test("Validate board for all tickets in each repository", async () => {
        const repositories = JSON.parse(process.env.TEST_REPOSITORIES);

        const repoTickets = await Promise.all(
            repositories.map((repo) => {
                IntegrationTicket.find({
                    repository: repo._id,
                }).populate("attachments");
            })
        );

        repoTickets.map((tickets) => {
            let boardId;

            tickets.map((ticket) => {
                const { board: ticketBoardId } = ticket;

                expect(ticketBoardId).toBeDefined();

                expect(ticketBoardId).not.toBeNull();

                if (!boardId) {
                    boardId = ticketBoardId.toString();
                } else {
                    expect(boardId).toEqual(ticketBoardId.toString());
                }
            });
        });
    });

    test("Validate attachments for each repository", async () => {
        const repositories = JSON.parse(process.env.TEST_REPOSITORIES);

        const repoTickets = await Promise.all(
            repositories.map((repo) => {
                IntegrationTicket.find({
                    repository: repo._id,
                }).populate("attachments");
            })
        );

        const acceptedModels = new Set(["branch", "issue", "pullRequest", "commit"]);

        process.env.TEST_REPO_TICKETS = JSON.stringify(repoTickets);

        repoTickets.map((tickets) => {
            tickets.map((ticket) => {
                const { attachments } = ticket;

                attachments.map((attachment) => {
                    const { modelType, sourceId, repository } = attachment;

                    expect(modelType).toBeDefined();

                    expect(modelType).not.toBeNull();

                    expect(sourceId).not.toBeNull();

                    expect(repository).toBeDefined();

                    expect(repository).not.toBeNull();

                    expect(acceptedModels.has(modelType)).toEqual(true);
                });
            });
        });
    });

    test("Validate association length and content", async () => {
        const repositories = JSON.parse(process.env.TEST_REPOSITORIES);

        const repoTickets = JSON.parse(process.env.TEST_REPO_TICKETS);

        const repoAssociations = await Promise.all(
            repositories.map((repo) => {
                Association.find({
                    repository: repo._id,
                });
            })
        );

        logger.info(`${repoAssociations.length} associations were found.`, {
            func: "Validate association length and content",
            obj: repoAssociations,
        });

        let modelTypeMap = {
            pullRequest: PullRequest,
            commit: Commit,
            issue: IntegrationTicket,
            branch: Branch,
        };

        let total = 0;

        for (let i = 0; i < repoTickets.length; i++) {
            const ticket = repoTickets[i];

            let seen = new Set();

            let { attachments } = ticket;

            attachments = attachments.filter((item) => {
                const { modelType, sourceId, repository } = item;

                const key = `${modelType}-${sourceId}-${repository.toString()}`;

                if (seen.has(key)) {
                    return false;
                } else {
                    seen.add(key);

                    return true;
                }
            });

            for (let i = 0; i < attachments.length; i++) {
                const { modelType, sourceId, repository } = attachments[i];

                const codeObject = await modelTypeMap[modelType].findOne({
                    sourceId,
                    repository,
                });

                const association = await Association.find({
                    repository,
                    firstElement: ticket._id,
                    secondElement: codeObject._id,
                });

                expect(association).toBeDefined();

                expect(association).not.toBeNull();
            }

            total += attachments.length;
        }

        expect(total).toEqual(repoAssociations.length);
    });
});
