import {
    CREATE_DOCUMENT,
    GET_DOCUMENT,
    RETRIEVE_DOCUMENTS,
    RETRIEVE_MORE_DOCUMENTS,
    DELETE_DOCUMENT,
    EDIT_DOCUMENT,
    ATTACH_TAG,
    REMOVE_TAG,
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
    REMOVE_CHILD,
    GET_PARENT,
    MOVE_DOCUMENT
} from './types/Document_Types';

import { api } from '../apis/api';

//create, move, 

export const createDocument = (formValues) => async (dispatch) => {
    const response = await api.post('/documents/create', formValues );
    dispatch({ type: CREATE_DOCUMENT, payload: response.data.result });
    return response.data
}

export const moveDocument = (formValues) => async (dispatch) => {
    const response = await api.put('/documents/move', formValues );
    dispatch({ type: MOVE_DOCUMENT, payload: response.data.result });
}

export const createChild = (formValues) => async (dispatch) => {
    const response = await api.post('/documents/create', formValues );
    return response.data
}
export const getParent = id => async dispatch => {
    const response = await api.get(`/documents/get_parent/${id}`);
    dispatch({ type: GET_PARENT, payload: response.data });
    return response.data
}

export const getDocument = id => async dispatch => {
    const response = await api.get(`/documents/get/${id}`);
    dispatch({ type: GET_DOCUMENT, payload: response.data });
    return response.data
}

export const renameDocument = (formValues) => async dispatch => {
    const response = await api.put(`/documents/rename`, formValues);
    dispatch({ type: RETRIEVE_DOCUMENTS, payload: response.data.result });
}

export const retrieveChildren = (formValues) => async () => {
    const response = await api.post(`/documents/retrieve`, formValues );
    return response.data
}

export const retrieveDocuments = (formValues) => async dispatch => {
    const response = await api.post(`/documents/retrieve`, formValues );
    console.log("RESPONSE", response.data)
    dispatch({ type: RETRIEVE_DOCUMENTS, payload: response.data });
}

export const retrieveMoreDocuments = (formValues) => async dispatch => {
    const response = await api.post(`/documents/retrieve`, formValues );
    dispatch({ type: RETRIEVE_MORE_DOCUMENTS, payload: response.data });
}

export const deleteDocument = id => async dispatch => {
    const response = await api.delete(`/documents/delete/${id}`);
    dispatch({ type: DELETE_DOCUMENT, payload: response.data.result });
}

export const editDocument = (id, formValues) => async dispatch => {
    const response = await api.put(`/documents/edit/${id}`, formValues);
    dispatch({ type: EDIT_DOCUMENT, payload: response.data });
}

export const attachTag = (id, tagId) => async (dispatch) => {
    const response = await api.put(`/documents/attach_tag/${id}`, { tagId });
    dispatch({ type: ATTACH_TAG, payload: response.data });
}

export const removeTag = (id, tagId) => async (dispatch) => {
    const response = await api.put(`/documents/remove_tag/${id}`, { tagId });
    dispatch({ type: REMOVE_TAG, payload: response.data });
}


export const attachReference = (id, referenceId) =>  async (dispatch) => {
    const response = await api.put(`/documents/attach_reference/${id}`, { referenceId });
    dispatch({ type: EDIT_DOCUMENT, payload: response.data });
}

export const removeReference = (id, referenceId) =>  async (dispatch) => {
    const response = await api.put(`/documents/remove_reference/${id}`, { referenceId });
    dispatch({ type: EDIT_DOCUMENT, payload: response.data });
}

export const attachChild = (id, childId) => async (dispatch) => {
    const response = await api.put(`/documents/attach_child/${id}`, { childId });
    dispatch({ type: ATTACH_CHILD, payload: response.data });
}

export const removeChild = (id, childId) => async (dispatch) => {
    const response = await api.put(`/documents/remove_child/${id}`, { childId });
    dispatch({ type: REMOVE_CHILD, payload: response.data });
}

export const documentAttachParent = (id, parentId) => async (dispatch) => {
    const response = await api.put(`/documents/attach_parent/${id}`, { parentId });
    dispatch({ type: DOCUMENT_ATTACH_PARENT, payload: response.data });
}

export const documentRemoveParent = (id, parentId) => async (dispatch) => {
    const response = await api.put(`/documents/remove_parent/${id}`, { parentId });
    dispatch({ type: DOCUMENT_REMOVE_PARENT, payload: response.data });
}

export const documentAttachUploadFile = (id, uploadFileId) => async (dispatch) => {
    const response = await api.put(`/documents/attach_uploadfile/${id}`, { uploadFileId });
    dispatch({ type: DOCUMENT_ATTACH_UPLOADFILE, payload: response.data });
}

export const documentRemoveUploadFile = (id, uploadFileId) => async (dispatch) => {
    const response = await api.put(`/documents/remove_uploadfile/${id}`, { uploadFileId });
    dispatch({ type: DOCUMENT_REMOVE_UPLOADFILE, payload: response.data });
}

export const documentAddCanWrite = (id, userId) => async (dispatch) => {
    const response = await api.put(`/documents/add_canwrite/${id}`, { userId });
    dispatch({ type: DOCUMENT_ADD_CANWRITE, payload: response.data });
}

export const documentRemoveCanWrite = (id, userId) => async (dispatch) => {
    const response = await api.put(`/documents/remove_canwrite/${id}`, { userId });
    dispatch({ type: DOCUMENT_REMOVE_CANWRITE, payload: response.data });
}

export const documentAddCanRead = (id, userId) => async (dispatch) => {
    const response = await api.put(`/documents/add_canread/${id}`, { userId });
    dispatch({ type: DOCUMENT_ADD_CANREAD, payload: response.data });
}

export const documentRemoveCanRead = (id, userId) => async (dispatch) => {
    const response = await api.put(`/documents/remove_canread/${id}`, { userId });
    dispatch({ type: DOCUMENT_REMOVE_CANREAD, payload: response.data });
}
