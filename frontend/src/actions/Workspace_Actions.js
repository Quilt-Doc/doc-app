import {
    CREATE_WORKSPACE,
    GET_WORKSPACE,
    WORKSPACE_ADD_USER,
    WORKSPACE_REMOVE_USER
} from './types/Workspace_Types';

import api from '../apis/api';

 
export const createWorkspace = (workspaceID, formValues) => async (dispatch, getState) => {
    let authorID = getState()
    const response = await api.post('/documents/create', {...formValues, workspaceID});
    dispatch({ type: CREATE_WORKSPACE, payload: response.data });
}

export const getWorkspace = (workspaceID, formValues) => async (dispatch, getState) => {
    let authorID = getState()
    const response = await api.post('/documents/create', {...formValues, workspaceID});
    dispatch({ type: GET_WORKSPACE, payload: response.data });
}

export const workspaceAddUser = (workspaceID, formValues) => async (dispatch, getState) => {
    let authorID = getState()
    const response = await api.post('/documents/create', {...formValues, workspaceID});
    dispatch({ type: WORKSPACE_ADD_USER, payload: response.data });
}

export const workspaceRemoveUser = (workspaceID, formValues) => async (dispatch, getState) => {
    let authorID = getState()
    const response = await api.post('/documents/create', {...formValues, workspaceID});
    dispatch({ type: WORKSPACE_REMOVE_USER, payload: response.data });
}



