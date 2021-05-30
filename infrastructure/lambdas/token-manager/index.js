require("dotenv").config();

const fs = require("fs");
var jwt = require("jsonwebtoken");

const axios = require("axios");
const queryString = require("query-string");


const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const Token = require("./models/Token");
const GithubAuthProfile = require("./models/authentication/GithubAuthProfile");


const password = process.env.EXTERNAL_DB_PASS;
const user = process.env.EXTERNAL_DB_USER;
var dbRoute = `mongodb+srv://${user}:${password}@docapp-cluster-hnftq.mongodb.net/test?retryWrites=true&w=majority`;

const logger = require("./logging/index").logger;

const Sentry = require("@sentry/serverless");

mongoose.connect(dbRoute, { useNewUrlParser: true });

let db = mongoose.connection;

db.once("open", () => console.log("connected to the database"));
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const refreshGithubTokens = async () => {

    const func = "refreshGithubTokens";

    // Refresh tokens if they are expiring less than one hour from now
    var currentMillis = new Date().getTime();
    var expiringAuthProfiles;
    try {
        expiringAuthProfiles = await GithubAuthProfile.find({ status: "valid", 
            $or: [{ accessTokenExpireTime: { $lte: (currentMillis + (60*60*1000))} },
                { refreshTokenExpireTime: { $lte: (currentMillis + (60*60*1000))} }],
        }).lean().exec();
    } catch (err) {

        logger.error("Error GithubAuthProfile find valid tokens expiring in less than an hour failed", {
            func,
            e: err,
        });

        Sentry.setContext("token-lambda", {
            message: "Error GithubAuthProfile find valid tokens expiring in less than an hour failed",
        });

        Sentry.captureException(err);

        throw err;
    }
    
    // Return if no GithubAuthProfiles found
    if (expiringAuthProfiles.length < 1) {
        return;
    }

    // Match refresh tokens to their users, useful later
    var refreshTokenOwnerLookup = {};

    expiringAuthProfiles.map(authProfileObj => {
        refreshTokenOwnerLookup[authProfileObj.refreshToken] = authProfileObj.user.toString();
    });

    var refreshTokenList = expiringAuthProfiles.map(authProfileObj => {
        return authProfileObj.refreshToken;
    });

    var refreshTokenDataList = refreshTokenList.map(token => ({
        refresh_token: token,
        grant_type: "refresh_token",
        client_id:  process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
    }));

    var requestList = refreshTokenDataList.map(async (dataObj) => {
        var response;
        var userId = refreshTokenOwnerLookup[dataObj.refresh_token];
        try {
            response = await axios.post("https://github.com/login/oauth/access_token", dataObj);
        } catch (err) {
            console.log(err);
            return {error: "Error", userId};
        }
        var parsed = queryString.parse(response.data);
        parsed.userId = userId;
        return parsed;
    });

    // Execute all requests
    var results;
    try {
        results = await Promise.allSettled(requestList);
    } catch (err) {

        logger.error(`Error Promise.allSettled refreshing ${refreshTokenDataList.length} Github tokens`, {
            func,
            e: err,
        });

        Sentry.setContext("token-lambda", {
            message: `Error Promise.allSettled refreshing ${refreshTokenDataList.length} Github tokens`,
        });

        Sentry.captureException(err);

        throw err;
    }

    // We will update GithubAuthProfiles for successful calls
    // Invalidate for unsuccessful calls

    logger.info("Results: ", {func, obj: results});

    // Non-error responses
    var validResults = results.filter(resultObj => resultObj.value && !resultObj.value.error);

    // Error responses
    var invalidResults = results.filter(resultObj => resultObj.value && resultObj.value.error);


    /*
    accessToken: {type: String, required: true},
    accessTokenExpireTime: {type: Number, required: true},

    refreshToken: {type: String, required: true},
    refreshTokenExpireTime: {type: Number, required: true}, 
    */
    // NOTE: GITHUB TIMES ARE IN SECONDS NOT MILLISECONDS
    const bulkAuthProfileUpdateOps = validResults.map((queryObj) => {
        return ({
            updateOne: {
                filter: { user: ObjectId(queryObj.value.userId), status: "valid" },
                // Where field is the field you want to update
                update: { $set: { accessToken: queryObj.value.access_token,
                    accessTokenExpireTime: 
                        (currentMillis + (parseInt(queryObj.value.expires_in, 10)*1000)),
                    refreshToken: queryObj.value.refresh_token,
                    refreshTokenExpireTime: 
                        (currentMillis +
                            (parseInt(queryObj.value.refresh_token_expires_in, 10)*1000)
                        ),
                } },
                upsert: false,
            },
        });
    });

    if (bulkAuthProfileUpdateOps.length > 0) {
        try {
            await GithubAuthProfile.bulkWrite(bulkAuthProfileUpdateOps);
        } catch (err) {

            logger.error("Error GithubAuthProfile bulkAuthProfileUpdateOps failed", {
                func,
                e: err,
            });
    
            Sentry.setContext("token-lambda", {
                message: "Error GithubAuthProfile bulkAuthProfileUpdateOps failed",
            });
    
            Sentry.captureException(err);
    
            throw err;
        }
    }



    const bulkAuthProfileInvalidateOps = invalidResults.map((queryObj) => {
        return ({
            updateOne: {
                filter: { user: ObjectId(queryObj.value.userId), status: "valid" },
                // Where field is the field you want to update
                update: { $set: { status: "invalid" } },
                upsert: false,
            },
        });
    });

    logger.info("bulkAuthProfileInvalidateOps: ", {func, obj: bulkAuthProfileInvalidateOps});

    if (bulkAuthProfileInvalidateOps.length > 0) {
        try {
            await GithubAuthProfile.bulkWrite(bulkAuthProfileInvalidateOps);
        } catch (err) {


            logger.error("Error GithubAuthProfile bulkAuthProfileInvalidateOps failed", {
                func,
                e: err,
            });
    
            Sentry.setContext("token-lambda", {
                message: "Error GithubAuthProfile bulkAuthProfileInvalidateOps failed",
            });
    
            Sentry.captureException(err);
    
            throw err;
        }
    }


    logger.info(`refreshGithubTokens: ${validResults.length} Github tokens refreshed, ${invalidResults.length} tokens invalidated.`,
        { func });
    return true;

};

const createAppJWTToken = () => {
    
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
        iss: process.env.GITHUB_APP_ID,
    };

    var private_key = fs.readFileSync(process.env.GITHUB_APP_PRIVATE_KEY_FILE, "utf8");
    
    var newToken = {
        value: jwt.sign(payload, private_key, { algorithm: "RS256" }),
        // put back into milliseconds
        expireTime: expirationTime * 1000,
    };

    return newToken;
};

const insertNewAppToken = async () => {

    const func = "insertNewAppToken";

    var newToken = createAppJWTToken();
    newToken.installationId = -1;
    newToken.type = "APP";

    var createdToken;
    try {
        createdToken = await Token.create({installationId: newToken.installationId,
            value: newToken.value, 
            expireTime: newToken.expireTime, 
            type: newToken.type});
    } catch (err) {

        logger.error("Error creating new 'APP' Token", {
            func,
            e: err,
        });

        Sentry.setContext("token-lambda", {
            message: "Error creating new 'APP' Token",
        });

        Sentry.captureException(err);

        throw err;
    }

    return createdToken;
};

const updateAppToken = async (oldToken) => {

    const func = "updateAppToken";

    var newToken = createAppJWTToken();

    oldToken.value = newToken.value;
    oldToken.expireTime = newToken.expireTime;
    
    var updatedAppToken;

    try {
        updatedAppToken = await Token.findOneAndUpdate({ _id: oldToken._id}, 
            {$set: {value: newToken.value, expireTime: newToken.expireTime}});
    } catch (err) {

        logger.error("Error updating 'APP' Token", {
            func,
            e: err,
        });

        Sentry.setContext("token-lambda", {
            message: "Error updating 'APP' Token",
        });

        Sentry.captureException(err);

        throw err;
    }
    return updatedAppToken;
};

const createNewInstallToken = async (tokenModel, githubAppClient) => {

    const func = "createNewInstallToken";

    var newTokenResponse;
    try {
        newTokenResponse = await githubAppClient.post(`/app/installations/${tokenModel.installationId}/access_tokens`);
    } catch (err) {

        logger.error("Error getting new 'INSTALL' access token from Github API", {
            func,
            e: err,
        });

        Sentry.setContext("token-lambda", {
            message: "Error getting new 'INSTALL' access token from Github API",
        });

        Sentry.captureException(err);

        throw err;
    }

    var newToken = newTokenResponse.data;
    newToken = {installationId: tokenModel.installationId, type: "INSTALL",
        value: newToken.token, expireTime: Date.parse(newToken.expires_at)};

    return newToken;
};

const getAppToken = async () => {

    const func = "getAppToken";

    var tokenResult;
    try {
        tokenResult = await Token.findOne({"type": "APP"});
    } catch (err) {
        logger.error("Error fetching 'APP' Token", {
            func,
            e: err,
        });

        Sentry.setContext("token-lambda", {
            message: "Error fetching 'APP' Token",
        });

        Sentry.captureException(err);

        throw err;
    }

    return tokenResult;
};

exports.handler = async (event) => {

    const func = "handler";

    Sentry.init({
        dsn: process.env.SENTRY_DSN,

        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        tracesSampleRate: 1.0,
    });

    const response = {
        statusCode: 200,
        body: {success: true, result: "Success"},
    };

    // App Token Section START ------
    var currentTime = new Date().getTime();
    var currentAppToken = undefined;

    var retrievedToken = undefined;

    // Fetch App Token From Mongo
    try {
        retrievedToken = await getAppToken();
    } catch (err) {

        logger.error("Error fetching 'APP' Token", {
            func,
            e: err,
        });

        Sentry.setContext("token-lambda", {
            message: "Error fetching 'APP' Token",
        });

        Sentry.captureException(err);

        return response;
    }

    // If app token does not exist.
    if (!retrievedToken) {
        logger.info("No 'APP' token found, inserting new one", { func });
        try {
            currentAppToken = await insertNewAppToken();
        } catch (err) {

            logger.error("Error creating new 'APP' Token", {
                func,
                e: err,
            });
    
            Sentry.setContext("token-lambda", {
                message: "Error creating new 'APP' Token",
            });
    
            Sentry.captureException(err);
    
            return response;
        }
        logger.info("Successfully inserted new 'APP' token", { func });
    } else {

        // If app token expiring within 3 minutes
        if ((retrievedToken.expireTime - currentTime) < (60*3*1000)) {

            logger.info(`Updating 'APP' token expireTime: ${retrievedToken.expireTime}`, { func });

            try {
                currentAppToken = await updateAppToken(retrievedToken);
            } catch (err) {

                logger.error("Error updating 'APP' Token", {
                    func,
                    e: err,
                });
        
                Sentry.setContext("token-lambda", {
                    message: "Error updating 'APP' Token",
                });
        
                Sentry.captureException(err);
        
                return response;
            }

            logger.info(`Successfully updated 'APP' token new expireTime: ${currentAppToken.expireTime}`, { func });
        } else {
            // If the app token is valid
            currentAppToken = retrievedToken;
        }
    }

    // replace newline, carriage-return, etc
    const regex = /\r?\n|\r/g;

    currentAppToken.value = currentAppToken.value.replace(regex, "");
    // App Token Section END ------


    // Github Token Refresh Section START ------
    try {
        await refreshGithubTokens();
    } catch (err) {

        logger.error("Error refreshing Github tokens", {
            func,
            e: err,
        });

        Sentry.setContext("token-lambda", {
            message: "Error refreshing Github tokens",
        });

        Sentry.captureException(err);

        return response;
    }
    // Github Token Refresh Section END ------


    var githubAppClient = axios.create({
        baseURL: process.env.GITHUB_API_URL,
        headers: {
            Authorization: "Bearer " + currentAppToken.value,
            Accept: "application/vnd.github.machine-man-preview+json",
        },
    });


    // Create New Install Token Section START ------
    if (event.action) {
        if (event.action == "createInstallToken") {
            logger.info(`Creating new 'INSTALL' token for installationId: ${event.installationId}`, { func });
            var installationId = event.installationId;
            
            var newInstallToken;
            try {
                newInstallToken = await createNewInstallToken({installationId}, githubAppClient);
            } catch (err) {

                logger.error("Error getting new 'INSTALL' access token from Github API", {
                    func,
                    e: err,
                });
        
                Sentry.setContext("token-lambda", {
                    message: "Error getting new 'INSTALL' access token from Github API",
                });
        
                Sentry.captureException(err);
        
                return response;
            }

            newInstallToken.installationId = installationId;
            newInstallToken.type = "INSTALL";

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

            logger.info(`Successfully created new 'INSTALL' token for installationId: ${createdInstallToken.installationId}`, { func });
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
        installTokens = await Token.find({"type": "INSTALL", "expireTime": { $lte: (currentTime + (60*3*1000))}});
    } catch (err) {

        logger.error("Error finding 'INSTALL' tokens expiring within 3 minutes", {
            func,
            e: err,
        });

        Sentry.setContext("token-lambda", {
            message: "Error finding 'INSTALL' tokens expiring within 3 minutes",
        });

        Sentry.captureException(err);

        return response;

    }

    if (!installTokens) logger.info("Found 0 'INSTALL' tokens to update", { func });
    else if (installTokens.length != 0) {

        logger.info(`Found ${installTokens.length} 'INSTALL' tokens expiring within 3 minutes`, { func });

        var newTokens = installTokens.map(async (tokenModel) => {
            return await createNewInstallToken(tokenModel, githubAppClient);
        });

        // Now `newTokens` should have all of our new tokens
        var results;
        try {
            logger.info("Before Promise", { func });
            results = await Promise.all(newTokens);
            logger.info("After Promise", { func });
        } catch (err) {

            logger.error("Error getting new 'INSTALL' access token from Github API", {
                func,
                e: err,
            });
    
            Sentry.setContext("token-lambda", {
                message: "Error getting new 'INSTALL' access token from Github API",
            });
    
            Sentry.captureException(err);
    
            return response;
        }

        logger.info("results: ", { func, obj: results });

        const bulkOps = results.map(tokenObj => ({
            updateOne: {
                // Error Here
                filter: { installationId: tokenObj.installationId },
                // Where field is the field you want to update
                update: { $set: { value: tokenObj.value, expireTime: tokenObj.expireTime} },
                upsert: false,
            },
        }));

        if (bulkOps.length > 0) {
            try {
                await Token.collection.bulkWrite(bulkOps);
            } catch (err){


                logger.error("Error bulk updating 'INSTALL' tokens", {
                    func,
                    e: err,
                });
        
                Sentry.setContext("token-lambda", {
                    message: "Error bulk updating 'INSTALL' tokens",
                });
        
                Sentry.captureException(err);
        
                return response;
            }
            logger.info(`Successfully updated ${bulkOps.length} 'INSTALL' tokens`, { func });
        }
    }

    return response;
    // Install Token Update Section END ------
};