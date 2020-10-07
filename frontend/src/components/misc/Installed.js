import React from 'react';
import styled from 'styled-components';

const Installed = () => {
    return(
        <Container>
            Installion Success! Return to quilt. 
        </Container>
    )
}

export default Installed;

const StyledIcon = styled.img`
    width: 10rem;
    margin-bottom: 2rem;
`

const Container = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #16181d;
    width: 100vw;
    height: 100vh;
    color: white;
    font-size: 3rem;
    flex-direction: column;
`