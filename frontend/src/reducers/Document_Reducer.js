import {
    CREATE_DOCUMENT, GET_DOCUMENT, RETRIEVE_DOCUMENTS, DELETE_DOCUMENT, 
    EDIT_DOCUMENT, MOVE_DOCUMENT, RENAME_DOCUMENT
} from '../actions/types/Document_Types'

import _ from 'lodash';

// POPULATION: If in reducer state, the following should be populated at all times:
//  author references snippets workspace repository tags

// If in reducer state, the following should not be populated ever:
// children
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
        case CREATE_DOCUMENT:
            // merge incoming payload with new state
            return merge(state, action.payload);
        case GET_DOCUMENT:
            // replace or add whole document to state
            if (state[action.payload._id]) {
                action.payload.open = state[action.payload._id].open;
            } 

            return { ...state, [action.payload._id]: action.payload };
        case RETRIEVE_DOCUMENTS:
            // merge incoming payload with new state
            if (action.wipe) return _.mapKeys(action.payload, '_id');
            return merge(state, action.payload);
        case EDIT_DOCUMENT:
            // merge incoming single doc payload with state
            return merge(state, [action.payload]);
        case MOVE_DOCUMENT:
            // merge incoming payload with new state
            return merge(state, action.payload);
        case RENAME_DOCUMENT:
            // merge incoming payload with new state
            return merge(state, action.payload);
        case DELETE_DOCUMENT:
            const { deletedDocuments, parent } = action.payload; 

            // omit documents that are deleted from state
            let remaining = _.omit(state, deletedDocuments.map(doc => doc._id));

            // if parent of top level deleted doc is gone, update it in the state
            if (parent) {
                return merge(remaining, [parent]);
            } else {
                return remaining;
            }
        default: 
            return state;
    }
}