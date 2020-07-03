import {
    CREATE_REQUEST,
    GET_REQUEST,
    EDIT_REQUEST,
    DELETE_REQUEST,
    RETRIEVE_REQUESTS
} from './types/Request_Types'

import { api } from '../apis/api';


export const createRequest = (formValues) => async (dispatch) => {
    const response = await api.post('/requests/create', formValues );
    dispatch({ type: CREATE_REQUEST, payload: response.data });
}

export const getRequest = id => async dispatch => {
    const response = await api.get(`/requests/get/${id}`);
    dispatch({ type: GET_REQUEST, payload: response.data });
}

export const retrieveRequests = (formValues) => async dispatch => {
    const response = await api.post(`/requests/retrieve`, formValues );
    dispatch({ type: RETRIEVE_REQUESTS, payload: response.data });
}

export const deleteRequest = id => async dispatch => {
    const response = await api.delete(`/requests/delete/${id}`);
    dispatch({ type: DELETE_REQUEST, payload: response.data });
}

export const editRequest = (id, formValues) => async dispatch => {
    const response = await api.put(`/requests/edit/${id}`, formValues);
    dispatch({ type: EDIT_REQUEST, payload: response.data });
}