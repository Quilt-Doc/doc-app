import {
    CREATE_TAG,
    GET_TAG,
    EDIT_TAG,
    DELETE_TAG,
    RETRIEVE_TAGS
} from './types/Tag_Types'

import { api } from '../apis/api';


export const createTag = (formValues) => async (dispatch) => {
    const response = await api.post('/tags/create', formValues );
    dispatch({ type: CREATE_TAG, payload: response.data });
    return response.data
}

export const getTag = id => async dispatch => {
    const response = await api.get(`/tags/get/${id}`);
    dispatch({ type: GET_TAG, payload: response.data });
}

export const retrieveTags = (formValues) => async dispatch => {
    const response = await api.post(`/tags/retrieve`, formValues );
    dispatch({ type: RETRIEVE_TAGS, payload: response.data });
}

export const deleteTag = id => async dispatch => {
    const response = await api.delete(`/tags/delete/${id}`);
    dispatch({ type: DELETE_TAG, payload: response.data });
}

export const editTag = (id, formValues) => async dispatch => {
    const response = await api.put(`/tags/edit/${id}`, formValues);
    dispatch({ type: EDIT_TAG, payload: response.data });
}

