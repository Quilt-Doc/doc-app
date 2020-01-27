import {
    REPO_SEARCH,
    REPO_REFRESH_PATH,
    REPO_VIEW_CODEFILE
} from './types/Repo_Types';

import api from '../apis/api';


/* export const repoSearch = (formValues) => async (dispatch) => {
    const response = await api.post('/repo/search', formValues );
    dispatch({ type: REPO_SEARCH, payload: response.data });
}*/

export const repoRefreshPath = (formValues) => async (dispatch) => {
    const response = await api.post('/repo/refresh_path', formValues );
    console.log(response);
    dispatch({ type: REPO_REFRESH_PATH, payload: response.data });
}