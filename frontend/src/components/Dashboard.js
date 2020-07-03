import React from 'react';
import history from '../history';

//components
import SpaceView from './Space Page/SpaceView';
import Bucket from './General Components/Top Navbar/Bucket'
import NavbarProfile from './Top Navbar/NavbarProfile';
//styles
import styled from "styled-components";

//images
import preetaicon from '../images/preeta.png'


const Dashboard = () => {
    return (
        <Container>
            <TopNav>
                <NavbarProfile
                    goLogout = {goLogout}
                />
            </TopNav>
            <SpaceView/>
        </Container>
    )
}

const goLogout = () => {
    window.open("http://localhost:3001/api/auth/logout", "_self");
}
/*

<LeftNav/>
            <RightView>
                
            </RightView>

*/
//  DESIGN NEEDS TO BE CLEANED UP
/*
<StyledIcon  src = {preetaicon}/>
                <NavbarButton2 marginLeft = {'6'} borderRadius = {'0.5rem'} onClick = {() => history.push('/repository')}>
                    Home
                </NavbarButton2>
                <NavbarButton2 marginLeft = {'1'} borderRadius = {'0.5rem'} onClick = {() => history.push('/repository')}>
                    Spaces
                </NavbarButton2>
                <NavbarButton2 marginLeft = {'1'} borderRadius = {'0.5rem'} onClick = {() => history.push('/repository')}>
                    People
                </NavbarButton2>
                <Searchbar/>
                <Bucket/>
*/
export default Dashboard;

const TopNav = styled.div`
    height: 8vh;
    box-shadow: 0 2px 2px rgba(0,0,0,0.1);
    display: flex;
    z-index: 4;
    align-items: center;
`

const Container = styled.div`
    display: flex;
    flex-direction:column;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`


const NavbarButton = styled.div`
    padding: 1.2rem 1.5rem;
   
    height: 6rem;
    width: 6rem;
    margin-left:12rem;
    font-size: 1.5rem;
    letter-spacing: 0.1rem;
    color:  #172A4E;
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
        background-color:   #F1F3F4; 
        border-radius: 4px;
    }
`


const NavbarButton2 = styled.div`
    padding: 1.2rem 1.5rem;
    
    border-radius: ${props => props.borderRadius};
    height: 5rem;
    font-size: 1.6rem;
    letter-spacing: 0.1rem;
    color:  #172A4E;
    cursor: pointer;

    display: flex;
    align-items: center;
    margin-left: ${props => props.marginLeft}rem;

    &:hover {
        
    }

`

const Searchbar = styled.input`
    margin-left: 15rem;
    height: 3.5rem;
    width: 40rem;
    border-radius: 2px;
    border: none;
    background-color:   #F1F3F4;
    padding: 0.8rem 1.2rem;
    &:focus {
        background-color: white;
        border: 1px solid #19E5BE;
    }
    color: #172A4E;
    outline: none;
    
`

const StyledIcon = styled.img`
    width: 3.5rem;
    margin-left: 3.5rem;
`

const StyledIcon2 = styled.img`
    width: 4rem;
    cursor: pointer;
   
`

const LogoutButton = styled.div`
    padding: 1rem 0.8rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-radius: 0.4rem;
    color: #19E5BE;
    border: 1px solid #19E5BE;
    &:hover {
        color: white;
        background-color: #19E5BE;
    }
    cursor: pointer;
    margin-right: 2rem;
`