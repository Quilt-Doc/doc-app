import React from 'react';
import { Router, Route, Switch } from 'react-router-dom';
import history from '../history';


//components
import Dashboard from './Dashboard';
import NavbarProfile from './Top Navbar/NavbarProfile'
import Home from './Home';
import Landing from './Landing/Landing';

import TagWrapper from './General/TagWrapper';
import ReferenceMenu from './Space Page/Text Editor Page/Menus/ReferenceMenu';
//import HoveringMenuExample from'./Space Page/Text Editor Page/HoveringMenuExample'
import ExtensionDemo from './Extension/ExtensionDemo';
//split markers -- directory, file
const App = () => {
    return (<>
                <Router history = {history}>

                  
                  <Route path = "" component = {Home} />
                </Router>
            </>)
}

/* <Route path = "/reference" component = {ReferenceMenu} />*/
/*
<Route path = "" component = {Dashboard} />
<Route path = "" component = {Dashboard} />
 <Route path = "" component = {Dashboard} />
<Route path = "" component = {Dashboard} />
                  <Route exact path= "/document_create" component={DocumentCreate} />*/


export default App;