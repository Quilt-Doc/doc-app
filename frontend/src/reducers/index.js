import { combineReducers } from 'redux';
import documentReducer from './Document_Reducer'
import snippetReducer from './Snippet_Reducer';
import requestReducer from './Request_Reducer';

export default combineReducers({
    documents: documentReducer,
    snippetState: snippetReducer,
    requestReducer: requestReducer
});

