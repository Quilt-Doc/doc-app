import React from 'react';

//components
import Sidebar from './Sidebar';

//styles
import styled from "styled-components"

const Dashboard = () => {
    return (
        <Container>
            
            <Sidebar/>
        </Container>
    )
}

/*

<LeftNav/>
            <RightView>
                
            </RightView>

*/

export default Dashboard;

const Container = styled.div`
    display: flex;
`
/*
const RightView = styled.div`
    display: flex;
    flex-direction: column;
    width: 80vw;
    height: 100vh;
`

const LeftNav = styled.div`
    background-color: blue;
    width: 13rem;
    height: 100vh;
`

const TopNav = styled.div`
    background-color: green;
    height: 3rem;
`
const MainView = styled.div`
    background-color: red;
    height: 100%;
`
*/