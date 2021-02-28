import {
    CREATE_LINKAGE,
    GET_LINKAGE,
    EDIT_LINKAGE,
    DELETE_LINKAGE,
    RETRIEVE_LINKAGES,
    ATTACH_LINKAGE_TAG,
    ATTACH_LINKAGE_REFERENCE,
    REMOVE_LINKAGE_TAG,
    REMOVE_LINKAGE_REFERENCE 
} from '../actions/types/Linkage_Types'

import _ from 'lodash';


export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_LINKAGE:
            return { ...state, [action.payload._id]: action.payload };
        case GET_LINKAGE:
            return { ...state, [action.payload._id]: action.payload };
        case RETRIEVE_LINKAGES:
            return { ..._.mapKeys(action.payload, '_id') };
        case DELETE_LINKAGE:
            return _.omit(state, action.payload._id);
        case EDIT_LINKAGE:
            return { ...state, [action.payload._id]: action.payload };
        case ATTACH_LINKAGE_TAG:
            return { ...state, [action.payload._id]: action.payload };
        case ATTACH_LINKAGE_REFERENCE:
            return { ...state, [action.payload._id]: action.payload };
        case REMOVE_LINKAGE_TAG:
            return { ...state, [action.payload._id]: action.payload };
        case REMOVE_LINKAGE_REFERENCE:
            return { ...state, [action.payload._id]: action.payload };
        default:
            return state
    }
}