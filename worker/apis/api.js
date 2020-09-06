var jwtUtils = require('../utils/jwt');
const Token = require('../models/Token');
const fs = require('fs');



const requestBackendClient = () => {
    const axios = require('axios');
    return axios.create({
        baseURL: "http://54.160.81.133:3001/api"
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

// Modify 
const requestAppToken = async () => {
    
    var currentTime = new Date().getTime();
    curentTime = Math.round(currentTime  / 1000);

    var token = undefined;
    
    return await Token.findOne({'type': 'APP'})
    .then((foundToken) => {
        token = foundToken;
        console.log('Token found is: ');
        console.log(token);

        if (!token) {
            console.log('Creating new token');
            token = jwtUtils.createAppJWTToken();
            console.log('Trying to save token: ', token);
            token.installationId = -1;
            token.type = 'APP';
            token.status = 'RESOLVED';
            console.log('Trying to save token: ', token);
            tokenToSave = new Token(token);
            tokenToSave.save((err, savedToken) => {
                if (err) {
                    console.log('Error Saving new app token: ');
                    console.log(err);
                    return {};
                }
                console.log('Success | Saved new app token');
            });
            return token;
            // If token has less than two minutes of life left.
        }
        else {
            console.log('Returning retrieved token');
            return token;
        }
    })
    .catch((err) => {
        console.log("Error finding app access token: ");
        console.log(err);
        return undefined;
    });
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

    // replace newlin, carriage-return, etc
    const regex = /\r?\n|\r/g;

    appToken.value = appToken.value.replace(regex, '');

    let config = {
        headers: {
          Authorization: "Bearer " + appToken.value,
          Accept: "application/vnd.github.machine-man-preview+json"
        }
    }

    var currentTime = new Date().getTime();


    return await installationApi.post(installationId + "/access_tokens", {}, config)
    .then((response) => {
        console.log('ACCESS_TOKENS RESPONSE: ');
        console.log(response);
        var newToken = response.data;
        newToken = {value: newToken.token, expireTime: Date.parse(newToken.expires_at)}

        newToken.installationId = installationId;
        newToken.type = 'INSTALL';
        newToken.status = 'RESOLVED';
        
        tokenToSave = new Token(newToken);
        tokenToSave.save((err, savedToken) => {
            if (err) {
                console.log('Error Saving new install token: ');
                console.log(err);
                return {};
            }
            console.log('Success | Saved new installation token');
        });

        return newToken;
    })
    .catch((error) => {
        console.log('Error fetching new installation access token: ', error);
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
    console.log('requestInstallationToken received appToken: ');
    console.log(appToken);

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

    return await Token.findOne({ installationId })
    .then(async (token) => {
        retrievedToken = token;
        console.log('requestInstallationToken retrievedToken: ');
        console.log(retrievedToken);

        if (!retrievedToken) {
            console.log('Requesting new installation token');
            return await requestNewInstallationToken(appToken, installationId);
        }

        else {
            console.log('Returning retrieved installation token');
            retrievedToken.installationId = installationId;
            retrievedToken.type = 'INSTALL';
            retrievedToken.status = 'RESOLVED';
            return retrievedToken;
        }
    })
    .catch(err => {
       if (err) {
            console.log('Error searching for install token: ');
            console.log(err);
        } 
    });

}

const requestInstallationClient = async (installationId) => {
    const axios = require('axios');

    var appToken = await requestAppToken();
    console.log('Received App Token');
    console.log(appToken);
    var installationToken = await requestInstallationToken(appToken, installationId);
    console.log('Received Installation Token');
    console.log(installationToken);

    var installationApi = axios.create({
        baseURL: "https://api.github.com/",
        headers: {
            post: {        // can be common or any other method
                Authorization: 'token ' + installationToken.value
            },
            get: {
                Authorization: 'token ' + installationToken.value
            }
          }
    });
    return installationApi;
}

module.exports = {
    
    requestSQSServiceObject,
    requestBackendClient,

    requestAppToken,
    requestInstallationToken,
    requestInstallationClient
}
