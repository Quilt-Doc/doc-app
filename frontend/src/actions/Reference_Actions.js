import {
    RETRIEVE_REFERENCES,
    EDIT_REFERENCE
} from './types/Reference_Types';

import { api } from '../apis/api';

export const retrieveReferences = (formValues) => async dispatch => {
    const response = await api.post('/references/retrieve', formValues);
    dispatch({ type: RETRIEVE_REFERENCES, payload: response.data });
}

export const localRetrieveReferences = (formValues) => async dispatch => {
    const response = await api.post('/references/retrieve', formValues);
    return response.data;
}

export const getReferenceFromPath = (formValues) => async dispatch => {
    const response = await api.post('/references/retrieve', formValues);
    return response.data
}

export const editReference = (id, formValues) => async dispatch => {
    const response = await api.put(`/references/edit/${id}`, formValues);
    dispatch({ type: EDIT_REFERENCE, payload: response.data });
}

export const attachTag = (id, tagId) => async dispatch => {
    const response = await api.put(`/references/attach_tag/${id}`, {tagId});
    dispatch({ type: EDIT_REFERENCE, payload: response.data });
}


export const removeTag = (id, tagId) => async dispatch => {
    const response = await api.put(`/references/remove_tag/${id}`, {tagId});
    dispatch({ type: EDIT_REFERENCE, payload: response.data });
}


// Example download link: https://raw.githubusercontent.com/kgodara/snippet-logic-test/master/post_commit.py

export const getContents = (formValues) => async () => {
    const response = await api.post('/references/get_contents', formValues);
    return response.data
}

export const retrieveCodeReferences = (formValues) => async dispatch => {
    const response = await api.post('/references/retrieve_code_references', formValues);
    dispatch({ type: RETRIEVE_REFERENCES, payload: response.data });
}