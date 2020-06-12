import React from 'react';

//styles 
import styled from "styled-components";


//images
import code_icon from '../../images/coding.svg';
import doc_icon from '../../images/paper.svg';

//components
import CodebaseNavigation from './CodebaseNavigation';
import Repository_Viewer from '../Repository_Viewer';

//react-router
import { Switch, Route } from 'react-router-dom';
import history from '../../history';

class Dash extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
           
        }
    }

    /*
        onClick = {() => this.setState({modal_display: ''})}
    */
    render() {
        return (
            <Container>
                <Side_Navbar>
                    <Doc_Create_Button   >
                        <ion-icon style={{'font-size': '3.7rem'}} name="create-outline"></ion-icon>
                    </Doc_Create_Button>
                    <Side_Navbar_Item>
                        <Styled_Icon src = {code_icon}/>
                    </Side_Navbar_Item>
                    <Side_Navbar_Item>
                        <Styled_Icon src = {doc_icon}/>
                    </Side_Navbar_Item>
                </Side_Navbar>
                <Right_View>
                    <Switch history = {history}>
                        <Route exact path = "/codebase" component = {Repository_Viewer} />
                        <Route path = "/codebase" component = {CodebaseNavigation}/>
                    </Switch>
                </Right_View>
            </Container>
        );
    }
}

export default Dash;


//Styled Components

const Container = styled.div`
    display: flex;
`

const Side_Navbar = styled.div`
    width: 11rem;
    background-color: #F4F4F6;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 5rem;
`

const Side_Navbar_Item = styled.div`
    height: 9rem;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    &:hover {
        border-left: 0.55rem solid #5534FF;
    }
`

const Doc_Create_Button = styled.div`
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

const Styled_Icon = styled.img`
    width: 5rem;
`

const Right_View = styled.div`
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    background-color: white;
    width: 100%;
    padding-top: 4rem;
    padding-left: 0rem;
    overflow-y: scroll;
    height: 92vh;
`