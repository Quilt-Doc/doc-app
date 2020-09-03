import React from 'react';
import styled from 'styled-components';

//images
import logo from '../../images/logo.svg';

//components
import { CSSTransition } from 'react-transition-group';
import { Router, Route, Switch } from 'react-router-dom';

import ChooseProvider from './ChooseProvider';
import ChooseRepos from './ChooseRepos';
import ChooseName from './ChooseName';


class CreateWorkspaceView extends React.Component {
    constructor(props){
        super(props)

        this.state = {
            page: 0
        }
    }

    changePage = (page) => {
        this.setState({page})
    }

    render(){
        let {page} = this.state
        return(
            <Container>
                <TopNavbar>
                    <StyledIcon src = {logo} />
                    <Company>quilt</Company>
                </TopNavbar>
                <CreateBox>
                    <Content>
                        <Progress>
                                <Bar active = {true}/>
                                <Bar active = {page > 0} />
                                <Bar active = {page > 1} />
                        </Progress>
                        <Header>
                            Create a new workspace
                           
                        </Header>
                        <SubHeader>
                            Start documenting your code in three easy steps.
                        </SubHeader>
                        <SubContent>   
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
                            </CSSTransition>
                            <CSSTransition
                                in = {this.state.page === 1}
                                unmountOnExit
                                enter = {true}
                                exit = {false}       
                                timeout = {300}
                                classNames = "slidepane"
                            >
                                <div style ={{width: "100%"}}>
                                    <   ChooseRepos
                                        changePage = {this.changePage}
                                    />
                                </div>
                            </CSSTransition>
                            <CSSTransition
                                in = {this.state.page === 2}
                                unmountOnExit
                                enter = {true}
                                exit = {false}       
                                timeout = {300}
                                classNames = "slidepane"
                            >
                                <div style ={{width: "100%"}}>
                                    <ChooseName/>
                                </div>
                            </CSSTransition>
                        </SubContent>
                    </Content>
                </CreateBox>
            </Container>
        )   
    }
}

export default CreateWorkspaceView;


const Progress = styled.div`
    display: flex;
    
`

const Bar = styled.div`

    background-color: ${props => props.active ? "#19E5BE" : "#2e323d"};
    width: 4rem;
    height: 0.33rem;
    border-radius: 0.2rem;
    margin-right: 1rem;
    &:first-of-type {
        margin-left: auto;
        
    }

    &:last-of-type {
        margin-right: 0rem;
    }
    transition: background-color 0.2s ease-in;
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
    height: 20rem;
    padding-top: 5rem;
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
    display: flex;
`