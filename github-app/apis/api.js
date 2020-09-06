const requestBackendClient = () => {
	const axios = require('axios');
	return axios.create({
		baseURL: process.env.BACKEND_API_URL
	})
}

module.exports = {
    requestBackendClient
}