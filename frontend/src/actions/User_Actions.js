import {
    GET_USER,
    DELETE_USER,
    RETRIEVE_USERS
} from './types/User_Types';

import {
    EDIT_USER
} from './types/Auth_Types';

import { api } from '../apis/api';


export const getUser = id => async dispatch => {
    const response = await api.get(`/users/get/${id}`);
    dispatch({ type: GET_USER, payload: response.data });
}

export const retrieveUsers = (formValues) => async dispatch => {
    const response = await api.post(`/users/retrieve`, formValues );
    dispatch({ type: RETRIEVE_USERS, payload: response.data });
}

export const deleteUser = id => async dispatch => {
    const response = await api.delete(`/users/delete/${id}`);
    dispatch({ type: DELETE_USER, payload: response.data });
}

export const editUser = (formValues) => async dispatch => {
    const { userId } = formValues;

    if (!userId) throw new Error("editUser: userId not provided");

    const response = await api.put(`/users/edit/${userId}`, formValues);

    const {success, result, error} = response.data;
    if (!success) {
        throw new Error(error.toString());
    } else {
        dispatch({ type: EDIT_USER, payload: result });
    }
}

export const userAttachWorkspace = (id, workspaceId) => async (dispatch) => {
    const response = await api.put(`/users/attach_workspace/${id}`, { workspaceId });
    dispatch({ type: EDIT_USER, payload: response.data });
}

export const userRemoveWorkspace = (id, workspaceId) => async (dispatch) => {
    const response = await api.put(`/users/remove_workspace/${id}`, { workspaceId });
    dispatch({ type: EDIT_USER, payload: response.data });
}

export const addUserToContacts = (email) => async () => {
    const response = await api.post(`/verify/add_contact`, { email });
    const {success, result, error} = response.data;
    if (!success) {
        alert(error.toString());
    }
}