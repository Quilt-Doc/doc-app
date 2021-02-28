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
import Onboarding from './onboarding/Onboarding';
import WorkspaceCreation from './workspace_creation/WorkspaceCreation';

// component that houses the core application
const Application = () => {
    return ( 
        <Container>
            <Router history = {history}>
                <Route exact path = "/workspaces" component = {Home} />
                <Route path = "/create_workspace" component = {WorkspaceCreation}/>
                <Route path = "/onboarding" component = {Onboarding} />
                <Route path = "/workspaces/:workspaceId" component = {Space} />
            </Router>
        </Container>
    )
}

export default Application;

const Container = styled.div`
    background-color:  #16181d;
    display: flex;
    flex-direction:column;
    height: 100vh;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`