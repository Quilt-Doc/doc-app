import { api } from '../apis/api';

export const retrieveUserStats = (formValues) => async () => {

    const { workspaceId } = formValues;

    if (!workspaceId) {
        throw new Error("retrieveUserStats: workspaceId not provided");
    }

    const response = await api.post(`/reporting/${workspaceId}/retrieve_user_stats`, formValues );

    const { success, error, result } = response.data;

    if (!success) {
        throw new Error(error);
    } else {
        return result;
    }
}
