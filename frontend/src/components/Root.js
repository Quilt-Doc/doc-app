import React from 'react';

//router
import { Router, Route, Switch } from 'react-router-dom';

//components
import Main from './Main';
import Installed from './misc/Installed';
import Landing from './landing/Landing';

//history
import history from '../history';

// root component of the entire frontend 
const Root = () => {
    return (<>
                <Router history = {history}>
                  <Switch>
                    <Route path = "/installed" component = {Installed} />
                    <Route exact path = "/" component = {Landing} />
                    <Route path = "" component = {Main} />
                  </Switch>
                </Router>
            </>)
}


export default Root;