const Token = require('../models/Token');

const getInstallToken = async (installationId) => {
    return await Token.findOne({ installationId, type: 'INSTALL' })
    .then( token => {
        return token;
    })
    .catch(err => {
        console.log('Error fetching installation access token');
        console.log(err);
        return {};
    });
}

module.exports = {
    getInstallToken
}
