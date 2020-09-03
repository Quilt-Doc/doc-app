import {
    RETRIEVE_REFERENCES,
    EDIT_REFERENCE
} from './types/Reference_Types';

import { api } from '../apis/api';

// DONE
export const retrieveReferences = (formValues) => async dispatch => {
    
    const workspaceId = formValues.workspaceId;
    if (!workspaceId) {
        throw new Error("retrieveReferences: workspaceId not provided");
    }

    const response = await api.post(`/references/${workspaceId}/retrieve`, formValues);

    if (response.data.success == false) {
        throw new Error("retrieveReferences Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: RETRIEVE_REFERENCES, payload: response.data.result });
    }

}

<<<<<<< HEAD
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
=======
export const localRetrieveReferences = (formValues) => async () => {
    const response = await api.post('/references/retrieve_references_dropdown', formValues);
    return response.data;
>>>>>>> 18bcacd53e6f9e483e57724e2210d65a898887fb
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

export const attachTag = (formValues) => async dispatch => {

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


export const removeTag = (formValues) => async dispatch => {

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