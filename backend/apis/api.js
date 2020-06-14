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

module.exports = {
    requestClient
}