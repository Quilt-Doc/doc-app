var jwt = require('jsonwebtoken');


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

const requestAppToken = () => {
    
    var currentTime = new Date().getTime();
    curentTime = Math.round(now  / 1000);

    var token = undefined;

    if (typeof requestAppToken.currentToken == 'undefined') {
        requestAppToken.currentToken = createJWTToken();
        // If token has less than two minutes of life left.
    }
    else {
        // If token has less than two minutes of life left.
        if ((requestAppToken.expireTime - currentTime) < (60*2)) {
            requestAppToken.currentToken = createJWTToken();
        }
    }

    return requestAppToken.currentToken.token;
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

    
    if (typeof requestInstallationToken.tokens == 'undefined') {
        requestInstallationToken.tokens = {};
    }


    if (!installationId in requestInstallationToken.tokens) {
        installationApi.post(installationId + "/access_tokens", config)
        .then((response) => {
            var newToken = response.data;
            requestInstallationToken.tokens[installationId] = {token: newToken.token, expireTime: Date.parse(newToken.expires_at)}
            return requestInstallationToken.tokens[installationId].token;
        })
        .catch((error) => {
            console.log('Error: ', error);
            return;
        });
    }

    else {
        // If less than two minutes left in token life
        if((requestInstallationToken.tokens[installationId].expireTime - currentTime) < (60*2*1000)) {
            installationApi.post(installationId + "/access_tokens", config)
            .then((response) => {
                var newToken = response.data;
                requestInstallationToken.tokens[installationId] = {token: newToken.token, expireTime: Date.parse(newToken.expires_at)}
                return requestInstallationToken.tokens[installationId].token;
            })
            .catch((error) => {
                console.log('Error: ', error);
                return;
            });
        }
        // If token previously existed and has not expired
        else {
            return requestInstallationToken.tokens[installationId].token;
        }
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
    requestInstallationToken
}