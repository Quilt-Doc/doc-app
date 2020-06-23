const axios = require("axios");

var api = axios.create({
    baseURL: "http://54.160.81.133:3001/api"
});

module.exports = { api };

/*export default axios.create({
    baseURL: "http://54.160.81.133:3001/api"
});*/