import {
    CREATE_FOLDER,
    EDIT_FOLDER,
    GET_FOLDER,
    DELETE_FOLDER,
    RETRIEVE_FOLDERS,
    FOLDER_ATTACH_SNIPPET,
    FOLDER_REMOVE_SNIPPET,
    FOLDER_ATTACH_UPLOAD_FILE,
    FOLDER_REMOVE_UPLOAD_FILE,
    FOLDER_ATTACH_TAG,
    FOLDER_REMOVE_TAG,
    FOLDER_ADD_CAN_WRITE,
    FOLDER_REMOVE_CAN_WRITE,
    FOLDER_ADD_CAN_READ,
    FOLDER_REMOVE_CAN_READ,
} from './types/Folder_Types';

import { api } from '../apis/api';


export const createFolder = (formValues) => async (dispatch) => {
    const response = await api.post('/folders/create', formValues );
    return response.data;
    // dispatch({ type: CREATE_FOLDER, payload: response.data });
}

// /folders/edit/:id
export const editFolder = (id, formValues) => async dispatch => {
    const response = await api.put(`/folders/edit/${id}`, formValues);
    dispatch({ type: EDIT_FOLDER, payload: response.data });
}

// /folders/get/:id
export const getFolder = id => async dispatch => {
    const response = await api.get(`/folders/get/${id}`);
    dispatch({ type: GET_FOLDER, payload: response.data });
}

// /folders/delete/:id
export const deleteFolder = id => async dispatch => {
    const response = await api.delete(`/folders/delete/${id}`);
    dispatch({ type: DELETE_FOLDER, payload: response.data });
}

export const retrieveFolders = (workspaceId, formValues) => async dispatch => {
    const response = await api.post(`/folders/retrieve/`, {...formValues, workspaceId});
    dispatch({ type: RETRIEVE_FOLDERS, payload: response.data });
}

export const retrieveChildren = (parentId) => async () => {
    const response = await api.post(`/folders/retrieve/`, {parentId});
    return response.data
}

// /folders/attach_snippet/:id
export const folderAttachSnippet = (id, snippetId) => async (dispatch) => {
    const response = await api.put(`/folders/attach_snippet/${id}`, { snippetId });
    dispatch({ type: FOLDER_ATTACH_SNIPPET, payload: response.data });
}

// /folders/remove_snippet/:id
export const folderRemoveSnippet = (id, snippetId) => async (dispatch) => {
    const response = await api.put(`/folders/remove_snippet/${id}`, { snippetId });
    dispatch({ type: FOLDER_REMOVE_SNIPPET, payload: response.data });
}

// /folders/attach_upload_file/:id
export const folderAttachUploadFile = (id, uploadFileId) => async (dispatch) => {
    const response = await api.put(`/folders/attach_upload_file/${id}`, { uploadFileId });
    dispatch({ type: FOLDER_ATTACH_UPLOAD_FILE, payload: response.data });
}

// /folders/remove_upload_file/:id
export const folderRemoveUploadFile = (id, uploadFileId) => async (dispatch) => {
    const response = await api.put(`/folders/remove_upload_file/${id}`, { uploadFileId });
    dispatch({ type: FOLDER_REMOVE_UPLOAD_FILE, payload: response.data });
}

// /folders/attach_tag/:id
export const folderAttachTag = (id, tagId) => async (dispatch) => {
    const response = await api.put(`/folders/attach_tag/${id}`, { tagId });
    dispatch({ type: FOLDER_ATTACH_TAG, payload: response.data });
}

// /folders/remove_tag/:id
export const folderRemoveTag = (id, tagId) => async (dispatch) => {
    const response = await api.put(`/folders/remove_tag/${id}`, { tagId });
    dispatch({ type: FOLDER_REMOVE_TAG, payload: response.data });
}

// /folders/add_can_write/:id
export const folderAddCanWrite = (id, userId) => async (dispatch) => {
    const response = await api.put(`/folders/add_can_write/${id}`, { userId });
    dispatch({ type: FOLDER_ADD_CAN_WRITE, payload: response.data });
}

// /folders/remove_can_write/:id
export const folderRemoveCanWrite = (id, userId) => async (dispatch) => {
    const response = await api.put(`/folders/remove_can_write/${id}`, { userId });
    dispatch({ type: FOLDER_REMOVE_CAN_WRITE, payload: response.data });
}

// /folders/add_can_read/:id
export const folderAddCanRead = (id, userId) => async (dispatch) => {
    const response = await api.put(`/folders/add_can_read/${id}`, { userId });
    dispatch({ type: FOLDER_ADD_CAN_READ, payload: response.data });
}
// /folders/remove_can_read/:id
export const folderRemoveCanRead = (id, userId) => async (dispatch) => {
    const response = await api.put(`/folders/remove_can_read/${id}`, { userId });
    dispatch({ type: FOLDER_REMOVE_CAN_READ, payload: response.data });
}