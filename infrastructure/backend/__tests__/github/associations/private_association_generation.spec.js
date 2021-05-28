require("dotenv").config();

// mongoose
const mongoose = require("mongoose");

// models
const Workspace = require("../../../models/Workspace");
const Repository = require("../../../models/Repository");
const IntegrationTicket = require("../../../models/integrations/integration_objects/IntegrationTicket");

// util helpers
const {
    deleteWorkspace,
    createWorkspace,
} = require("../../../__tests__config/utils");

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

    test("Validate association length and content", async () => {});
});
