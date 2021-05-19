// Fields verified by Code Object:

/*

PullRequest:
        fileList: [".BinomialQueue.py.swp", "BinomialQueue.py"],
        repository: "604133292355880fd17ff5b6",
        name: "parse_branch_3 into master",
        sourceId: "3",
        sourceCloseDate: null,
        pullRequestId: 547967198,
        number: 3,
        htmlUrl: "https://github.com/kgodara-testing/brodal_queue/pull/3",
        issueUrl: "https://api.github.com/repos/kgodara-testing/brodal_queue/issues/3",
        state: "open",
        locked: false,
        title: "parse_branch_3 into master",
        body: "",
        closedAt: null,
        mergedAt: null,
        mergeCommitSha: "eb4c5b4649eb6f6c2ae8d13f8d237e0b0b7e8533",
        headRef: "parse_branch_3",
        headLabel: "kgodara-testing:parse_branch_3",
        headSha: "0fa21fe27a89854eb493542a0719839c1003eddf",
        baseRef: "master",
        baseLabel: "kgodara-testing:master",
        baseSha: "b2fd3c8d3ed1afc4b06c73faea8db59d64ff953d",
        draft: false,

*/

require("dotenv").config();

const axios = require("axios");

const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

// models
const Commit = require("../../../models/Commit");
const Branch = require("../../../models/Branch");
const PullRequest = require("../../../models/PullRequest");

const api = require("../../../apis/api");

// test data

const {
    prNum: brodalPRNum,
    branchNum: brodalBranchNum,
    commitNum: brodalCommitNum,
} = require("../../../__tests__data/repository_data/brodal_queue");
const {
    prData: brodalPRData,
    branchData: brodalBranchData,
    commitData: brodalCommitData,
} = require("../../../__tests__data/repository_data/brodal_queue");

const {
    prNum: hamechaPRNum,
    branchNum: hamechaBranchNum,
    commitNum: hamechaCommitNum,
} = require("../../../__tests__data/repository_data/hamecha");
const {
    prData: hamechaPRData,
    branchData: hamechaBranchData,
    commitData: hamechaCommitData,
} = require("../../../__tests__data/repository_data/hamecha");

const {
    prNum: issueScrapePRNum,
    branchNum: issueScrapeBranchNum,
    commitNum: issueScrapeCommitNum,
} = require("../../../__tests__data/repository_data/issue-scrape");
const {
    prData: issueScrapePRData,
    branchData: issueScrapeBranchData,
    commitData: issueScrapeCommitData,
} = require("../../../__tests__data/repository_data/issue-scrape");

// util helpers
const {
    createWorkspace,
    deleteWorkspace,
    removeWorkspaces,
} = require("../../../__tests__config/utils");

// env variables
const { TEST_USER_ID, EXTERNAL_DB_PASS, EXTERNAL_DB_USER } = process.env;

beforeAll(async () => {
    try {
        const dbRoute = `mongodb+srv://${EXTERNAL_DB_USER}:${EXTERNAL_DB_PASS}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

        await mongoose.connect(dbRoute, { useNewUrlParser: true });

        let db = mongoose.connection;

        db.once("open", () => console.log("connected to the database"));

        db.on("error", console.error.bind(console, "MongoDB connection error:"));

        const { createdWorkspaceId: workspaceId, repositoryIds } = await createWorkspace([
            "kgodara-testing/brodal_queue",
            "kgodara-testing/hamecha",
            "kgodara-testing/issue-scrape",
        ]);

        const workspace = { workspaceId, repositoryIds };

        console.log("Saving Workspace: ");
        console.log(JSON.stringify(workspace));

        process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE = JSON.stringify(workspace);
    } catch (err) {
        console.log(err);
    }
});

describe("Test Code Object Scrape", () => {
    let backendClient;

    beforeEach(() => {
        backendClient = api.requestTestingUserBackendClient();
    });

    // PullRequests
    test("Correct number of PullRequests should be scraped for kgodara-testing/brodal_queue", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var foundPullRequestNum = await PullRequest.countDocuments({
            repository: workspace.repositoryIds[0],
        });
        expect(foundPullRequestNum).toEqual(brodalPRNum);
    });

    test("PullRequest fields should be correctly scraped for kgodara-testing/brodal_queue", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var i;
        var documentFound;
        for (i = 0; i < brodalPRData.length; i++) {
            documentFound = await PullRequest.exists({
                repository: workspace.repositoryIds[0],
                fileList: brodalPRData[i].fileList,
                repository: brodalPRData[i].repository,
                name: brodalPRData[i].name,
                sourceId: brodalPRData[i].sourceId,
                sourceCloseDate: brodalPRData[i].sourceCloseDate,
                pullRequestId: brodalPRData[i].pullRequestId,
                number: brodalPRData[i].number,
                htmlUrl: brodalPRData[i].htmlUrl,
                issueUrl: brodalPRData[i].issueUrl,
                state: brodalPRData[i].state,
                locked: brodalPRData[i].locked,
                title: brodalPRData[i].title,
                body: brodalPRData[i].body,
                closedAt: brodalPRData[i].closedAt,
                mergedAt: brodalPRData[i].mergedAt,
                mergeCommitSha: brodalPRData[i].mergeCommitSha,
                headRef: brodalPRData[i].headRef,
                headLabel: brodalPRData[i].headLabel,
                headSha: brodalPRData[i].headSha,
                baseRef: brodalPRData[i].baseRef,
                baseLabel: brodalPRData[i].baseLabel,
                baseSha: brodalPRData[i].baseSha,
                draft: brodalPRData[i].draft,
            });
            expect(documentFound).toEqual(true);
        }
    });

    test("Correct number of PullRequests should be scraped for kgodara-testing/hamecha", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var foundPullRequestNum = await PullRequest.countDocuments({
            repository: workspace.repositoryIds[1],
        });
        expect(foundPullRequestNum).toEqual(hamechaPRNum);
    });

    test("PullRequest fields should be correctly scraped for kgodara-testing/hamecha", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var i;
        var documentFound;
        for (i = 0; i < hamechaPRData.length; i++) {
            documentFound = await PullRequest.exists({
                repository: workspace.repositoryIds[1],
                fileList: hamechaPRData[i].fileList,
                repository: hamechaPRData[i].repository,
                name: hamechaPRData[i].name,
                sourceId: hamechaPRData[i].sourceId,
                sourceCloseDate: hamechaPRData[i].sourceCloseDate,
                pullRequestId: hamechaPRData[i].pullRequestId,
                number: hamechaPRData[i].number,
                htmlUrl: hamechaPRData[i].htmlUrl,
                issueUrl: hamechaPRData[i].issueUrl,
                state: hamechaPRData[i].state,
                locked: hamechaPRData[i].locked,
                title: hamechaPRData[i].title,
                body: hamechaPRData[i].body,
                closedAt: hamechaPRData[i].closedAt,
                mergedAt: hamechaPRData[i].mergedAt,
                mergeCommitSha: hamechaPRData[i].mergeCommitSha,
                headRef: hamechaPRData[i].headRef,
                headLabel: hamechaPRData[i].headLabel,
                headSha: hamechaPRData[i].headSha,
                baseRef: hamechaPRData[i].baseRef,
                baseLabel: hamechaPRData[i].baseLabel,
                baseSha: hamechaPRData[i].baseSha,
                draft: hamechaPRData[i].draft,
            });
            expect(documentFound).toEqual(true);
        }
    });

    test("Correct number of PullRequests should be scraped for kgodara-testing/issue-scrape", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var foundPullRequestNum = await PullRequest.countDocuments({
            repository: workspace.repositoryIds[2],
        });
        expect(foundPullRequestNum).toEqual(issueScrapePRNum);
    });

    test("PullRequest fields should be correctly scraped for kgodara-testing/issue-scrape", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var i;
        var documentFound;
        for (i = 0; i < issueScrapePRData.length; i++) {
            documentFound = await PullRequest.exists({
                repository: workspace.repositoryIds[2],
                fileList: issueScrapePRData[i].fileList,
                repository: issueScrapePRData[i].repository,
                name: issueScrapePRData[i].name,
                sourceId: issueScrapePRData[i].sourceId,
                sourceCloseDate: issueScrapePRData[i].sourceCloseDate,
                pullRequestId: issueScrapePRData[i].pullRequestId,
                number: issueScrapePRData[i].number,
                htmlUrl: issueScrapePRData[i].htmlUrl,
                issueUrl: issueScrapePRData[i].issueUrl,
                state: issueScrapePRData[i].state,
                locked: issueScrapePRData[i].locked,
                title: issueScrapePRData[i].title,
                body: issueScrapePRData[i].body,
                closedAt: issueScrapePRData[i].closedAt,
                mergedAt: issueScrapePRData[i].mergedAt,
                mergeCommitSha: issueScrapePRData[i].mergeCommitSha,
                headRef: issueScrapePRData[i].headRef,
                headLabel: issueScrapePRData[i].headLabel,
                headSha: issueScrapePRData[i].headSha,
                baseRef: issueScrapePRData[i].baseRef,
                baseLabel: issueScrapePRData[i].baseLabel,
                baseSha: issueScrapePRData[i].baseSha,
                draft: issueScrapePRData[i].draft,
            });
            expect(documentFound).toEqual(true);
        }
    });

    //Branches
    test("Correct number of Branches should be scraped for kgodara-testing/brodal_queue", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var foundBranchNum = await Branch.countDocuments({
            repository: workspace.repositoryIds[0],
        });
        expect(foundBranchNum).toEqual(brodalBranchNum);
    });

    test("Branch fields should be correctly scraped for kgodara-testing/brodal_queue", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var i;
        var documentFound;
        for (i = 0; i < brodalBranchData.length; i++) {
            documentFound = await Branch.exists({
                repository: workspace.repositoryIds[0],
                name: brodalBranchData[i].name,
                sourceId: brodalBranchData[i].sourceId,
                ref: brodalBranchData[i].ref,
                lastCommit: brodalBranchData[i].lastCommit,
            });

            expect(documentFound).toEqual(true);
        }
    });

    test("Correct number of Branches should be scraped for kgodara-testing/hamecha", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var foundBranchNum = await Branch.countDocuments({
            repository: workspace.repositoryIds[1],
        });
        expect(foundBranchNum).toEqual(hamechaBranchNum);
    });

    test("Branch fields should be correctly scraped for kgodara-testing/hamecha", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var i;
        var documentFound;
        for (i = 0; i < hamechaBranchData.length; i++) {
            documentFound = await Branch.exists({
                repository: workspace.repositoryIds[1],
                name: hamechaBranchData[i].name,
                sourceId: hamechaBranchData[i].sourceId,
                ref: hamechaBranchData[i].ref,
                lastCommit: hamechaBranchData[i].lastCommit,
            });

            expect(documentFound).toEqual(true);
        }
    });

    test("Correct number of Branches should be scraped for kgodara-testing/issue-scrape", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var foundBranchNum = await Branch.countDocuments({
            repository: workspace.repositoryIds[2],
        });
        expect(foundBranchNum).toEqual(issueScrapeBranchNum);
    });

    test("Branch fields should be correctly scraped for kgodara-testing/issue-scrape", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var i;
        var documentFound;
        for (i = 0; i < issueScrapeBranchData.length; i++) {
            documentFound = await Branch.exists({
                repository: workspace.repositoryIds[2],
                name: issueScrapeBranchData[i].name,
                sourceId: issueScrapeBranchData[i].sourceId,
                ref: issueScrapeBranchData[i].ref,
                lastCommit: issueScrapeBranchData[i].lastCommit,
            });

            expect(documentFound).toEqual(true);
        }
    });

    //Commits
    test("Correct number of Commits should be scraped for kgodara-testing/brodal_queue", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var foundCommitNum = await Commit.countDocuments({
            repository: workspace.repositoryIds[0],
        });
        expect(foundCommitNum).toEqual(brodalCommitNum);
    });

    test("Commits fields should be correctly scraped for kgodara-testing/brodal_queue", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var i;
        var documentFound;
        for (i = 0; i < brodalCommitData.length; i++) {
            documentFound = await Commit.exists({
                repository: workspace.repositoryIds[0],
                fileList: brodalCommitData[i].fileList,
                sha: brodalCommitData[i].sha,
                committerDate: brodalCommitData[i].committerDate,
                treeHash: brodalCommitData[i].treeHash,
                authorName: brodalCommitData[i].authorName,
                committerName: brodalCommitData[i].committerName,
                committerEmail: brodalCommitData[i].committerEmail,
                commitMessage: brodalCommitData[i].commitMessage,
                name: brodalCommitData[i].name,
                sourceId: brodalCommitData[i].sourceId,
                sourceCreationDate: brodalCommitData[i].sourceCreationDate,
            });

            expect(documentFound).toEqual(true);
        }
    });

    test("Correct number of Commits should be scraped for kgodara-testing/hamecha", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var foundCommitNum = await Commit.countDocuments({
            repository: workspace.repositoryIds[1],
        });
        expect(foundCommitNum).toEqual(hamechaCommitNum);
    });

    test("Commits fields should be correctly scraped for kgodara-testing/hamecha", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var i;
        var documentFound;
        for (i = 0; i < hamechaCommitData.length; i++) {
            documentFound = await Commit.exists({
                repository: workspace.repositoryIds[1],
                fileList: hamechaCommitData[i].fileList,
                sha: hamechaCommitData[i].sha,
                committerDate: hamechaCommitData[i].committerDate,
                treeHash: hamechaCommitData[i].treeHash,
                authorName: hamechaCommitData[i].authorName,
                committerName: hamechaCommitData[i].committerName,
                committerEmail: hamechaCommitData[i].committerEmail,
                commitMessage: hamechaCommitData[i].commitMessage,
                name: hamechaCommitData[i].name,
                sourceId: hamechaCommitData[i].sourceId,
                sourceCreationDate: hamechaCommitData[i].sourceCreationDate,
            });

            expect(documentFound).toEqual(true);
        }
    });

    test("Correct number of Commits should be scraped for kgodara-testing/issue-scrape", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var foundCommitNum = await Commit.countDocuments({
            repository: workspace.repositoryIds[2],
        });
        expect(foundCommitNum).toEqual(issueScrapeCommitNum);
    });

    test("Commits fields should be correctly scraped for kgodara-testing/issue-scrape", async () => {
        const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

        var i;
        var documentFound;
        for (i = 0; i < issueScrapeCommitData.length; i++) {
            documentFound = await Commit.exists({
                repository: workspace.repositoryIds[2],
                fileList: issueScrapeCommitData[i].fileList,
                sha: issueScrapeCommitData[i].sha,
                committerDate: issueScrapeCommitData[i].committerDate,
                treeHash: issueScrapeCommitData[i].treeHash,
                authorName: issueScrapeCommitData[i].authorName,
                committerName: issueScrapeCommitData[i].committerName,
                committerEmail: issueScrapeCommitData[i].committerEmail,
                commitMessage: issueScrapeCommitData[i].commitMessage,
                name: issueScrapeCommitData[i].name,
                sourceId: issueScrapeCommitData[i].sourceId,
                sourceCreationDate: issueScrapeCommitData[i].sourceCreationDate,
            });

            expect(documentFound).toEqual(true);
        }
    });
});

afterAll(async () => {
    const workspace = JSON.parse(process.env.TEST_CODE_OBJECT_CREATE_WORKSPACE);

    await deleteWorkspace(workspace.workspaceId);

    // await expect( () => deleteWorkspace(workspace.workspaceId)).not.toThrow();
});
