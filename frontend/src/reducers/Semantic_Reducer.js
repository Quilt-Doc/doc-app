import {
    RETRIEVE_CALLBACKS
} from '../actions/types/Semantic_Types';


import _ from 'lodash';


export default (state = [], action) => {
    switch (action.type) {
        case RETRIEVE_CALLBACKS:
            let callbacks = action.payload.sort((a, b) => {
                if (a.span.start.line > b.span.start.line) {
                    return 1
                } else if (a.span.start.line < b.span.start.line) {
                    return -1
                } else if (a.span.start.column > b.span.start.column) {
                    return 1
                } else {
                    return -1 
                }
            })
            //console.log(callbacks)
            return callbacks
        default:
            return state
    }
}