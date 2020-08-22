import {
    CREATE_SNIPPET,
    GET_SNIPPET,
    EDIT_SNIPPET,
    DELETE_SNIPPET,
    RETRIEVE_SNIPPETS
} from '../actions/types/Snippet_Types'

import _ from 'lodash';


export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_SNIPPET:
            return { ...state, [action.payload._id]: action.payload };
        case GET_SNIPPET:
            return { ...state, [action.payload._id]: action.payload };
        case RETRIEVE_SNIPPETS:
            return { ..._.mapKeys(action.payload, 'start') };
        case DELETE_SNIPPET:
            return _.omit(state, action.payload._id);
        case EDIT_SNIPPET:
            return { ...state, [action.payload._id]: action.payload };
        default:
            return state
    }
}