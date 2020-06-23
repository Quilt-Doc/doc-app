import {
    CHECK_LOGIN
} from '../actions/types/Auth_Types'

let initial = {
    authenticated: false,
    user : {}
}

export default (state = {}, action) => {
    switch (action.type) {
        case CHECK_LOGIN:
            return {authenticated: action.payload.authenticated, user: action.payload.user}
        default: 
            return state
    }
}

