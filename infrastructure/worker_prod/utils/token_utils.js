const Token = require('../models/Token');
const {serializeError, deserializeError} = require('serialize-error');


const getInstallToken = async (installationId, worker, session) => {
    var token;

    try {
        token = await Token.findOne({ installationId, type: 'INSTALL' }, null, { session }).exec();


        if (!token) {
            await worker.send({action: 'log', info: {level: 'error',
                                                        message: serializeError(Error(`Error could not find a install token for installationId: ${installationId}`)),
                                                        source: 'worker-instance', function: 'getInstallToken'}});
            throw new Error(`Error could not find a install token for installationId: ${installationId}`);
        }
        return token;
    }
    catch (err) {
        await worker.send({action: 'log', info: {level: 'error', message: serializeError(err), errorDescription: `Error fetching install token on installationId: ${installationId}`,
                                                    source: 'worker-instance', function: 'getInstallToken'}});
        throw new Error(`Error fetching install token on installationId: ${installationId}`);
    }
}

module.exports = {
    getInstallToken
}
