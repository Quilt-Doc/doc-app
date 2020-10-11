import React from 'react';
import { render } from 'react-dom';
import { Router, Route, Switch } from 'react-router-dom';

import dashboardGIF from '../../images/dashboard.gif';
import terminalMP4 from '../../images/terminal_6.mp4';

import styled from 'styled-components';
import chroma from 'chroma-js';

const DashboardPanel = () => {
    return(
        <Container>
            <TopBar>
                <Content>
                    <Header>
                        Remove Process
                    </Header>   
                    <SubHeader>
                        <Mark>Integrated into your workflow.</Mark> Across changes to source code, Quilt delivers radical clarity and actionable insights for documentation work.
                    </SubHeader>
                </Content>
            </TopBar>
            <Body>
                <BlockContainer>
                    <Block>
                        <Top>
                            <Number bColor = {'#2c303a'}>1</Number>
                            Make Changes
                        </Top>
                        <StyledVideo muted autoPlay loop >
                            <source src = {terminalMP4} type = "video/mp4"></source>
                        </StyledVideo>
                    </Block>
                    <Block>
                        <Top>
                            <Number bColor = {'#5B75E6'}>2</Number>
                            Update Documentation
                        </Top>
                       
                    </Block>
                </BlockContainer>
            </Body>
        </Container>
    )
}


export default DashboardPanel;

const StyledVideo = styled.video`
    margin-top: 2rem;
    width: 100%;
    height: auto;
`

const Top = styled.div`
    display: flex;
    align-items: center;
    font-size: 2rem;
    font-weight: 500;
`

const Number = styled.div`
    height: 4rem;
    width: 4rem;
    color: ${props => props.bColor};
    background-color: ${props => chroma(props.bColor).alpha(0.1)};
    border: 1px solid ${props => props.bColor};
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    margin-right: 1.5rem;
    font-weight: 500;
`


const Body = styled.div`
    height: 100%;
    display: flex;
    justify-content: center;
`

const BlockContainer = styled.div`
    display: flex;
`
const Block = styled.div`
    height: 50rem;
    width: 42vw;
    &:first-of-type {
        margin-right: 6rem;
    }
`


const Mark = styled.b`
    font-weight: 500;
`

const Container = styled.div`
    height: 100rem;
    width: 100%;
    background-color: white;
    display: flex;
    color: #172A4e;
    flex-direction: column;
`

const TopBar = styled.div`
    height: 50rem;
    padding-left: 15rem;
    padding-right: 15rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`

const Content = styled.div`
    max-width: 75rem;
`

const Header = styled.div`
    font-size: 4.5rem;
    font-weight: 500;
    text-align: center;
`

const SubHeader = styled.div`
    font-size: 1.9rem;
    font-weight: 300;
    line-height: 3.5rem;
    margin-top: 2rem;
    opacity: 0.8;
    text-align: center;
`