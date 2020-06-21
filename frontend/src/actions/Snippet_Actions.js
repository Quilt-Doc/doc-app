import {
    CREATE_SNIPPET,
    GET_SNIPPET,
    EDIT_SNIPPET,
    DELETE_SNIPPET,
    RETRIEVE_SNIPPETS
} from './types/Snippet_Types'

import api from '../apis/api';


export const createSnippet = (formValues) => async (dispatch) => {
    // console.log('Creating snippet with values: ');
    // console.log(formValues);
    const response = await api.post('/snippets/create', formValues );
    dispatch({ type: CREATE_SNIPPET, payload: response.data });
}

export const getSnippet = id => async dispatch => {
    const response = await api.get(`/snippets/get/${id}`);
    dispatch({ type: GET_SNIPPET, payload: response.data });
}

export const retrieveSnippets = (formValues) => async dispatch => {
    const response = await api.post(`/snippets/retrieve`, formValues );
    dispatch({ type: RETRIEVE_SNIPPETS, payload: response.data });
}

export const deleteSnippet = id => async dispatch => {
    const response = await api.delete(`/snippets/delete/${id}`);
    dispatch({ type: DELETE_SNIPPET, payload: response.data });
}

export const editSnippet = (id, formValues) => async dispatch => {
    const response = await api.put(`/snippets/edit/${id}`, formValues);
    dispatch({ type: EDIT_SNIPPET, payload: response.data });
}