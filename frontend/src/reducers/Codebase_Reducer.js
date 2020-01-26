import {
    CREATE_CODEBASE,
    GET_CODEBASE,
    DELETE_CODEBASE
} from '../actions/types/Codebase_Types'

import _ from 'lodash';


export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_CODEBASE:
            return { ...state, [action.payload._id]: action.payload };
        case GET_CODEBASE:
            return { ...state, [action.payload._id]: action.payload };
        case DELETE_CODEBASE:
            return _.omit(state, action.payload._id);
        default: 
            return state;
    }
}
