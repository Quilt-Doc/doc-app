import {
    CHECK_LOGIN
} from './types/Auth_Types';

import api from '../apis/api';


export const checkLogin = () => async (dispatch) => {
    const response = await api.get('/auth/login/success', { withCredentials: true })
    dispatch({ type: CHECK_LOGIN, payload: response.data });
}