const CLIENT_HOME_PAGE_URL = "http://localhost:3000/repository";
const client = require("../../apis/api").requestGithubClient();

const AuthRequest = require('../../models/authentication/AuthRequest');
const User = require('../../models/authentication/User');

const querystring = require('querystring');

const { createUserJWTToken } = require('../../utils/jwt');

var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

const SUPPORTED_PLATFORMS = ['jira'];

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
    console.log("REQ USER: ", req.user)

    console.log('req.user: ');
    console.log(req.user);

    const authHeader = req.headers.authorization;

    // console.log('Cookies: ');
    // console.log(req.cookies);

    // Get token
    var token = undefined;
    if (authHeader) {
        token = authHeader.split(' ')[1];
    }
    else if (req.cookies['user-jwt']) {
        token = req.cookies['user-jwt'];
    }


    else {
        console.log('No JWT provided');
        return res.json({
            success: false,
            authenticated: false,
            user: {}
        })
        /*
        return res.status(401).json({
            authenticated: false,
            message: "user has not been authenticated"
        });
        */
    }
    // console.log('TOKEN: ', token);

    var publicKey = fs.readFileSync('docapp-test-public.pem', 'utf8');
    // console.log('publicKey: ', publicKey);
    try {
        console.log('About to decode JWT');
        var decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        console.log('decoded JWT: ');
        console.log(decoded);
        // req.tokenPayload = decoded;
        var user = await User.findById(decoded.userId);
        return res.json({
            success: true,
            authenticated: true,
            message: "user has successfully authenticated",
            user,
            cookies: req.cookies
        });
    }
    catch(err) {
        console.log('JWT Verify Failed Error: ');
        console.log(err);
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
    let response;
    try {
        response = await client.get("/user/installations",  
        { headers: {
                Authorization: `token ${req.body.accessToken}`,
                Accept: 'application/vnd.github.v3+json'
            }
        })
    } catch (err) {
        return res.json({error: "checkInstallation Error: github api response failed", trace: err, success: false})
    }
    //console.log("RESPONSE", response.data);
    return res.json({success: true, result: response.data.installations})
}


startJiraAuthRequest = async (req, res) => {
    console.log('startJiraAuthRequest');
    let {userId, workspaceId, requestUUID, platform} = req.query;
    if (!checkValid(userId)) return res.json({success: false, error: "startJiraAuthRequest error: no userId provided.", result: null});
    if (!checkValid(workspaceId)) return res.json({success: false, error: "startJiraAuthRequest error: no workspaceId provided.", result: null});
    if (!checkValid(requestUUID)) return res.json({success: false, error: "startJiraAuthRequest error: no requestUUID provided.", result: null});
    if (!checkValid(platform)) return res.json({success: false, error: "startJiraAuthRequest error: no platform provided.", result: null});

    let authRequest = new AuthRequest(
        {
            user: ObjectId(userId),
            workspace: ObjectId(workspaceId),
            requestUUID: requestUUID,
            platform: platform,
            state: 'Init'
        },
    );


    authRequest.save(async (err, authRequest) => {
        if (err) return res.json({ success: false, error: err, result: null });
        console.log('startJiraAuthRequest: created AuthRequest');

        authRequest.populate('user').populate('workspace', (err, authRequest) => {
            if (err) return res.json({ success: false, error: err, result: authRequest });
            
            /*
                https://auth.atlassian.com/authorize?
                audience=api.atlassian.com&
                client_id=WQX1e28I3nhk8p8gLSrRkE0dxKIKGeWY&
                scope=read%3Ajira-user&
                redirect_uri=https%3A%2F%2Fgoogle.com&
                state=${YOUR_USER_BOUND_VALUE}&
                response_type=code&
                prompt=consent
            */
            /*
            https://auth.atlassian.com/authorize?
            audience=api.atlassian.com&
            client_id=WQX1e28I3nhk8p8gLSrRkE0dxKIKGeWY&
            scope=read%3Ajira-user&
            redirect_uri=https%3A%2F%2Fgoogle.com&
            state=${YOUR_USER_BOUND_VALUE}&
            response_type=code&
            prompt=consent
            */
            const query = querystring.stringify({
                "audience": "api.atlassian.com",
                "client_id": "WQX1e28I3nhk8p8gLSrRkE0dxKIKGeWY",
                "scope":"read:jira-user",
                "redirect_uri": "https://google.com",
                "state": requestUUID,
                "response_type": "code",
                "prompt": "consent",
            });
            console.log('startJiraAuthRequest redirecting to: ', 'https://auth.atlassian.com/authorize/?' + query);
            return res.redirect('https://auth.atlassian.com/authorize/?' + query);
            //return res.json({success: true, result: {obj: authRequest, url: `https://auth.atlassian.com/authorize/?${query}`}});
        });
    });
}




retrieveDomainRepositories = async (req, res) => {
    const response = await client.get("/user/repos",  
    { headers: {
            Authorization: `token ${req.body.accessToken}`,
            Accept: 'application/vnd.github.machine-man-preview+json'
        }
    })
    filteredResponse = response.data.filter(item => item.permissions.admin === true)
    return res.json(filteredResponse)
}

module.exports = {
    loginSuccess, loginFailed, logout, checkInstallation, retrieveDomainRepositories, startJiraAuthRequest
}