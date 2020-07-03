import {
    CHECK_LOGIN
} from './types/Auth_Types';

import { api, apiEndpoint } from '../apis/api';


export const checkLogin = () => async (dispatch) => {
    console.log('apiEndpoint: ', apiEndpoint);
    const response = await api.get('/auth/login/success', { withCredentials: true })
    dispatch({ type: CHECK_LOGIN, payload: response.data });
}