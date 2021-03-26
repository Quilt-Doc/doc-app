
const mongoose = require("mongoose")
const { ObjectId } = mongoose.Types;


const Document = require('../models/Document');
const UserStats = require('../models/reporting/UserStats');





const breakAttachedDocuments = async (repoId, workspaceId, refUpdateData, worker, session) => {
    // Find all Documents associated with References that have been broken
    var documentsToBreak;
    try {
        documentsToBreak = await Document.find({repository: repoId, references: { $in: refUpdateData.map(refObj => ObjectId(refObj._id)) }}, null, { session }).exec();
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                    errorDescription: `Error finding invalidated References on repository: ${repoId}`,
                                                    source: 'worker-instance', function: 'breakAttachedDocuments'}});
        throw new Error(`Error finding invalidated References on repository: ${repoId}`);
    }
    // No need to update any info on documents that are already broken so filter them out
    documentsToBreak = documentsToBreak.filter(documentObj => documentObj.status != 'invalid');

    var docUpdateData = [];

    // Need to match the retrieved Documents to the References that broke them
    for (i = 0; i < documentsToBreak.length; i++) {
        var currentDocument = documentsToBreak[i];
        // References that have been broken that are attached to the currentDocument
        var attachedReferences = refUpdateData.filter(refUpdate => currentDocument.references.includes(refUpdate._id ));
        // We will use the commit of the first broken Reference
        // TODO: Make sure this is the earliest commit sha
        if (attachedReferences.length > 0) docUpdateData.push({_id: currentDocument._id, status: 'invalid', breakCommit: attachedReferences[0].breakCommit});
    }

    const bulkDocumentInvalidateOps = docUpdateData.map(docObj => ({

        updateOne: {
                filter: { _id: ObjectId(docObj._id.toString()) },
                // Where field is the field you want to update
                // TODO: Instead of using `new Date()` use the actual date on the git push
                update: { $set: { status: docObj.status, breakCommit: docObj.breakCommit, breakDate: new Date() } },
                upsert: false
        }
    }));
    if (bulkDocumentInvalidateOps.length > 0) {
        try {
            const bulkResult = await Document.collection.bulkWrite(bulkDocumentInvalidateOps, { session });
            worker.send({action: 'log', info: {level: 'info', message: `bulk Document invalidate results: ${JSON.stringify(bulkResult)}`,
                                                source: 'worker-instance', function: 'breakAttachedDocuments'}});

        }
        catch(err) {
            await worker.send({action: 'log', info: {level: 'error', message: serializeError(err),
                                                        errorDescription: `Error bulk invalidating Documents on repository: ${repoId}`,
                                                        source: 'worker-instance', function: 'breakAttachedDocuments'}});
            throw new Error(`Error bulk invalidating Documents on repository: ${repoId}`);
        }

        // Update UserStats here

        // We need to get the Document's authors

        var deletedIds = docUpdateData.map(docData => docData._id.toString());

        var deletedDocumentInfo;

        try {
            deletedDocumentInfo = await Document.find({_id: {$in: deletedIds}}, null, { session }).select("author status").lean().exec();
        }
        catch (err) {
            worker.send({ action: 'log', info: {level: 'error',
                                                    source: 'worker-instance',
                                                    message: serializeError(err),
                                                    errorDescription: `Error Document find query failed repositoryId, deletedIds: ${repoId}, ${JSON.stringify(deletedIds)}`,
                                                    function: 'breakAttachedDocuments'}});

            throw new Error(`Error Document find query failed repositoryId, deletedIds: ${repoId}, ${JSON.stringify(deletedIds)}`);
        }

        var userBrokenDocumentNums = {};
        var userBrokenDocumentUpdateList = [];
    
        deletedDocumentInfo.filter(infoObj => infoObj.status == 'invalid')
                            .forEach(infoObj => {
                                userBrokenDocumentNums[infoObj.author.toString()] = (userBrokenDocumentNums[infoObj.author.toString()] || 0) + 1;
                            });
        Object.keys(userBrokenDocumentNums).forEach(key => {
            userBrokenDocumentUpdateList.push({ userId: key, updateNum: userBrokenDocumentNums[key] });
        });
    
        if (userBrokenDocumentUpdateList.length > 0) {
            var userUpdates = userBrokenDocumentUpdateList;

            worker.send({ action: 'log', info: {level: 'info',
                                                    source: 'worker-instance',
                                                    message: `Updating UserStats - repositoryId, userUpdates: ${repoId}, ${JSON.stringify(userUpdates)}`,
                                                    function: 'breakAttachedDocuments'}});
            

            // mongoose bulkwrite for one many update db call
            try {
                const bulkDecrementOps = userUpdates.map((update) => {
                    return ({
                        updateOne: {
                            filter: { user: ObjectId(update.userId.toString()), workspace: ObjectId(workspaceId) },
                            // Where field is the field you want to update
                            update: { $inc: { documentsBrokenNum: update.updateNum } },
                            upsert: false
                        }
                    })
                });

               var rawResult = await UserStats.bulkWrite(bulkDecrementOps, { rawResult: true, session });

               worker.send({ action: 'log', info: {level: 'info',
                                                    source: 'worker-instance',
                                                    message: `UserStats bulk decrement raw results - repositoryId, rawResult: ${repoId}\n${JSON.stringify(rawResult)}`,
                                                    function: 'breakAttachedDocuments'}});

                // KARAN TODO: DELETE THIS
                /*
                var tempResult = await UserStats.findOne({user: ObjectId("5f89d2be05ca08f87c4ac17b")}, null, { session }).lean().exec();
                worker.send({ action: 'log', info: {level: 'info',
                                                    source: 'worker-instance',
                                                    message: `UserStats TEMP RESULT - tempResult: ${JSON.stringify(tempResult)}`,
                                                    function: 'breakAttachedDocuments'}});
                */

            }
            catch (err) {
                worker.send({ action: 'log', info: {    level: 'error',
                                                        source: 'worker-instance',
                                                        message: serializeError(err),
                                                        errorDescription: `Error bulk updating User Stats for repositoryId, userUpdates: ${repoId}, ${JSON.stringify(userUpdates)}`,
                                                        function: 'breakAttachedDocuments'}});

                throw new Error(`Error bulk updating User Stats for repositoryId, userUpdates: ${repoId}, ${JSON.stringify(userUpdates)}`);
            }

            await worker.send({action: 'log', info: { level: 'info',
                                                        source: 'worker-instance',
                                                        message: `Successfully updated 'UserStats.documentsBrokenNum' for ${userUpdates.length} Users - repositoryId: ${repoId}`,
                                                        function: 'breakAttachedDocuments'}});
        }



    }
    await worker.send({ action: 'log', info: {level: 'info',
                                                source: 'worker-instance',
                                                message: `Invalidated ${docUpdateData.length} Documents.`,
                                                function: 'breakAttachedDocuments'
                                                }});
    return docUpdateData.map(docData => docData._id.toString());
}


module.exports = {
    breakAttachedDocuments
}