import {
    GET_USER,
    EDIT_USER,
    DELETE_USER,
    RETRIEVE_USERS
} from './types/User_Types'

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

export const editUser = (id, formValues) => async dispatch => {
    const response = await api.put(`/users/edit/${id}`, formValues);
    dispatch({ type: EDIT_USER, payload: response.data });
}

export const userAttachWorkspace = (id, workspaceId) => async (dispatch) => {
    const response = await api.put(`/users/attach_workspace/${id}`, { workspaceId });
    dispatch({ type: USER_ATTACH_WORKSPACE, payload: response.data });
}

export const userRemoveWorkspace = (id, workspaceId) => async (dispatch) => {
    const response = await api.put(`/users/remove_workspace/${id}`, { workspaceId });
    dispatch({ type: USER_REMOVE_WORKSPACE, payload: response.data });
}


