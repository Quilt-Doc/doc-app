import axios from 'axios';
import Cookies from 'js-cookie';
var apiEndpoint;

console.log('Running!');
if(process.env.REACT_APP_NETLIFY_API_URL) { 
    apiEndpoint = process.env.REACT_APP_NETLIFY_API_URL;
}
else { 
   apiEndpoint = process.env.REACT_APP_LOCAL_URL;
}
console.log('apiEndpoint: ', apiEndpoint);

var api = axios.create({
    baseURL: apiEndpoint,
    withCredentials: true
});

api.interceptors.request.use(
    config => {
      console.log('Axios Interceptor');
      // const { origin } = new URL(config.url);
      // const allowedOrigins = [apiUrl];
      // const token = Cookies.get('user-jwt');
      // console.log(Cookies.get());
      // console.log('Intercept token: ');
      // console.log(token);
      // if (allowedOrigins.includes(origin)) {
      // config.headers.authorization = `Bearer ${token}`;
      // }
      return config;
    },
    error => {
      return Promise.reject(error);
    }
);

export {api, apiEndpoint}