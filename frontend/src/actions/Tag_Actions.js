import {
    CREATE_TAG,
    GET_TAG,
    EDIT_TAG,
    DELETE_TAG,
    RETRIEVE_TAGS
} from './types/Tag_Types'

import { api } from '../apis/api';


export const createTag = (formValues) => async (dispatch) => {
    const { workspaceId } = formValues;

    if (!workspaceId) {
        throw new Error("retrieveTags: workspaceId not provided");
    }

    const response = await api.post(`/tags/${workspaceId}/create`, formValues );

    if (response.data.success == false) {
        throw new Error(response.data.error);
    } else {
        dispatch({ type: CREATE_TAG, payload: response.data.result });
        return response.data.result;
    }
}

export const getTag = formValues => async dispatch => {
    const { workspaceId, tagId } = formValues;

    if (!workspaceId) {
        throw new Error("retrieveTags: workspaceId not provided");
    }

    if (!tagId) {
        throw new Error("retrieveTags: tagId not provided");
    }

    const response = await api.get(`/tags/${workspaceId}/get/${tagId}`);

    if (response.data.success == false) {
        throw new Error(response.data.error);
    } else {
        dispatch({ type: GET_TAG, payload: response.data.result });
        return response.data.result;
    }
}

export const retrieveTags = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;

    if (!workspaceId) {
        throw new Error("retrieveTags: workspaceId not provided");
    }

    const response = await api.post(`/tags/${workspaceId}/retrieve`, formValues );

    if (response.data.success == false) {
        throw new Error(response.data.error);
    } else {
        dispatch({ type: RETRIEVE_TAGS, payload: response.data.result });
    }
}

export const deleteTag = formValues => async dispatch => {
    const { workspaceId, tagId } = formValues;

    if (!workspaceId) {
        throw new Error("retrieveTags: workspaceId not provided");
    }

    if (!tagId) {
        throw new Error("retrieveTags: tagId not provided");
    }

    const response = await api.delete(`/tags/${workspaceId}/delete/${tagId}`);

    if (response.data.success == false) {
        throw new Error(response.data.error);
    } else {
        dispatch({ type: DELETE_TAG, payload: response.data.result });
    }
}

export const editTag = (formValues) => async dispatch => {
    const { workspaceId, tagId } = formValues;

    if (!workspaceId) {
        throw new Error("retrieveTags: workspaceId not provided");
    }

    if (!tagId) {
        throw new Error("retrieveTags: tagId not provided");
    }

    const response = await api.put(`/tags/${workspaceId}/edit/${tagId}`, formValues);

    if (response.data.success == false) {
        throw new Error(response.data.error);
    } else {
        dispatch({ type: EDIT_TAG, payload: response.data.result });
    }
    
}

