import {
    CREATE_CODEBASE,
    GET_CODEBASE,
    DELETE_CODEBASE,
    RETRIEVE_CODEBASES
} from './types/Codebase_Types';

import api from '../apis/api';


export const createCodebase = (formValues) => async (dispatch) => {
    console.log("CREATING");
    const response = await api.post('/codebases/create', formValues);
    dispatch({ type: CREATE_CODEBASE, payload: response.data });
}

// /codebases/get/:id'
export const getCodebase = id => async dispatch => {
    const response = await api.get(`/codebases/get/${id}`);
    dispatch({ type: GET_CODEBASE, payload: response.data });
}

// /codebases/delete/:id
export const deleteCodebase = (id) => async dispatch => {
    const response = await api.delete(`/codebases/delete/${id}`);
    dispatch({ type: DELETE_CODEBASE, payload: response.data });
}

export const retrieveCodebases = (formValues) => async dispatch => {
    const response = await api.post('/codebases/retrieve', formValues);
    dispatch({ type: RETRIEVE_CODEBASES, payload: response.data });
}