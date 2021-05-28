const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

const IntegrationBoard = require("../../models/integrations/integration_objects/IntegrationBoard");
const Workspace = require("../../models/Workspace");

const apis = require("../../apis/api");
const Sentry = require("@sentry/node");

// Return created boardId
const generateGithubIssueBoard = async (repositoryId) => {
    var createdBoard;
    try {
        createdBoard = await IntegrationBoard.create({ source: "github", repositories: [repositoryId.toString()] });
    } catch (err) {
        Sentry.captureException(err);
        throw err;
    }
    
    return createdBoard._id.toString();
};

// Return created boardId
const setupGithubIssueBoard = async (workspaceId, repositoryId) => {

    var createdBoardId;

    try {
        createdBoardId = await generateGithubIssueBoard(repositoryId);
    } catch (err) {
        Sentry.captureException(err);
        throw err;
    }

    await addBoardsToWorkspace(workspaceId, [createdBoardId]);
    
    return createdBoardId;
};

const fetchBoardsFromRepositoryList = async (repositoryIdList) => {


    var boardFindFilter = { repositories: { $in: repositoryIdList
        .map(id => ObjectId(id.toString())), 
    },
    source: "github",
    };

    console.log(`fetchBoardsFromRepositoryList - IntegrationBoard.find() filter: ${JSON.stringify(boardFindFilter)}`);

    var foundBoards;
    try {
        foundBoards = await IntegrationBoard.find(boardFindFilter,
            "_id"
        )
            .lean()
            .exec();
    } catch (err) {
        console.log(err);
        Sentry.captureException(err);
        throw err;
    }

    console.log(`fetchBoardsFromRepositoryList - foundBoards: ${JSON.stringify(foundBoards)}`);

    return foundBoards;
};

const addBoardsToWorkspace = async (workspaceId, boardIdList) => {
    // Attach Board to Workspace.boards
    console.log(`Adding Boards ${JSON.stringify(boardIdList)} to Workspace ${workspaceId}`);
    try {
        await Workspace.updateOne({ _id: ObjectId(workspaceId.toString()) }, { $push: { boards: { $each: boardIdList.map(id => ObjectId(id.toString())) } } })
            .exec();
    } catch (err) {
        console.log(err);
        Sentry.captureException(err);
        throw err;
    }
};


const generateAssociationsFromResults = async (workspaceId, successResults) => {

    var createAssociationData = [];

    var i = 0;
    for (i = 0; i < successResults.length; i++) {
        createAssociationData.push({ _id: successResults[i].integrationBoardId, repositories: [successResults[i].repositoryId] });
    }

    var backendClient = apis.requestBackendClient();

    console.log(`Calling 'generate_associations' - workspaceId: ${workspaceId}`);
    console.log(createAssociationData);

    try {
        await backendClient.post(`/associations/${workspaceId}/generate_associations`, { boardId: createAssociationData[0]._id, boards: createAssociationData });
    } catch (err) {
        Sentry.captureException(err);
        throw err;
    }
};

module.exports = {
    generateGithubIssueBoard,
    setupGithubIssueBoard,
    generateAssociationsFromResults,

    addBoardsToWorkspace,
    fetchBoardsFromRepositoryList,
};