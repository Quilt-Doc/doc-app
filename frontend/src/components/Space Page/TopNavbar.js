import React, { useRef, useState } from 'react'

//components
import NavbarProfile from '../Top Navbar/NavbarProfile'
import CreateButton from '../Top Navbar/CreateButton';
import ConnectButton from '../Top Navbar/ConnectButton';

//styles
import styled from "styled-components";
import {IoMdNotificationsOutline} from 'react-icons/io'

//images
import logo from '../../images/logo.svg';


const TopNavbar = (props) => {
    let [search, setSearch] = useState(false)
    const inputRef = useRef(null)

    return(
        <TopNav>
            <StyledIcon src = {logo} />
            <Company>quilt</Company>
            <CreateButton/>
            <ConnectButton/>
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
                    <IoMdNotificationsOutline/>
                </Option>
                <NavbarProfile/>
            </Options>
        </TopNav>
    )  
}

export default TopNavbar;


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
    margin-right: 10rem;
`

const Option = styled.div`
    font-size: 2rem;
    margin-right: 1.5rem;
    height: 3.3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3.3rem;
    border-radius: 0.4rem;
    background-color: #323643;
    cursor: pointer;
    color: white;
    &:hover {
        background-color:#39466f
    }
    padding: 0.5;
    border: 1px solid #323743;;
`


const Company = styled.div`
    font-size: 2.3rem;
    color:white;
    font-weight: 500;
    letter-spacing: 1.5px;
    margin-right: 15rem;
    margin-top: -0.25rem;
`

const SearchbarWrapper = styled.div`
    margin-right: 3rem;
    border-radius: 0.25rem;
    cursor: text;
    display: flex;
    align-items: center;
    
    height: 3.3rem;
    padding: 0.5rem 1.5rem;
    background-color: #323643;   /*#39466f*/;
    border: 1px solid #323743;
    
   
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
    transition: width 0.15s ease-out;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`
//#262848;
//#323B5D;
const TopNav = styled.div`
    min-height: 5.5rem;
    max-height: 5.5rem;
    
    background-color:#252832;
    color:white;
    display: flex;
    z-index: 5;
    align-items: center;
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