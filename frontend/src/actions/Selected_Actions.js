import {
    ADD_SELECTED,
    DELETE_SELECTED,
    CLEAR_SELECTED
} from './types/Selected_Types'


export const addSelected = (selection) => (dispatch) => {
    dispatch({ type: ADD_SELECTED, payload: selection});
}

export const deleteSelected = (selection) => (dispatch) => {
    dispatch({ type: DELETE_SELECTED, payload: selection });
}

export const clearSelected = (selection) => (dispatch) => {
    dispatch({ type:CLEAR_SELECTED, payload: selection });
}