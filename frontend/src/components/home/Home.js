import React from 'react';

//components
import Workspaces from './workspaces/Workspaces';

//styles
import styled from 'styled-components';

//icons
import logoSVG from '../../images/final_logo.svg';

const Home = () => {
    return (
        <Container>
            <Top>
                <StyledIcon src = {logoSVG}/>
                <BrandName>
                    quilt
                </BrandName>
            </Top>
            <Workspaces/>
        </Container>
        )
}

export default Home;

const BrandName = styled.div`
    font-size: 3.5rem;
    letter-spacing: 1px;
    font-weight: 400;
    margin-top: 0.3rem;
`

const StyledIcon = styled.img`
    max-width: 4rem;
    margin-right: 1.33rem;
    margin-top: 1.5rem;
`

const Container = styled.div`
    background-color:#16181d;
    display: flex;
    flex: 1;
    display: flex;
    flex-direction: column;
    color: white;
`


const Top = styled.div`
    height: 9rem;
    padding-left: 8.5rem;
    padding-right: 8.5rem;
    color:white;
    display: flex;
    align-items: center;
`