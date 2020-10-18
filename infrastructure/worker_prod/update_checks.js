
require('dotenv').config();

const constants = require('./constants/index');

const apis = require('./apis/api');

const Repository = require('./models/Repository');
const Check = require('./models/Check');

const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;

const tokenUtils = require('./utils/token_utils');

const checkUtils = require('./utils/check_utils');

const _ = require('underscore');


const {serializeError, deserializeError} = require('serialize-error');

let db = mongoose.connection;




// Procedure:
// Fetch all Checks that have any of the validatedDocuments / validatedSnippets on them
// If no Checks found, return
// Remove validatedDocuments & validatedSnippets Ids from found Checks
// Get new Check Run Obj (Markdown) for all modified Checks
// Update all Check Markdown on Github
// Update all Checks in database.

const runUpdateProcedure = async () => {
    var worker = require('cluster').worker;

    var repositoryId = process.env.repositoryId;
    var validatedDocuments = JSON.parse(process.env.validatedDocuments);
    var validatedSnippets = JSON.parse(process.env.validatedSnippets);

    const session = await db.startSession();

    var transactionAborted = false;
    var transactionError = {message: ''};

    await session.withTransaction(async () => {

        // Get Repository Document & Installation Client 
        var repositoryObj;
        try {
            repositoryObj = await Repository.findById(repositoryId, null, { session });
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                errorDescription: `Error fetching Repository repositoryId: ${repositoryId}`,
                                function: 'updateChecks'}});
            
            transactionAborted = true;
            transactionError.message = `Error fetching Repository repositoryId: ${repositoryId}`;
            
            throw Error(`Error fetching Repository repositoryId: ${repositoryId}`);
        }

        var installationId = repositoryObj.installationId;


        var installationClient;
        try {
            installationClient = await apis.requestInstallationClient(installationId);
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                        errorDescription: `Error fetching installationClient installationId: ${installationId}`,
                                                        function: 'updateChecks'}});
            
            transactionAborted = true;
            transactionError.message = `Error fetching installationClient installationId: ${installationId}`;
            
            throw new Error(`Error fetching installationClient installationId: ${installationId}`);
        }

        var findFilter = {};

        if (validatedDocuments.length > 0) {
            findFilter.brokenDocuments = { $in: validatedDocuments.map(id => ObjectId(id.toString())) };
        }
        
        if (validatedSnippets.length > 0) {
            findFilter.brokenSnippets = { $in: validatedSnippets.map(id => ObjectId(id.toString())) };
        }

        findFilter.repository = repositoryId;

        // Find all Checks with any validatedDocuments or validatedSnippets Ids attached
        var modifiedChecks;
        try {
            modifiedChecks = await Check.find(findFilter, null, { session }).exec();
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                        errorDescription: `Error fetching modified Checks findFilter: ${JSON.stringify(findFilter)}`,
                                                        function: 'updateChecks'}});
            
            transactionAborted = true;
            transactionError.message = `Error fetching modified Checks findFilter: ${JSON.stringify(findFilter)}`;
            
            throw new Error(`Error fetching modified Checks findFilter: ${JSON.stringify(findFilter)}`);
        }

        // If no Checks found, return
        if (modifiedChecks.length < 1) {
            await worker.send({action: 'log', info: {level: 'info', source: 'worker-instance', message: `No Checks found for repositoryId, validatedDocuments, validatedSnippets: ${repositoryId}, ${JSON.stringify(validatedDocuments)}, ${JSON.stringify(validatedSnippets)}`,
                                                        errorDescription: `Error fetching modified Checks findFilter: ${JSON.stringify(findFilter)}`,
                                                        function: 'updateChecks'}});
            return;
        }

        // Remove 'validatedDocuments' Ids from the Checks we've found

        validatedDocuments = validatedDocuments.map(id => id.toString());

        if (validatedDocuments.length > 0) {
            modifiedChecks = modifiedChecks.map(checkObj => {

                checkObj.brokenDocuments = checkObj.brokenDocuments.map(docId => docId.toString());

                var x = checkObj.brokenDocuments.map(docId => docId.toString());
                checkObj.brokenDocuments = _.difference(x, validatedDocuments);

                return checkObj;
            });
        }


        // Remove 'validatedSnippets' Ids from the Checks we've found
        if (validatedSnippets.length > 0) {
            modifiedChecks = modifiedChecks.map(checkObj => {

                checkObj.brokenSnippets = checkObj.brokenSnippets.map(docId => docId.toString());

                var x = checkObj.brokenSnippets.map(docId => docId.toString());

                checkObj.brokenSnippets = _.difference(x, validatedSnippets);

                return checkObj;
            });
        }

        // createCheckRunObj = async (commit, brokenDocuments, brokenSnippets, checkId, worker) => {

        // Bulk Create Check Run Objects with new 'brokenDocuments' and 'brokenSnippets' arrays, as well as commit of the old Check
        // Also add 'githubId', param needed for API call
        var patchDataList;
        try {
            // KARAN TODO: Verify this Promise.all properly waits
            var newCheckRunObjList = modifiedChecks.map( async (checkObj) => {
                var updatedObj = await checkUtils.createCheckRunObj(checkObj.sha, checkObj.brokenDocuments, checkObj.brokenSnippets, checkObj._id.toString(), worker);
                return {payload: updatedObj, githubId: checkObj.githubId}
            });
            patchDataList = await Promise.all(newCheckRunObjList);
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                        errorDescription: `Error creating Check Run Object - modifiedChecks: ${JSON.stringify(modifiedChecks.map(checkObj => checkObj._id.toString()))}`,
                                                        function: 'updateChecks'}});
            
            transactionAborted = true;
            transactionError.message = `Error creating Check Run Object - modifiedChecks: ${JSON.stringify(modifiedChecks.map(checkObj => checkObj._id.toString()))}`;
            
            throw Error(`Error creating Check Run Object - modifiedChecks: ${JSON.stringify(modifiedChecks.map(checkObj => checkObj._id.toString()))}`);
        }


        // KARAN TODO: Verify this Promise.all properly waits
        // Bulk Update Checks on Github
        var requestPromiseList = patchDataList.map(async (patchDataObj) => await installationClient.patch(`/repos/${repositoryObj.fullName}/check-runs/${patchDataObj.githubId}`, patchDataObj.payload));

        try {
            await Promise.all(requestPromiseList);
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                        errorDescription: `Error patching Check Run - modifiedChecks: ${JSON.stringify(modifiedChecks.map(checkObj => checkObj._id.toString()))}`,
                                                        function: 'updateChecks'}});
            
            transactionAborted = true;
            transactionError.message = `Error patching Check Run - modifiedChecks: ${JSON.stringify(modifiedChecks.map(checkObj => checkObj._id.toString()))}`;
            
            throw Error(`Error patching Check Run - modifiedChecks: ${JSON.stringify(modifiedChecks.map(checkObj => checkObj._id.toString()))}`);
        }

        // Bulk Update Checks on MongoDB

        const bulkCheckUpdateOps = modifiedChecks.map(checkObj => ({
            updateOne: {
                // Error Here
                filter: { _id: ObjectId(checkObj._id.toString()) },
                // Where field is the field you want to update
                update: { $set: { brokenDocuments: checkObj.brokenDocuments, brokenSnippets: checkObj.brokenSnippets} },
                upsert: false
            }
        }));

        try {
            await Check.collection.bulkWrite(bulkCheckUpdateOps, { session });
        }
        catch (err) {
            await worker.send({action: 'log', info: {level: 'error', source: 'worker-instance', message: serializeError(err),
                                                        errorDescription: `Error updating Checks in MongoDB - modifiedChecks: ${JSON.stringify(modifiedChecks.map(checkObj => checkObj._id.toString()))}`,
                                                        function: 'updateChecks'}});
            
            transactionAborted = true;
            transactionError.message = `Error updating Checks in MongoDB - modifiedChecks: ${JSON.stringify(modifiedChecks.map(checkObj => checkObj._id.toString()))}`;

            throw Error(`Error updating Checks in MongoDB - modifiedChecks: ${JSON.stringify(modifiedChecks.map(checkObj => checkObj._id.toString()))}`);
        }

        // Info log
        await worker.send({action: 'log', info: {level: 'info', source: 'worker-instance',
                                                    message: `Update Checks Job Completed, updated ${modifiedChecks.length} Checks for repositoryId ${repositoryId}`,
                                                    function: 'updateChecks'}});
    });

    session.endSession();

    if (transactionAborted) {
        throw new Error(transactionError.message);
    }

}

module.exports = {
    runUpdateProcedure
}