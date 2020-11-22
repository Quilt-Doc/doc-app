import {
    CREATE_DOCUMENT,
    GET_DOCUMENT,
    RETRIEVE_DOCUMENTS,
    DELETE_DOCUMENT,
    EDIT_DOCUMENT,
    MOVE_DOCUMENT,
    RENAME_DOCUMENT,
    UPLOAD_ATTACHMENT
} from './types/Document_Types';

import { api } from '../apis/api';

export const getDocumentImage = (formValues) => async () => {
    const { workspaceId, documentId } = formValues;

    if (!workspaceId) {
        throw new Error("getDocumentImage: workspaceId not provided");
    }

    if (!documentId) {
        throw new Error("getDocumentImage: documentId not provided");
    }

    const response = await api.post(`/documents/${workspaceId}/get_image/${documentId}`);

    const { error, success, result} = response.data;

    if (!success) {
        throw new Error(error);
    } else {
        return result;
    }
}

export const getUpload = (formValues) => async () => {
    const { fileName } = formValues;

    if (!fileName) {
        throw new Error("getUpload: fileName not provided");
    }

    var response;
    try {
        response = await api.get(`/uploads/${encodeURIComponent(fileName)}`, { responseType: 'blob', timeout: 30000 });
    }
    catch (err) {
        console.log(err);
        return;
    }

    // 1. Convert the data into 'blob'
    // response = response.blob();

    // 2. Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.body]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName.split('/').slice(-1));
    // 3. Append to html page
    document.body.appendChild(link);
    // 4. Force download
    link.click();
    // 5. Clean up and remove the link
    link.parentNode.removeChild(link);
}

export const uploadAttachment = (formValues) => async (dispatch) => {
    const { attachment, documentId, workspaceId, name } = formValues;

    if (!attachment) {
        throw new Error("uploadAttachment: attachment not provided");
    }

    if (!documentId) {
        throw new Error("uploadAttachment: documentId not provided");
    }

    if (!workspaceId) {
        throw new Error("uploadAttachment: workspaceId not provided");
    }

    if (!name) {
        throw new Error("uploadAttachment: name not provided");
    }


    let formData = new FormData();
    formData.append('attachment', attachment);
    formData.append('documentId', documentId);
    formData.append('workspaceId', workspaceId);
    formData.append('name', name);

    const config = {
        headers: {
            'content-type': 'multipart/form-data'
        }
    }

    const response = await api.post(`/uploads/create_attachment`, formData, config);

    const { success, error, result } = response.data;


    if (!success) {
        if (response.data.alert) {
            alert(response.data.alert)
            return false
        } else {
            throw new Error(response.data.error);
        }
    } else {
        dispatch({ type: EDIT_DOCUMENT, payload: result});
    }
}

export const syncEditDocument = (formValues) => (dispatch) => {
    const { _id } = formValues;

    if (!_id) {
        throw new Error("syncEditDocument: documentId not provided");
    }
    
    dispatch({ type: EDIT_DOCUMENT, payload: formValues});
}

// DONE
export const createDocument = (formValues) => async (dispatch) => {
    
    var workspaceId = formValues.workspaceId;
    if (!workspaceId) {
        throw new Error("createDocument: workspaceId not provided");
    }

    const response = await api.post(`/documents/${workspaceId}/create`, formValues );

    if (response.data.success == false) {
        if (response.data.alert) {
            alert(response.data.alert)
            return false
        } else {
            throw new Error(response.data.error);
        }
    }
    else {
        dispatch({ type: CREATE_DOCUMENT, payload: response.data.result });
        return response.data.result;
    }
}

export const retrieveBrokenDocuments  = (formValues) => async () => {

    var workspaceId = formValues.workspaceId;
    if (!workspaceId) {
        throw new Error("retrieveBrokenDocuments: workspaceId not provided");
    }

    const response = await api.post(`/reporting/${workspaceId}/retrieve_broken_documents`, formValues );

    const {success, error, result} = response.data;

    if (!success) {
        throw new Error(error)
    } else {
        return result;
    }
}

export const setDocumentOpen = (formValues) => (dispatch) => {
    const { documentId, open } = formValues;

    if (!documentId) {
        throw new Error("setDocumentOpen: documentId not provided");
    }

    if (open === undefined || open === null) {
        throw new Error("setDocumentOpen: open not provided")
    }

    dispatch({ type: EDIT_DOCUMENT, payload: {_id: documentId, open}});
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

    const response = await api.put(`/documents/${workspaceId}/move/${documentId}`, formValues );

    if (response.data.success == false) {
        throw new Error(response.data.error);
    }
    else {
        dispatch({ type: MOVE_DOCUMENT, payload: response.data.result });
        return response.data.result;
    }

}

// FARAZ TODO: ACTION SHOULD BE DELETED
/*
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
}*/


// FARAZ TODO: ACTION SHOULD NOT RETURN.. USE ID
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
        throw new Error(response.data.error);
    }
    else {
        dispatch({ type: GET_DOCUMENT, payload: response.data.result });
        return response.data.result
    }
}

export const testRoute = (formValues) => async () => {
    await api.post(`/testRoute`, formValues);
}

export const syncRenameDocument = (results) => (dispatch) => {
    console.log("RESULTS IN ACTION", results);
    dispatch({ type: RENAME_DOCUMENT, payload: results });
}

// DONE
export const renameDocument = (formValues) => async (dispatch) => {

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
        if (response.data.alert) {
            alert(response.data.alert)
            return false
        } else {
            throw new Error(response.data.error);
        }
    }
    else {
        dispatch({ type: RENAME_DOCUMENT, payload: response.data.result });
        return response.data.result;
    }
}

// FARAZ TODO: ACTION SHOULD BE DELETED
/*
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
*/

export const searchDocuments = (formValues) => async () => {
    const workspaceId = formValues.workspaceId;
    
    if (!workspaceId) {
        throw new Error("retrieveDocuments: workspaceId not provided");
    }

    const response = await api.post(`/documents/${workspaceId}/search`, formValues);

    if (response.data.success == false) {
        throw new Error(response.data.error);
    } else {
        return response.data.result;
    }
}

// DONE
export const retrieveDocuments = (formValues, wipe, passback) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    
    if (!workspaceId) {
        throw new Error("retrieveDocuments: workspaceId not provided");
    }

    const response = await api.post(`/documents/${workspaceId}/retrieve`, formValues );

    if (response.data.success == false) {
        throw new Error(response.data.error);
    }
    else if (!passback) {
        dispatch({ type: RETRIEVE_DOCUMENTS, payload: response.data.result, wipe});
    } else {
        return response.data.result;
    }
}

// DONE  // FARAZ TODO: ACTION NEEDS TO BE DELETED
/*
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
*/

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
        console.log(response.data.trace);
        throw new Error(response.data.error);
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
        throw new Error(response.data.error);
    }
    else {
        dispatch({ type: EDIT_DOCUMENT, payload: response.data.result });
    }
}

export const attachDocumentTag = (formValues) => async (dispatch) => {


    const workspaceId = formValues.workspaceId;
    const documentId = formValues.documentId;
    const tagId = formValues.tagId;

    if (!workspaceId) {
        throw new Error("attachDocumentTag: workspaceId not provided");
    }

    if (!documentId) {
        throw new Error("attachDocumentTag: documentId not provided");
    }

    if (!tagId) {
        throw new Error("attachDocumentTag: tagId not provided");
    }
    console.log("TAG ATTACHMENT FORMVALUES", formValues);
    const response = await api.put(`/documents/${workspaceId}/${documentId}/attach_tag/${tagId}`);

    if (response.data.success == false) {
        throw new Error(response.data.error.toString());
    }
    else {
        console.log("RESULT", response.data.result);
        dispatch({ type: EDIT_DOCUMENT, payload: response.data.result });
    }
}

export const removeDocumentTag = (formValues) => async (dispatch) => {

    const workspaceId = formValues.workspaceId;
    const documentId = formValues.documentId;
    const tagId = formValues.tagId;

    if (!workspaceId) {
        throw new Error("removeDocumentTag: workspaceId not provided");
    }

    if (!documentId) {
        throw new Error("removeDocumentTag: documentId not provided");
    }

    if (!tagId) {
        throw new Error("removeDocumentTag: tagId not provided");
    }

    const response = await api.put(`/documents/${workspaceId}/${documentId}/remove_tag/${tagId}`);

    if (response.data.success == false) {
        throw new Error(response.data.error.toString());
    }
    else {
        dispatch({ type: EDIT_DOCUMENT, payload: response.data.result });
    }
}


export const attachDocumentReference = (formValues) =>  async (dispatch) => {

    const workspaceId = formValues.workspaceId;
    const documentId = formValues.documentId;
    const referenceId = formValues.referenceId;

    if (!workspaceId) {
        throw new Error("attachDocumentReference: workspaceId not provided");
    }

    if (!documentId) {
        throw new Error("attachDocumentReference: documentId not provided");
    }

    if (!referenceId) {
        throw new Error("attachDocumentReference: referenceId not provided");
    }

    const response = await api.put(`/documents/${workspaceId}/${documentId}/attach_reference/${referenceId}`);

    if (response.data.success == false) {
        throw new Error(response.data.error.toString());
    }
    else {
        dispatch({ type: EDIT_DOCUMENT, payload: response.data.result });
    }
}

export const removeDocumentReference = (formValues) =>  async (dispatch) => {

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
        throw new Error(response.data.error.toString());
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
