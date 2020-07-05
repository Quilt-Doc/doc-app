import axios from 'axios';

var apiEndpoint = process.env.REACT_APP_API_ENDPOINT;

var api = axios.create({
    baseURL: apiEndpoint
});

export {api, apiEndpoint}