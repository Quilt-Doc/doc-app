const requestClient = () => {
    const axios = require('axios');
    return axios.create({
        baseURL: "https://api.github.com"
    });
}

module.exports = {
    requestClient
}