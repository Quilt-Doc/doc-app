import {
    CREATE_DOCUMENT, GET_DOCUMENT, RETRIEVE_DOCUMENTS, DELETE_DOCUMENT, 
    EDIT_DOCUMENT, ATTACH_DOCUMENT_TAG, REMOVE_DOCUMENT_TAG, ATTACH_DOCUMENT_SNIPPET, 
    REMOVE_DOCUMENT_SNIPPET, REMOVE_DOCUMENT_PARENT, ATTACH_DOCUMENT_UPLOADFILE, 
    REMOVE_DOCUMENT_UPLOADFILE, ADD_DOCUMENT_CANWRITE, REMOVE_DOCUMENT_CANWRITE, 
    ADD_DOCUMENT_CANREAD, REMOVE_DOCUMENT_CANREAD
} from '../actions/types/Document_Types'

import _ from 'lodash';


export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_DOCUMENT:
            return { ...state, [action.payload._id]: action.payload };
        case GET_DOCUMENT:
            return { ...state, [action.payload._id]: action.payload };
        case RETRIEVE_DOCUMENTS:
            return { ..._.mapKeys(action.payload, '_id') };
        case DELETE_DOCUMENT:
            return _.omit(state, action.payload._id);
        case EDIT_DOCUMENT:
            return { ...state, [action.payload._id]: action.payload };
        case ATTACH_DOCUMENT_TAG:
            return { ...state, [action.payload._id]: action.payload };
        case REMOVE_DOCUMENT_TAG:
            return { ...state, [action.payload._id]: action.payload };
        case ATTACH_DOCUMENT_SNIPPET:
            return { ...state, [action.payload._id]: action.payload };
        case REMOVE_DOCUMENT_SNIPPET:
            return { ...state, [action.payload._id]: action.payload };
        case ATTACH_DOCUMENT_PARENT:
            return { ...state, [action.payload._id]: action.payload };
        case REMOVE_DOCUMENT_PARENT:
            return { ...state, [action.payload._id]: action.payload };
        case ATTACH_DOCUMENT_UPLOADFILE:
            return { ...state, [action.payload._id]: action.payload };
        case REMOVE_DOCUMENT_UPLOADFILE:
            return { ...state, [action.payload._id]: action.payload };
        case ADD_DOCUMENT_CANWRITE:
            return { ...state, [action.payload._id]: action.payload };
        case REMOVE_DOCUMENT_CANWRITE:
            return { ...state, [action.payload._id]: action.payload };
        case ADD_DOCUMENT_CANREAD:
            return { ...state, [action.payload._id]: action.payload };
        case REMOVE_DOCUMENT_CANREAD:
            return { ...state, [action.payload._id]: action.payload };
        default: 
            return state;
    }
}
