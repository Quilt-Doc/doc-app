import {
    SCROLL_RIGHT_VIEW,
    SET_CREATION,
    SET_REQUEST_CREATION
} from './types/UI_Types'


export const updateRightViewScroll = (scrollTop) => (dispatch) => {
    dispatch({ type: SCROLL_RIGHT_VIEW, payload: scrollTop});
}

export const setCreation = (creationMode) => (dispatch) => {
    dispatch({ type: SET_CREATION, payload: creationMode});
}

export const setRequestCreation = (creationMode) => (dispatch) => {
    dispatch({ type: SET_REQUEST_CREATION, payload: creationMode});
}