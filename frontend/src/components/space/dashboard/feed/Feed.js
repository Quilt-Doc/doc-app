import React from 'react';
import styled from 'styled-components';

//components
import FeedLog from './FeedLog';

// Log of activity in workspace
const Feed = () => {
    return (
        <FeedContainer>
            <ListView>
                <FeedLog/>
                <FeedLog/>
                <FeedLog/>
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
    /*
    background-color: white;
    padding-bottom: 1rem;
    padding: 2rem;
    */

`

const FeedContainer = styled.div`
    margin-top: 2.7rem;
`