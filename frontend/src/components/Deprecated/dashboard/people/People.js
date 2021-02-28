import React from 'react';

//styles
import styled from 'styled-components';

//components
import Member from './Member';

// listing of people and relevant stats associated with those people
const People = () => {
    return(
        <PeopleContainer>
            <Header>
                Team
            </Header>
            <ListView>
                <Member/>
                <Member/>
                <Member/>
            </ListView>
        </PeopleContainer>
    )
}

export default People;

const PeopleContainer = styled.div`
    margin-top: 1rem;
`

const Header = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    font-size: 1.7rem;
    font-weight: 500;
    margin-bottom: 1rem;
`

const ListView = styled.div`
    display: flex;
    flex-direction: column;
`