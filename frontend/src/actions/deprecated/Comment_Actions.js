import {
    CREATE_COMMENT,
    GET_COMMENT,
    EDIT_COMMENT,
    DELETE_COMMENT,
    RETRIEVE_COMMENTS
} from '../types/Comment_Types'

import  { api } from '../../apis/api';


export const createComment = (formValues) => async (dispatch) => {
    const response = await api.post('/comments/create', formValues );
    dispatch({ type: CREATE_COMMENT, payload: response.data });
}

export const getComment = id => async dispatch => {
    const response = await api.get(`/comments/get/${id}`);
    dispatch({ type: GET_COMMENT, payload: response.data });
}

export const retrieveComments = (formValues) => async dispatch => {
    const response = await api.post(`/comments/retrieve`, formValues );
    dispatch({ type: RETRIEVE_COMMENTS, payload: response.data });
}

export const deleteComment = id => async dispatch => {
    const response = await api.delete(`/comments/delete/${id}`);
    dispatch({ type: DELETE_COMMENT, payload: response.data });
}

export const editComment = (id, formValues) => async dispatch => {
    const response = await api.put(`/comments/edit/${id}`, formValues);
    dispatch({ type: EDIT_COMMENT, payload: response.data });
}