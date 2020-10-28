import {
    RETRIEVE_NOTIFICATIONS,
    GET_PENDING_COUNT
} from './types/Notification_Types';

import { api } from '../apis/api';

export const setNotificationsHidden = (formValues) => async dispatch => {
    const { workspaceId, userId } = formValues;

    if (!workspaceId) {
        throw new Error("getPendingCount: workspaceId not provided");
    }

    if (!userId) {
        throw new Error("getPendingCount: userId not provided");
    }

    const response = await api.post(`/notifications/${workspaceId}/${userId}/hide_all`, formValues);

    const { result, success, error } = response.data;

    if (!success) {
        throw new Error(error);
    } else {
        dispatch({type: GET_PENDING_COUNT, payload: result});
    }
}

export const getPendingCount = (formValues) => async dispatch => {
    const { workspaceId, userId } = formValues;

    if (!workspaceId) {
        throw new Error("getPendingCount: workspaceId not provided");
    }

    if (!userId) {
        throw new Error("getPendingCount: userId not provided");
    }

    const response = await api.get(`/notifications/${workspaceId}/${userId}/pending`);

    const { result, success, error } = response.data;

    if (!success) {
        throw new Error(error);
    } else {
        dispatch({type: GET_PENDING_COUNT, payload: result});
    }
}

export const retrieveNotifications = (formValues, wipe) => async dispatch => {

    const { workspaceId, userId } = formValues;

    if (!workspaceId) {
        throw new Error("retrieveNotifications: workspaceId not provided");
    }

    if (!userId) {
        throw new Error("retrieveNotifications: userId not provided");
    }

    const response = await api.post(`/notifications/${workspaceId}/${userId}/retrieve`, formValues);


    const { result, success, error } = response.data;
    console.log("NOTIFICATION RETRIEVE RESULTS", result.map(item => item._id));
    if (!success) {
        throw new Error(error);
    } else {
        dispatch({type:  RETRIEVE_NOTIFICATIONS, payload: result, wipe});
        if (result.length % 10 !== 0 || result.length === 0) {
            return false;
        } else {
            return true
        }
    }
}
