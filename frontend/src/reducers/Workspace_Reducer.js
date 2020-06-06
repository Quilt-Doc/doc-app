import {
    CREATE_WORKSPACE,
    GET_WORKSPACE,
    WORKSPACE_ADD_USER,
    DELETE_WORKSPACE,
    WORKSPACE_REMOVE_USER
} from '../actions/types/Workspace_Types'

import _ from 'lodash';


export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_WORKSPACE:
            return { ...state, [action.payload._id]: action.payload };
        case GET_WORKSPACE:
            return { ...state, [action.payload._id]: action.payload };
        case DELETE_WORKSPACE:
            return _.omit(state, action.payload._id);
        case WORKSPACE_ADD_USER:
            return { ...state, [action.payload._id]: action.payload };
        case WORKSPACE_REMOVE_USER:
            return { ...state, [action.payload._id]: action.payload };
        default: 
            return state;
    }
}