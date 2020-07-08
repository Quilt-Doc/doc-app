import {
    CREATE_WORKSPACE,
    GET_WORKSPACE,
    WORKSPACE_ADD_USER,
    DELETE_WORKSPACE,
    WORKSPACE_REMOVE_USER,
    RETRIEVE_WORKSPACES,
    SET_CURRENT_WORKSPACE
} from './types/Workspace_Types';

import { api } from '../apis/api';

export const createWorkspace = (formValues) => async (dispatch) => {
    const response = await api.post('/workspaces/create', formValues);
    dispatch({ type: CREATE_WORKSPACE, payload: response.data });
}

// /workspaces/get/:id'
export const getWorkspace = id => async dispatch => {
    const response = await api.get(`/workspaces/get/${id}`);
    dispatch({ type: GET_WORKSPACE, payload: response.data });
}

// /workspaces/delete/:id
export const deleteWorkspace = (id) => async dispatch => {
    const response = await api.delete(`/workspaces/delete/${id}`);
    dispatch({ type: DELETE_WORKSPACE, payload: response.data });
}

export const retrieveWorkspaces = (formValues) => async dispatch => {
    console.log("FORMVALUES", formValues)
    const response = await api.post(`/workspaces/retrieve`, formValues);
    dispatch({ type: RETRIEVE_WORKSPACES, payload: response.data });
}

export const setCurrentWorkspace = (currentSpace) => dispatch => {
    dispatch({ type:  SET_CURRENT_WORKSPACE, payload: currentSpace });
}

// /workspaces/add_user/:id
export const workspaceAddUser = (id, userID) => async (dispatch) => {
    const response = await api.put(`/workspaces/add_user/${id}`, { userID });
    dispatch({ type: WORKSPACE_ADD_USER, payload: response.data });
}

// /workspaces/remove_user/:id
export const workspaceRemoveUser = (id, userID) => async (dispatch) => {
    const response = await api.put(`/workspaces/remove_user/${id}`, { userID });
    dispatch({ type: WORKSPACE_REMOVE_USER, payload: response.data });
}