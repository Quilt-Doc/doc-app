import {
    CREATE_WORKSPACE,
    GET_WORKSPACE,
    WORKSPACE_ADD_USER,
    DELETE_WORKSPACE,
    WORKSPACE_REMOVE_USER
} from './types/Workspace_Types';

import api from '../apis/api';

export const createWorkspace = (workspaceID, formValues) => async (dispatch, getState) => {
    const response = await api.post('/workspaces/create', {...formValues, workspaceID});
    dispatch({ type: CREATE_WORKSPACE, payload: response.data });
}

// /workspaces/get/:id'
export const getWorkspace = (id) => async dispatch => {
    const response = await api.get(`/workspaces/get/${id}`);
    dispatch({ type: GET_WORKSPACE, payload: response.data });
}

// /workspaces/delete/:id
export const deleteWorkspace = (id) => async dispatch => {
    const response = await api.delete(`/workspaces/delete/${id}`);
    dispatch({ type: DELETE_WORKSPACE, payload: response.data });
}

// /workspaces/add_user/:id
export const workspaceAddUser = (workspaceID, formValues) => async (dispatch, getState) => {
    const response = await api.put(`/workspaces/add_user/${id}`, formValues);
    dispatch({ type: WORKSPACE_ADD_USER, payload: response.data });
}

// /workspaces/remove_user/:id
export const workspaceRemoveUser = (workspaceID, formValues) => async (dispatch, getState) => {
    const response = await api.put(`/workspaces/remove_user/${id}`, formValues);
    dispatch({ type: WORKSPACE_REMOVE_USER, payload: response.data });
}