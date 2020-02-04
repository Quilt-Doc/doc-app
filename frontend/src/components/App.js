import React from 'react';
import { Router, Route } from 'react-router-dom';
import history from '../history';

//components
import Dashboard from './Dashboard';

const App = () => {
    return (<>
                <Router history = {history}>
                  <Route path = "/:workspaceID" component = {Dashboard} />
                </Router> 
            </>)
}

export default App;