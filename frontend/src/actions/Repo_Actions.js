import {
    REPO_GET_FILE,
    REPO_REFRESH_PATH,
} from './types/Repo_Types';

import api from '../apis/api';


/* export const repoSearch = (formValues) => async (dispatch) => {
    const response = await api.post('/repo/search', formValues );
    dispatch({ type: REPO_SEARCH, payload: response.data });
}*/

export const repoRefreshPath = (formValues) => async (dispatch) => {
    console.log('formValues: ', formValues);
    const response = await api.post('/repo/refresh_path', formValues );
    
    var current_path = '';

    if ('repo_path' in formValues) {
        current_path = formValues.repo_path;
    }

    console.log(response);
    dispatch({ type: REPO_REFRESH_PATH, payload: response.data, repo_name: formValues.repo_name, repo_current_path: current_path });
}

export const repoGetFile = (file_desc) => async (dispatch) => {
    
    console.log('file_desc: ', file_desc);
    const response = await api.post('/repo/get_file', file_desc);
    console.log('response: ', response);
    dispatch({ type: REPO_GET_FILE, payload: response.data, file_name: file_desc.file_name});

}