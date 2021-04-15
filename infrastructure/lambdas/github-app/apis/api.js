var testingApiEndpoint;

if (process.env.IS_PRODUCTION) {
    testingApiEndpoint = process.env.PRODUCTION_API_URL;
} else {
    testingApiEndpoint = process.env.LOCALHOST_API_URL;
}

const requestTestingUserBackendClient = () => {
    const axios = require("axios");
    // console.log("TEST_USER_JWT: ");
    // console.log(process.env.TEST_USER_JWT);
    return axios.create({
        baseURL: testingApiEndpoint,
        headers: {
            Authorization: `Bearer ${process.env.TEST_USER_JWT}`,
        },
    });
};

const requestTestingDevBackendClient = () => {
    const axios = require("axios");
    console.log(
        `Creating testing dev client - testingApiEndpoint: ${testingApiEndpoint}`
    );
    return axios.create({
        baseURL: testingApiEndpoint,
        headers: {
            Authorization: `Bearer ${process.env.DEV_TOKEN}`,
        },
    });
};

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
	requestTestingDevBackendClient,
	requestTestingUserBackendClient,
	requestBackendClient
}