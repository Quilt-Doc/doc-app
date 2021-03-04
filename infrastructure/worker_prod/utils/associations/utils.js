const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

const IntegrationBoard = require('../../models/integrations/integration_objects/IntegrationColumn');
const Workspace = require("../../models/Workspace");

const apis = require('../../apis/api');
const Sentry = require("@sentry/node");

// Return created boardId
const generateGithubIssueBoard = async (repositoryId) => {
    var createdBoard;
    try {
        createdBoard = await IntegrationBoard.create({ source: "github", repositories: [repositoryId.toString()] }).lean().exec();
    }
    catch (err) {
        Sentry.captureException(err);
        throw err;
    }

    await findBoard(createdBoard._id.toString());
    
    return createdBoard._id.toString();
}

// Return created boardId
const generateGithubIssueBoardAPI = async (workspaceId, repositoryId) => {

    var backendClient = apis.requestBackendClient();
    var createdBoardId;

    try {
        createdBoardId = await backendClient.post("/associations/create_board", { "repositoryId": repositoryId, "workspaceId": workspaceId, });
        if (createdBoardId.success == false) {
            throw Error("API Call failed");
        }
    }
    catch (err) {
        Sentry.captureException(err);
        throw err;
    }

    // console.log("/associations/create_board Response: ");
    // console.log(createdBoardId);

    createdBoardId = createdBoardId.data.result;

    await addBoardToWorkspace(workspaceId, createdBoardId);

    await findBoard(createdBoardId);
    
    return createdBoardId;
}

const addBoardToWorkspace = async (workspaceId, boardId) => {
        // Attach Board to Workspace.boards
        console.log(`Adding Board ${boardId} to Workspace ${workspaceId}`);
        try {
            await Workspace.updateOne({ _id: ObjectId(workspaceId.toString()) }, { $push: { boards: ObjectId(boardId) } }).exec();
        }
        catch (err) {
            console.log(err);
            Sentry.captureException(err);
            throw err;
        }    
}

const findBoard = async (boardId) => {
    console.log("Created IntegrationBoard: ");
    console.log(await IntegrationBoard.findById(boardId).lean().exec());
}


const generateAssociationsFromResults = async (workspaceId, successResults) => {

    var createAssociationData = [];

    var i = 0;
    for (i = 0; i < successResults.length; i++) {
        createAssociationData.push({ _id: successResults[i].integrationBoardId, repositories: [ successResults[i].repositoryId ] });
    }

    var backendClient = apis.requestBackendClient();

    console.log(`Calling 'generate_associations' - workspaceId: ${workspaceId}`);
    console.log(createAssociationData);

    await findBoard(createAssociationData[0]._id);

    try {
        await backendClient.post(`/associations/${workspaceId}/generate_associations`, { boardId: createAssociationData[0]._id, boards: createAssociationData });
    }
    catch (err) {
        Sentry.captureException(err);
        throw err;
    }
}

module.exports = {
    generateGithubIssueBoard,
    generateGithubIssueBoardAPI,
    generateAssociationsFromResults,

}