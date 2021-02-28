import React from 'react';

import styled from 'styled-components';
import snippetMP4 from '../../images/snippet.mp4'

const SnippetPanel = () => {
    return(
        <Container>
            <Content>
                <SmallContainer>
                    <Header>
                        Understand Context
                    </Header>   
                    <SubHeader>
                        <Mark>Information shouldn't be separated from code. </Mark>Stay in context with attached and tracked snippet annotations.
                    </SubHeader>
                </SmallContainer>
                <StyledVideo muted autoPlay loop >
                    <source src = {snippetMP4} type = "video/mp4"></source>
                </StyledVideo>
            </Content>
        </Container>
    )
}

export default SnippetPanel;


const StyledVideo = styled.video`
    width: 55%;
    margin-right: 8rem;
    border-radius: 0.8rem;
    box-shadow: 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12), 0 3px 5px -1px rgba(0, 0, 0, 0.4);
`

const Container = styled.div`
    height: 85rem;
    width: 100%;
    background-color: #1a1d23;
    display: flex;
    color: white;
    flex-direction: column;
    justify-content: center;
    padding-right: 8.5rem;
`

const Content = styled.div`
    height: 50rem;
    width: 100%;
    display: flex;
    align-items: center;
    direction: rtl;
`

const SmallContainer = styled.div`
    min-width: 37%;
    max-width: 37%;
    display: flex;
    flex-direction: column;
    direction: ltr;
`

const Header = styled.div`
    font-size: 4.5rem;
    font-weight: 500;
`

const SubHeader = styled.div`
    font-size: 1.9rem;
    font-weight: 300;
    line-height: 3.5rem;
    margin-top: 2rem;
    opacity: 0.8;
`

const Mark = styled.b`
    font-weight: 500;
`