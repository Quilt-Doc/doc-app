import {
    CREATE_DOCUMENT
} from './types/Document_Types';

import api from '../apis/api';

 
export const createDocument = (workspaceID, formValues) => async (dispatch, getState) => {
    let authorID = getState()
    const response = await api.post('/documents/create', {...formValues, workspaceID});
    dispatch({ type: CREATE_DOCUMENT, payload: response.data });
}


