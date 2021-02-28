import {
    RETRIEVE_REFERENCES,
    EDIT_REFERENCE,
    CREATE_REFERENCE,
    GET_REFERENCE,
    DELETE_REFERENCE
} from '../actions/types/Reference_Types';

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
        case CREATE_REFERENCE:
             // add reference 
            return { ...state, [action.payload._id]: action.payload};
        case GET_REFERENCE:
            // add/replace reference 
            return { ...state, [action.payload._id]: action.payload};
        case EDIT_REFERENCE:
            // merge incoming single doc payload with state
            return merge(state, [action.payload]);
        case DELETE_REFERENCE:
            // omit deleted references from state
            return _.omit(state, action.payload._id);
        case RETRIEVE_REFERENCES:
            // wipe state, map references array by each one's id to full object
            let roots = Object.values(state).filter(ref => ref.path === "");
            let refs = [...action.payload, ...roots];
            return { ..._.mapKeys(refs, '_id') };
        default: 
            return state;
    }
}

