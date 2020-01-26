import { combineReducers } from 'redux';

import workspaceReducer from './Workspace_Reducer';
import codebaseReducer from './Codebase_Reducer';
import folderReducer from './Folder_Reducer';

import documentReducer from './Document_Reducer';
import snippetReducer from './Snippet_Reducer';
import requestReducer from './Request_Reducer';
import commentReducer from './Comment_Reducer';
import userReducer from './User_Reducer';
import tagReducer from './Tag_Reducer';

export default combineReducers({
    workspaces: workspaceReducer,
    codebases: codebaseReducer,
    folders: folderReducer,
    documents: documentReducer,
    snippets: snippetReducer,
    requests: requestReducer,
    comments: commentReducer,
    users: userReducer,
    tags: tagReducer,
});

