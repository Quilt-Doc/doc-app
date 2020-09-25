import {
    RETRIEVE_REFERENCES,
    EDIT_REFERENCE,
    CREATE_REFERENCE,
    GET_REFERENCE,
    DELETE_REFERENCE
} from '../actions/types/Reference_Types';


import _ from 'lodash';

export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_REFERENCE:
             // add reference 
            return { ...state, [action.payload._id]: action.payload};
        case GET_REFERENCE:
            // add/replace reference 
            return { ...state, [action.payload._id]: action.payload};
        case EDIT_REFERENCE:
            // merge incoming single doc payload with state
            return _.merge({...state}, {[action.payload._id]: action.payload});
        case DELETE_REFERENCE:
            // omit deleted references from state
            return _.omit(state, action.payload._id);
        case RETRIEVE_REFERENCES:
            // wipe state, map references array by each one's id to full object
            return { ..._.mapKeys(action.payload, '_id') };
        default: 
            return state;
    }
}

