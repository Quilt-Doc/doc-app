import {
    SCROLL_RIGHT_VIEW,
    SET_CREATION
} from './types/UI_Types'


export const updateRightViewScroll = (scrollTop) => (dispatch) => {
    dispatch({ type: SCROLL_RIGHT_VIEW, payload: scrollTop});
}

export const setCreation = (creationMode) => (dispatch) => {
    dispatch({ type: SET_CREATION, payload: creationMode});
}

