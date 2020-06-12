import React from 'react';
import { Router, Route, useParams } from 'react-router-dom';
import history from '../history';


//components
import Dashboard from './Dashboard';
import CodeViewer from './CodeViewer';
import DocumentCreate from './Document/DocumentCreate';

import Dash from './Code Explorer Page/Dash'


import CodeView from './Code Viewer Page/CodeView';
//import RichTextExample from './Text Editor/Text_Editor';
import MarkdownShortcutsExample from './Text Editor/Slate_Startup'
import HoveringMenuExample from'./Text Editor/HoveringMenuExample'
import Repository_Viewer from './Repository_Viewer';

//split markers -- directory, file
const App = () => {
    return (<>
                <Router history = {history}>
                  <Route path = '/code_explorer' component = {Dash}/>
                  <Route path = "/codeview/:location" component = {CodeView} />
                  <Route exact path="/code_viewer" component={CodeViewer} />
                  <Route path = '/text_editor' component = {HoveringMenuExample}/>
                 
                  
                  <Route path = "" component = {Dashboard} />
                  <Route exact path= "/document_create" component={DocumentCreate} />
                </Router>
            </>)
}

/*
 <Route path = "/codebase/:link"
 */

/*

<Route path = "/:workspaceID" children={<WorkspaceDashboard />} />
*/

function WorkspaceDashboard() {
  let { workspaceID } = useParams();
  
  if (workspaceID !== "code_viewer") {
    return (
      <div>
        <h3>ID: {workspaceID}</h3>
        <Dashboard/>
      </div>
    );
  }
  return null;
}

export default App;