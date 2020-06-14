import {
    GET_REPOSITORY_FILE,
    REFRESH_REPOSITORY_PATH,
    PARSE_REPOSITORY_FILE,
    CLEAR_REPOSITORY_FILE,
    REFRESH_REPOSITORY_PATH_NEW,
    UPDATE_REPOSITORY_REFS,
    CREATE_REPOSITORY,
    GET_REPOSITORY,
    DELETE_REPOSITORY,
    RETRIEVE_REPOSITORIES
} from './types/Repository_Types';

import api from '../apis/api';


/* export const repoSearch = (formValues) => async (dispatch) => {
    const response = await api.post('/repositories/search', formValues );
    dispatch({ type: REPO_SEARCH, payload: response.data });
}*/

export const refreshRepositoryPath = (formValues) => async (dispatch) => {
    console.log('formValues: ', formValues);
    const response = await api.post('/repositories/refresh_path', formValues );
    console.log('refreshRepositoryPath response: ', response);
    
    var current_path = '';

    if ('repositoryPath' in formValues) {
        current_path = formValues.repositoryPath;
    }

    console.log(response);
    dispatch({ type: REFRESH_REPOSITORY_PATH, payload: response.data, repositoryName: formValues.repositoryName, repositoryCurrentPath: current_path });
}

export const refreshRepositoryPathNew = (formValues) => async (dispatch) => {
    console.log('formValues: ', formValues);
    const response = await api.post('/repositories/refresh_path_new', formValues );
    console.log('refreshRepositoryPath response: ', response);
    
    console.log(response);
    dispatch({ type: REFRESH_REPOSITORY_PATH_NEW, payload: response.data });
}

export const getRepositoryFile = (file_desc) => async (dispatch) => {

    console.log('file_desc: ', file_desc);
    const response = await api.post('/repositories/get_file', file_desc);
    console.log('getRepositoryFile response: ', response);
    
    dispatch({ type: GET_REPOSITORY_FILE, payload: response.data, fileName: file_desc.fileName});

}

export const parseRepositoryFile = (fileContents) => async (dispatch) => {

    console.log('repo_parse_file called');
    const response = await api.post('/repositories/parse_file', fileContents);
    console.log('parseRepositoryFile response');
    console.log(response);

    dispatch({ type: PARSE_REPOSITORY_FILE, payload: 'test'});
}

export const getRepositoryRefs = (repoLink) => async (dispatch) => {

    console.log('repo_get_refs called');
    const response = await api.post('/repositories/get_refs', repoLink);
    console.log('getRefs response');
    console.log(response)
}

export const clearRepositoryRefs = () => async (dispatch) => {
    dispatch({ type: CLEAR_REPOSITORY_FILE});
}

export const updateRepositoryRefs = (repositoryRefs) => async (dispatch) => {
    console.log('repo update refs called');
    dispatch({type: UPDATE_REPOSITORY_REFS, references: repositoryRefs.references});
}


export const createRepository = (formValues) => async (dispatch) => {
    console.log("CREATING");
    const response = await api.post('/repositories/create', formValues);
    dispatch({ type: CREATE_REPOSITORY, payload: response.data });
}

// /repositories/get/:id'
export const getRepository = id => async dispatch => {
    const response = await api.get(`/repositories/get/${id}`);
    dispatch({ type: GET_REPOSITORY, payload: response.data });
}

// /repositories/delete/:id
export const deleteRepository = (id) => async dispatch => {
    const response = await api.delete(`/repositories/delete/${id}`);
    dispatch({ type: DELETE_REPOSITORY, payload: response.data });
}

export const retrieveRepositories = (formValues) => async dispatch => {
    const response = await api.post('/repositories/retrieve', formValues);
    dispatch({ type: RETRIEVE_REPOSITORIES, payload: response.data });
}