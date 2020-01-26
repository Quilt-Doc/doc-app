import { combineReducers } from 'redux';
import documentReducer from './Document_Reducer'
import snippetReducer from './Snippet_Reducer';
import requestReducer from './Request_Reducer';
import commentReducer from './Comment_Reducer';
import userReducer from './User_Reducer'
import tagReducer from './Tag_Reducer';

export default combineReducers({
    documents: documentReducer,
<<<<<<< HEAD
    snippetState: snippetReducer,
    requestReducer: requestReducer
=======
    snippets: snippetReducer,
    requests: requestReducer,
    comments: commentReducer,
    users: userReducer,
    tags: tagReducer,
>>>>>>> e6ec6a01d4d63e1f39647d2670f83b23824687a0
});

