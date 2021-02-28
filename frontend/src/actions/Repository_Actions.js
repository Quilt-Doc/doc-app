import {
    GET_REPOSITORY_FILE,
    CREATE_REPOSITORY,
    GET_REPOSITORY,
    DELETE_REPOSITORY,
    RETRIEVE_REPOSITORIES
} from './types/Repository_Types';

import { api } from '../apis/api';


export const getRepositoryFile = (fileDesc) => async (dispatch) => {

    console.log('fileDesc: ', fileDesc);
    
    const workspaceId = fileDesc.workspaceId;
    const repositoryId = fileDesc.repositoryId;

    if (!workspaceId) {
        throw new Error("getRepositoryFile: workspaceId not provided");
    }

    if (!repositoryId) {
        throw new Error("getRepositoryFile: repositoryId not provided");
    }

    const response = await api.post(`/repositories/${workspaceId}/get_file/${repositoryId}`, fileDesc);

    if (response.data.success == false) {
        console.log(response.data.error.toString());
        throw new Error(response.data.error.toString());
    }
    else {
        dispatch({ type: GET_REPOSITORY_FILE, payload: response.data.result, fileName: fileDesc.fileName});
        return response.data.result;
    }
}

export const createRepository = (formValues) => async (dispatch) => {
    const response = await api.post('/repositories/create', formValues);

    if (response.data.success == false) {
        throw new Error(response.data.error.toString());
    }
    else {
        dispatch({ type: CREATE_REPOSITORY, payload: response.data.result });
        return response.data.result;
    }
}


export const getRepository = formValues => async dispatch => {
    
    const repositoryId = formValues.repositoryId;
    const workspaceId = formValues.workspaceId;
    
    if (!workspaceId) {
        throw new Error("getRepository: workspaceId not provided");
    }

    if (!repositoryId) {
        throw new Error("getRepository: repositoryId not provided");
    }

    const response = await api.get(`/repositories/${workspaceId}/get/${repositoryId}`);

    if (response.data.success == false) {
        throw new Error(response.data.error.toString());
    }
    else {
        dispatch({ type: GET_REPOSITORY, payload: response.data.result });
    }
}


export const deleteRepository = formValues => async dispatch => {

    const repositoryId = formValues.repositoryId;
    const workspaceId = formValues.workspaceId;
    
    if (!workspaceId) {
        throw new Error("deleteRepository: workspaceId not provided");
    }

    if (!repositoryId) {
        throw new Error("deleteRepository: repositoryId not provided");
    }

    const response = await api.delete(`/repositories/${workspaceId}/delete/${repositoryId}`);

    if (response.data.success == false) {
        throw new Error(response.data.error.toString());
    }
    else {
        dispatch({ type: DELETE_REPOSITORY, payload: response.data.result });
    }
}

export const retrieveRepositories = (formValues) => async dispatch => {
    
    const workspaceId = formValues.workspaceId;
    
    if (!workspaceId) {
        throw new Error("retrieveRepositories: workspaceId not provided");
    }

    const response = await api.post(`/repositories/${workspaceId}/retrieve`, formValues);
    
    if (response.data.success == false) {
        throw new Error(response.data.error.toString());
    }
    else {
        dispatch({ type: RETRIEVE_REPOSITORIES, payload: response.data.result });
    }
}


export const retrieveCreationRepositories = (formValues) => async dispatch => {

    const userId = formValues.userId;

    const response = await api.post(`/repositories/${userId}/retrieve_creation`, formValues);

    if (response.data.success == false) {
        throw new Error(response.data.error.toString());
    }
    else {
        dispatch({ type: RETRIEVE_REPOSITORIES, payload: response.data.result });
    }
}
