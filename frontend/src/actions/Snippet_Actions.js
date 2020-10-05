import {
    CREATE_SNIPPET,
    GET_SNIPPET,
    EDIT_SNIPPET,
    DELETE_SNIPPET,
    RETRIEVE_SNIPPETS
} from './types/Snippet_Types'

import { api } from '../apis/api';

// DONE
export const createSnippet = (formValues) => async (dispatch) => {
    console.log('Creating snippet with values: ');
    console.log(formValues);

    const workspaceId = formValues.workspaceId;
    const referenceId = formValues.referenceId;

    if (!workspaceId) {
        throw new Error("createSnippet: workspaceId not provided");
    }
    if (!referenceId) {
        throw new Error("createSnippet: referenceId not provided");
    }

    const response = await api.post(`/snippets/${workspaceId}/${referenceId}/create`, formValues );

    if (response.data.success == false) {
        console.log(response.data.error.toString());
        throw new Error("createSnippet Error: ", response.data.error.toString());
    }
    else {
        console.log("SNIPPET HERE", response.data.result);
        dispatch({ type: CREATE_SNIPPET, payload: response.data.result });
    }
}

// DONE
export const getSnippet = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    const snippetId = formValues.snippetId;

    if (!workspaceId) {
        throw new Error("getSnippet: workspaceId not provided");
    }
    if (!snippetId) {
        throw new Error("getSnippet: snippetId not provided");
    }

    const response = await api.get(`/snippets/${workspaceId}/get/${snippetId}`);

    if (response.data.success == false) {
        throw new Error("getSnippet Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: GET_SNIPPET, payload: response.data.result });
    }
}

// DONE
export const retrieveSnippets = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;

    if (!workspaceId) {
        throw new Error("retrieveSnippets: workspaceId not provided");
    }

    const response = await api.post(`/snippets/${workspaceId}/retrieve`, formValues );
    if (response.data.success == false) {
        throw new Error("retrieveSnippets Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: RETRIEVE_SNIPPETS, payload: response.data.result});
    }
}

// DONE
export const deleteSnippet = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    const snippetId = formValues.snippetId;

    if (!workspaceId) {
        throw new Error("getSnippet: workspaceId not provided");
    }
    if (!snippetId) {
        throw new Error("getSnippet: snippetId not provided");
    }

    
    const response = await api.delete(`/snippets/${workspaceId}/delete/${snippetId}`);

    if (response.data.success == false) {
        throw new Error("deleteSnippet Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: DELETE_SNIPPET, payload: response.data.result });
    }
}

export const editSnippet = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    const snippetId = formValues.snippetId;

    if (!workspaceId) {
        throw new Error("editSnippet: workspaceId not provided");
    }
    if (!snippetId) {
        throw new Error("editSnippet: snippetId not provided");
    }

    const response = await api.put(`/snippets/${workspaceId}/edit/${snippetId}`, formValues);

    if (response.data.success == false) {
        throw new Error("editSnippet Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: EDIT_SNIPPET, payload: response.data.result });
    }
}