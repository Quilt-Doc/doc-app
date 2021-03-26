const requestBackendClient = () => {
	const axios = require('axios');
	var backendUrl;
	if (!process.env.IS_PRODUCTION) {
		backendUrl = process.env.DEBUG_BACKEND_API_URL;
	}
	else {
		backendUrl = process.env.BACKEND_API_URL;
	}

	return axios.create({
		baseURL: backendUrl,
		headers: {
			"Authorization": `Bearer ${process.env.DEV_TOKEN}`
		}
	})
}

module.exports = {
	requestBackendClient
}