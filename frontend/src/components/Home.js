import React from 'react';

// react-redux
import { connect } from 'react-redux';

//styles
import styled from 'styled-components';

//actions
import { checkLogin } from '../actions/Auth_Actions'

//components
import Dashboard from './Dashboard';

//css -- needs to be thrown later



class Home extends React.Component {

    componentDidMount(){
        this.props.checkLogin()
    }
    
    goLogin = () => {
        window.open("http://localhost:3001/api/auth/github", "_self");
    }

    renderLoginModal() {
        return (<LoginBoxContainer>
                    <LoginBox>
                        <LoginHeader>Sign in</LoginHeader>
                        <LoginSubHeader>to continue with Docapp</LoginSubHeader>
                        <LoginButton onClick = {() => this.goLogin()}><ion-icon style = {{'fontSize':'2.3rem', 'marginRight': '0.7rem',   'color': '#172A4E'}} name="logo-github"></ion-icon>Continue with Github</LoginButton>
                    </LoginBox>
                </LoginBoxContainer>)
    }

    renderDashboard() {
        return <Dashboard/>
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
`

const LoginBox = styled.div`
    margin: 0 auto;
    margin-top: 18rem;
    margin-bottom: 50rem;
    height: 50rem;
    width: 45rem;
    box-shadow: rgba(0, 0, 0, 0.15) 0px 2px 10px;
    display: flex;
    flex-direction: column;
    padding: 8rem;
    
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
    color: #262626;
    align-items: center;
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
    margin-top: 8rem;
    border: 1px solid #1BE5BE;
    color: #172A4E;
    display: flex;
    align-items: center;
    padding: 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.5rem;

    &:hover {
        background-color:  #F7F9FB;
    }
`


/*
#172A4E;
    border: 1px solid #1BE5BE;*/