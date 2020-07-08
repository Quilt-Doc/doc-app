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
    RETRIEVE_REPOSITORIES, 
    SET_CURRENT_REPOSITORY
} from './types/Repository_Types';

import { api } from '../apis/api';

var urljoin = require('url-join');


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

// Example download link: https://raw.githubusercontent.com/kgodara/snippet-logic-test/master/post_commit.py
export const getRepositoryFile = (file_desc) => async (dispatch) => {

    console.log('file_desc: ', file_desc);
    var id = file_desc.repositoryId;
    const repository = await api.get(`/repositories/get/${id}`);


    console.log('Repository Object: ');
    console.log(repository);
    console.log(repository.data.name)

    var downloadLink = urljoin("https://raw.githubusercontent.com/", repository.data.name);
    downloadLink = urljoin(downloadLink, 'master/');
    downloadLink = urljoin(downloadLink, file_desc.pathInRepo);
    

    const response = await api.post('/repositories/get_file', {downloadLink});
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
    dispatch({ type: UPDATE_REPOSITORY_REFS, payload: response.data})
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
    console.log('createRepository response: ');
    console.log(response);
    dispatch({ type: CREATE_REPOSITORY, payload: response.data });
    return response.data;
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

export const validateRepositories = (formValues) => async () => {
    const response = await api.post('/repositories/validate', formValues);
    return response.data
}

export const pollRepositories = (formValues) => async () => {
    const response = await api.post('/repositories/poll', formValues);
    return response.data
}

export const setCurrentRepository = (formValues) => dispatch => {
    dispatch({ type: SET_CURRENT_REPOSITORY, payload: formValues });
}


export const updateRepositoryCommit = (formValues) => async (dispatch) => {
    console.log('repoUpdateCommit formValues: ', formValues);
    const response = await api.post('/repositories/update_commit', formValues);
    console.log('repoUpdateCommit response: ')
    console.log(response);
}