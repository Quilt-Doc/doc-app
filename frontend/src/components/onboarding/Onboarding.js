import React from 'react';

import logo from '../../images/logo.svg';
import styled from 'styled-components';

class Onboarding extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        return(
            <Container>
                <TopNavbar>
                    <StyledIcon src = {logo} />
                    <Company>quilt</Company>
                </TopNavbar>
                <Content>
                    <Header>
                        Welcome!
                    </Header>
                    <SubHeader>
                        Provide us some info to tailor your experience
                    </SubHeader>
                    <SubContent>   
                        <NameInput spellCheck = {false} autoFocus placeholder = 
                            {"First name"}/>
                        <NameInput spellCheck = {false}  placeholder = 
                            {"Last name"}/>
                        <NextButton>
                            Next
                        </NextButton>
                    </SubContent>
                </Content>
            </Container>
        )
    }
}

export default Onboarding;

 {/*
                            <CSSTransition
                                in = {this.state.page === 0}
                                unmountOnExit
                                enter = {true}
                                exit = {false}     
                                appear = {true}  
                                timeout = {300}
                                classNames = "slidepane"
                            >   
                                <div style ={{width: "100%"}}>
                                    <ChooseProvider
                                        changePage = {this.changePage}
                                    />
                                </div> 
                            </CSSTransition>*/}

const NextButton = styled.div`
    background-color: #23262f;
    height: 3.5rem;
    border-radius: 0.4rem;
    display: inline-flex;
    border-radius: 0.3rem;
    margin-top: 5rem;
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
    width: 100%;
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

const Container = styled.div`
    background-color:#16181d;
    min-height: 100vh;
    width: 100vw;
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    padding-bottom: 20rem;
`

const TopNavbar = styled.div`
    height: 10rem;
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
    font-size: 3rem;
    color:white;
    font-weight: 500;
    letter-spacing: 1.5px;
    margin-right: 15rem;
    margin-top: -0.25rem;
`

const CreateBox = styled.div`
    background-color: white
    height: 60rem;
    width: 100rem;
    margin-top: 3rem;
    border-radius: 0.4rem;
    align-self: center;
    display: flex;
    justify-content: center;
`

const Content = styled.div`
    width: 60rem;
    color: white;
    padding-top: 5rem;
    margin-top: 3rem;
    align-self: center;
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
    font-weight: 400;
    opacity: 0.9;
`

const SubContent = styled.div`
    margin-top: 5rem;
    width: 100%;
`