var jwt = require("jsonwebtoken");

const fs = require("fs");

createUserJWTToken = (userId, role) => {

    const now = new Date().getTime();
    const timeNow = Math.round(now / 1000);
  
    // Generate the JWT
    var payload = {
        // issued at time
        iat: timeNow,
        // User identifiers
        userId: userId,
        role: role,

    };
  
    var private_key = fs.readFileSync("docapp-test.pem", "utf8");

    return jwt.sign(payload, private_key, { algorithm: "RS256" });

};


console.log(createUserJWTToken("5f8515464ff117c30c52b42e", "user"));