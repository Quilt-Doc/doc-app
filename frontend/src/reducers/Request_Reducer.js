import {
    CREATE_REQUEST,
    GET_REQUEST,
    EDIT_REQUEST,
    DELETE_REQUEST,
    RETRIEVE_REQUESTS
} from '../actions/types/Request_Types'

import _ from 'lodash';


export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_REQUEST:
            return { ...state, [action.payload._id]: action.payload };
        case GET_REQUEST:
            return { ...state, [action.payload._id]: action.payload };
        case RETRIEVE_REQUESTS:
            return { ..._.mapKeys(action.payload, '_id') };
        case DELETE_REQUEST:
            return _.omit(state, action.payload._id);
        case EDIT_REQUEST:
            return { ...state, [action.payload._id]: action.payload };
        default:
            return state
    }
}