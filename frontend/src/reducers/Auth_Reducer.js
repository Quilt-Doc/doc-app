import {
    CHECK_LOGIN, CHECK_INSTALLATION, RETRIEVE_DOMAIN_REPOSITORIES, EDIT_USER
} from '../actions/types/Auth_Types';

let initial = {
    authenticated: false,
    user : {},
    installations: [],
    domainRepositories: []
}

export default (state = {}, action) => {
    switch (action.type) {
        case CHECK_LOGIN:
            return { ...state, authenticated: action.payload.authenticated, 
                     user: action.payload.user}
        case CHECK_INSTALLATION:
            return { ...state,  installations: action.payload }
        case RETRIEVE_DOMAIN_REPOSITORIES:
                return { ...state,  domainRepositories: action.payload }
        case EDIT_USER:
            return {...state, user: action.payload }
        default: 
            return state
    }
}

