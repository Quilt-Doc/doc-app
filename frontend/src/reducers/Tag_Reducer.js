import {
    CREATE_TAG,
    GET_TAG,
    EDIT_TAG,
    DELETE_TAG,
} from '../actions/types/Tag_Types'

import _ from 'lodash';


export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_TAG:
            return { ...state, [action.payload._id]: action.payload };
        case GET_TAG:
            return { ...state, [action.payload._id]: action.payload };
        case DELETE_TAG:
            return _.omit(state, action.payload._id);
        case EDIT_TAG:
            return { ...state, [action.payload._id]: action.payload };
        default:
            return state
    }
}