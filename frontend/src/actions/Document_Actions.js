import {
    CREATE_DOCUMENT,
    GET_DOCUMENT,
    RETRIEVE_DOCUMENTS,
    DELETE_DOCUMENT,
    EDIT_DOCUMENT,
    DOCUMENT_ATTACH_TAG,
    DOCUMENT_REMOVE_TAG,
    DOCUMENT_ATTACH_SNIPPET,
    DOCUMENT_REMOVE_SNIPPET,
    DOCUMENT_ATTACH_PARENT,
    DOCUMENT_REMOVE_PARENT,
    DOCUMENT_ATTACH_UPLOADFILE,
    DOCUMENT_REMOVE_UPLOADFILE,
    DOCUMENT_ADD_CANWRITE,
    DOCUMENT_REMOVE_CANWRITE,
    DOCUMENT_ADD_CANREAD,
    DOCUMENT_REMOVE_CANREAD,
    ATTACH_CHILD,
    REMOVE_CHILD
} from './types/Document_Types';

import { api } from '../apis/api';


export const createDocument = (formValues) => async (dispatch) => {
    const response = await api.post('/documents/create', formValues );
    dispatch({ type: CREATE_DOCUMENT, payload: response.data });
    return response.data
}

export const createChild = (formValues) => async (dispatch) => {
    const response = await api.post('/documents/create', formValues );
    return response.data
}

export const getDocument = id => async dispatch => {
    const response = await api.get(`/documents/get/${id}`);
    dispatch({ type: GET_DOCUMENT, payload: response.data });
    return response.data
}

export const retrieveChildren = (formValues) => async () => {
    const response = await api.post(`/documents/retrieve`, formValues );
    return response.data
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

export const documentAttachTag = (id, tagID) => async (dispatch) => {
    const response = await api.put(`/documents/attach_tag/${id}`, { tagID });
    dispatch({ type: DOCUMENT_ATTACH_TAG, payload: response.data });
}

export const documentRemoveTag = (id, tagID) => async (dispatch) => {
    const response = await api.put(`/documents/remove_tag/${id}`, { tagID });
    dispatch({ type: DOCUMENT_REMOVE_TAG, payload: response.data });
}


export const attachChild = (id, childID) => async (dispatch) => {
    const response = await api.put(`/documents/attach_child/${id}`, { childID });
    dispatch({ type: ATTACH_CHILD, payload: response.data });
}

export const removeChild = (id, childID) => async (dispatch) => {
    const response = await api.put(`/documents/remove_child/${id}`, { childID });
    dispatch({ type: REMOVE_CHILD, payload: response.data });
}

export const documentAttachParent = (id, parentID) => async (dispatch) => {
    const response = await api.put(`/documents/attach_parent/${id}`, { parentID });
    dispatch({ type: DOCUMENT_ATTACH_PARENT, payload: response.data });
}

export const documentRemoveParent = (id, parentID) => async (dispatch) => {
    const response = await api.put(`/documents/remove_parent/${id}`, { parentID });
    dispatch({ type: DOCUMENT_REMOVE_PARENT, payload: response.data });
}

export const documentAttachUploadFile = (id, uploadFileID) => async (dispatch) => {
    const response = await api.put(`/documents/attach_uploadfile/${id}`, { uploadFileID });
    dispatch({ type: DOCUMENT_ATTACH_UPLOADFILE, payload: response.data });
}

export const documentRemoveUploadFile = (id, uploadFileID) => async (dispatch) => {
    const response = await api.put(`/documents/remove_uploadfile/${id}`, { uploadFileID });
    dispatch({ type: DOCUMENT_REMOVE_UPLOADFILE, payload: response.data });
}

export const documentAddCanWrite = (id, userID) => async (dispatch) => {
    const response = await api.put(`/documents/add_canwrite/${id}`, { userID });
    dispatch({ type: DOCUMENT_ADD_CANWRITE, payload: response.data });
}

export const documentRemoveCanWrite = (id, userID) => async (dispatch) => {
    const response = await api.put(`/documents/remove_canwrite/${id}`, { userID });
    dispatch({ type: DOCUMENT_REMOVE_CANWRITE, payload: response.data });
}

export const documentAddCanRead = (id, userID) => async (dispatch) => {
    const response = await api.put(`/documents/add_canread/${id}`, { userID });
    dispatch({ type: DOCUMENT_ADD_CANREAD, payload: response.data });
}

export const documentRemoveCanRead = (id, userID) => async (dispatch) => {
    const response = await api.put(`/documents/remove_canread/${id}`, { userID });
    dispatch({ type: DOCUMENT_REMOVE_CANREAD, payload: response.data });
}
