import {
    REFRESH_REPOSITORY_PATH,
    GET_REPOSITORY_FILE,
    PARSE_REPOSITORY_FILE,
    CLEAR_REPOSITORY_FILE,
    REFRESH_REPOSITORY_PATH_NEW,
    UPDATE_REPOSITORY_REFS,
    CREATE_REPOSITORY,
    GET_REPOSITORY,
    DELETE_REPOSITORY,
    RETRIEVE_REPOSITORIES,
    SET_CURRENT_REPOSITORY
} from '../actions/types/Repository_Types';


import _ from 'lodash';

export default (state = {}, action) => {
    let repositories = state.repositories
    switch (action.type) {
        case CREATE_REPOSITORY:
            return { ...state, [action.payload._id]: action.payload};
        case GET_REPOSITORY:
            return { ...state, [action.payload._id]: action.payload};
        case DELETE_REPOSITORY:
            return _.omit(state, action.payload._id);
        case RETRIEVE_REPOSITORIES:
            return { ..._.mapKeys(action.payload, '_id') };
        case SET_CURRENT_REPOSITORY:
            return {[action.payload._id]: action.payload}
        default: 
            return state;
    }
}