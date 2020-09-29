import React from 'react';

//styles
import styled from 'styled-components';

//components
import BreakageCard from './BreakageCard';

// component that shows which documents have been broken by deprecation
const Breakage = () =>  {
    return(
        <BreakageContainer>
            <Header>  
                Breakage
            </Header>
            <ListView>
                <BreakageCard/>
                <BreakageCard/>
                <BreakageCard warning = {true}/>
                <BreakageCard/>
            </ListView>
        </BreakageContainer>
    )
}

export default Breakage;

const Header = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    font-size: 1.7rem;
    font-weight: 600;
    margin-bottom: 1rem;
    padding-left: 4rem;
    padding-right: 4rem;
`

const ListView = styled.div`
    display: flex;
    padding-bottom: 1rem;
    height: 100%;
    overflow-x: scroll;
    width: calc(100vw - 32rem - 25rem);
`

const BreakageContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
`
