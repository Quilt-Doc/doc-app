import {
    CHECK_LOGIN,
    CHECK_INSTALLATION,
    RETRIEVE_DOMAIN_REPOSITORIES
} from './types/Auth_Types';

import { api, apiEndpoint } from '../apis/api';


export const checkLogin = () => async (dispatch) => {
    console.log('apiEndpoint: ', apiEndpoint);
    const response = await api.get('/auth/login/success', { withCredentials: true })
    console.log('response: ', response)
    dispatch({ type: CHECK_LOGIN, payload: response.data });
}

export const checkInstallation = (formValues) => async (dispatch) => {
    const response = await api.post('/auth/check_installation', formValues)
    dispatch({ type: CHECK_INSTALLATION, payload: response.data });
}

export const retrieveDomainRepositories = (formValues) => async (dispatch) => {
    const response = await api.post('/auth/retrieve_domain_repositories', formValues)
    dispatch({ type: RETRIEVE_DOMAIN_REPOSITORIES, payload: response.data });
}