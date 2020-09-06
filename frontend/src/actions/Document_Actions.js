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
    DOCUMENT_ATTACH_UPLOADFILE,
    DOCUMENT_REMOVE_UPLOADFILE,
    DOCUMENT_ADD_CANWRITE,
    DOCUMENT_REMOVE_CANWRITE,
    DOCUMENT_ADD_CANREAD,
    DOCUMENT_REMOVE_CANREAD,
    GET_PARENT,
    MOVE_DOCUMENT
} from './types/Document_Types';

import { api } from '../apis/api';

// DONE
export const createDocument = (formValues) => async (dispatch) => {
    
    var workspaceId = formValues.workspaceId;
    if (!workspaceId) {
        throw new Error("createDocument: workspaceId not provided");
    }

    const response = await api.post(`/documents/${workspaceId}/create`, formValues );

    if (response.data.success == false) {
        console.log(response.data.error.toString());
        throw new Error("createDocument Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: CREATE_DOCUMENT, payload: response.data.result });
        return response.data.result;
    }
}

// DONE
export const moveDocument = (formValues) => async (dispatch) => {

    const workspaceId = formValues.workspaceId;
    const documentId = formValues.documentId;

    if (!workspaceId) {
        throw new Error("moveDocument: workspaceId not provided");
    }

    if (!documentId) {
        throw new Error("moveDocument: documentId not provided");
    }

    const response = await api.put('/documents/move', formValues );

    if (response.data.success == false) {
        throw new Error("createDocument Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: MOVE_DOCUMENT, payload: response.data.result });
        return response.data.result;
    }

}

// DONE
export const createChild = (formValues) => async (dispatch) => {
    
    var workspaceId = formValues.workspaceId;
    if (!workspaceId) {
        throw new Error("createDocument: workspaceId not provided");
    }
    
    const response = await api.post(`/documents/${workspaceId}/create`, formValues );

    if (response.data.success == false) {
        throw new Error("createChild Error: ", response.data.error.toString());
    }
    else {
        return response.data.result;
    }
}

// DONE
export const getParent = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    const documentId = formValues.documentId;

    if (!workspaceId) {
        throw new Error("getParent: workspaceId not provided");
    }

    if (!documentId) {
        throw new Error("getParent: documentId not provided");
    }

    const response = await api.get(`/documents/${workspaceId}/get_parent/${documentId}`);

    if (response.data.success == false) {
        throw new Error("getParent Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: GET_PARENT, payload: response.data.result });
        return response.data.result;
    }
}

// DONE
export const getDocument = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    const documentId = formValues.documentId;

    if (!workspaceId) {
        throw new Error("getDocument: workspaceId not provided");
    }

    if (!documentId) {
        throw new Error("getDocument: documentId not provided");
    }

    const response = await api.get(`/documents/${workspaceId}/get/${documentId}`);

    if (response.data.success == false) {
        throw new Error("getDocument Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: GET_DOCUMENT, payload: response.data.result });
        return response.data.result
    }
}

// DONE
export const renameDocument = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    const documentId = formValues.documentId;

    if (!workspaceId) {
        throw new Error("renameDocument: workspaceId not provided");
    }

    if (!documentId) {
        throw new Error("renameDocument: documentId not provided");
    }

    const response = await api.put(`/documents/${workspaceId}/rename/${documentId}`, formValues);

    if (response.data.success == false) {
        throw new Error("renameDocument Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: RETRIEVE_DOCUMENTS, payload: response.data.result });
    }
}

// DONE
export const retrieveChildren = (formValues) => async () => {

    const workspaceId = formValues.workspaceId;

    if (!workspaceId) {
        throw new Error("retrieveChildren: workspaceId not provided");
    }

    const response = await api.post(`/documents/${workspaceId}/retrieve`, formValues );
    
    if (response.data.success == false) {
        throw new Error("retrieveChildren Error: ", response.data.error.toString());
    }
    else {
        return response.data.result;
    }
}

// DONE
export const retrieveDocuments = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;

    if (!workspaceId) {
        throw new Error("retrieveDocuments: workspaceId not provided");
    }

    const response = await api.post(`/documents/${workspaceId}/retrieve`, formValues );

    if (response.data.success == false) {
        throw new Error("retrieveDocuments Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: RETRIEVE_DOCUMENTS, payload: response.data.result });
    }
}

// DONE
export const retrieveMoreDocuments = (formValues) => async dispatch => {
    
    const workspaceId = formValues.workspaceId;

    if (!workspaceId) {
        throw new Error("retrieveDocuments: workspaceId not provided");
    }

    const response = await api.post(`/documents/${workspaceId}/retrieve`, formValues );

    if (response.data.success == false) {
        throw new Error("retrieveMoreDocuments Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: RETRIEVE_MORE_DOCUMENTS, payload: response.data.result });
    }
}

// DONE
export const deleteDocument = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    const documentId = formValues.documentId;

    if (!workspaceId) {
        throw new Error("deleteDocument: workspaceId not provided");
    }

    if (!documentId) {
        throw new Error("deleteDocument: documentId not provided");
    }

    const response = await api.delete(`/documents/${workspaceId}/delete/${documentId}`);

    if (response.data.success == false) {
        throw new Error("deleteDocument Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: DELETE_DOCUMENT, payload: response.data.result });
    }

}

export const editDocument = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    const documentId = formValues.documentId;

    if (!workspaceId) {
        throw new Error("editDocument: workspaceId not provided");
    }

    if (!documentId) {
        throw new Error("editDocument: documentId not provided");
    }


    const response = await api.put(`/documents/${workspaceId}/edit/${documentId}`, formValues);

    if (response.data.success == false) {
        throw new Error("editDocument Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: EDIT_DOCUMENT, payload: response.data.result });
    }
}

export const attachTag = (formValues) => async (dispatch) => {


    const workspaceId = formValues.workspaceId;
    const documentId = formValues.documentId;
    const tagId = formValues.tagId;

    if (!workspaceId) {
        throw new Error("attachTag: workspaceId not provided");
    }

    if (!documentId) {
        throw new Error("attachTag: documentId not provided");
    }

    if (!tagId) {
        throw new Error("attachTag: tagId not provided");
    }

    const response = await api.put(`/documents/${workspaceId}/${documentId}/attach_tag/${tagId}`);

    if (response.data.success == false) {
        throw new Error("attachTag Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: ATTACH_TAG, payload: response.data.result });
    }
}

export const removeTag = (formValues) => async (dispatch) => {

    const workspaceId = formValues.workspaceId;
    const documentId = formValues.documentId;
    const tagId = formValues.tagId;

    if (!workspaceId) {
        throw new Error("removeTag: workspaceId not provided");
    }

    if (!documentId) {
        throw new Error("removeTag: documentId not provided");
    }

    if (!tagId) {
        throw new Error("removeTag: tagId not provided");
    }

    const response = await api.put(`/documents/${workspaceId}/${documentId}/remove_tag/${tagId}`);

    if (response.data.success == false) {
        throw new Error("removeTag Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: REMOVE_TAG, payload: response.data.result });
    }
}


export const attachReference = (formValues) =>  async (dispatch) => {

    const workspaceId = formValues.workspaceId;
    const documentId = formValues.documentId;
    const referenceId = formValues.referenceId;

    if (!workspaceId) {
        throw new Error("attachReference: workspaceId not provided");
    }

    if (!documentId) {
        throw new Error("attachReference: documentId not provided");
    }

    if (!referenceId) {
        throw new Error("attachReference: referenceId not provided");
    }

    const response = await api.put(`/documents/${workspaceId}/${documentId}/attach_reference/${referenceId}`);

    if (response.data.success == false) {
        throw new Error("attachReference Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: EDIT_DOCUMENT, payload: response.data.result });
    }
}

export const removeReference = (formValues) =>  async (dispatch) => {

    const workspaceId = formValues.workspaceId;
    const documentId = formValues.documentId;
    const referenceId = formValues.referenceId;

    if (!workspaceId) {
        throw new Error("removeReference: workspaceId not provided");
    }

    if (!documentId) {
        throw new Error("removeReference: documentId not provided");
    }

    if (!referenceId) {
        throw new Error("removeReference: referenceId not provided");
    }

    const response = await api.put(`/documents/${workspaceId}/${documentId}/remove_reference/${referenceId}`);

    if (response.data.success == false) {
        throw new Error("removeReference Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: EDIT_DOCUMENT, payload: response.data.result });
    }
}


// Currently Disabled
/*
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
*/
