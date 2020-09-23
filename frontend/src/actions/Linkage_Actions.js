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



// DONE
export const createLinkage = (formValues) => async (dispatch) => {
    
    var workspaceId = formValues.workspaceId;
    if (!workspaceId) {
        throw new Error("createLinkage: workspaceId not provided");
    }

    const response = await api.post(`/linkages/${workspaceId}/create`, formValues );

    if (response.data.success == false) {
        throw new Error("createLinkage Error: ", response.data.error.toString());
    } else {
        dispatch({ type: CREATE_LINKAGE, payload: response.data.result });
    }
}


// DONE
export const getLinkage = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    const linkageId = formValues.linkageId;

    if (!workspaceId) {
        throw new Error("getLinkage: workspaceId not provided");
    }

    if (!linkageId) {
        throw new Error("getLinkage: linkageId not provided");
    }

    const response = await api.get(`/linkages/${workspaceId}/get/${linkageId}`);

    if (response.data.success == false) {
        throw new Error("getLinkage Error: ", response.data.error.toString());
    }

    else {
        dispatch({ type: GET_LINKAGE, payload: response.data.result });
        return response.data.result
    }
}


export const editLinkage = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    const linkageId = formValues.linkageId;

    if (!workspaceId) {
        throw new Error("editLinkage: workspaceId not provided");
    }

    if (!linkageId) {
        throw new Error("editLinkage: linkageId not provided");
    }


    const response = await api.put(`/linkages/${workspaceId}/edit/${linkageId}`, formValues);

    if (response.data.success == false) {
        throw new Error("editLinkage Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: EDIT_LINKAGE, payload: response.data.result });
    }
}


export const deleteLinkage = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;
    const linkageId = formValues.linkageId;

    if (!workspaceId) {
        throw new Error("deleteLinkage: workspaceId not provided");
    }

    if (!linkageId) {
        throw new Error("deleteLinkage: linkageId not provided");
    }

    const response = await api.delete(`/linkages/${workspaceId}/delete/${linkageId}`);

    if (response.data.success == false) {
        throw new Error("deleteLinkage Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: DELETE_LINKAGE, payload: response.data.result });
    }

}


export const retrieveLinkages = (formValues) => async dispatch => {

    const workspaceId = formValues.workspaceId;

    if (!workspaceId) {
        throw new Error("retrieveLinkages: workspaceId not provided");
    }

    const response = await api.post(`/linkages/${workspaceId}/retrieve`, formValues );

    if (response.data.success == false) {
        throw new Error("retrieveLinkages Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: RETRIEVE_LINKAGES, payload: response.data.result });
    }
}



export const attachLinkageTag = (formValues) => async (dispatch) => {

    const workspaceId = formValues.workspaceId;
    const linkageId = formValues.linkageId;
    const tagId = formValues.tagId;

    if (!workspaceId) {
        throw new Error("attachLinkageTag: workspaceId not provided");
    }

    if (!linkageId) {
        throw new Error("attachLinkageTag: linkageId not provided");
    }

    if (!tagId) {
        throw new Error("attachLinkageTag: tagId not provided");
    }

    const response = await api.put(`/linkages/${workspaceId}/${linkageId}/attach_tag/${tagId}`);

    if (response.data.success == false) {
        throw new Error("attachLinkageTag Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: ATTACH_LINKAGE_TAG, payload: response.data.result });
    }
}


export const attachLinkageReference = (formValues) => async (dispatch) => {
     
    const workspaceId = formValues.workspaceId;
    const linkageId = formValues.linkageId;
    const referenceId = formValues.referenceId;

    if (!workspaceId) {
        throw new Error("attachLinkageReference: workspaceId not provided");
    }

    if (!linkageId) {
        throw new Error("attachLinkageReference: linkageId not provided");
    }

    if (!referenceId) {
        throw new Error("attachLinkageReference: referenceId not provided");
    }

    const response = await api.put(`/linkages/${workspaceId}/${linkageId}/attach_reference/${referenceId}`);

    if (response.data.success == false) {
        throw new Error("attachLinkageReference Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: ATTACH_LINKAGE_REFERENCE, payload: response.data.result });
    }
}

export const removeLinkageTag = (formValues) => async (dispatch) => {

    const workspaceId = formValues.workspaceId;
    const linkageId = formValues.linkageId;
    const tagId = formValues.tagId;

    if (!workspaceId) {
        throw new Error("removeLinkageTag: workspaceId not provided");
    }

    if (!linkageId) {
        throw new Error("removeLinkageTag: linkageId not provided");
    }

    if (!tagId) {
        throw new Error("removeLinkageTag: tagId not provided");
    }

    const response = await api.put(`/linkages/${workspaceId}/${linkageId}/remove_tag/${tagId}`);

    if (response.data.success == false) {
        throw new Error("removeLinkageTag Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: REMOVE_LINKAGE_TAG, payload: response.data.result });
    }
}

export const removeLinkageReference = (formValues) => async (dispatch) => {

    const workspaceId = formValues.workspaceId;
    const linkageId = formValues.linkageId;
    const referenceId = formValues.referenceId;

    if (!workspaceId) {
        throw new Error("removeLinkageReference: workspaceId not provided");
    }

    if (!linkageId) {
        throw new Error("removeLinkageReference: linkageId not provided");
    }

    if (!referenceId) {
        throw new Error("removeLinkageReference: referenceId not provided");
    }

    const response = await api.put(`/linkages/${workspaceId}/${linkageId}/remove_reference/${referenceId}`);

    if (response.data.success == false) {
        throw new Error("removeLinkageReference Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: REMOVE_LINKAGE_REFERENCE, payload: response.data.result });
    }
}