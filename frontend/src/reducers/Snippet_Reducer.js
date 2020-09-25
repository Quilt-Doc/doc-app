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
             // add snippet
            return { ...state, [action.payload._id]: action.payload };
        case GET_SNIPPET:
            // add/replace snippet
            return { ...state, [action.payload._id]: action.payload };
        case RETRIEVE_SNIPPETS:
            // map snippets to state
            return { ..._.mapKeys(action.payload, '_id') };
        case DELETE_SNIPPET:
            // omit snippet from state
            return _.omit(state, action.payload._id);
        case EDIT_SNIPPET:
            // merge incoming snippet values with snippet in state
            return _.merge({...state}, {[action.payload._id]: action.payload});
        default:
            return state
    }
}