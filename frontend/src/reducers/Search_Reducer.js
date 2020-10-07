import {
    RETRIEVE_SEARCH_RESULTS,
    RETRIEVE_INFOBANK_RESULTS
} from '../actions/types/Search_Types'

import _ from 'lodash';


let initialState = {
    docSkip: 0,
    refSkip: 0,
    linkageSkip: 0,
    infobankResults: [],
    searchResults: [],
    hasMore: true
}

export default (state = initialState, action) => {
    switch (action.type) {
        case RETRIEVE_SEARCH_RESULTS:
            return { ...state, searchResults: action.payload.searchResults };
        case RETRIEVE_INFOBANK_RESULTS:
            let {searchResults, docSkip, refSkip, linkageSkip}  = action.payload;
            let {limit, newSearch} = action.misc;
            
            let infobankResults = [];

            if (!newSearch) {
                infobankResults = [...state.infobankResults, ...searchResults];

                docSkip = state.docSkip + docSkip;
                linkageSkip = state.linkageSkip + linkageSkip;
                refSkip = state.refSkip + refSkip;
            } else {
                infobankResults = [...searchResults]
            }


            let hasMore = searchResults.length > 0 && searchResults.length % limit === 0;

            return {...state, infobankResults, docSkip, refSkip, linkageSkip, hasMore};
        default:
            return state
    }
}