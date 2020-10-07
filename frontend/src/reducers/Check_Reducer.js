import {
   RETRIEVE_CHECKS
} from '../actions/types/Check_Types'

import _ from 'lodash';

export default (state = {}, action) => {
    switch (action.type) {
        case RETRIEVE_CHECKS:
            return _.mapKeys(action.payload, '_id');
        default: 
            return state;
    }
}