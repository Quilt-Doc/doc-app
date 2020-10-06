import React from 'react';
import styled from 'styled-components';

//components
import FeedLog from './FeedLog';

// Log of activity in workspace
const Feed = () => {
    return (
        <FeedContainer>
            <Header>
                Feed
            </Header>
            <ListView>
                <FeedLog/>
            </ListView>
        </FeedContainer>
    )
}

export default Feed;

const Header = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    font-size: 1.7rem;
    font-weight: 600;
    padding-right: 3rem;
    margin-bottom: 1rem;
`

const ListView = styled.div`
    display: flex;
    flex-direction: column;
    background-color: white;
    padding-bottom: 1rem;
    height: 100%;
    padding: 2rem;
    border-radius: 0.4rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    background-color: white;
`

const FeedContainer = styled.div`
    margin-top: 2rem;
    margin-left: 4rem;
`