import {
    CREATE_WORKSPACE,
    GET_WORKSPACE,
    RETRIEVE_WORKSPACES,
    WORKSPACE_ADD_USER,
    DELETE_WORKSPACE,
    WORKSPACE_REMOVE_USER,
    SET_CURRENT_WORKSPACE
} from '../actions/types/Workspace_Types'

import _ from 'lodash';

let state = {
    workspaces: {},
    currentSpace: {}
}
// NEED TO UPDATE CURRENT WORKSPACE ON WORKSPACE CHANGE
export default (state = {workspaces: {}, currentSpace: {}}, action) => {
    let workspaces;
    switch (action.type) {
        
        case CREATE_WORKSPACE:
            workspaces = { ...state.workspaces, [action.payload._id]: action.payload }
            return { ...state, workspaces };
        case GET_WORKSPACE:
            workspaces = { ...state.workspaces, [action.payload._id]: action.payload }
            return { ...state, workspaces };
        case DELETE_WORKSPACE:
            workspaces = _.omit(state.workspaces, action.payload._id); 
            return { ...state, workspaces };
        case WORKSPACE_ADD_USER:
            workspaces = { ...state.workspaces, [action.payload._id]: action.payload }
            return { ...state, workspaces }
        case WORKSPACE_REMOVE_USER:
            workspaces = { ...state.workspaces, [action.payload._id]: action.payload }
            return { ...state, workspaces }
        case RETRIEVE_WORKSPACES:
            workspaces = { ..._.mapKeys(action.payload, '_id') };
            return { ...state, workspaces }
        case SET_CURRENT_WORKSPACE:
            return { ...state, currentSpace: action.payload}
        default: 
            return state;
    }
}