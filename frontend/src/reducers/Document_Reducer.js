import {
    CREATE_DOCUMENT
} from '../actions/types/Document_Types'

import _ from 'lodash';


export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_DOCUMENT:
            return {...state, [action.payload._id]: action.payload}
        default: 
            return state;
    }
}
