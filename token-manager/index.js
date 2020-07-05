require('dotenv').config();
const fs = require('fs');
var jwt = require('jsonwebtoken');


var mongoose = require('mongoose')
const { ObjectId } = mongoose.Types;

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



const Token = require('./models/Token');

var cron = require('node-cron');

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
        value: jwt.sign(payload, private_key, { algorithm: 'RS256' }),
        // put back into milliseconds
        expireTime: expirationTime * 1000,
    }

    return newToken;

}

const insertNewAppToken = () => {
    var newToken = createJWTToken();
    newToken.installationId = -1;
    newToken.type = 'APP';
    newToken.status = 'RESOLVED';
    
    newToken = Token(newToken);
    console.log('save() in insertNewAppToken');
    newToken.save((err, token) => {
        if (err) {
            console.log('Error saving newToken: ', err);
            return token;
        }
    });
    return newToken;
}

const updateAppToken = async (oldToken) => {
    console.log('updateAppToken received: ');
    console.log(oldToken);
    var newToken = createJWTToken();

    oldToken.value = newToken.value;
    oldToken.expireTime = newToken.expireTime;
    oldToken.status = 'RESOLVED';
    console.log('save() in updateAppToken()');
    return await Token.findOneAndUpdate({ _id: oldToken._id}, {$set: {value: newToken.value, expireTime: newToken.expireTime, status: oldToken.status}});
    /*oldToken.save(function (err) {
        if(err) {
            console.error('Error updating app token: ');
            console.error(err);
        }
    });

    console.log('updateAppToken saved: ');
    console.log(oldToken);*/

}
const getNewInstallToken = async (tokenModel, installationApi) => {
    installationApi.post(tokenModel.installationId + "/access_tokens")
        .then((response) => {
            var newToken = response.data;
            newToken = {value: newToken.token, expireTime: Date.parse(newToken.expires_at)};

            return newToken;
        })
        .catch((error) => {
            console.log('Error: ', error);
            return undefined;
        });
}

const getAppToken = async () => {
    return await Token.findOneAndUpdate({'type': 'APP', 'status': 'RESOLVED'}, {$set: {'status': 'UPDATING'}})
                .catch(err => {
                    console.log('Error finding app token: ');
                    console.log(err);
                    return;
                });
}


cron.schedule('* * * * *', async () => {
    console.log('running a task every minute');

    // App Token Section START ------
    var retrievedToken = undefined;
    var currentTime = new Date().getTime();
    // curentTime = Math.round(currentTime  / 1000);

    var currentAppToken = undefined;

    retrievedToken = await getAppToken();

    // If app token does not exist.
    if (!retrievedToken) {
        console.log('Inserting new app token')
        currentAppToken = insertNewAppToken();
    }
    else {
        
        // If app token expiring within 3 minutes
        if ((retrievedToken.expireTime - currentTime) < (60*3*1000)) {
            console.log('Updating app token');
            currentAppToken = await updateAppToken(retrievedToken);
        }

        // If the app token is valid
        else {
            console.log('Did nothing, setting appToken back to valid')
            Token.updateOne({'type': 'APP', 'status': 'UPDATING'}, {'$set': {"status": "RESOLVED"}}, function(err, foundToken) {
                if (err) {
                    console.log('Error setting app token status back to resolved: ');
                    console.log(err);
                    return;
                }
                return;
            });
            currentAppToken = retrievedToken;
        }
    }

    // replace newlin, carriage-return, etc
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
 


    // Find install tokens whose expiration time is less than 3 minutes from now and which are not being updated currently.
    Token.find({'type': 'INSTALL', 'expireTime': { $lte: (currentTime + (60*3*1000))}, 'status': 'RESOLVED'}, async function (err, installTokens) {
        if (err) {
            console.log('Error fetching install tokens');
            console.log(err);
            return;
        }

        var i = 0;

        for (i = 0; i < installTokens.length; i++) {
            installTokens[i].status = 'UPDATING';
            installTokens[i].save();
        }

        console.log('installTokens: ');
        console.log(installTokens);
        var newTokens = installTokens.map(async (tokenModel) => {
            return await getNewInstallToken(tokenModel, installationApi);
        });

        // Now `newTokens` should have all of our new tokens
        const results = await Promise.all(newTokens);/*.then((results) => {
            console.log('Token Request Results: ');
            console.log(results);

        });*/

        // TODO: Update DB with new tokens
        const bulkOps = results.map(tokenObj => ({
            updateOne: {
                filter: { installationId: tokenObj.installationId },
                // Where field is the field you want to update
                update: { $set: { value: tokebObj.value, expireTime: tokenObj.expireTime, status: 'RESOLVED' } },
                upsert: true
                }
            }));
           // where Model is the name of your model
        if (bulkOps.length > 0) {
            console.log('Bulk writing tokens');
            return Token.collection
                .bulkWrite(bulkOps)
                .then(results => res.json(results))
                .catch(err => {
                    console.log('Error refreshing tokens: ', err);
                    res.json({success: false, error: err});
                });
        }

        console.log("Finished.");

    });


});
