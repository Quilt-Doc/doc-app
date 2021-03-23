const Token = require('../models/Token');
const {serializeError, deserializeError} = require('serialize-error');

const Sentry = require("@sentry/node");


const getInstallToken = async (installationId, session) => {
    var token;

    var queryOptions = {}

    if (session) queryOptions.session = session;

    try {
        token = await Token.findOne({ installationId, type: 'INSTALL' }, null, queryOptions).exec();


        if (!token) {

            Sentry.setContext("getInstallToken", {
                message: `Could not find an install token (Token { type: 'INSTALL' } ) for given installationId`,
                installationId: installationId,
            });

            var err = new Error(`Could not find an install token (Token { type: 'INSTALL' } ) for given installationId - ${installationId}`);

            Sentry.captureException(err);
            
            console.log(err);

            throw err;
        }
        return token;
    }
    catch (err) {

        Sentry.setContext("getInstallToken", {
            message: `Error fetching install token (Token { type: 'INSTALL' } )`,
            installationId: installationId,
        });

        Sentry.captureException(err);
        
        console.log(err);

        throw err;
    }
}

module.exports = {
    getInstallToken
}
