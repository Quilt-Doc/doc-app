import {
    RETRIEVE_SEARCH_RESULTS,
    RETRIEVE_INFOBANK_RESULTS
} from './types/Search_Types';

import { api } from '../apis/api';

export const retrieveSearchResults = (formValues) => async (dispatch) => {
    const response = await api.post('/workspaces/search', formValues );
    dispatch({ type: RETRIEVE_SEARCH_RESULTS, payload: response.data.result });
}

export const retrieveInfobankResults = (formValues, newSearch) => async (dispatch) => {
    const response = await api.post('/workspaces/search', formValues );
    dispatch({ type: RETRIEVE_INFOBANK_RESULTS, payload: response.data.result, misc: {limit: formValues.limit, newSearch}});
}
