import {
    CREATE_TAG,
    GET_TAG,
    EDIT_TAG,
    DELETE_TAG,
    RETRIEVE_TAGS
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
        case RETRIEVE_TAGS:
            console.log("RETRIEVE TAGS", { ..._.mapKeys(action.payload, '_id') })
            return  _.mapKeys(action.payload, '_id');
        default:
            return state
    }
}