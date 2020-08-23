var jwt = require('jsonwebtoken');

const fs = require('fs');

createJWTToken = (username, profileId) => {

    const now = new Date().getTime();
    const timeNow = Math.round(now / 1000);
  
    // Generate the JWT
    var payload = {
      // issued at time
      iat: timeNow,
      // User identifiers
      username: username,
      profileId: profileId

    }
  
    var private_key = fs.readFileSync('docapp-test.pem', 'utf8');

    return jwt.sign(payload, private_key, { algorithm: 'RS256' });
  
}

module.exports = {
    createJWTToken
}