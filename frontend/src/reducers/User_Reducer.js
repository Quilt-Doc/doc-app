import {
    CREATE_USER,
    GET_USER,
    EDIT_USER,
    DELETE_USER,
    RETRIEVE_USERS,
    USER_ATTACH_WORKSPACE,
    USER_REMOVE_WORKSPACE
} from '../actions/types/User_Types'

import _ from 'lodash';


export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_USER:
            return { ...state, [action.payload._id]: action.payload };
        case GET_USER:
            return { ...state, [action.payload._id]: action.payload };
        case RETRIEVE_USERS:
            return { ..._.mapKeys(action.payload, '_id') };
        case DELETE_USER:
            return _.omit(state, action.payload._id);
        case EDIT_USER:
            return { ...state, [action.payload._id]: action.payload };
        case USER_ATTACH_WORKSPACE:
            return { ...state, [action.payload._id]: action.payload };
        case USER_REMOVE_WORKSPACE:
            return { ...state, [action.payload._id]: action.payload };
        default:
            return state
    }
}