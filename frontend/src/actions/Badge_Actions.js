import {
    GET_BADGE
} from './types/Badge_Types';


import { api } from '../apis/api';

export const getBadge = (formValues) => async dispatch => {

    const { workspaceId, repositoryId } = formValues;

    if (!workspaceId) {
        throw new Error("getBadge: workspaceId not provided");
    }

    if (!repositoryId) {
        throw new Error("getBadge: repositoryId not provided");
    }

    const response = await api.get(
        `/badges/status/?workspaceId=${workspaceId}&repositoryId=${repositoryId}`, formValues );

    console.log("BADGE RESPONSE", response);
    /*
    const { success, error, result } = response.data;

    if (!success) {
        throw new Error(error);
    } else {
        dispatch({ type: RETRIEVE_CHECKS, payload: result });
    }*/
}
