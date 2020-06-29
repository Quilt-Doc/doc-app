const Token = require('../models/Token');
var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const apis = require('../apis/api');

createToken = async (req, res) => {
    const { installationId, type } = req.body;
    
    if (!typeof installationId == 'undefined' && installationId !== null) return res.json({success: false, error: 'no token installationId provided'});
    if (!typeof type == 'undefined' && type !== null) return res.json({success: false, error: 'no token type provided'});

    let token = new Token(
        installationId,
        type
    );
    var appToken = undefined;
    
    await Token.findOne({'type': 'APP'}, function (err, foundToken) {
        if (err) {
            console.log('Error finding app access token: ');
            console.log(err);
            return;
        }
        appToken = foundToken;
    });

    var installationToken = await apis.requestInstallationToken(appToken, installationId);

    token.value = installationToken.value;
    token.expireTime = installationToken.expireTime;

    console.log('Creating Token: ');
    console.log(token);

    token.save((err, token) => {
        if (err) return res.json({ success: false, error: err });
        return res.json(token);
    });
}

module.exports = { createToken }