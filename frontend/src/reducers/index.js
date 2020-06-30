import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form'

import workspaceReducer from './Workspace_Reducer';
import repositoryReducer from './Repository_Reducer';
import folderReducer from './Folder_Reducer';
import repositoryItemReducer from './RepositoryItem_Reducer';

import documentReducer from './Document_Reducer';
import snippetReducer from './Snippet_Reducer';
import requestReducer from './Request_Reducer';
import commentReducer from './Comment_Reducer';
import userReducer from './User_Reducer';
import tagReducer from './Tag_Reducer';

import uiReducer from './UI_Reducer';

import authReducer from './Auth_Reducer';

import selectedReducer from './Selected_Reducer';

import semanticReducer from './Semantic_Reducer';

export default combineReducers({
    workspaces: workspaceReducer,
    repositories: repositoryReducer,
    folders: folderReducer,
    documents: documentReducer,
    snippets: snippetReducer,
    requests: requestReducer,
    comments: commentReducer,
    users: userReducer,
    tags: tagReducer,
    selected: selectedReducer,
    repositoryItems: repositoryItemReducer,
    form: formReducer,
    auth: authReducer,
    ui: uiReducer,
    callbacks: semanticReducer
});
