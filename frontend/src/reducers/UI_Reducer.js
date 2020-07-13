import {
    SCROLL_RIGHT_VIEW, 
    SET_CREATION
} from '../actions/types/UI_Types'

const initialState = {
    scrollRightView: 0,
    creating: false
}

export default (state = initialState, action) => {
    switch (action.type) {
        case SET_CREATION:
            return { ...state,  creating: action.payload};
        case SCROLL_RIGHT_VIEW:
            return { ...state, scrollRightView: action.payload };
        default:
            return state
    }
}