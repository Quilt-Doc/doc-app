import { combineReducers } from 'redux';
import documentReducer from './Document_Reducer'
import snippetReducer from './Snippet_Reducer';
import requestReducer from './Request_Reducer';
import commentReducer from './Comment_Reducer';
import userReducer from './User_Reducer'
import tagReducer from './Tag_Reducer';

export default combineReducers({
    documents: documentReducer,
    snippets: snippetReducer,
    requests: requestReducer,
    comments: commentReducer,
    users: userReducer,
    tags: tagReducer,
});

