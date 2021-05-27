const requestBackendClient = () => {
    const axios = require("axios");
    var backendUrl = process.env.BACKEND_API_URL;

    return axios.create({
        baseURL: backendUrl,
        headers: {
            "Authorization": `Bearer ${process.env.DEV_TOKEN}`,
        },
    });
};

module.exports = {
    requestBackendClient,
};