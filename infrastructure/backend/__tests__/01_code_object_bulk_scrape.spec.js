
require('dotenv').config();
const fs = require("fs");

const brodalQueueCodeObjectData = require("../__tests__data/code_objects/brodal_queue/index");
const docAppCodeObjectData = require("../__tests__data/code_objects/doc-app/index");

const Branch = require('../../models/Branch');
const PullRequest = require('../../models/PullRequest');
const Commit = require('../../models/Commit');



const fetchAllBranches = async (repositoryId) => {
    var scrapedBranches;
    try {
        scrapedBranches = await Branch.find({ repositoryId: ObjectId(repositoryId.toString()) })
                                                        .lean()
                                                        .exec();
    }
    catch (err) {
        console.log(err);
        throw Error(`Couldn't fetch Branches - repositoryId: ${repositoryId}`);
    }
    return scrapedBranches;
}

const fetchAllPRs = async (repositoryId) => {
    var scrapedPRs;
    try {
        scrapedPRs = await PullRequest.find({ repositoryId: ObjectId(repositoryId.toString()) })
                                                        .lean()
                                                        .exec();
    }
    catch (err) {
        console.log(err);
        throw Error(`Couldn't fetch PullRequests - repositoryId: ${repositoryId}`);
    }
    return scrapedPRs;
}

const fetchAllCommits = async (repositoryId) => {
    var scrapedCommits;
    try {
        scrapedCommits = await Commit.find({ repositoryId: ObjectId(repositoryId.toString()) })
                                                        .lean()
                                                        .exec();
    }
    catch (err) {
        console.log(err);
        throw Error(`Couldn't fetch Commits - repositoryId: ${repositoryId}`);
    }
    return scrapedCommits;

}




describe("Branch Scraping", () => {
    
    var createdRepositories = JSON.parse(process.env.TEST_CREATED_REPOSITORIES);
    var createdRepositoryIds = createdRepositories.map(repositoryObj => repositoryObj._id);

    test("Should have scraped correct number of branches from brodal_queue", async () => {
        var scrapedBranchNum = await fetchAllBranches(createdRepositoryIds[0]);
        expect(scrapedBranchNum).toEqual(brodalQueueCodeObjectData.branchData.numBranches);
    })
    test("Should have scraped correct number of branches from doc-app", async () => {
        var scrapedBranchNum = await fetchAllBranches(createdRepositoryIds[1]);
        expect(scrapedBranchNum).toEqual(docAppCodeObjectData.branchData.numBranches);
    });
})


describe("Pull Request Scraping", () => {

    var createdRepositories = JSON.parse(process.env.TEST_CREATED_REPOSITORIES);
    var createdRepositoryIds = createdRepositories.map(repositoryObj => repositoryObj._id);

    test("Should have scraped correct number of PRs from brodal_queue", async () => {
        var scrapedPRNum = await fetchAllPRs(createdRepositoryIds[0]);
        expect(scrapedPRNum).toEqual(brodalQueueCodeObjectData.PRData.numPRs);
    });

    test("Should have scraped correct number of PRs from doc-app", async () => {
        var scrapedPRNum = await fetchAllPRs(createdRepositoryIds[1]);
        expect(scrapedPRNum).toEqual(docAppCodeObjectData.PRData.numPRs);
    });
})


describe("Commit Scraping", () => {

    var createdRepositories = JSON.parse(process.env.TEST_CREATED_REPOSITORIES);
    var createdRepositoryIds = createdRepositories.map(repositoryObj => repositoryObj._id);

    test("Should have scraped correct number of commits from brodal_queue", async () => {
        var scrapedCommitNum = await fetchAllCommits(createdRepositoryIds[0]);
        expect(scrapedCommitNum).toEqual(brodalQueueCodeObjectData.commitData.numCommits);
    });

    test("Should have scraped correct number of commits from doc-app", async () => {
        var scrapedCommitNum = await fetchAllCommits(createdRepositoryIds[1]);
        expect(scrapedCommitNum).toEqual(brodalQueueCodeObjectData.commitData.numCommits);
    });
})

