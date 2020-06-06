import React from 'react';
import { Router, Route, useParams } from 'react-router-dom';
import history from '../history';


//components
import Dashboard from './Dashboard';
import CodeViewer from './CodeViewer';


import CodeView from './Code Page/CodeView';

const App = () => {
    return (<>
                <Router history = {history}>
                  
                  <Route path = "/codeview/:location" component = {CodeView} />
                  <Route exact path="/code_viewer" component={CodeViewer} />
                  
                </Router>
            </>)
}

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