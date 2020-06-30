import {
    SCROLL_RIGHT_VIEW
} from './types/UI_Types'


export const updateRightViewScroll = (scrollTop) => (dispatch) => {
    dispatch({ type: SCROLL_RIGHT_VIEW, payload: scrollTop});
}

