import React, { useRef, useState, useCallback } from 'react'
import history from '../history';

//

//router
import { Router, Route, Link } from 'react-router-dom';

//components
import SpaceView from './Space Page/SpaceView';
import Bucket from './General/Top Navbar/Bucket'
import NavbarProfile from './Top Navbar/NavbarProfile';
import UserSettingsView from './Settings Pages/UserSettingsView';
import WorkspaceView from './Workspace Page/WorkspaceView';
import CreateButton from './Top Navbar/CreateButton';

//styles
import styled from "styled-components";
import {RiPencilLine} from 'react-icons/ri'

//images
import logo from '../images/logo.svg'



/* <NavbarProfile
                    goLogout = {goLogout}
                />*//*<Searchbar/>*/
const Dashboard = () => {

    let [search, setSearch] = useState(false)
    const inputRef = useRef(null)

    return ( 
        <Container>
            <TopNav>
                <StyledIcon src = {logo} />
                <Company>quilt</Company>
                <CreateButton/>
                <div>
                    <SearchbarWrapper hoverColor = {search ? '#313b5e' : '#39466f'} onClick = {() => setSearch(true)}>
                        <ion-icon 
                            style={{'color': 'white', 'cursor': 'pointer', 'fontSize': '2rem'}} 
                            name="search-outline">
                        </ion-icon>
                        <Searchbar ref = {inputRef} onBlur = {(e) => {e.target.blur(); setSearch(false)}} barWidth = {search ? '40rem' : '15rem'} />
                    </SearchbarWrapper>
                    
                    {search && <SearchBubble>
                                    <SearchHeader>
                                        
                                        Recently Searched
                                    </SearchHeader>
                                    {["Torch Utils", "Untitled", "Starting the server", "Document Hierarchy", "Requests"].map((query) => {
                                        return (
                                                <SearchResult>
                                                    <ion-icon name="document-text-outline" style={{'fontSize': '1.7rem', 'color': "#213A81", marginRight: "0.8rem"}}></ion-icon>
                                                    {query}
                                                </SearchResult>
                                            )
                                        })  
                                
                                    }
                                </SearchBubble>
                    }
                     
                </div>
               
                
               
            </TopNav>
            <Router history = {history}>
                  <Route exact path = "/workspaces" component = {WorkspaceView} />
                  <Route path = "/workspaces/:workspaceId" component = {SpaceView} />
                  <Route path = "/settings" component = {UserSettingsView} />
            </Router>
            {/*<UserSettingsView/>*/}
            {/*<SpaceView/>*/}
        </Container>
    )
}

/*
<Options>
                    <Option>
                        <ion-icon name="add-outline">
                        </ion-icon>
                    </Option>
                    <Option>
                        <ion-icon name="layers-outline">
                        </ion-icon>
                    </Option>
                   
                    <Option>
                        <ion-icon name="notifications-outline">
                        </ion-icon>
                    </Option>
                                  
                    <NavbarProfile
                        goLogout = {goLogout}
                    />
                </Options>
                
 <TopNav>
                <StyledIcon src = {logo} />
                <Company>quilt</Company>
                
                <NavbarElement onClick = {() => {history.push("/workspaces")}} >
                    <ion-icon style={{'color': 'white', 
                                 'fontSize': '2rem', 
                                 'marginRight': '1rem'
                                 
                                  }}  name="planet-outline"></ion-icon>
                    Spaces
                </NavbarElement>
                <div>
                    <SearchbarWrapper hoverColor = {search ? '#313b5e' : '#39466f'} onClick = {() => setSearch(true)}>
                        <ion-icon 
                            style={{'color': 'white', 'cursor': 'pointer', 'fontSize': '2rem'}} 
                            name="search-outline">
                        </ion-icon>
                        <Searchbar ref = {inputRef} onBlur = {(e) => {e.target.blur(); setSearch(false)}} barWidth = {search ? '40rem' : '15rem'} />
                    </SearchbarWrapper>
                    
                    {search && <SearchBubble>
                                    <SearchHeader>
                                        
                                        Recently Searched
                                    </SearchHeader>
                                    {["Torch Utils", "Untitled", "Starting the server", "Document Hierarchy", "Requests"].map((query) => {
                                        return (
                                                <SearchResult>
                                                    <ion-icon name="document-text-outline" style={{'fontSize': '1.7rem', 'color': "#213A81", marginRight: "0.8rem"}}></ion-icon>
                                                    {query}
                                                </SearchResult>
                                            )
                                        })  
                                
                                    }
                                </SearchBubble>
                    }
                     
                </div>
                <Options>
                    <Option>
                        <ion-icon name="add-outline">
                        </ion-icon>
                    </Option>
                    <Option>
                        <ion-icon name="layers-outline">
                        </ion-icon>
                    </Option>
                   
                    <Option>
                        <ion-icon name="notifications-outline">
                        </ion-icon>
                    </Option>
                                  
                    <NavbarProfile
                        goLogout = {goLogout}
                    />
                </Options>
                
               
            </TopNav>*/

/*
 <ion-icon  style={{'color': '#172A4E', 'fontSize': '2.4rem', 'marginRight': '2rem'}} name="bookmarks-outline"></ion-icon>
                    <ion-icon style={{'color': '#172A4E', 'fontSize': '2.4rem', 'marginRight': '2rem'}} name="add-outline"></ion-icon>
                    */
/* 
                <ion-icon style={{'color': '#172A4E', 'fontSize': '2.4rem', 'marginLeft': '70rem', 'marginRight': '2rem'}} name="search-outline"></ion-icon>
                <ion-icon   style={{'color': '#172A4E', 'fontSize': '2.4rem', 'marginRight': '2rem'}} name="notifications-outline"></ion-icon>
                <ion-icon  style={{'color': '#172A4E', 'fontSize': '2.4rem', 'marginRight': '2rem'}} name="bookmarks-outline"></ion-icon>
                <ion-icon style={{'color': '#172A4E', 'fontSize': '2.4rem', 'marginRight': '2rem'}} name="add-outline"></ion-icon>
                <NavbarProfile
                    goLogout = {goLogout}
                />*/
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

const SearchHeader = styled.div`
    height: 2rem;
    color: #172A4E;
    opacity: 0.8;
    font-size: 1.2rem;
    padding: 1rem;
    margin-bottom: 1rem;
    
`

const SearchResult = styled.div`
    height: 3rem;
    display: flex;
    align-items: center;
    color: #172A4E;
    font-size: 1.3rem;
    padding: 1.5rem 2rem;
    cursor: pointer;
    &:hover {
        background-color: #EBECF0;
    }
    font-weight: 500;
`

const SearchBubble = styled.div`
    width: 50rem;
    box-shadow: 0 2px 6px 2px rgba(60,64,67,.15);
    position: absolute;
    border-radius: 0.3rem;
    background-color: white;
    top: 5rem;
    display: flex;
    flex-direction: column;
    padding-bottom: 0.5rem;
`

const Options = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;
    margin-right: 15rem;
`

const Option = styled.div`
    font-size: 2rem;
    margin-right: 1.5rem;
    height: 3.3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.3rem;
    border-radius: 0.25rem;
    background-color:  #323B5D;;
    cursor: pointer;
    color: white;
    &:hover {
        background-color:#39466f
    }
`


const Company = styled.div`
    font-size: 2.3rem;
    color:white;
    font-weight: 500;
    letter-spacing: 1.5px;
    margin-right: 15rem;
    margin-top: -0.25rem;
`

const NavbarElement = styled.div`
    font-size: 1.8rem;
    /*color: #172A4E;*/
    background-color: #414758;
   
    height: 3.2rem;
    padding: 0 1rem;
    margin-right: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    &:hover {
        /*background-color:#39466f*/
    }
    color: white;
    border: 1px solid #70EAE1;
    border-radius: 0.3rem;
    cursor: pointer;
`

const SearchbarWrapper = styled.div`
    margin-right: 3rem;
    border-radius: 0.25rem;
    cursor: text;
    display: flex;
    align-items: center;
    
    height: 3.3rem;
    padding: 0.5rem 1.5rem;
    background-color: #414758; /*#39466f*/
    
    
   
    width: ${props => props.width};
`


const Searchbar = styled.input`
    background-color:transparent;
    border-radius: 2px;
    border: none;
    padding: 0.4rem 0.4rem;
    font-size: 1.35rem;
    outline: none;
    color: white;
    margin-left: 1rem;
    &::placeholder {
        color: white;
        opacity: 0.7;
        font-weight: 400;
    }
    &:hover {
        background-color:transparent;
    }
    font-weight: 350;
    height: 3rem;
    width: ${props => props.barWidth};
    transition: width 0.2s ease-out;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`
//#262848;
//#323B5D;
const TopNav = styled.div`
    min-height: 5.5rem;
    max-height: 5.5rem;
    
    background-color:#343946;
    color:#D6E0EE;
    display: flex;
    z-index: 20;
    align-items: center;
`

const Container = styled.div`
    display: flex;
    flex-direction:column;
    height: 100vh;
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
    width: 2.6rem;
    margin-left: 4.5rem;
    margin-right: 1rem;
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