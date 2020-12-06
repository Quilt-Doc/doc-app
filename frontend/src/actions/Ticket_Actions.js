import { api } from '../apis/api';

export const retrieveTickets = (formValues) => async dispatch => {
    const { workspaceId } = formValues;

    if (!workspaceId) {
        throw new Error("retrieveTickets: workspaceId not provided");
    }

    const response = await api.post(`/tickets/${workspaceId}/retrieve`, formValues);

    return response.data;
}

