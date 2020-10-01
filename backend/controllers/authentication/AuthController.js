const CLIENT_HOME_PAGE_URL = "http://localhost:3000/repository";
const client = require("../../apis/api").requestGithubClient();

const User = require('../../models/authentication/User');

const querystring = require('querystring');

const { createUserJWTToken } = require('../../utils/jwt');

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const logger = require('../../logging/index').logger;

const fs = require('fs');
var jwt = require('jsonwebtoken');


checkValid = (item) => {
    if (item !== undefined && item !== null) {
        return true
    }
    return false
}
// TODO: Change just to validate JWT
loginSuccess = async (req, res) => {

    const authHeader = req.headers.authorization;

    // Get token
    var token = undefined;
    if (authHeader) {
        token = authHeader.split(' ')[1];
    }
    else if (req.cookies['user-jwt']) {
        token = req.cookies['user-jwt'];
    }


    else {
        return res.json({
            success: false,
            authenticated: false,
            user: {}
        })
    }

    var publicKey = fs.readFileSync('docapp-test-public.pem', 'utf8');
    try {
        var decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });

        var user = await User.findById(decoded.userId);

        await logger.info({source: 'backend-api', message: `User ${decoded.userId} successfully authenticated.`, function: 'loginSuccess'});

        return res.json({
            success: true,
            authenticated: true,
            message: "user has successfully authenticated",
            user,
            cookies: req.cookies
        });
    }
    catch(err) {
        await logger.error({source: 'backend-api', message: err, errorDescription: `Error authenticating User`,
                             function: 'loginSuccess'});
        return res.status(403);
    }
    
    
    
    /*
    // Apparently standard practice is to run a new JWT on every sign-in
    // If they don't have a JWT yet, let's make one for them
    if (!req.cookies['user-jwt']) {
        
    }
    */
    
    // Check if req.user is an actual user, normally we would be using username/password to authenticate req.user
    // Since we don't have this, this is the current stopgap
    
    /*
    var requestUser = await User.findOne({ _id: req.user._id, domain: req.user.domain, username: req.user.username, profileId: req.user.profileId });
    if (requestUser) {
        var jwtToken = createUserJWTToken(req.user._id, req.user.role);

        res.cookie('user-jwt', jwtToken, { httpOnly: true });

        // req.cookies['token'] = {"user-jwt": jwtToken};
        return res.json({
            success: true,
            authenticated: true,
            message: "user has successfully authenticated",
            user: req.user,
            cookies: req.cookies
        });
    }
    return res.json({
        success: false,
        authenticated: false,
        user: {}
    })
    */
}

loginFailed = (req, res) => {
    return res.status(401).json({
        success: false,
        message: "user failed to authenticate."
    });
}

logout = (req, res) => {
    req.logout()
    res.redirect(CLIENT_HOME_PAGE_URL);
}

checkInstallation = async (req, res) => {
    var installationResponse;
    try {
        installationResponse = await client.get("/user/installations",  
            { headers: {
                    Authorization: `token ${req.body.accessToken}`,
                    Accept: 'application/vnd.github.machine-man-preview+json'
                }
            });
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error fetching installation - userId: ${req.tokenPayload.userId}`, function: 'checkInstallation'});
        return res.json({success: false, error: err});
    }
    // KARAN TODO: Format this result properly
    return res.json(response.data.installations);
}



retrieveDomainRepositories = async (req, res) => {
    var userRepositoriesResponse;
    try {
        userRepositoriesResponse = await client.get("/user/repos",  
        { headers: {
                Authorization: `token ${req.body.accessToken}`,
                Accept: 'application/vnd.github.machine-man-preview+json'
            }
        })
    }
    catch (err) {
        await logger.error({source: 'backend-api', message: err,
                            errorDescription: `Error Retrieving Repositories - userId: ${req.tokenPayload.userId}`, function: 'retrieveDomainRepositories'});
        return res.json({success: false, error: err});
    }

    filteredResponse = userRepositoriesResponse.data.filter(item => item.permissions.admin === true);
    // KARAN TODO: Format this result properly
    return res.json(filteredResponse)
}

module.exports = {
    loginSuccess, loginFailed, logout, checkInstallation, retrieveDomainRepositories
}