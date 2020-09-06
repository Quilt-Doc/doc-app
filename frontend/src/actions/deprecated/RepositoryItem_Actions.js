import {
    CREATE_REPOSITORYITEM,
    GET_REPOSITORYITEM,
    EDIT_REPOSITORYITEM,
    DELETE_REPOSITORYITEM,
    RETRIEVE_REPOSITORYITEMS,
    ATTACH_DOCUMENT,
    REMOVE_DOCUMENT
} from './types/RepositoryItem_Types'

import { api } from '../apis/api';


export const createRepositoryItem = (formValues) => async (dispatch) => {
    const response = await api.post('/repository/items/create', formValues );
    dispatch({ type: CREATE_REPOSITORYITEM, payload: response.data });
}

export const getRepositoryItem = id => async dispatch => {
    const response = await api.get(`/repository/items/get/${id}`);
    dispatch({ type: GET_REPOSITORYITEM, payload: response.data });
}

export const retrieveRepositoryItems = (formValues) => async dispatch => {
    console.log('Called with formValues: ');
    console.log(formValues);
    const response = await api.post(`/repository/items/retrieve`, formValues );
    console.log(response.data)
    dispatch({ type: RETRIEVE_REPOSITORYITEMS, payload: response.data });
}

export const deleteRepositoryItem = id => async dispatch => {
    const response = await api.delete(`/repository/items/delete/${id}`);
    dispatch({ type: DELETE_REPOSITORYITEM, payload: response.data });
}

export const editRepositoryItem = (id, formValues) => async dispatch => {
    const response = await api.put(`/repository/items/edit/${id}`, formValues);
    dispatch({ type: EDIT_REPOSITORYITEM, payload: response.data });
}

export const attachDocument = (formValues) => async dispatch => {
    const response = await api.post(`repository/items/attach_document`, formValues);
    dispatch({ type: ATTACH_DOCUMENT, payload: response.data });
}

export const removeDocument = (formValues) => async dispatch => {
    const response = await api.post(`repository/items/remove_document`, formValues);
    dispatch({ type: REMOVE_DOCUMENT, payload: response.data });
}