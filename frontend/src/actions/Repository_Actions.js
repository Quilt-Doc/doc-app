import {
    GET_REPOSITORY_FILE,
    CREATE_REPOSITORY,
    GET_REPOSITORY,
    DELETE_REPOSITORY,
    RETRIEVE_REPOSITORIES, 
    SET_CURRENT_REPOSITORY
} from './types/Repository_Types';

import { api } from '../apis/api';

var urljoin = require('url-join');


/* export const repoSearch = (formValues) => async (dispatch) => {
    const response = await api.post('/repositories/search', formValues );
    dispatch({ type: REPO_SEARCH, payload: response.data });
}*/

<<<<<<< HEAD
export const getRepositoryFile = (fileDesc) => async (dispatch) => {

    console.log('fileDesc: ', fileDesc);
=======
export const retrieveInstallationRepositories = (formValues) => async () => {
    const response = await api.post('/repositories/retrieve_installed', formValues );
    return response.data
}

export const refreshRepositoryPath = (formValues) => async (dispatch) => {
    console.log('formValues: ', formValues);
    const response = await api.post('/repositories/refresh_path', formValues );
    console.log('refreshRepositoryPath response: ', response);
>>>>>>> 18bcacd53e6f9e483e57724e2210d65a898887fb
    
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
        throw new Error("getRepositoryFile Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: GET_REPOSITORY_FILE, payload: response.data.result, fileName: fileDesc.fileName});
        return response.data.result;
    }
}

export const createRepository = (formValues) => async (dispatch) => {
    const response = await api.post('/repositories/create', formValues);

    if (response.data.success == false) {
        throw new Error("createRepository Error: ", response.data.error.toString());
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
        throw new Error("getRepository Error: ", response.data.error.toString());
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
        throw new Error("deleteRepository Error: ", response.data.error.toString());
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
        throw new Error("retrieveRepositories Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: RETRIEVE_REPOSITORIES, payload: response.data.result });
    }
}

export const setCurrentRepository = (formValues) => dispatch => {
    dispatch({ type: SET_CURRENT_REPOSITORY, payload: formValues });
}


// These two routes below are not finalized
export const validateRepositories = (formValues) => async () => {
    const response = await api.post('/repositories/validate', formValues);

    if (response.data.success == false) {
        throw new Error("validateRepositories Error: ", response.data.error.toString());
    }
    else {
        return response.data.result
    }
}

export const pollRepositories = (formValues) => async () => {

    const workspaceId = formValues.workspaceId;
    
    if (!workspaceId) {
        throw new Error("retrieveRepositories: workspaceId not provided");
    }

    const response = await api.post(`/repositories/${workspaceId}/poll`, formValues);

    if (response.data.success == false) {
        throw new Error("pollRepositories Error: ", response.data.error.toString());
    }
    else {
        return response.data.result;
    }
}
