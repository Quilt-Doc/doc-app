import React from 'react';
import { Router, Route } from 'react-router-dom';
import history from '../history';


//components
import Dashboard from './Dashboard';
import DocumentCreate from './Document/DocumentCreate';
import Test from './Test';
import ReferenceMenu from './Space Page/Text Editor Page/ReferenceMenu';
//import HoveringMenuExample from'./Space Page/Text Editor Page/HoveringMenuExample'

//split markers -- directory, file
const App = () => {
    return (<>
                <Router history = {history}>
                  <Route path = "" component = {Dashboard} />
                 
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