import {
    CREATE_WORKSPACE,
    GET_WORKSPACE,
    WORKSPACE_ADD_USER,
    DELETE_WORKSPACE,
    WORKSPACE_REMOVE_USER,
    RETRIEVE_WORKSPACES
} from './types/Workspace_Types';

import { api } from '../apis/api';

export const createWorkspace = (formValues, passback) => async (dispatch) => {
    const response = await api.post('/workspaces/create', formValues);

    if (response.data.success == false) {
        if (response.data.alert) {
            alert(response.data.alert)
            return false
        } else {
            throw new Error(response.data.error.toString());
        }
    }
    else {
        dispatch({ type: CREATE_WORKSPACE, payload: response.data.result });
        if (passback) return response.data.result;
    }
}

export const retrieveWorkspaces = (formValues) => async dispatch => {
    const response = await api.post(`/workspaces/retrieve`, formValues);

    if (response.data.success == false) {
        throw new Error(response.data.error.toString());
    }
    else {
        dispatch({ type: RETRIEVE_WORKSPACES, payload: response.data.result });
    }
}

export const searchWorkspace = (formValues) => async () => {
    
    var workspaceId = formValues.workspaceId;
    if (!workspaceId) {
        throw new Error("searchWorkspace: workspaceId not provided");
    }

    const response = await api.post(`/workspaces/search/${workspaceId}`, formValues );

    if (response.data.success == false) {
        throw new Error(response.data.error.toString());
    }
    else {
        return response.data.result
    }
}

export const getWorkspace = workspaceId => async dispatch => {
    
    if (!workspaceId) {
        throw new Error("getWorkspace: workspaceId not provided");
    }

    const response = await api.get(`/workspaces/get/${workspaceId}`);
    
    if (response.data.success == false) {
        throw new Error(response.data.error.toString());
    }
    else {
        dispatch({ type: GET_WORKSPACE, payload: response.data.result });
    }
}

// /workspaces/delete/:id
export const deleteWorkspace = (formValues) => async dispatch => {
    const { workspaceId } = formValues;

    if (!workspaceId) {
        throw new Error("deleteWorkspace: workspaceId not provided");
    }
    const response = await api.delete(`/workspaces/delete/${workspaceId}`);

    if (response.data.success == false) {
        throw new Error(response.data.error.toString());
    }
    else {
        dispatch({ type: DELETE_WORKSPACE, payload: response.data.result });
    }
}

// DEPRECATED
/*
// /workspaces/add_user/:id
export const workspaceAddUser = (workspaceId, userId) => async (dispatch) => {
    
    if (!workspaceId) {
        throw new Error("workspaceAddUser: workspaceId not provided");
    }
    if (!userId) {
        throw new Error("workspaceAddUser: userId not provided");
    }

    const response = await api.put(`/workspaces/add_user/${workspaceId}`, { userId });

    if (response.data.success == false) {
        throw new Error(response.data.error.toString());
    }
    else {
        dispatch({ type: WORKSPACE_ADD_USER, payload: response.data.result });
    }
}
*/

// /workspaces/remove_user/:id
export const workspaceRemoveUser = (workspaceId, userId) => async (dispatch) => {

    if (!workspaceId) {
        throw new Error("workspaceRemoveUser: workspaceId not provided");
    }
    if (!userId) {
        throw new Error("workspaceRemoveUser: userId not provided");
    }

    const response = await api.put(`/workspaces/remove_user/${workspaceId}`, { userId });

    if (response.data.success == false) {
        throw new Error(response.data.error.toString());
    }
    else {
        dispatch({ type: WORKSPACE_REMOVE_USER, payload: response.data.result });
    }
}