import React from 'react';
import history from '../history';

//components
import Sidebar from './Sidebar';
import Dash from './Code Explorer Page/Dash';

//styles
import styled from "styled-components";

//images
import bucket_icon from '../images/bucket.svg'
import preeta_icon from '../images/preeta.png'

const Dashboard = () => {
    return (
        <Container>
            <TopNav>
                <Styled_Icon  src = {preeta_icon}/>
                <Navbar_Button2 margin_left = {'6'} border_radius = {'0.5rem'} onClick = {() => this.setState({modal_display: ''})}>
                    Home
                </Navbar_Button2>
                <Navbar_Button2 margin_left = {'1'} border_radius = {'0.5rem'} onClick = {() => this.setState({modal_display: ''})}>
                    Spaces
                </Navbar_Button2>
                <Navbar_Button2 margin_left = {'1'} border_radius = {'0.5rem'} onClick = {() => this.setState({modal_display: ''})}>
                    People
                </Navbar_Button2>
                <Searchbar/>
                <Navbar_Button>
                    <ion-icon style={{'font-size': '3rem'}} name="albums-outline"></ion-icon>
                </Navbar_Button>
                
            </TopNav>
            <Dash/>
        </Container>
    )
}

/*

<LeftNav/>
            <RightView>
                
            </RightView>

*/

export default Dashboard;

const TopNav = styled.div`
    height: 8vh;
    box-shadow: 0 2px 2px rgba(0,0,0,0.1);
    display: flex;
    z-index: 4;
    align-items: center
`

const Container = styled.div`
    display: flex;
    flex-direction:column
    
`


const Navbar_Button = styled.div`
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


const Navbar_Button2 = styled.div`
    padding: 1.2rem 1.5rem;
    
    border-radius: ${props => props.border_radius};
    height: 5rem;
    font-size: 1.6rem;
    letter-spacing: 0.1rem;
    color:  #172A4E;
    cursor: pointer;

    display: flex;
    align-items: center;
    margin-left: ${props => props.margin_left}rem;

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

const Styled_Icon = styled.img`
    width: 3.5rem;
    margin-left: 3.5rem;
`

const Styled_Icon2 = styled.img`
    width: 4rem;

`
