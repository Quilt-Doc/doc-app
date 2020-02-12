import React from 'react';
import { Router, Route, useParams } from 'react-router-dom';
import history from '../history';


//components
import Dashboard from './Dashboard';
import CodeViewer from './CodeViewer';

const App = () => {
    return (<>
                <Router history = {history}>
                  <Route exact path="/code_viewer" component={CodeViewer} />
                  <Route path = "/:workspaceID" children={<WorkspaceDashboard />} />
                </Router>
            </>)
}

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