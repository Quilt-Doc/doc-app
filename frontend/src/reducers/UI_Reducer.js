import {
    SCROLL_RIGHT_VIEW, 
    SET_CREATION,
    SET_REQUEST_CREATION,
    SET_DOCUMENT_LOADED
} from '../actions/types/UI_Types'

const initialState = {
    scrollRightView: 0,
    creating: false,
    creatingRequest: false,
    documentLoaded: false
}

export default (state = initialState, action) => {
    switch (action.type) {
        case SET_DOCUMENT_LOADED: 
            return {...state, documentLoaded: action.payload};
        case SET_CREATION:
            return { ...state,  creating: action.payload};
        case SCROLL_RIGHT_VIEW:
            return { ...state, scrollRightView: action.payload };
        case SET_REQUEST_CREATION:
            return { ...state, creatingRequest: action.payload };
        default:
            return state
    }
}