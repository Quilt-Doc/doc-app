var jwt = require('jsonwebtoken');

const Token = require('../models/Token');


const requestClient = () => {
    const axios = require('axios');
    return axios.create({
        baseURL: "https://api.github.com",
        headers: {
            post: {        // can be common or any other method
                Authorization: 'token ' + process.env.OAUTH_TOKEN
            },
            get: {        // can be common or any other method
                Authorization: 'token ' + process.env.OAUTH_TOKEN
              }
          }
    });
}

const requestSQSServiceObject = () => {
    // Load the AWS SDK for Node.js
    var AWS = require('aws-sdk');
    // Set the region 
    AWS.config.update({region: 'us-east-1'});

    // Create an SQS service object
    var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

    /*var params = {
      QueueName: 'dataUpdate.fifo'
    };

    sqs.getQueueUrl(params, function(err, data) {
        if (err) {
            console.log("Error", err);
        } else {
            console.log("Success", data.QueueUrl);
        }
    });*/
    return sqs;
}


createJWTToken = () => {
    
    const now = new Date().getTime();
    //Get timestamp in seconds
    const timeNow = Math.round(now / 1000);

    const expirationTime = timeNow + (10 * 60);

    // Generate the JWT
    var payload = {
      // issued at time
      iat: timeNow,
      // JWT expiration time (10 minute maximum)
      exp: expirationTime,
      // GitHub App's identifier
      iss: process.env.GITHUB_APP_ID
    }

    var private_key = fs.readFileSync(process.env.GITHUB_APP_PRIVATE_KEY_FILE, 'utf8');
    
    var newToken = {
        token: jwt.sign(payload, private_key, { algorithm: 'RS256' }),
        expireTime: expirationTime,
    }

    return newToken;

}

// Modify 
const requestAppToken = () => {
    
    var currentTime = new Date().getTime();
    curentTime = Math.round(now  / 1000);

    var token = undefined;
    
    Token.findOne({'type': 'APP'}, function (err, foundToken) {
        if (err) {
            console.log('Error finding app access token: ');
            console.log(err);
            return {};
        }
        token = foundToken;
    });

    console.log('Token found is: ');
    console.log(token);

    if (typeof token == 'undefined') {
        token = createJWTToken();
        token.installationId = -1;
        token.type = 'APP';
        token.status = 'RESOLVED';
        token.save()
        token.save((err, savedToken) => {
            if (err) {
                console.log('Error Saving new app token: ');
                console.log(err);
                return {};
            } 
        });
        return token;
        // If token has less than two minutes of life left.
    }
    else {
       return token;
    }
}

const requestNewInstallationToken = async (appToken, installationId) => {

    /*
    curl -i \
        -H "Authorization: token YOUR_INSTALLATION_ACCESS_TOKEN" \
        -H "Accept: application/vnd.github.machine-man-preview+json" \
        https://api.github.com/installation/repositories
    */
    const axios = require('axios');
    var installationApi = axios.create({
        baseURL: "https://api.github.com/installations/",
    });
    
    let config = {
        headers: {
          Authorization: "Bearer " + appToken,
          Accept: "application/vnd.github.machine-man-preview+json"
        }
    }

    var currentTime = new Date().getTime();


    installationApi.post(installationId + "/access_tokens", config)
    .then((response) => {
        var newToken = response.data;
        newToken = {token: newToken.token, expireTime: Date.parse(newToken.expires_at)}
        return newToken;
    })
    .catch((error) => {
        console.log('Error: ', error);
        return {};
    });
}

const requestInstallationToken = async (appToken, installationId) => {

    /*
    curl -i \
        -H "Authorization: token YOUR_INSTALLATION_ACCESS_TOKEN" \
        -H "Accept: application/vnd.github.machine-man-preview+json" \
        https://api.github.com/installation/repositories
    */
    const axios = require('axios');
    var installationApi = axios.create({
        baseURL: "https://api.github.com/installations/",
    });
    
    let config = {
        headers: {
          Authorization: "Bearer " + appToken,
          Accept: "application/vnd.github.machine-man-preview+json"
        }
    }

    var currentTime = new Date().getTime();

    var retrievedToken = undefined;

    Token.findOne({ installationId }, function (err, token) {
        if (err) {
            console.log('Error searching for install token: ');
            console.log(err);
        }
        retrievedToken = token;
    });

    if (retrievedToken == 'undefined') {
        return await requestNewInstallationToken(appToken, installationId);
    }

    else {
        retrievedToken.installationId = installationId;
        retrievedToken.type = 'INSTALL';
        retrievedToken.status = 'RESOLVED';
        return retrievedToken;
    }

}

const requestInstallationClient = async (installationId) => {
    const axios = require('axios');
    var appToken = requestAppToken();
    var installationToken = await requestInstallationToken(appToken, installationId);
    var installationApi = axios.create({
        baseURL: "https://api.github.com/",
        headers: {
            post: {        // can be common or any other method
                Authorization: 'token ' + installationToken
            },
            get: {
                Authorization: 'token ' + installationToken
            }
          }
    });
    return installationApi;
}

module.exports = {
    requestClient,
    requestSQSServiceObject,
    requestAppToken,
    requestInstallationToken,
    requestInstallationClient
}