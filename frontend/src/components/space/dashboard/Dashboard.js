import React, {Component} from 'react';

// styles
import styled from 'styled-components';
import chroma from 'chroma-js';

// components
import Checks from './checks/Checks';
import People from './people/People';
import Breakage from './breakage/Breakage';
import Feed from './feed/Feed';
import Team from './team/Team';

// initial page on the workspace, contains tracking information (breakage), actionable components (pull requests)
const Dashboard = () => {
    return(
        <>
        <Container>
            <LeftContainer>
                <Top>
                    <Header>DASHBOARD</Header>
                </Top>
                <Feed/>
            </LeftContainer>
            <RightContainer>
                <Content>
                    <Breakage/>
                    <Checks/>
                </Content>
            </RightContainer>
        </Container>
        </>
    )
}

export default Dashboard;

/* <ContentContainer>
                    <Team/>
                    <Breakage/>
                    <PullRequest/>
                </ContentContainer>*/
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

const ContentContainer = styled.div`
    padding: 2rem 0rem;
    padding-right: 0rem;
    width: 90%;
    max-width: 90rem;
    margin-left: 5%;
`

const LeftContainer = styled.div`
    padding: 2.1rem;
    min-width: 32rem;
    max-width: 32rem;
    background-color: white;
    box-shadow: 5px 0 3px -3px rgba(0,0,0,0.1);
    flex-direction: column;
`

const RightContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    align-items: center;
    overflow-y: scroll;
`

const Content = styled.div`
    width: 85%;
    max-width: 110rem;
    min-width: 80rem;
`
/*
const RightContainer = styled.div`

    margin-left: auto;
    width: 31rem;
    background-color: white;
    height: 100vh;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-top-left-radius: 2rem;

    height: 100vh;
    margin-left: 3rem;
`
*/


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
    background-color: white;/*FIX ME CSS #f6f7f9;*/
    height: 100vh;
    display: flex;
`

const FlexContainer = styled.div`
    display: flex;
`