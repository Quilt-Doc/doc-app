import React from 'react';

// react-redux
import { connect } from 'react-redux';

//styles
import styled from 'styled-components';

//actions
import { checkLogin } from '../actions/Auth_Actions'

//components
import Dashboard from './Dashboard';
import CreateWorkspaceView from "../components/Workspace Page/CreateWorkspaceView";
import OnboardingView from '../components/Onboarding Page/OnboardingView';
import LoginView from '../components/Login Page/LoginView';

import { api, apiEndpoint } from '../apis/api';

//css -- needs to be thrown later



class Home extends React.Component {

    componentDidMount(){
        this.props.checkLogin()
    }

    goLogin = () => {
        window.open(apiEndpoint + "/auth/github", "_self");
    }

    renderLoginModal() {
        return (<LoginView/>)
    }

    renderDashboard() {
        return <Dashboard/>/* <OnboardingView/>*/
        //<Dashboard/>return <CreateWorkspaceView/>/*<Dashboard/>*/
    }   

    render(){
        if (this.props.authenticated === undefined){
            return null
        }
        return(
            <>
                {this.props.authenticated ? (this.renderDashboard()) : (this.renderLoginModal())}
            </>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        user: state.auth.user,
        authenticated: state.auth.authenticated
    }
}

export default connect(mapStateToProps, {checkLogin})(Home);

const LoginBoxContainer = styled.div`
    overflow: hidden;
    width: 100vw;
    height: 100vh;
    background-color: #262E49;
`

const LoginBox = styled.div`
    margin: 0 auto;
    margin-top: 18rem;
    margin-bottom: 50rem;
    height: 40rem;
    width: 35rem;
    box-shadow: 0 2px 2px 2px rgba(60,64,67,.15);
    display: flex;
    flex-direction: column;
    padding: 8rem;
    border-radius:0.4rem;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
    color: #172A4e;
    align-items: center;
    background-color:white;
`

const LoginHeader = styled.div`
    margin-top: 3rem;
    font-size: 2.5rem;

`

const LoginSubHeader = styled.div`
    margin-top: 1rem;
    font-size: 1.5rem;
`

const LoginButton = styled.div`
    margin-top: 9rem;
   
    color: #172A4E;
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.4rem;
    background-color: #313b5e;
    &:hover {
        background-color:  #39466f;
    }
    color: white;
`


/*
#172A4E;
    border: 1px solid #1BE5BE;*/