import {
    CREATE_DOCUMENT,
    GET_DOCUMENT,
    RETRIEVE_DOCUMENTS,
    DELETE_DOCUMENT,
    EDIT_DOCUMENT,
    ATTACH_DOCUMENT_TAG,
    REMOVE_DOCUMENT_TAG,
    ATTACH_DOCUMENT_SNIPPET,
    REMOVE_DOCUMENT_SNIPPET,
    ATTACH_DOCUMENT_PARENT,
    REMOVE_DOCUMENT_PARENT,
    ATTACH_DOCUMENT_UPLOADFILE,
    REMOVE_DOCUMENT_UPLOADFILE,
    ADD_DOCUMENT_CANWRITE,
    REMOVE_DOCUMENT_CANWRITE,
    ADD_DOCUMENT_CANREAD,
    REMOVE_DOCUMENT_CANREAD
} from './types/Document_Types';

import api from '../apis/api';


export const createDocument = (formValues) => async (dispatch) => {
    const response = await api.post('/documents/create', formValues );
    dispatch({ type: CREATE_DOCUMENT, payload: response.data });
}

export const getDocument = id => async dispatch => {
    const response = await api.get(`/documents/get/${id}`);
    dispatch({ type: GET_DOCUMENT, payload: response.data });
}

export const retrieveDocuments = (formValues) => async dispatch => {
    const response = await api.post(`/documents/retrieve`, formValues );
    dispatch({ type: RETRIEVE_DOCUMENTS, payload: response.data });
}

export const deleteDocument = id => async dispatch => {
    const response = await api.delete(`/documents/delete/${id}`);
    dispatch({ type: DELETE_DOCUMENT, payload: response.data });
}

export const editDocument = (id, formValues) => async dispatch => {
    const response = await api.put(`/documents/edit/${id}`, formValues);
    dispatch({ type: EDIT_DOCUMENT, payload: response.data });
}

export const attachDocumentTag = (id, tagID) => async (dispatch) => {
    const response = await api.put(`/documents/attach_tag/${id}`, { tagID });
    dispatch({ type: ATTACH_DOCUMENT_TAG, payload: response.data });
}

export const removeDocumentTag = (id, tagID) => async (dispatch) => {
    const response = await api.put(`/documents/remove_tag/${id}`, { tagID });
    dispatch({ type: REMOVE_DOCUMENT_TAG, payload: response.data });
}


export const attachDocumentSnippet = (id, snippetID) => async (dispatch) => {
    const response = await api.put(`/documents/attach_snippet/${id}`, { snippetID });
    dispatch({ type: ATTACH_DOCUMENT_SNIPPET, payload: response.data });
}

export const removeDocumentSnippet = (id, snippetID) => async (dispatch) => {
    const response = await api.put(`/documents/remove_snippet/${id}`, { snippetID });
    dispatch({ type: REMOVE_DOCUMENT_SNIPPET, payload: response.data });
}

export const attachDocumentParent = (id, parentID) => async (dispatch) => {
    const response = await api.put(`/documents/attach_parent/${id}`, { parentID });
    dispatch({ type: ATTACH_DOCUMENT_PARENT, payload: response.data });
}

export const removeDocumentParent = (id, parentID) => async (dispatch) => {
    const response = await api.put(`/documents/remove_parent/${id}`, { parentID });
    dispatch({ type: REMOVE_DOCUMENT_PARENT, payload: response.data });
}

export const attachDocumentUploadFile = (id, uploadFileID) => async (dispatch) => {
    const response = await api.put(`/documents/attach_uploadfile/${id}`, { uploadFileID });
    dispatch({ type: ATTACH_DOCUMENT_UPLOADFILE, payload: response.data });
}

export const removeDocumentUploadFile = (id, uploadFileID) => async (dispatch) => {
    const response = await api.put(`/documents/remove_uploadfile/${id}`, { uploadFileID });
    dispatch({ type: REMOVE_DOCUMENT_UPLOADFILE, payload: response.data });
}

export const addDocumentCanWrite = (id, userID) => async (dispatch) => {
    const response = await api.put(`/documents/add_canwrite/${id}`, { userID });
    dispatch({ type: ADD_DOCUMENT_CANWRITE, payload: response.data });
}

export const removeDocumentCanWrite = (id, userID) => async (dispatch) => {
    const response = await api.put(`/documents/remove_canwrite/${id}`, { userID });
    dispatch({ type: REMOVE_DOCUMENT_CANWRITE, payload: response.data });
}

export const addDocumentCanRead = (id, userID) => async (dispatch) => {
    const response = await api.put(`/documents/add_canread/${id}`, { userID });
    dispatch({ type: ADD_DOCUMENT_CANREAD, payload: response.data });
}

export const removeDocumentCanRead = (id, userID) => async (dispatch) => {
    const response = await api.put(`/documents/remove_canread/${id}`, { userID });
    dispatch({ type: REMOVE_DOCUMENT_CANREAD, payload: response.data });
}