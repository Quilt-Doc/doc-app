import {
    CREATE_FOLDER,
    EDIT_FOLDER,
    GET_FOLDER,
    DELETE_FOLDER,
    RETRIEVE_FOLDERS,
    FOLDER_ATTACH_SNIPPET,
    FOLDER_REMOVE_SNIPPET,
    FOLDER_ATTACH_UPLOAD_FILE,
    FOLDER_REMOVE_UPLOAD_FILE,
    FOLDER_ATTACH_TAG,
    FOLDER_REMOVE_TAG,
    FOLDER_ADD_CAN_WRITE,
    FOLDER_REMOVE_CAN_WRITE,
    FOLDER_ADD_CAN_READ,
    FOLDER_REMOVE_CAN_READ,
} from './types/Folder_Types';


import _ from 'lodash';


export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_FOLDER:
            return { ...state, [action.payload._id]: action.payload };
        case GET_FOLDER:
            return { ...state, [action.payload._id]: action.payload };
        case RETRIEVE_FOLDERS:
            return { ..._.mapKeys(action.payload, '_id') };
        case DELETE_FOLDER:
            return _.omit(state, action.payload._id);
        case EDIT_FOLDER:
            return { ...state, [action.payload._id]: action.payload };
        case FOLDER_ATTACH_TAG:
            return { ...state, [action.payload._id]: action.payload };
        case FOLDER_REMOVE_TAG:
            return { ...state, [action.payload._id]: action.payload };
        case FOLDER_ATTACH_SNIPPET:
            return { ...state, [action.payload._id]: action.payload };
        case FOLDER_REMOVE_SNIPPET:
            return { ...state, [action.payload._id]: action.payload };
        case FOLDER_ATTACH_UPLOAD_FILE:
            return { ...state, [action.payload._id]: action.payload };
        case FOLDER_REMOVE_UPLOAD_FILE:
            return { ...state, [action.payload._id]: action.payload };
        case FOLDER_ADD_CAN_WRITE:
            return { ...state, [action.payload._id]: action.payload };
        case FOLDER_REMOVE_CAN_WRITE:
            return { ...state, [action.payload._id]: action.payload };
        case FOLDER_ADD_CAN_READ:
            return { ...state, [action.payload._id]: action.payload };
        case FOLDER_REMOVE_CAN_READ:
            return { ...state, [action.payload._id]: action.payload };
        default: 
            return state;
    }
}
