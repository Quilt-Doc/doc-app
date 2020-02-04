import React from 'react';
import { Router, Route } from 'react-router-dom';
import history from './history';

import ReactDOM from 'react-dom'

import CodeViewer from './components/CodeViewer'

const App = () => {
    return (<>
                <Router history = {history}>
                  {/* <Route path = "/" component = {Dashboard} />  */}
                  <Route exact path="/code_viewer" component={CodeViewer} />
                </Router> 
            </>)
}

export default App;
