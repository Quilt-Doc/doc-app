import React from 'react'

//components
import NavbarProfile from '../Top Navbar/NavbarProfile'
import CreateButton from '../Top Navbar/CreateButton';
import ConnectButton from '../Top Navbar/ConnectButton';
import TopSearchbar from '../Top Navbar/TopSearchbar';

//styles
import styled from "styled-components";
import {IoMdNotificationsOutline} from 'react-icons/io'

//images
import logo from '../../images/logo.svg';


const TopNavbar = () => {
    return(
        <TopNav>
            <StyledIcon src = {logo} />
            <Company>quilt</Company>
            <CreateButton/>
            <ConnectButton/>
            <div>
                <TopSearchbar/>
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

const TopNav = styled.div`
    min-height: 5.5rem;
    max-height: 5.5rem;
    
    background-color:#252832; 
    color:white;
    display: flex;
    z-index: 5;
    align-items: center;
`

const StyledIcon = styled.img`
    width: 2.6rem;
    margin-left: 4.5rem;
    margin-right: 1rem;
`