import axios from 'axios';

var apiEndpoint = process.env.REACT_APP_LOCAL_URL;

var api = axios.create({
    baseURL: apiEndpoint
});

export {api, apiEndpoint}