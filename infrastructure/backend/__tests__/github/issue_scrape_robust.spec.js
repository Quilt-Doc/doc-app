require("dotenv").config();

const mongoose = require("mongoose");

const api = require("../../apis/api");

const {
    extractRepositoryLabels,
} = require("../../../worker_prod/utils/integrations/github_scrape_helpers");

const Workspace = require("../../models/Workspace");
const Repository = require("../../models/Repository");

const _ = require("lodash");

const {
    createWorkspace,
    removeWorkspaces,
    deleteWorkspace,
} = require("../../__tests__config/utils");

// env variables
const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

let installationClient;

beforeAll(async () => {
    const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

    await mongoose.connect(dbRoute, { useNewUrlParser: true });

    let db = mongoose.connection;

    db.once("open", () => console.log("connected to the database"));

    db.on("error", console.error.bind(console, "MongoDB connection error:"));

    const { createdWorkspaceId, repositoryIds } = await createWorkspace([
        "kgodara-testing/issue-scrape",
    ]);

    process.env.TEST_REPOSITORY_ID = repositoryIds[0];

    process.env.TEST_WORKSPACE_ID = createdWorkspaceId;

    const repository = await Repository.findById(repositoryIds[0]);

    installationClient = await api.requestInstallationClient(
        repository.installationId
    );

    process.env.TEST_REPOSITORY = JSON.stringify(repository);

    process.env.isTesting = true;
});

afterAll(async () => {
    let workspaces;

    workspaces = await Workspace.find({
        memberUsers: { $in: [TEST_USER_ID] },
    });

    for (let i = 0; i < workspaces.length; i++) {
        console.log(workspaces[i]._id);

        await deleteWorkspace(workspaces[i]._id);
    }
});

describe("Issue Scrape Robust Association/Field Testing", () => {
    test("extractRepositoryLabels: should extract labels correctly", async () => {
        const repository = JSON.parse(process.env.TEST_REPOSITORY);

        const { fullName } = repository;

        const response = await installationClient.get(
            `/repos/${fullName}/issues`
        );

        const issues = response.data;

        console.log(
            issues.filter((issue) => issue.labels.length >= 1)[0].labels
        );

        /*
        await extractRepositoryLabels(
            installationClient,
            process.env.TEST_REPOSITORY_FULL_NAME
        );*/
    });
});
