import React from 'react';

//styles
import styled from 'styled-components';

//images
import logo from '../../images/logo.svg';

//icons
import {ImGithub} from 'react-icons/im';

// endpoint used by axios api to backend
import { apiEndpoint } from '../../apis/api';

// component that the user sees to login
class Login extends React.Component {
    // opens up the backend route set by passport 
    // instantiates the login process for github
    goLogin = () => {
        window.open(apiEndpoint + "/auth/github", "_self");
    }

    render(){
        return(
            <Container>
                <Content>
                    <StyledIcon src= {logo} />
                    <Company>
                        quilt
                    </Company>
                    <SubHeader>
                        The knowledge solution for developer teams.
                    </SubHeader>
                    <SubHeader2>
                        Sign in with Github to get started
                    </SubHeader2>
                    <NextButton onClick = {() => {this.goLogin()}}>
                        <ImGithub style = {{marginRight: "1rem"}}/>
                            Continue with Github
                    </NextButton>
                 </Content>
            </Container>
        )
    }
}

export default Login;

const StyledIcon = styled.img`
    width: 6rem;
    margin-bottom: 0.5rem;
`

const Company = styled.div`
    font-size: 4rem;
    letter-spacing: 1.5px;
    font-weight: 500;
    display: flex;
    align-items: center;
`

const Container = styled.div`
    background-color:#16181d;
    min-height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    padding-bottom: 20rem;
    color: white;
    justify-content: center;
    align-items: center;
`

const NextButton = styled.div`
    background-color: #23262f;
    height: 4rem;
    border-radius: 0.4rem;
    display: inline-flex;
    border-radius: 0.3rem;
    margin-top: 2rem;
    font-size: 1.6rem;
    display: inline-flex;
    align-items: center;
    padding-left: 2rem;
    padding-right: 2rem;
    font-weight: 500;
    border: 1px solid #5B75E6;
    cursor: pointer;
    &:hover {
        background-color: #2e323d;
    }
`

const Content = styled.div`
    width: 43rem;
    padding-top: 8rem;
    padding-bottom: 8rem;
    border-radius: 0.3rem;
    color: white;
    border: 2px solid #2a2e37;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`

const SubHeader = styled.div`
    color: white;
    font-size: 1.8rem;
    font-weight: 300;
    opacity: 1;
    margin-top: 2.5rem;
`

const SubHeader2 = styled.div`
    color: white;
    font-size: 1.8rem;
    font-weight: 400;
    opacity: 1;
    margin-top: 5rem;
`