require('dotenv').config();

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
        expireTime: expirationTime,
    }

    return newToken;

}

const insertNewAppToken = () => {
    var newToken = createJWTToken();
    newToken.installationId = -1;
    newToken.type = 'APP';
    newToken.status = 'RESOLVED';
    
    newToken = Token(newToken);
    newToken.save((err, token) => {
        if (err) {
            console.log('Error saving newToken: ', err);
            return token;
        }
    });
}

const updateAppToken = (oldToken) => {
    var newToken = createJWTToken();

    oldToken.value = newToken.value;
    oldToken.expireTime = newToken.expireTime;
    oldToken.status = 'RESOLVED';

    oldToken.save(function (err) {
        if(err) {
            console.error('Error updating expiring app token');
        }
    });

}
const getNewInstallToken = async (tokenModel, config) => {
    installationApi.post(tokenModel.installationId + "/access_tokens", config)
        .then((response) => {
            var newToken = response.data;
            newToken = {token: newToken.token, expireTime: Date.parse(newToken.expires_at)};
            return newToken;
        })
        .catch((error) => {
            console.log('Error: ', error);
            return undefined;
        });
}


cron.schedule('* * * * *', () => {
    console.log('running a task every minute');

    // App Token Section START ------
    var retrievedToken = undefined;
    var currentTime = new Date().getTime();
    curentTime = Math.round(now  / 1000);

    var currentAppToken = undefined;

    Token.updateOne({'type': 'APP', 'status': 'RESOLVED'}, {'$set': {"status": "UPDATING"}}, function (err, foundToken) {
        if (err) {
            console.log('Error finding app access token: ');
            console.log(err);
            return;
        }
        retrievedToken = foundToken;
    });

    // If app token does not exist.
    if (typeof retrievedToken == 'undefined') {
        currentAppToken = insertNewAppToken();
    }
    else {

        // If app token expiring within 3 minutes
        if ((retrievedToken.expireTime - currentTime) < (60*3)) {
            currentAppToken = updateAppToken(retrievedToken);
        }

        // If the app token is valid
        else {
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
    // App Token Section END ------

    const axios = require('axios');
    var installationApi = axios.create({
        baseURL: "https://api.github.com/installations/",
    });
    
    let config = {
        headers: {
          Authorization: "Bearer " + currentAppToken,
          Accept: "application/vnd.github.machine-man-preview+json"
        }
    }


    // Find install tokens whose expiration time is less than 3 minutes from now and which are not being updated currently.
    Token.updateMany({'type': 'INSTALL', 'expireTime': { $lte: (currentTime + (60*3))}, 'status': 'RESOLVED'}, {"$set":{"status": 'UPDATING'}}, function (err, installTokens) {
        if (err) {
            console.log('Error fetching install tokens');
            console.log(err);
            return;
        }


        var newTokens = installTokens.map(tokenModel => {
            return getNewInstallToken(tokenModel, config);
        });

        // Now `newTokens` should have all of our new tokens
        await Promise.all(newTokens).then((results) => {
            console.log('Token Request Results: ');
            console.log(results);
        });

        

        console.log("This shouldn't print before 'Token Request Results.'");

    });


});
