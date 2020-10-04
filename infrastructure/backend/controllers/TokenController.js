const Token = require('../models/Token');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;
const logger = require('../logging/index').logger;

const apis = require('../apis/api');

createToken = async (req, res) => {
    const { installationId, type } = req.body;

    if (!typeof installationId == 'undefined' && installationId !== null) return res.json({success: false, error: 'no token installationId provided'});
    if (!typeof type == 'undefined' && type !== null) return res.json({success: false, error: 'no token type provided'});

    await logger.info({source: 'backend-api', message: `Creating 'INSTALL' token installationId: ${installationId}`, function: 'createToken'});

    let token = new Token({
        installationId,
        type
    });

    var appToken = undefined;
    
    try {
        appToken =  await Token.findOne({'type': 'APP'});
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err, errorDescription: `Error finding 'APP' token`, function: 'createToken'});
        return res.json({success: false, error: 'Error finding app access token'});
    }

    var installationToken;
    try {
       installationToken = await apis.requestInstallationToken(appToken, installationId);
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error requesting 'INSTALL' token, installationId: ${installationId}`,
                            function: 'requestInstallationToken'});

        return res.json({success: false, error: `Error requesting 'INSTALL' token, installationId: ${installationId}`});
    }

    token.value = installationToken.value;
    token.expireTime = installationToken.expireTime;
    token.status = '';

    try {
        token = await token.save();
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error saving 'INSTALL' token, installationId: ${installationId}`,
                            function: 'createToken'});

        return res.json({success: false, error: `Error saving 'INSTALL' token, installationId: ${installationId}`});
    }

    await logger.info({source: 'backend-api',
                        message: `Successfully created 'INSTALL' token for installationId: ${installationId}`,
                        function: 'createToken'});

    return res.json({success: true, result: token});
}

deleteInstallationToken = async (req, res) => {
    const { installationId } = req.body;

    if (!typeof installationId == 'undefined' && installationId !== null) return res.json({success: false, error: 'no token installationId provided'});

    await logger.info({source: 'backend-api', message: `Deleting 'INSTALL' token installationId: ${installationId}`, function: 'deleteToken'});

    try {
        await Token.deleteOne({installationId});
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err, errorDescription: `Error deleting 'INSTALL' token, installationId: ${installationId}`, function: 'deleteInstallationToken'});
        return res.json({success: false, error: `Error deleting 'INSTALL' token, installationId: ${installationId}`});
    }

    await logger.info({source: 'backend-api',
                        message: `Successfully deleted 'INSTALL' token for installationId: ${installationId}`,
                        function: 'deleteToken'});

    return res.json({success: true});
}

module.exports = { createToken, deleteInstallationToken }