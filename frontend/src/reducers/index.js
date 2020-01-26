import { combineReducers } from 'redux';
import documentReducer from './Document_Reducer'
import snippetReducer from './Snippet_Reducer';
import requestReducer from './Request_Reducer';
import commentReducer from './Comment_Reducer';


export default combineReducers({
    documentState: documentReducer,
    snippetState: snippetReducer,
    requestState: requestReducer,
    commentState: commentReducer
});

