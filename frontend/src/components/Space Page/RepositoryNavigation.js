import React from 'react';

//styles 
import styled from "styled-components"

//react-router
import { Router, Route } from 'react-router-dom';
import history from '../../history';

//components
import HoveringMenuExample from './Text Editor Page/HoveringMenuExample';
import DirectoryView from './Directory Navigation Page/DirectoryView'
import CodeView from './Code Editing Page/CodeView'


//component that holds everything related to repository navigation (directory viewer and code viewer)

class RepositoryNavigation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
           'fileItemBackgroundColor': '',
           'modalDisplay': 'none',
           'file': false
        } 
    }




    renderHeader() {
        //this.props.location.pathname
    }


    render() {
            return (
                <>
                    <Container>
                        <Header>Pytorch / Fairseq</Header>
                        <Router history = {history}>
                            <Route path = "/repository/directory/:link" component = { DirectoryView } />
                            <Route path = "/repository/codeview/:link" component = { CodeView } />
                        </Router>
                    </Container> 
                    <ModalBackground display = {this.state.modalDisplay} onClick = {() => this.setState({'modalDisplay': 'none'})}>
                        <ModalContent onClick = {(e) => {e.stopPropagation()}}>
                            <Document>
                                <HoveringMenuExample/>
                            </Document>
                            
                        </ModalContent>
                    </ModalBackground>
                </>
            );
    }
}

export default RepositoryNavigation

// Styled Components

const Container = styled.div`
    width: 120rem;
    margin: 0 auto;
    margin-top: 5rem;
    
`

// DIRECTORY COMPONENTS

const Header = styled.div`
    font-size: 3.5rem;
    color: #172A4E;
    font-weight: bold;
    letter-spacing: 0.1rem;
    margin-bottom: 7rem;
`

// Modal
/* The Modal (background) */
const ModalBackground = styled.div`
    display: ${props => props.display};
    position: fixed; /* Stay in place */
    z-index: 1; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: hidden; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
`
  
  /* Modal Content/Box */
const ModalContent = styled.div`
    background-color: #fefefe;
    margin: 4.5% auto; /* 15% from the top and centered */
    padding: 20px;
    border: 1px solid #888;
    width: 73vw; /* Could be more or less, depending on screen size */
    height: 85vh;
    border-radius: 5px;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    max-width: 96rem;
`
//background: rgba(45, 170, 219, 0.3); on highlight
const Document = styled.div`
    width: 100%;
`

