import { combineReducers } from 'redux';
import { reducer as formReducer } from 'redux-form'

import workspaceReducer from './Workspace_Reducer';
import repositoryReducer from './Repository_Reducer';
import repositoryItemReducer from './RepositoryItem_Reducer';
import referenceReducer from './Reference_Reducer';
import documentReducer from './Document_Reducer';
import snippetReducer from './Snippet_Reducer';
import requestReducer from './Request_Reducer';
import commentReducer from './Comment_Reducer';
import userReducer from './User_Reducer';
import tagReducer from './Tag_Reducer';
import searchReducer from './Search_Reducer';


import uiReducer from './UI_Reducer';
import authReducer from './Auth_Reducer';
import selectedReducer from './Selected_Reducer';
import linkageReducer from './Linkage_Reducer';

export default combineReducers({
    workspaces: workspaceReducer, // DONE (with notes)
    repositories: repositoryReducer, // DONE (with notes)
    documents: documentReducer, // DONE (not tested)
    snippets: snippetReducer, // 
    requests: requestReducer,
    comments: commentReducer,
    users: userReducer,
    tags: tagReducer,
    selected: selectedReducer,
    references: referenceReducer, // DONE (attachTags, removeTags not done)
    auth: authReducer,
    ui: uiReducer,
    searchResults: searchReducer, // Standardize
    linkages: linkageReducer // Standardize
});
