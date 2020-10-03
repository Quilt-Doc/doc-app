import {
    CHECK_LOGIN,
    CHECK_INSTALLATION,
    RETRIEVE_DOMAIN_REPOSITORIES
} from './types/Auth_Types';

import { api, apiEndpoint } from '../apis/api';
import Cookies from 'js-cookie';


export const checkLogin = () => async (dispatch) => {
    console.log('User-JWT Cookie: ');
    console.log(Cookies.get('user-jwt'));
    
    console.log('apiEndpoint: ', apiEndpoint);
    console.log('api: ');
    console.log(api);
    
    const response = await api.get('/auth/login/success', { withCredentials: true });

    console.log('Headers: ');
    console.log(response.headers);
    console.log(response.data);

    dispatch({ type: CHECK_LOGIN, payload: response.data });
}

export const checkInstallation = (formValues) => async (dispatch) => {
    const response = await api.post('/auth/check_installation', formValues)

    console.log("CHECKINSTALLATIONRESPONSE", response)
    if (response.data.success == false) {
        throw new Error("checkInstallation Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: CHECK_INSTALLATION, payload: response.data.result });
    }
}

export const retrieveDomainRepositories = (formValues) => async (dispatch) => {
    const response = await api.post('/auth/retrieve_domain_repositories', formValues)
    dispatch({ type: RETRIEVE_DOMAIN_REPOSITORIES, payload: response.data });
}