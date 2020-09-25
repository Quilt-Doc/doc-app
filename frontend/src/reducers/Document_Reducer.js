import {
    CREATE_DOCUMENT, GET_DOCUMENT, RETRIEVE_DOCUMENTS, DELETE_DOCUMENT, 
    EDIT_DOCUMENT, MOVE_DOCUMENT, RENAME_DOCUMENT
} from '../actions/types/Document_Types'

import _ from 'lodash';

// POPULATION: If in reducer state, the following should be populated at all times:
//  author references snippets workspace repository tags

// If in reducer state, the following should not be populated ever:
// children

export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_DOCUMENT:
            // merge incoming payload with new state
            return _.merge({...state}, _.mapKeys(action.payload, '_id'));
        case GET_DOCUMENT:
            // replace or add whole document to state
            return { ...state, [action.payload._id]: action.payload };
        case RETRIEVE_DOCUMENTS:
            // merge incoming payload with new state
            if (action.wipe) return _.mapKeys(action.payload, '_id');
            return _.merge({...state}, _.mapKeys(action.payload, '_id'));
        case EDIT_DOCUMENT:
            // merge incoming single doc payload with state
            return _.merge({...state}, {[action.payload._id]: action.payload});
        case MOVE_DOCUMENT:
            // merge incoming payload with new state
            return _.merge({...state}, _.mapKeys(action.payload, '_id'));
        case RENAME_DOCUMENT:
            // merge incoming payload with new state
            return _.merge({...state}, _.mapKeys(action.payload, '_id'));
        case DELETE_DOCUMENT:
            const { deletedDocuments, parent } = action.payload; 

            // omit documents that are deleted from state
            let omitted = _.omit(state, deletedDocuments.map(doc => doc._id));

            // if parent of top level deleted doc is gone, update it in the state
            if (parent) {
                return _.merge(omitted, {[parent._id]: parent});
            } else {
                return omitted;
            }
        default: 
            return state;
    }
}