import React from 'react';
import history from '../history';

//router
import { Router, Route } from 'react-router-dom';

//components
import SpaceView from './Space Page/SpaceView';
import Bucket from './General Components/Top Navbar/Bucket'
import NavbarProfile from './Top Navbar/NavbarProfile';
import UserSettingsView from './Settings Pages/UserSettingsView';
import WorkspaceView from './Workspace Page/WorkspaceView';

//styles
import styled from "styled-components";

//images
import preetaicon from '../images/preeta.png'


/* <NavbarProfile
                    goLogout = {goLogout}
                />*/
const Dashboard = () => {
    return (
        <Container>
            <TopNav>
                <ion-icon style={{'color': '#19E5BE', 'fontSize': '2.4rem', 'marginLeft': '5rem', 'marginRight': '1.2rem'}} name="book-outline"></ion-icon>
                <Company>Docapp</Company>
                <NavbarElement borderBottom = {'4px solid #19E5BE'}>
                    Home
                </NavbarElement>
                <NavbarElement>
                    Workspaces
                </NavbarElement>
                <NavbarElement>
                    Recent
                </NavbarElement>
                <NavbarElement>
                    People
                </NavbarElement>
                
                
                <ion-icon style={{'color': '#172A4E', 'fontSize': '2.4rem', 'marginLeft': '70rem', 'marginRight': '2rem'}} name="search-outline"></ion-icon>
                <ion-icon   style={{'color': '#172A4E', 'fontSize': '2.4rem', 'marginRight': '2rem'}} name="notifications-outline"></ion-icon>
                <ion-icon  style={{'color': '#172A4E', 'fontSize': '2.4rem', 'marginRight': '2rem'}} name="bookmarks-outline"></ion-icon>
                <ion-icon style={{'color': '#172A4E', 'fontSize': '2.4rem', 'marginRight': '2rem'}} name="add-outline"></ion-icon>
                <NavbarProfile
                    goLogout = {goLogout}
                />
            </TopNav>
            <Router history = {history}>
                  <Route exact path = "/workspaces" component = {WorkspaceView} />
                  <Route path = "/workspaces/*" component = {SpaceView} />
                  <Route path = "/settings" component = {UserSettingsView} />
            </Router>
            {/*<UserSettingsView/>*/}
            {/*<SpaceView/>*/}
        </Container>
    )
}

/*

<SearchbarWrapper>
                    
                    <Searchbar  placeholder = {'Search for anything..'} spellCheck = {false}/>
                </SearchbarWrapper>*/

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

const Company = styled.div`
    font-size: 2.2rem;
    color: #172A4E;
    font-weight: 300;
    margin-right: 13rem;
`

const NavbarElement = styled.div`
    font-size: 1.6rem;
    color: #172A4E;
    margin-right: 3rem;
    height: 8vh;
    display: flex;
    align-items: center;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    margin-top: 4px;
    border-bottom: 4px solid transparent;
    border-bottom: ${props => props.borderBottom};
`

const SearchbarWrapper = styled.div`
    margin-right: 3rem;
    margin-left: 20rem;
    border-radius: 0.3rem;
    border: 1px solid #DFDFDF;
    display: flex;
    align-items: center;
    width: 37rem;
    height: 3.8rem;
    padding: 0.5rem 1.5rem;
    background-color: #FAFBFC;
    
`


const Searchbar = styled.input`
    background-color: #FAFBFC;
    border-radius: 2px;
    border: none;
    padding: 0.4rem 0.4rem;
    font-size: 1.5rem;
    outline: none;
    color: #172A4E;
    margin-left: 1rem;
    &::placeholder {
        color: #172A4E;
        opacity: 0.7;
        font-weight: 400;
    }
    font-weight: 400;
    width: 25rem;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`


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
/*
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
    
`*/

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