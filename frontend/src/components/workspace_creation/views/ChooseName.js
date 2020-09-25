import React from 'react';
import styled from 'styled-components';

// part of the workspace creation where name of workspace is inputted
const ChooseName = () => {
    return(
        <ContentContainer>
            <SubContentHeader>
                Name your workspace
            </SubContentHeader>
            <SubContentText>
                And thats it! Enjoy.
            </SubContentText>
            <NameInput spellCheck = {false} autoFocus placeholder = 
                {"workspace name"}/>
            <NextButton>
                Create
            </NextButton>
        </ContentContainer>
    )
}

export default ChooseName;


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
    border: 2px solid #3e4251;
    letter-spacing: 0.5px;
    outline: none;
    margin-top: 5rem;
    &::placeholder {
        color: white;
        opacity: 0.3;
    }
`

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
`

const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
`

const SubContentHeader = styled.div`
    font-size: 2.2rem;
    height: 3.5rem;
    margin-bottom: 0.5rem;
`

const SubContentText = styled.div`
    color: white;
    font-size: 1.8rem;
    font-weight: 400;
    line-height: 1.6;
    opacity: 0.9
`
