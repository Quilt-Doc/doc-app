import {
    RETRIEVE_REFERENCES,
    EDIT_REFERENCE
} from './types/Reference_Types';

import { api } from '../apis/api';

// DONE
export const searchReferences = (formValues) => async () => {
    const workspaceId = formValues.workspaceId;
    if (!workspaceId) {
        throw new Error("searchReferences: workspaceId not provided");
    }

    const repositoryId = formValues.repositoryId;
    if (!repositoryId) {
        throw new Error("searchReferences: repositoryId not provided");
    }

    const response = await api.post(`/references/${workspaceId}/search`, formValues);
    if (response.data.success == false) {
        throw new Error("retrieveReferences Error: ", response.data.error.toString());
    } else {
        return response.data.result;
    }
}

export const retrieveReferences = (formValues, passBack) => async dispatch => {
    
    const workspaceId = formValues.workspaceId;
    if (!workspaceId) {
        throw new Error("retrieveReferences: workspaceId not provided");
    }

    const response = await api.post(`/references/${workspaceId}/retrieve`, formValues);
    if (response.data.success == false) {
        throw new Error("retrieveReferences Error: ", response.data.error.toString());
    }
    else {
        if (passBack) return response.data.result;
        dispatch({ type: RETRIEVE_REFERENCES, payload: response.data.result });
    }
}

// DONE
export const localRetrieveReferences = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    if (!workspaceId) {
        throw new Error("localRetrieveReferences: workspaceId not provided");
    }

    const response = await api.post(`/references/${workspaceId}/retrieve`, formValues);

    if (response.data.success == false) {
        throw new Error("localRetrieveReferences Error: ", response.data.error.toString());
    }
    else {
        return response.data.result;
    }
}

// DONE
export const getReferenceFromPath = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    if (!workspaceId) {
        throw new Error("getReferenceFromPath: workspaceId not provided");
    }

    const response = await api.post(`/references/${workspaceId}/retrieve`, formValues);

    if (response.data.success == false) {
        throw new Error("getReferenceFromPath Error: ", response.data.error.toString());
    }
    else {
        return response.data.result;
    }
}

export const editReference = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    const referenceId = formValues.referenceId;

    if (!workspaceId) {
        throw new Error("editReference: workspaceId not provided");
    }
    if (!referenceId) {
        throw new Error("editReference: referenceId not provided");
    }

    const response = await api.put(`/references/${workspaceId}/edit/${referenceId}`, formValues);

    if (response.data.success == false) {
        throw new Error("editReference Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: EDIT_REFERENCE, payload: response.data.result });
    }

}

export const attachReferenceTag = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    const referenceId = formValues.referenceId;
    const tagId = formValues.tagId;

    if (!workspaceId) {
        throw new Error("attachTag: workspaceId not provided");
    }
    if (!referenceId) {
        throw new Error("attachTag: referenceId not provided");
    }
    if (!tagId) {
        throw new Error("attachTag: referenceId not provided");
    }

    const response = await api.put(`/references/${workspaceId}/${referenceId}/attach_tag/${tagId}`);

    if (response.data.success == false) {
        throw new Error("attachTag Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: EDIT_REFERENCE, payload: response.data.result });
    }
}


export const removeReferenceTag = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    const referenceId = formValues.referenceId;
    const tagId = formValues.tagId;

    if (!workspaceId) {
        throw new Error("removeTag: workspaceId not provided");
    }
    if (!referenceId) {
        throw new Error("removeTag: referenceId not provided");
    }
    if (!tagId) {
        throw new Error("removeTag: referenceId not provided");
    }

    const response = await api.put(`/references/${workspaceId}/${referenceId}/remove_tag/${tagId}`);

    if (response.data.success == false) {
        throw new Error("removeTag Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: EDIT_REFERENCE, payload: response.data.result });
    }
}

// DONE
export const retrieveCodeReferences = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;

    if (!workspaceId) {
        throw new Error("retrieveCodeReferences: workspaceId not provided");
    }

    const response = await api.post(`/references/${workspaceId}/retrieve_code_references`, formValues);

    if (response.data.success == false) {
        throw new Error("retrieveCodeReferences Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: RETRIEVE_REFERENCES, payload: response.data.result });
    }
}