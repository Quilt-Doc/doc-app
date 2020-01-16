import React from 'react';
import { Router, Route } from 'react-router-dom';
import history from '../history';


const App = () => {
    return (<>
                <Router history = {history}>
                  {/* <Route path = "/" component = {Dashboard} />  */}
                </Router> 
            </>)
}

export default App;