import {
    RETRIEVE_CHECKS
} from './types/Check_Types';

import { api } from '../apis/api';

export const retrieveChecks = (formValues) => async dispatch => {

    const { workspaceId, repositoryId } = formValues;

    if (!workspaceId) {
        throw new Error("retrieveChecks: workspaceId not provided");
    }

    if (!repositoryId) {
        throw new Error("retrieveChecks: repositoryId not provided");
    }

    const response = await api.post(`/checks/${workspaceId}/${repositoryId}/retrieve`, formValues );

    const { success, error, result } = response.data;

    if (!success) {
        throw new Error(error);
    } else {
        dispatch({ type: RETRIEVE_CHECKS, payload: result });
    }
}
