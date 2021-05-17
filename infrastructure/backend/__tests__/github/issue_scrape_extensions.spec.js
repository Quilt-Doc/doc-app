require("dotenv").config();

const mongoose = require("mongoose");

const api = require("../../apis/api");

const {
    extractRepositoryLabels,
    parseGithubBody,
} = require("../../../worker_prod/utils/integrations/github_scrape_helpers");

const Workspace = require("../../../worker_prod/models/Workspace");
const Repository = require("../../../worker_prod/models/Repository");
const IntegrationTicket = require("../../../worker_prod/models/integrations/integration_objects/IntegrationTicket");
const PullRequest = require("../../../worker_prod/models/PullRequest");
const Commit = require("../../../worker_prod/models/Commit");

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
        await deleteWorkspace(workspaces[i]._id);
    }
});

describe("Issue Scrape Extended Association/Field Testing", () => {
    test("extractRepositoryLabels: should extract labels correctly", async () => {
        const repository = JSON.parse(process.env.TEST_REPOSITORY);

        const labelsObj = await extractRepositoryLabels(
            installationClient,
            repository
        );

        const labels = Object.values(labelsObj);

        expect(labels.length).toEqual(10);

        console.log("Labels", labels);
    });

    /*
    test("parseGithubBody: should extract a unique set of attachments", async () => {
        const repository = JSON.parse(process.env.TEST_REPOSITORY);

        const { fullName } = repository;

        const response = await installationClient.get(
            `/repos/${fullName}/issues`
        );

        const issues = response.data;

        let issue = issues.filter((issue) => issue.number == 9)[0];

        let attachments = parseGithubBody(issue.body, repository);

        expect(attachments).toEqual([
            {
                sourceId: "3",
                modelType: "pullRequest",
                repository: "604133292355880fd17ff5b2",
            },
            {
                sourceId: "ef38c3ffa0b830168f02f34d555a9377c5969208",
                modelType: "commit",
                repository: "604133292355880fd17ff5b2",
            },
            {
                sourceId: "6989da1c3c71f0c8d8db0dd57f5508419df9aaec",
                modelType: "commit",
                repository: "604133292355880fd17ff5b2",
            },
            {
                sourceId: "62f0a69",
                modelType: "commit",
                repository: "604133292355880fd17ff5b2",
            },
            {
                sourceId: "4",
                modelType: "pullRequest",
                repository: "604133292355880fd17ff5b2",
            },
            {
                sourceId: "6",
                modelType: "issue",
                repository: "604133292355880fd17ff5b2",
            },
        ]);

        attachments = parseGithubBody("", repository);

        expect(attachments).toEqual([]);
    });

    test("traverseGithubThreads: should extract pull request/issue threads attachments", async () => {
        const repository = JSON.parse(process.env.TEST_REPOSITORY);

        const issues = await IntegrationTicket.find({
            source: "github",
            repositoryId: repository._id,
        }).populate("attachments");

        const pullRequests = await PullRequest.find({
            repository: repository._id,
        });

        await traverseGithubThreads(
            installationClient,
            repository,
            issues,
            pullRequests
        );

        const testIssueAttachmentCounts = {
            7: 3,
            9: 8,
            10: 5,
        };

        const testIssueNums = [7, 9, 10];

        for (let i = 0; i < testIssueNums.length; i++) {
            const sourceId = testIssueNums[i];

            const issue = await IntegrationTicket.findOne({
                source: "github",
                repositoryId: repository._id,
                sourceId: sourceId,
            }).populate("attachments");

            expect(issue.attachments).toBeDefined();

            expect(issue.attachments).not.toBeNull();

            expect(issue.attachments.length).toEqual(
                testIssueAttachmentCounts[sourceId]
            );
        }
    });

    test("extractTextualAttachments: should extract attachments in body correctly", async () => {
        await deleteWorkspace(process.env.TEST_WORKSPACE_ID);

        const { createdWorkspaceId, repositoryIds } = await createWorkspace([
            "kgodara-testing/issue-scrape",
        ]);

        process.env.TEST_WORKSPACE_ID = createdWorkspaceId;

        const repository = await Repository.findById(repositoryIds[0]);

        process.env.TEST_REPOSITORY = JSON.stringify(repository);

        let issues = await IntegrationTicket.find({
            source: "github",
            repositoryId: repository._id,
        }).populate("attachments");

        issues = _.mapKeys(issues, "sourceId");

        expect(issues["9"].attachments.length).toEqual(1);

        issues = Object.values(issues);

        await extractTextualAttachments(issues, repository);

        issues = await IntegrationTicket.find({
            source: "github",
            repositoryId: repository._id,
        }).populate("attachments");

        issues = _.mapKeys(issues, "sourceId");

        expect(issues["9"].attachments.length).toEqual(6);
    });

    test("extractTextualAttachments + traverseGithubThreads: should extract attachments without redundacy", async () => {
        await deleteWorkspace(process.env.TEST_WORKSPACE_ID);

        const { createdWorkspaceId, repositoryIds } = await createWorkspace([
            "kgodara-testing/issue-scrape",
        ]);

        process.env.TEST_WORKSPACE_ID = createdWorkspaceId;

        const repository = await Repository.findById(repositoryIds[0]);

        process.env.TEST_REPOSITORY = JSON.stringify(repository);

        let issues = await IntegrationTicket.find({
            source: "github",
            repositoryId: repository._id,
        }).populate("attachments");

        const pullRequests = await PullRequest.find({
            repository: repository._id,
        });

        await extractTextualAttachments(issues, repository);

        issues = await IntegrationTicket.find({
            source: "github",
            repositoryId: repository._id,
        }).populate("attachments");

        await traverseGithubThreads(
            installationClient,
            repository,
            issues,
            pullRequests
        );

        issues = await IntegrationTicket.find({
            source: "github",
            repositoryId: repository._id,
        }).populate("attachments");

        issues = _.mapKeys(issues, "sourceId");

        expect(issues["9"].attachments.length).toEqual(10);

        expect(issues["7"].attachments.length).toEqual(3);

        expect(issues["10"].attachments.length).toEqual(5);

        expect(issues["11"].attachments.length).toEqual(4);
    });
    */
});
