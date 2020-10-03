import React, {Component} from 'react';

// styles
import styled from 'styled-components';
import chroma from 'chroma-js';

// components
import PullRequest from './pull_request/PullRequest';
import People from './people/People';
import Breakage from './breakage/Breakage';
import Feed from './feed/Feed';

// initial page on the workspace, contains tracking information (breakage), actionable components (pull requests)
const Dashboard = () => {
    return(
        <>
        <Container>
            <Top>
                <Header>DASHBOARD</Header>
                {/*
                <NavbarElement>
                    <RiPencilLine/>
                </NavbarElement>*/}
            </Top>
            <RightContainer>
                <Breakage/>
                <PullRequest/>
            </RightContainer>
        </Container>
        </>
    )
}

export default Dashboard;

// Styled Components

const Top = styled.div`
    display: flex;
    align-items: center;
`

const Header = styled.div`
    font-size: 1.1rem;
    font-weight: 400;
    display: inline-flex;
    border-bottom: 2px solid #172A4E;
    height: 2.8rem;
    padding-right: 3.5rem;
    display: flex;
    align-items: center;
`

const RightContainer = styled.div`
    width: calc(100% - 32rem);
    padding: 2rem 0rem;
    padding-right: 0rem;
`

const Todos = styled.div`
    margin-left: auto;
    padding: 0.5rem 1rem;
    font-size: 1.25rem;
    background-color: ${chroma('#5B75E6').alpha(0.15)};
    color: #5B75E6;
    border-radius: 1.3rem;
    font-weight: 500;
    margin-bottom: 1rem;
    margin-right: 3rem;
`

const Leftbar = styled.div`
    width: 32rem;
    background-color: white;
    padding: 2rem 0rem;
    display: flex;
    flex-direction: column;
    /*height: calc(100vh - 5.5rem);*/
    overflow-y: scroll;
    box-shadow: 5px 0 3px -3px rgba(0,0,0,0.1);
    z-index: 1;
`

const Container = styled.div`
    background-color: #f6f7f9;
    height: 100vh;
    padding: 2.1rem;
`
