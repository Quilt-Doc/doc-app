import React from 'react';
import { Router, Route, Switch } from 'react-router-dom';
import history from '../history';

import styled from 'styled-components';
import chroma from 'chroma-js';

//components
import Dashboard from './Dashboard';
import NavbarProfile from './Top Navbar/NavbarProfile'
import Home from './Home';
import Landing from './Landing/Landing';
import Installed from './Installed';
import CreateWorkspaceView from './Workspace Page/CreateWorkspaceView';

import TagWrapper from './General/TagWrapper';
import ReferenceMenu from './Space Page/Text Editor Page/Menus/ReferenceMenu';
//import HoveringMenuExample from'./Space Page/Text Editor Page/HoveringMenuExample'
import ExtensionDemo from './Extension/ExtensionDemo';
//split markers -- directory, file


const App = () => {
    return (<>
                <Router history = {history}>
                  <Switch>
                    <Route path = "/installed" component = {Installed} />
                    <Route path = "/workspaces/:workspaceId" component = {Home} />
                  </Switch>
                </Router>
            </>)
}


export default App;