import React, { Component } from 'react';

import styled from 'styled-components';
import chroma from 'chroma-js';

class Team extends Component {

    render(){
        return (
            <TeamContainer>
                <Header>Team</Header>
                <Container>
                    <Member>
                        <PersonIcon color = {'#1e90ff'}>F</PersonIcon>
                        <ContentContainer>
                            <Name>Minnie Garcia</Name>
                            <Stats></Stats>
                        </ContentContainer>
                    </Member>
                </Container>
            </TeamContainer>
        )
    }
}

export default Team;

const PersonIcon = styled.div`
    height: 3.3rem;
    width: 3.3rem;
    background-color: ${props => chroma(props.color).alpha(0.2)};
    color:${props => props.color};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    margin-right: 1.5rem;
    border-radius: 50%;
`

const ContentContainer = styled.div`
    
`

const Name = styled.div`
    font-weight: 500;
    opacity: 0.9;
    font-size: 1.2rem;
`

const Stats = styled.div`

`


const Member = styled.div`
    height: 7.5rem;
    border: 1px solid #E0E4E7;
    width: 25rem;
    display: flex;
    border-radius: 0.7rem;
    padding:1.2rem 1rem;
`

const Container = styled.div`
    height: 35rem;
    background-color: white;
    border-radius: 0.4rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    padding: 3rem;
`

const Header = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    font-size: 1.7rem;
    font-weight: 600;
    margin-bottom: 1rem;
`

const TeamContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
`
