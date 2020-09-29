//react
import React from 'react'
import history from '../history';

//router
import { Router, Route  } from 'react-router-dom';

//components
import Space from './space/Space';
import UserSettings from './settings/UserSettings';
import MainNavbar from './main_navbar/MainNavbar';

//styles
import styled from "styled-components";

// component that houses the core application
const Application = () => {
    return ( 
        <Container>
            <MainNavbar/>
            <Router history = {history}>
                  <Route path = "/workspaces/:workspaceId" component = {Space} />
                  <Route path = "/settings" component = {UserSettings} />
            </Router>
        </Container>
    )
}

export default Application;

const Container = styled.div`
    display: flex;
    flex-direction:column;
    height: 100vh;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`