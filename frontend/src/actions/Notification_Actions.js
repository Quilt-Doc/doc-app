import {
    RETRIEVE_NOTIFICATIONS
} from './types/Notification_Types';

import { api } from '../apis/api';

export const retrieveNotifications = (formValues) => async dispatch => {

    const { workspaceId, userId } = formValues;

    if (!workspaceId) {
        throw new Error("retrieveNotifications: workspaceId not provided");
    }

    if (!userId) {
        throw new Error("retrieveNotifications: userId not provided");
    }

    const response = await api.get(`/notifications/${userId}/retrieve`, formValues);

    return response.data;
    /*
    const { success, error, result } = response.data;

    if (!success) {
        throw new Error(error);
    } else {
        dispatch({ type: RETRIEVE_CHECKS, payload: result });
    }*/
}
