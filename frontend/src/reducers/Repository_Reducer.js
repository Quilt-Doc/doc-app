import {
    CREATE_REPOSITORY,
    GET_REPOSITORY,
    DELETE_REPOSITORY,
    RETRIEVE_REPOSITORIES,
    SET_CURRENT_REPOSITORY
} from '../actions/types/Repository_Types';


import _ from 'lodash';

export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_REPOSITORY:
            return { ...state, [action.payload._id]: action.payload};
        case GET_REPOSITORY:
            return { ...state, [action.payload._id]: action.payload};
        case DELETE_REPOSITORY:
            return _.omit(state, action.payload._id);
        case RETRIEVE_REPOSITORIES:
            return { ..._.mapKeys(action.payload, '_id') };
        default: 
            return state;
    }
}