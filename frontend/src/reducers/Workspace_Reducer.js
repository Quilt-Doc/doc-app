import {
    CREATE_WORKSPACE,
    GET_WORKSPACE,
    RETRIEVE_WORKSPACES,
    DELETE_WORKSPACE,
    EDIT_WORKSPACE
} from '../actions/types/Workspace_Types'

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

// NEED TO UPDATE CURRENT WORKSPACE ON WORKSPACE CHANGE
export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_WORKSPACE:
            return { ...state, [action.payload._id]: action.payload };
        case GET_WORKSPACE:
            return { ...state, [action.payload._id]: action.payload };
        case DELETE_WORKSPACE:
            return _.omit(state, action.payload._id); 
        case EDIT_WORKSPACE:
            return merge(state, [action.payload]);
        case RETRIEVE_WORKSPACES:
            return { ..._.mapKeys(action.payload, '_id') };
        default: 
            return state;
    }
}