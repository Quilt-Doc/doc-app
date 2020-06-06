import {
    CREATE_COMMENT,
    GET_COMMENT,
    EDIT_COMMENT,
    DELETE_COMMENT,
    RETRIEVE_COMMENTS
} from '../actions/types/Comment_Types'

import _ from 'lodash';


export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_COMMENT:
            return { ...state, [action.payload._id]: action.payload };
        case GET_COMMENT:
            return { ...state, [action.payload._id]: action.payload };
        case RETRIEVE_COMMENTS:
            return { ..._.mapKeys(action.payload, '_id') };
        case DELETE_COMMENT:
            return _.omit(state, action.payload._id);
        case EDIT_COMMENT:
            return { ...state, [action.payload._id]: action.payload };
        default:
            return state
    }
}