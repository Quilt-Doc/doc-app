import React from 'react';
import styled from 'styled-components';

//images
import logo from '../../images/logo.svg';
import {ImGithub} from 'react-icons/im';

class LoginView extends React.Component {


    goLogin = () => {
        window.open("http://localhost:3001/api/auth/github", "_self");
    }

    render(){
        return(
            <Container>
                <Content>
                    <StyledIcon src= {logo} />
                    <Company>
                        
                        quilt
                    </Company>
                    <SubHeader >
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
                 {/*
                 <Content>
                   
                   
                   
                  
                    <SubContent>   
                            <NameInput spellCheck = {false} autoFocus placeholder = 
                                {"First name"}/>
                            <NameInput spellCheck = {false}  placeholder = 
                                {"Last name"}/>
                        <NextButton>
                            Next
                        </NextButton>
                    </SubContent>
                 </Content>*/}
            </Container>
        )
    }
}

export default LoginView;

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

const NameInput = styled.input`
    height: 4.5rem;
    font-size: 1.7rem;
    display: flex;
    align-items: center;
    background-color: #23262f;
    padding-left: 2rem;
    padding-right: 2rem;
    color: white;
    border-radius: 0.3rem;
    border: 1px solid #3e4251;
    letter-spacing: 0.5px;
    outline: none;
    &::placeholder {
        color: white;
        opacity: 0.3;
    }
    &:focus{
        border: 1px solid #19e5be;
    }
    &:first-of-type {
        margin-bottom: 2rem;
    }
   width: 35rem;
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

const Header = styled.div`
    font-size: 2.6rem;
    height: 4.5rem;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
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

const SubContent = styled.div`
    margin-top: 5rem;
    width: 100%;
`