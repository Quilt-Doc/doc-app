import {
    RETRIEVE_SEARCH_RESULTS,
    RETRIEVE_INFOBANK_RESULTS
} from './types/Search_Types';

import { api } from '../apis/api';

export const retrieveSearchResults = (formValues) => async (dispatch) => {

    const workspaceId = formValues.workspaceId;

    if (!workspaceId) {
        throw new Error("retrieveSearchResults: workspaceId not provided");
    }

    const response = await api.post(`/workspaces/search/${workspaceId}`, formValues );

    if (response.data.success == false) {
        throw new Error("retrieveSearchResults Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: RETRIEVE_SEARCH_RESULTS, payload: response.data.result });
    }
}

export const retrieveInfobankResults = (formValues, newSearch) => async (dispatch) => {
    const workspaceId  = formValues.workspaceId;
    const limit = formValues.limit;

    if (!workspaceId) {
        throw new Error("retrieveInfobankResults: workspaceId not provided");
    }

    const response = await api.post(`/workspaces/search/${workspaceId}`, formValues );

    if (response.data.success == false) {
        throw new Error("retrieveInfobankResults: Error: ", response.data.error.toString());
    }
    else {
        dispatch({ type: RETRIEVE_INFOBANK_RESULTS, payload: response.data.result, misc: {limit, newSearch}});
    }
}
