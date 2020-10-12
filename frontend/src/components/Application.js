//react
import React from 'react'
import history from '../history';

//router
import { Router, Route  } from 'react-router-dom';

//components
import Space from './space/Space';
import Home from './home/Home';

//styles
import styled from "styled-components";

// component that houses the core application
const Application = () => {
    return ( 
        <Container>
            <Router history = {history}>
                <Route path = "/workspaces/:workspaceId" component = {Space} />
                <Route path = "/home" component = {Home} />
            </Router>
        </Container>
    )
}

{/*   <Route path = "/create_workspace" component = {WorkspaceCreation}/>
                <Route exact path = "/" component = {Home}/>
                <Route exact path = "/workspaces" component = {Home} />
                <Route path = "/workspaces/:workspaceId" component = {Space} />
<Route path = "/settings" component = {UserSettings} />*/}

export default Application;

const Container = styled.div`
    
    display: flex;
    flex-direction:column;
    height: 100vh;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`