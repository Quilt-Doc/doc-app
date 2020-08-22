import {
    CREATE_REPOSITORYITEM,
    GET_REPOSITORYITEM,
    EDIT_REPOSITORYITEM,
    DELETE_REPOSITORYITEM,
    RETRIEVE_REPOSITORYITEMS,
    ATTACH_DOCUMENT,
    REMOVE_DOCUMENT
} from '../actions/types/RepositoryItem_Types';

import _ from 'lodash';


export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_REPOSITORYITEM:
            return { ...state, [action.payload._id]: action.payload };
        case GET_REPOSITORYITEM:
            return { ...state, [action.payload._id]: action.payload };
        case RETRIEVE_REPOSITORYITEMS:
            return { ..._.mapKeys(action.payload, '_id') };
        case DELETE_REPOSITORYITEM:
            return _.omit(state, action.payload._id);
        case EDIT_REPOSITORYITEM:
            return { ...state, [action.payload._id]: action.payload };
        case ATTACH_DOCUMENT:
            let changedAttach = { ..._.mapKeys(action.payload, '_id') };
            return { ...state, ...changedAttach}
        case REMOVE_DOCUMENT:
            let changedRemove = { ..._.mapKeys(action.payload, '_id') };
            return { ...state, ...changedRemove}
        default:
            return state
    }
}