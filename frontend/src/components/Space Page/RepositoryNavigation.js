import React from 'react';

//styles 
import styled from "styled-components"

//react-router
import { Router, Route } from 'react-router-dom';
import history from '../../history';

//components
import DirectoryView from './Directory Navigation Page/DirectoryView'
import CodeView from './Code Editing Page/CodeView'


//component that holds everything related to repository navigation (directory viewer and code viewer)

class RepositoryNavigation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
           'fileItemBackgroundColor': '',
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
    margin-left: 5rem;
`

// DIRECTORY COMPONENTS

const Header = styled.div`
    font-size: 3.5rem;
    color: #172A4E;
    font-weight:400;
    letter-spacing: 0.1rem;
    margin-bottom: 7rem;
`