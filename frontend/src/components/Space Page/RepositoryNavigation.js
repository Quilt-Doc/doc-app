import React from 'react';

//styles 
import styled from "styled-components"

//react-router
import { Router, Route } from 'react-router-dom';
import history from '../../history';

//components
import DirectoryView from './Directory Navigation Page/DirectoryView'
import CodeView from './Code Editing Page/CodeView'
import TextEditorView from './Text Editor Page/TextEditorView';


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
                        <Header>backend / apis</Header>
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
    margin-left: 8rem;
    margin-right: 8rem;
`

// DIRECTORY COMPONENTS

const Header = styled.div`
    font-size: 2.5rem;
    color: #172A4E;
    margin-bottom: 8rem;
`