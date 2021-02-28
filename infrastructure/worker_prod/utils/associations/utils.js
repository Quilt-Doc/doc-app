const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

const IntegrationBoard = require('../../models/integrations/integration_objects/IntegrationColumn');

const apis = require('../apis/api');

const generateGithubIssueAssociations = async (workspaceId, workspaceRepositories) => {

    if (workspaceRepositories.length < 1) {
        return;
    }

    var integrationBoardsToCreate = workspaceRepositories.map(repositoryObj => {
        return { repositories: [repositoryObj._id.toString()] }
    });

    var insertedBoardIds;

    // Create IntegrationBoards and get Ids
    try {
        insertResults = await IntegrationBoard.insertMany(
            integrationBoardsToCreate,
            { rawResult: true }
        );

        console.log(insertResults.insertedIds);

        insertedBoardIds = Object.values(
            insertResults.insertedIds
        ).map((id) => id.toString());
    } catch (err) {
        console.log(err);
        throw new Error(
            `Error could not insert IntegrationBoards - integrationBoardsToCreate.length: ${integrationBoardsToCreate.length}`
        );
    }

    // Fetch IntegrationBoards, as opposed to assuming that insertedBoardIds matches the order of integrationBoardsToCreate accurately

    var insertedBoards;

    try {
        insertedBoards = await IntegrationBoard.find({ _id: { $in: insertedBoardIds } }, "_id repositories").lean().exec();
    }
    catch (err) {
        console.log(err);
        throw new Error(
            `Error could not fetch IntegrationBoards - insertedBoardIds: ${JSON.stringify(insertedBoardIds)}`
        );
    }

    // Call Association API Endpoint

    /*
    var backendClient = apis.requestBackendClient();

    try {
        await backendClient.post(`/associations/${workspaceId}/generate_associations`, insertedBoards);
    }
    catch (err) {
        console.log(err);
        throw new Error(
            `Error calling "/associations/${workspaceId}/generate_associations" - insertedBoards: ${JSON.stringify(insertedBoards)}`
        );
    }
    */

    return insertedBoards;

    
}