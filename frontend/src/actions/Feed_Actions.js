import {
    RETRIEVE_FEEDS
} from './types/Feed_Types';

import { api } from '../apis/api';

export const retrieveFeeds = (formValues) => async dispatch => {

    const { workspaceId } = formValues;

    if (!workspaceId) {
        throw new Error("retrieveFeed: workspaceId not provided");
    }

    const response = await api.post(`/reporting/${workspaceId}/retrieve_activity_feed_items`, formValues );

    const { success, error, result } = response.data;

    if (!success) {
        throw new Error(error);
    } else {
        dispatch({ type: RETRIEVE_FEEDS, payload: result });
    }
}
