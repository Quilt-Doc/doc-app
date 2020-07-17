import {
    RETRIEVE_REFERENCES,
    EDIT_REFERENCE
} from './types/Reference_Types';

import { api } from '../apis/api';

export const retrieveReferences = (formValues) => async dispatch => {
    const response = await api.post('/references/retrieve', formValues);
    console.log("DATA", response.data)
    dispatch({ type: RETRIEVE_REFERENCES, payload: response.data });
}

export const editReference = (id, formValues) => async dispatch => {
    const response = await api.put(`/references/edit/${id}`, formValues);
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