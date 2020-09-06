require('dotenv').config();

const fs = require('fs');
var jwt = require('jsonwebtoken');


var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;
const Token = require('./models/Token');

const password = process.env.EXTERNAL_DB_PASS
const user = process.env.EXTERNAL_DB_USER;
var dbRoute = `mongodb+srv://${user}:${password}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`

console.log(process.env.USE_EXTERNAL_DB);

if (process.env.USE_EXTERNAL_DB == 0) {
    dbRoute = 'mongodb://127.0.0.1:27017?retryWrites=true&w=majority'
    console.log('Running')
}
console.log(dbRoute);


//mongoose.connect('mongodb://localhost:27017/myDatabase');
mongoose.connect(dbRoute, { useNewUrlParser: true });

let db = mongoose.connection;

db.once('open', () => console.log('connected to the database'));
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

createAppJWTToken = () => {
    
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
        value: jwt.sign(payload, private_key, { algorithm: 'RS256' }),
        // put back into milliseconds
        expireTime: expirationTime * 1000,
    }

    return newToken;

}

const insertNewAppToken = async () => {
    var newToken = createAppJWTToken();
    newToken.installationId = -1;
    newToken.type = 'APP';

    return await Token.create({installationId: newToken.installationId, value: newToken.value, expireTime: newToken.expireTime, type: newToken.type});
}

const updateAppToken = async (oldToken) => {
    console.log('updateAppToken received: ');
    console.log(oldToken);
    var newToken = createAppJWTToken();

    oldToken.value = newToken.value;
    oldToken.expireTime = newToken.expireTime;
    console.log('save() in updateAppToken()');
    return await Token.findOneAndUpdate({ _id: oldToken._id}, {$set: {value: newToken.value, expireTime: newToken.expireTime}});

}

const createNewInstallToken = async (tokenModel, installationApi) => {
    const newTokenResponse = await installationApi.post(tokenModel.installationId + "/access_tokens");
    var newToken = newTokenResponse.data;
    newToken = {installationId: tokenModel.installationId, type: 'INSTALL',
                value: newToken.token, expireTime: Date.parse(newToken.expires_at)};

    return newToken;
}

const getAppToken = async () => {
    return await Token.findOne({'type': 'APP'});
}

exports.handler = async (event) => {

    var appTokenAction = '';
    
    // App Token Section START ------
    var retrievedToken = undefined;
    var currentTime = new Date().getTime();
    // curentTime = Math.round(currentTime  / 1000);

    var currentAppToken = undefined;

    retrievedToken = await getAppToken();

    // If app token does not exist.
    if (!retrievedToken) {
        console.log('Inserting new app token')
        currentAppToken = await insertNewAppToken();
        appTokenAction = 'INSERT';
    }
    else {

        // If app token expiring within 3 minutes
        if ((retrievedToken.expireTime - currentTime) < (60*3*1000)) {
            console.log('Updating app token');
            currentAppToken = await updateAppToken(retrievedToken);
            appTokenAction = 'REFRESH';
        }

        // If the app token is valid
        else {
            console.log('Did nothing, setting appToken back to valid')
            currentAppToken = retrievedToken;
            appTokenAction = 'NOTHING';
        }
    }

    // replace newline, carriage-return, etc
    const regex = /\r?\n|\r/g;

    currentAppToken.value = currentAppToken.value.replace(regex, '');
    // App Token Section END ------

    const axios = require('axios');
    var installationApi = axios.create({
        baseURL: "https://api.github.com/installations/",
        headers: {
            Authorization: "Bearer " + currentAppToken.value,
            Accept: "application/vnd.github.machine-man-preview+json"
          }
    });


    // Create New Install Token Section START ------
    if (event.action) {
        if (event.action == 'createInstallToken') {
            console.log('Creating new install token');
            var installationId = event.installationId;
            
            var newInstallToken = await createNewInstallToken({installationId}, installationApi);

            newInstallToken.installationId = installationId;
            newInstallToken.type = 'INSTALL';
            
            var createdInstallToken = await Token.create(newInstallToken);
            const response = {
                statusCode: 200,
                body: JSON.stringify({success: true, result: createdInstallToken}),
            };
            return response;
        }
    }

    // Create New Install Token Section END ------
 

    // Install Token Update Section START ------
    var numInstallTokensUpdated = 0;
    // Find install tokens whose expiration time is less than 3 minutes from now and which are not being updated currently.
    var installTokens = await Token.find({'type': 'INSTALL', 'expireTime': { $lte: (currentTime + (60*3*1000))}});
    if (!installTokens) {

    }
    else if (installTokens.length != 0) {
        console.log('installTokens: ');
        console.log(installTokens);
        var newTokens = installTokens.map(async (tokenModel) => {
            return await createNewInstallToken(tokenModel, installationApi);
        });

        // Now `newTokens` should have all of our new tokens
        const results = await Promise.all(newTokens);

        const bulkOps = results.map(tokenObj => ({
            updateOne: {
                // Error Here
                filter: { installationId: tokenObj.installationId },
                // Where field is the field you want to update
                update: { $set: { value: tokenObj.value, expireTime: tokenObj.expireTime} },
                upsert: true
            }
        }));

        if (bulkOps.length > 0) {
            console.log('Bulk writing tokens');
            try {
                await Token.collection.bulkWrite(bulkOps);
                numInstallTokensUpdated = bulkOps.length;
            }
            catch (err){
                const response = {
                    statusCode: 500,
                    body: JSON.stringify({success: false, error: `Error bulk updating Install Tokens: ${err}`}),
                };
                return response;
            }
        }
        console.log("Finished.");
    }
    const response = {
        statusCode: 200,
        body: JSON.stringify({success: true, message: `App Token Action: ${appTokenAction}. ${numInstallTokensUpdated} Install Tokens updated.`}),
    };
    return response;
    // Install Token Update Section END ------
};