import React from 'react';

//styles 
import styled from "styled-components";

//components
import RepositoryNavigation from './RepositoryNavigation';
import RepositoryView from './Repository Page/RepositoryView';

//react-router
import { Switch, Route } from 'react-router-dom';
import history from '../../history';

class SpaceView extends React.Component {

    render() {
        return (
            <Container>
                <SideNavbar>
                    <DocumentCreateButton   >
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