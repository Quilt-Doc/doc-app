import React, { Component } from 'react';

//components
import Onboarding from './onboarding/Onboarding';
import Workspaces from './workspaces/Workspaces';
import WorkspaceCreation from './workspace_creation/WorkspaceCreation';

//router
import { Router, Route  } from 'react-router-dom';

//history
import history from '../../history';

//styles
import styled from 'styled-components';

//react-redux
import { connect } from 'react-redux';

class Home extends Component {

    componentDidMount() {
        const {user: {onboarded}} = this.props;
        if (!onboarded) {
            let splitPath = history.location.pathname.split('/');
            if (splitPath.length > 2) {
                if (splitPath[2] !== "onboarding") {
                    history.push('/home/onboarding');
                }
            } else {
                history.push('/home/onboarding');
            }
           
        } else if (history.location.pathname !== "/home/create_workspace") {
            history.push('/home/workspaces');
        }
    }

    render() {

        return (
            <Container>
                <Top>
                    <Company>quilt</Company>
                </Top>
                <Router history = {history}>
                    <Route path = "/home/onboarding" component = {Onboarding} />
                    <Route path = "/home/workspaces" component = {Workspaces} />
                    <Route path = "/home/create_workspace" component = {WorkspaceCreation}/>
                </Router>
            </Container>
        )
    }
}

const mapStateToProps = (state) => {
    const {auth: {user}} = state;
    return {
        user
    }
}

export default connect(mapStateToProps, {})(Home);


const Container = styled.div`
    background-color:#16181d;
    display: flex;
    flex: 1;
    display: flex;
    flex-direction: column;
    color: white;
`


const Top = styled.div`
    height: 10rem;
    padding-left: 8.5rem;
    padding-right: 8.5rem;
    color:#D6E0EE;
    display: flex;
    align-items: center;
`

const StyledIcon = styled.img`
    width: 2.7rem;
    margin-left: 4.5rem;
    margin-right: 1rem;
`

const Company = styled.div`
    font-size: 3.5rem;
    letter-spacing: 1px;
    font-weight: 400;
    color:white;
    margin-right: 15rem;
    margin-top: -0.25rem;
`