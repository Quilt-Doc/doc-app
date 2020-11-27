import React, {Component} from 'react';

// styles
import styled from 'styled-components';
import chroma from 'chroma-js';
import { LIGHT_SHADOW_1 } from '../../../../../styles/shadows';

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
            <Top>
                <Header>DASHBOARD</Header>
            </Top>
            <ContainerFlex>
                <LeftContainer>
                    <Feed/>
                    <Breakage/>
                </LeftContainer>
                <RightContainer>
                    <Checks/>
                </RightContainer>
            </ContainerFlex>
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

const ContainerFlex = styled.div`
    display: flex;
`

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
    min-width: 40rem;
    max-width: 40rem;
    flex-direction: column;
    margin-right: 3rem;
    margin-left: 6rem;
`

/* box-shadow: 5px 0 3px -3px rgba(0,0,0,0.1);*/

const RightContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow-y: scroll;
    z-index: 2;
    background-color: white;
    margin-top: 2.7rem;
    padding: 2rem;
    padding-right: 3rem;
    border-radius: 0.7rem;
    height: 85vh;
    margin-right: 6rem;
    /*box-shadow: ${LIGHT_SHADOW_1};*/
    min-width: 70rem;
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
    background-color: ${chroma('#6762df').alpha(0.15)};
    color: #6762df;
    border-radius: 1.3rem;
    font-weight: 500;
    margin-bottom: 1rem;
    margin-right: 4rem;
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
    /*background-color: #F7F8FA;#f6f7f9;*/
    height: 100vh;
    padding: 2.1rem 2.5rem;
    padding-right: 3rem;
`

const FlexContainer = styled.div`
    display: flex;
`