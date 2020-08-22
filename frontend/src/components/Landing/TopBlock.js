import React from 'react';
import styled from 'styled-components';

import logo from '../../images/logo.svg';


class TopBlock extends React.Component {
    render(){
        return(
            <BlockContainer>
                <Company>
                    <StyledIcon src = {logo} />
                    quilt
                </Company>
                <Content margin = {true}>
                    <ContentText>
                        <ContentHeader>
                        Worry about code, not docs.
                        </ContentHeader>
                        <ContentSubHeader>
                            {/*Keep your knowledge productive*/}
                            Quilt integrates with your codebase to keep your knowledge accessible and up to date.
                        </ContentSubHeader>
                    </ContentText>
                    
                    <ContentCollage>

                    </ContentCollage>
                </Content>
            </BlockContainer>
        )
    }
}

export default TopBlock


const BlockContainer = styled.div`
    height: 80rem;
    padding: 3.5rem 12rem;
    background-color: #16181d;
    color: white;
    display: flex;
    flex-direction: column;
    clip-path: polygon(0 0, 0 100%, 100% 65rem, 100% 0)
`


const Company = styled.div`
    font-size: 3rem;
    color:white;
    font-weight: 500;
    letter-spacing: 1.5px;
    display: flex;
    align-items: center;
    margin-bottom: auto;
`


const StyledIcon = styled.img`
    width: 3.3rem;
    margin-right: 1rem;
`

const Content = styled.div`
    display: flex;
    margin-bottom: auto;
    margin-top: -10rem;
`   

const ContentText = styled.div`
    width: 40%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    color: ${props => props.color};
    margin-left: auto;
`

const ContentCollage = styled.div`
    width: 60%;
 
`

const ContentHeader = styled.div`
    font-size: 4.5rem;
    font-weight: 500;
    margin-top: -3rem;
    margin-bottom: 3.5rem;
    width: 40rem;
`

const ContentSubHeader = styled.div`
    font-size: 1.8rem;
    font-weight: 300;
    line-height: 2.8rem;
    color: ${props => props.active ?  "#737a96" : ""};
`