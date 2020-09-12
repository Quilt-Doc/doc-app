import {
    CREATE_LINKAGE,
    GET_LINKAGE,
    EDIT_LINKAGE,
    RETRIEVE_LINKAGES,
    DELETE_LINKAGE,
    ATTACH_LINKAGE_TAG,
    ATTACH_LINKAGE_REFERENCE,
    REMOVE_LINKAGE_TAG,
    REMOVE_LINKAGE_REFERENCE 
} from './types/Linkage_Types';

import { api } from '../apis/api';

export const createLinkage = (formValues) => async (dispatch) => {
    const response = await api.post('/linkages/create', formValues );
    dispatch({ type: CREATE_LINKAGE, payload: response.data.result });
}

export const getLinkage = (linkageId) => async (dispatch) => {
    const response = await api.get(`/linkages/get/${linkageId}`);
    dispatch({ type: GET_LINKAGE, payload: response.data });
}

export const editLinkage = (linkageId, formValues) => async (dispatch) => {
    const response = await api.put(`/linkages/edit/${linkageId}`, formValues);
    dispatch({ type: EDIT_LINKAGE, payload: response.data });
}

export const deleteLinkage = (linkageId) => async (dispatch) => {
    const response = await api.delete(`/linkages/delete/${linkageId}`);
    dispatch({ type: DELETE_LINKAGE, payload: response.data });
}

export const retrieveLinkages = (formValues) => async (dispatch) => {
    const response = await api.get(`/linkages/retrieve`, formValues);
    dispatch({ type: RETRIEVE_LINKAGES, payload: response.data });
}

export const attachLinkageTag = (linkageId, tagId) => async (dispatch) => {
    const response = await api.put(`/linkages/attach_tag/${linkageId}`, {tagId});
    dispatch({ type: ATTACH_LINKAGE_TAG, payload: response.data });
}

export const attachLinkageReference = (linkageId, referenceId) => async (dispatch) => {
    const response = await api.put(`/linkages/attach_reference/${linkageId}`, {referenceId});
    dispatch({ type: ATTACH_LINKAGE_REFERENCE, payload: response.data });
}

export const removeLinkageTag = (linkageId, tagId) => async (dispatch) => {
    const response = await api.put(`/linkages/remove_tag/${linkageId}`, {tagId});
    dispatch({ type: REMOVE_LINKAGE_TAG, payload: response.data });
}

export const removeLinkageReference = (linkageId, referenceId) => async (dispatch) => {
    const response = await api.put(`/linkages/remove_reference/${linkageId}`, {referenceId});
    dispatch({ type: REMOVE_LINKAGE_REFERENCE, payload: response.data });
}