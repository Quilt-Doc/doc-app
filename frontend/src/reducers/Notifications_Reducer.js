import {
    RETRIEVE_NOTIFICATIONS
} from '../actions/types/Notification_Types';

import _ from 'lodash';

export default (state = [], action) => {
    switch (action.type) {
        case RETRIEVE_NOTIFICATIONS:
            if (action.wipe) {
                return action.payload;
            } else {
                return [...state, ...action.payload];
            }
        default:
            return state;
    }
}



