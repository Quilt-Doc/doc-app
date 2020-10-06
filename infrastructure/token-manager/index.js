require('dotenv').config();

const fs = require('fs');
var jwt = require('jsonwebtoken');


var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;
const Token = require('../models/Token');
const {serializeError, deserializeError} = require('serialize-error');


const password = process.env.EXTERNAL_DB_PASS
const user = process.env.EXTERNAL_DB_USER;
var dbRoute = `mongodb+srv://${user}:${password}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`

const logger = require('./logging/index').logger;
const setupESConnection = require('./logging/index').setupESConnection;

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

    var createdToken;
    try {
        createdToken = await Token.create({installationId: newToken.installationId, value: newToken.value, expireTime: newToken.expireTime, type: newToken.type});
    }
    catch (err) {
        await logger.error({source: 'token-lambda', message: err, errorDescription: `Error creating new 'APP' Token`, function: 'insertNewAppToken'});
        throw err;
    }

    return createdToken;
}

const updateAppToken = async (oldToken) => {
    var newToken = createAppJWTToken();

    oldToken.value = newToken.value;
    oldToken.expireTime = newToken.expireTime;
    
    var updatedAppToken;

    try {
        updatedAppToken = await Token.findOneAndUpdate({ _id: oldToken._id}, {$set: {value: newToken.value, expireTime: newToken.expireTime}});
    }
    catch (err) {
        await logger.error({source: 'token-lambda', message: err, errorDescription: `Error updating 'APP' Token`, function: 'updateAppToken'});
        throw err;
    }
    return updatedAppToken;
}

const createNewInstallToken = async (tokenModel, githubAppClient) => {
    var newTokenResponse;
    try {
        newTokenResponse = await githubAppClient.post(`/app/installations/${tokenModel.installationId}/access_tokens`);
    }
    catch (err) {

        await logger.error({source: 'token-lambda', message: err, errorDescription: `Error getting new 'INSTALL' access token from Github API`, function: 'createNewInstallToken'});
        throw err;
    }

    var newToken = newTokenResponse.data;
    newToken = {installationId: tokenModel.installationId, type: 'INSTALL',
                value: newToken.token, expireTime: Date.parse(newToken.expires_at)};

    return newToken;
}

const getAppToken = async () => {
    var tokenResult;
    try {
        tokenResult = await Token.findOne({'type': 'APP'});
    }
    catch (err) {
        await logger.error({source: 'token-lambda', message: err, errorDescription: `Error fetching 'APP' Token`, function: 'getAppToken'});
        throw err;
    }

    return tokenResult;
}

exports.handler = async (event) => {

    try {
        await setupESConnection();
    }
    catch (err) {
        console.error('Could not establish connection to ES Search');
        const response = {
            statusCode: 500,
            body: {success: false, error: `Error Could not connect to ES Search: ${err}`},
        };
        return response;
    }

    // App Token Section START ------
    var currentTime = new Date().getTime();
    var currentAppToken = undefined;

    var retrievedToken = undefined;

    // Fetch App Token From Mongo
    try {
        retrievedToken = await getAppToken();
    }
    catch (err) {
        await logger.error({source: 'token-lambda', message: err, errorDescription: `Error fetching 'APP' Token`, function: 'handler'});
        const response = {
            statusCode: 500,
            body: {success: false, error: `Error fetching 'APP' Token: ${err}`},
        };
        return response;
    }

    // If app token does not exist.
    if (!retrievedToken) {
        await logger.info({source: 'token-lambda', message: `No 'APP' token found, inserting new one`, function: 'handler'});
        try {
            currentAppToken = await insertNewAppToken();
        }
        catch (err) {
            await logger.error({source: 'token-lambda', message: err, errorDescription: `Error creating new 'APP' Token`, function: 'insertNewAppToken'});
            const response = {
                statusCode: 500,
                body: {success: false, error: `Error creating new 'APP' Token: ${err}`},
            };
            return response;
        }
        await logger.info({source: 'token-lambda', message: `Successfully inserted new 'APP' token`, function: 'handler'});
    }
    else {

        // If app token expiring within 3 minutes
        if ((retrievedToken.expireTime - currentTime) < (60*3*1000)) {

            await logger.info({source: 'token-lambda', message: `Updating 'APP' token expireTime: ${retrievedToken.expireTime}`, function: 'handler'});

            try {
                currentAppToken = await updateAppToken(retrievedToken);
            }
            catch (err) {
                await logger.error({source: 'token-lambda', message: err, errorDescription: `Error updating 'APP' Token`, function: 'updateAppToken'});
                const response = {
                    statusCode: 500,
                    body: {success: false, error: `Error updating 'APP' Token: ${err}`},
                };
                return response;
            }

            await logger.info({source: 'token-lambda', message: `Successfully updated 'APP' token new expireTime: ${currentAppToken.expireTime}`, function: 'handler'});
        }

        // If the app token is valid
        else {
            currentAppToken = retrievedToken;
        }
    }

    // replace newline, carriage-return, etc
    const regex = /\r?\n|\r/g;

    currentAppToken.value = currentAppToken.value.replace(regex, '');
    // App Token Section END ------


    const axios = require('axios');
    var githubAppClient = axios.create({
        baseURL: process.env.GITHUB_API_URL,
        headers: {
            Authorization: "Bearer " + currentAppToken.value,
            Accept: "application/vnd.github.machine-man-preview+json"
          }
    });


    // Create New Install Token Section START ------
    if (event.action) {
        if (event.action == 'createInstallToken') {
            await logger.info({source: 'token-lambda', message: `Creating new 'INSTALL' token for installationId: ${event.installationId}`, function: 'handler'});
            var installationId = event.installationId;
            
            var newInstallToken;
            try {
                newInstallToken = await createNewInstallToken({installationId}, githubAppClient);
            }
            catch (err) {
                await logger.error({source: 'token-lambda', message: err, errorDescription: `Error getting new 'INSTALL' access token from Github API`, function: 'createNewInstallToken'});
                const response = {
                    statusCode: 500,
                    body: {success: false, error: `Error getting new 'INSTALL' access token from Github API`},
                };
                return response;
            }

            newInstallToken.installationId = installationId;
            newInstallToken.type = 'INSTALL';

            var createdInstallToken = newInstallToken;
            
            /*
            var createdInstallToken;

            try {
                createdInstallToken = await Token.create(newInstallToken);
            }
            catch (err) {
                await logger.error({source: 'token-lambda', message: err, errorDescription: `Error creating new 'INSTALL' token in database`, function: 'handler'});
                const response = {
                    statusCode: 500,
                    body: {success: false, error: `Error updating 'APP' Token: ${err}`},
                };
                return response;
            }
            */

            await logger.info({source: 'token-lambda',
                                message: `Successfully created new 'INSTALL' token for installationId: ${createdInstallToken.installationId}`,
                                function: 'handler'});
            const response = {
                statusCode: 200,
                body: {success: true, result: createdInstallToken},
            };
            return response;
        }
    }

    // Create New Install Token Section END ------
 

    // Install Token Update Section START ------

    // Find install tokens whose expiration time is less than 3 minutes from now and which are not being updated currently.
    var installTokens;

    try {
        installTokens = await Token.find({'type': 'INSTALL', 'expireTime': { $lte: (currentTime + (60*3*1000))}});
    }
    catch (err) {
        await logger.error({source: 'token-lambda', message: err, errorDescription: `Error finding 'INSTALL' tokens expiring within 3 minutes`, function: 'handler'});
        const response = {
            statusCode: 500,
            body: {success: false, error: `Error finding 'INSTALL' tokens expiring within 3 minutes`},
        };
        return response;
    }

    if (!installTokens) {
        await logger.info({source: 'token-lambda', message: `Found 0 'INSTALL' tokens to update`, function: 'handler'});
    }
    else if (installTokens.length != 0) {

        await logger.info({source: 'token-lambda', message: `Found ${installTokens.length} 'INSTALL' tokens expiring within 3 minutes`, function: 'handler'});

        var newTokens = installTokens.map(async (tokenModel) => {
            return await createNewInstallToken(tokenModel, githubAppClient);
        });

        // Now `newTokens` should have all of our new tokens
        var results;
        try {
            await logger.info({source: 'token-lambda', message: `Before Promise`, function: 'handler'});
            results = await Promise.all(newTokens);
            await logger.info({source: 'token-lambda', message: `After Promise`, function: 'handler'});
        }
        catch (err) {
            await logger.error({source: 'token-lambda', message: err, errorDescription: `Error getting new 'INSTALL' access token from Github API`, function: 'createNewInstallToken'});
            const response = {
                statusCode: 500,
                body: {success: false, error: `Error getting new 'INSTALL' access token from Github API`},
            };
            return response;
        }

        await logger.info({source: 'token-lambda', message: `results: ${JSON.stringify(results)}`, function: 'handler'});

        const bulkOps = results.map(tokenObj => ({
            updateOne: {
                // Error Here
                filter: { installationId: tokenObj.installationId },
                // Where field is the field you want to update
                update: { $set: { value: tokenObj.value, expireTime: tokenObj.expireTime} },
                upsert: false
            }
        }));

        if (bulkOps.length > 0) {
            try {
                await Token.collection.bulkWrite(bulkOps);
            }
            catch (err){
                await logger.error({source: 'token-lambda', message: err, errorDescription: `Error bulk updating 'INSTALL' tokens`, function: 'handler'});
                const response = {
                    statusCode: 500,
                    body: {success: false, error: `Error bulk updating Install Tokens: ${err}`},
                };
                return response;
            }
            await logger.info({source: 'token-lambda', message: `Successfully updated ${bulkOps.length} 'INSTALL' tokens`, function: 'handler'});
        }
    }
    const response = {
        statusCode: 200,
        body: {success: true, result: `Success`},
    };
    return response;
    // Install Token Update Section END ------
};