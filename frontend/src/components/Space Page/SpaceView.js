import React from 'react';

//styles 
import styled from "styled-components";

//components
import HoveringMenuExample from './Text Editor Page/HoveringMenuExample';
import RepositoryNavigation from './RepositoryNavigation';
import RepositoryView from './Repository Page/RepositoryView';

//react-router
import { Switch, Route } from 'react-router-dom';
import history from '../../history';

class SpaceView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
           'modalDisplay': ''
        } 
    }

    render() {
        return (
            <>
                <Container>
                    <SideNavbar>
                        <DocumentCreateButton onClick = {() => this.setState({'modalDisplay': ''})}  >
                            <ion-icon style={{'fontSize': '3.7rem'}} name="create-outline"></ion-icon>
                        </DocumentCreateButton>
                    </SideNavbar>
                    <RightView>
                        <Switch history = {history}>
                            <Route exact path = "/repository" component = {RepositoryView} />
                            <Route path = "/repository" component = {RepositoryNavigation}/>
                        </Switch>
                    </RightView>
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

export default SpaceView;


//Styled Components

const Container = styled.div`
    display: flex;
`

const SideNavbar = styled.div`
    width: 11rem;
    background-color: #F4F4F6;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 5rem;
`

/*
const SideNavbarItem = styled.div`
    height: 9rem;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    &:hover {
        border-left: 0.55rem solid #5534FF;
    }
`
*/
const DocumentCreateButton = styled.div`
    border-radius: 50%;
    margin-top: 0rem;
    margin-bottom: 5rem;
    width: 7rem;
    height: 7rem;
    background-color: white;
    font-size: 1.5rem;
    letter-spacing: 0.1rem;
    color:  #172A4E;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 1px 2px 0 rgba(60,64,67,0.302), 0 1px 3px 1px rgba(60,64,67,0.149); 

    &:hover {
        background-color: #fafafb;
    }
`

const RightView = styled.div`
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    background-color: white;
    width: 100%;
    padding-top: 4rem;
    padding-left: 0rem;
    overflow-y: scroll;
    height: 92vh;
`


// Modal
/* The Modal (background) */
const ModalBackground = styled.div`
    display: ${props => props.display};
    position: fixed; /* Stay in place */
    z-index: 20; /* Sit on top */
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
    overflow-y: scroll;
`
//background: rgba(45, 170, 219, 0.3); on highlight
const Document = styled.div`
    width: 100%;
`

