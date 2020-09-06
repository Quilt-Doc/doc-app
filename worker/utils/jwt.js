var jwt = require('jsonwebtoken');

const fs = require('fs');

createUserJWTToken = (username, profileId) => {

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

createAppJWTToken = () => {
  const now = new Date().getTime();
  //Get timestamp in seconds
  const timeNow = Math.round(now / 1000);

  // Reduce from max by 30 sec to stop rounding errors
  const expirationTime = timeNow + (10 * 60) - 30;

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
  // return {token: newToken};
  console.log('createAppJWTToken Returning: ');
  console.log(newToken);
  return newToken;

}

module.exports = {
  createAppJWTToken,
  createUserJWTToken
}