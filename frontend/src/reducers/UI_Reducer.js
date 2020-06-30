import {
    SCROLL_RIGHT_VIEW
} from '../actions/types/UI_Types'

const initialState = {
    scrollRightView: 0
}

export default (state = initialState, action) => {
    switch (action.type) {
        case SCROLL_RIGHT_VIEW:
            return { ...state, scrollRightView: action.payload };
        default:
            return state
    }
}