import {
    RETRIEVE_REFERENCES
} from '../actions/types/Reference_Types';


import _ from 'lodash';

export default (state = {}, action) => {
    switch (action.type) {
        /*
        case CREATE_REFERENCE:
            return { ...state, [action.payload._id]: action.payload};
        case GET_REFERENCE:
            return { ...state, [action.payload._id]: action.payload};
        case DELETE_REFERENCE:
            return _.omit(state, action.payload._id);
        */
        case RETRIEVE_REFERENCES:
            return { ..._.mapKeys(action.payload, '_id') };
        default: 
            return state;
    }
}

