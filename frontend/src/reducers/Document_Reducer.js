import {
    CREATE_DOCUMENT, GET_DOCUMENT, RETRIEVE_DOCUMENTS, DELETE_DOCUMENT, 
    EDIT_DOCUMENT, DOCUMENT_ATTACH_TAG, DOCUMENT_REMOVE_TAG, DOCUMENT_ATTACH_SNIPPET, 
    DOCUMENT_REMOVE_SNIPPET, DOCUMENT_ATTACH_PARENT, DOCUMENT_REMOVE_PARENT, DOCUMENT_ATTACH_UPLOADFILE, 
    DOCUMENT_REMOVE_UPLOADFILE, DOCUMENT_ADD_CANWRITE, DOCUMENT_REMOVE_CANWRITE, 
    DOCUMENT_ADD_CANREAD, DOCUMENT_REMOVE_CANREAD, ATTACH_CHILD, REMOVE_CHILD, GET_PARENT, RETRIEVE_MORE_DOCUMENTS
} from '../actions/types/Document_Types'

import _ from 'lodash';


export default (state = {}, action) => {
    switch (action.type) {
        case CREATE_DOCUMENT:
            return { ...state, ..._.mapKeys(action.payload, '_id') };
        case GET_DOCUMENT:
            return { ...state, [action.payload._id]: action.payload };
        case RETRIEVE_DOCUMENTS:
            return { ...state, ..._.mapKeys(action.payload, '_id') };
        case DELETE_DOCUMENT:
            let ids = action.payload.result.map(result => result._id);
            return _.omit(state, ids);
        case EDIT_DOCUMENT:
            return { ...state, [action.payload._id]: action.payload };
        case ATTACH_CHILD:
            return { ...state, [action.payload._id]: action.payload };
        case REMOVE_CHILD:
            return { ...state, [action.payload._id]: action.payload };
        case DOCUMENT_ATTACH_TAG:
            return { ...state, [action.payload._id]: action.payload };
        case DOCUMENT_REMOVE_TAG:
            return { ...state, [action.payload._id]: action.payload };
        case DOCUMENT_ATTACH_SNIPPET:
            return { ...state, [action.payload._id]: action.payload };
        case DOCUMENT_REMOVE_SNIPPET:
            return { ...state, [action.payload._id]: action.payload };
        case DOCUMENT_ATTACH_PARENT:
            return { ...state, [action.payload._id]: action.payload };
        case DOCUMENT_REMOVE_PARENT:
            return { ...state, [action.payload._id]: action.payload };
        case DOCUMENT_ATTACH_UPLOADFILE:
            return { ...state, [action.payload._id]: action.payload };
        case DOCUMENT_REMOVE_UPLOADFILE:
            return { ...state, [action.payload._id]: action.payload };
        case DOCUMENT_ADD_CANWRITE:
            return { ...state, [action.payload._id]: action.payload };
        case DOCUMENT_REMOVE_CANWRITE:
            return { ...state, [action.payload._id]: action.payload };
        case DOCUMENT_ADD_CANREAD:
            return { ...state, [action.payload._id]: action.payload };
        case DOCUMENT_REMOVE_CANREAD:
            return { ...state, [action.payload._id]: action.payload };
        case GET_PARENT:
            if (action.payload){
                return { ...state, [action.payload._id]: action.payload };
            }
        default: 
            return state;
    }
}