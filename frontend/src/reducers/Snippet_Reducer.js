import {
    CREATE_SNIPPET,
    GET_SNIPPET,
    EDIT_SNIPPET,
    DELETE_SNIPPET,
    RETRIEVE_SNIPPETS
} from '../actions/types/Snippet_Types'

import _ from 'lodash';


const merge = (state, payload) => {
    state = {...state};
    payload.map(item => {
        const { _id } = item;
        if (_id in state) {
            const currentItem = state[item._id];
            state[_id] = {...currentItem, ...item};
        } else {
            state[_id] = item;
        }
    });
    
    return state;
}

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
            return merge(state, [action.payload]);
        default:
            return state
    }
}