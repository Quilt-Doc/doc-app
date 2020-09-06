const requestBackendClient = () => {
	const axios = require('axios');
	return axios.create({
        baseURL: process.env.BACKEND_API_URL,
        headers: {
            "Authorization": `Bearer ${process.env.DEV_TOKEN}`
        }
	})
}

module.exports = {
    requestBackendClient
}