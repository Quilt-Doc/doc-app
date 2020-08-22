
import {
    ADD_SELECTED,
    DELETE_SELECTED,
    CLEAR_SELECTED
} from '../actions/types/Selected_Types'

import _ from 'lodash';


export default (state = {}, action) => {
    
    switch (action.type) {
       
        case ADD_SELECTED:
            return { ...state, [action.payload._id]: action.payload };
        case DELETE_SELECTED:
            return _.omit(state, action.payload._id);
        case CLEAR_SELECTED:
            return {}
        default:
            return state
    }
}