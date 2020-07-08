import React from 'react';

//styles 
import styled from "styled-components"

//react-router
import { Router, Route, Switch } from 'react-router-dom';
import history from '../../history';

//components
import DirectoryView from './Directory Navigation Page/DirectoryView'
import CodeView from './Code Editing Page/CodeView'
import TextEditorView from './Text Editor Page/TextEditorView';
import Donut from '../General Components/Donut';

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
                        <MidContainer>
                            <LeftContainer>
                                
                                <Switch history = {history}>
                                    <Route path = "/workspaces/:username/:key/repository/:repositoryID/dir/:referenceID" component = { DirectoryView } />
                                    <Route path = "/workspaces/:username/:key/repository/:repositoryID/dir/" component = { DirectoryView } />
                                    <Route path = "/workspaces/:username/:key/repository/:repositoryID/code/:referenceID" component = { CodeView } />
                                </Switch>
                            </LeftContainer>
                            
                        </MidContainer>
                    </Container> 
                </>
            );
    }
}

export default RepositoryNavigation

/*<InfoBar>
                                
                                <InfoBlock>
                                    <InfoHeader>TAGS</InfoHeader>
                                    <ReferenceContainer>
                                        <Tag bColor = {"#2ed573"}>Frontend</Tag>
                                        <Tag bColor = {"#ff7f50"}>Semantic</Tag>
                                        <Tag bColor = {"#ff4757"}>Doxygen</Tag>
                                        <Tag bColor = {"#1e90ff"}>Github API</Tag>
                                    </ReferenceContainer>
                                </InfoBlock>
                                <InfoBlock>
                                    <InfoHeader>Regex Identifiers</InfoHeader>
                                    <ReferenceContainer>
                                        <Regex bColor = {"#74b9ff"}>RepositoryItem</Regex>
                                        <Regex bColor = {"#a29bfe"}>HIER</Regex>
                                        <Regex bColor = {"#00b894"}>DBS</Regex>
                                    </ReferenceContainer>
                                </InfoBlock>
                                
                            </InfoBar>*/
// Styled Components

const Container = styled.div`
    margin-left: 8rem;
    margin-right: 8rem;
    padding-bottom: 4rem;
`

const MidContainer = styled.div`
    display: flex;
    
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`

const LeftContainer = styled.div`
    width: 80rem;
    margin-right: 15rem;
`

const RightContainer = styled.div`
    display: flex;
    flex-direction: column;
`

// INFO COMPONENTS


const InfoBar = styled.div`
    padding: 1rem;

`

const InfoHeader = styled.div`
    font-weight: 400;
    color: #172A4E;
    opacity: 1;
    font-size: 1.2rem;
    text-transform: uppercase;
`

const InfoBlock = styled.div`
    margin-bottom: 2rem;
`

const ReferenceContainer = styled.div`
    margin-top: 1rem;
`

const Tag = styled.div`
    padding-top: 0.4rem;
    padding-bottom: 0.4rem;
    padding-right: 1.2rem;
    padding-left: 1.2rem;
    border-radius: 0.3rem;
    background-color: ${props => props.bColor};
    color: white;
    display: inline-block;
    margin-right: 1rem;
    margin-bottom: 1rem;
    font-size: 1.2rem;
`

const Regex = styled.div`
    font-size: 1.2rem;
    color: white;
    border: 1px solid #172A4E;
    opacity: 0.9;
    padding: 0.2rem 0.6rem;
    background-color: #172A4E;
    display: inline-block;
    border-radius: 0.3rem;
    margin-right: 1rem;
    margin-bottom: 1rem;
`


const FieldTextArea = styled.textarea`
    outline: none;
    width: 30rem;
    height: 7rem;
    border-radius: 0.3rem;
    border: 1px solid #DFDFDF;
    background-color: #FAFBFC;
    font-size: 1.5rem;
    color: #172A4E;
    padding: 1rem;
    resize: none;
    &:focus {
        background-color: white;
        border: 1px solid #19E5BE;
    }
`

// DIRECTORY COMPONENTS

const Header = styled.div`
    font-size: 2.5rem;
    color: #172A4E;
    margin-bottom: 8rem;
`