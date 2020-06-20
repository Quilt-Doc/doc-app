import React from 'react';

//styles 
import styled from "styled-components";

//redux
import { connect } from 'react-redux';

//components
import HoveringMenuExample from './Text Editor Page/HoveringMenuExample';
import RepositoryNavigation from './RepositoryNavigation';
import RepositoryView from './Repository Page/RepositoryView';
import Bucket from '../General Components/Top Navbar/Bucket';

//react-router
import { Switch, Route, Link } from 'react-router-dom';
import history from '../../history';

//actions
import { createDocument } from '../../actions/Document_Actions';
import { attachDocument } from '../../actions/RepositoryItem_Actions';
import { clearSelected } from '../../actions/Selected_Actions';

import { HistoryEditor } from 'slate-history';

class SideNavbar extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            searchbarBorder: ''
        }
    }

    createDocumentFromButton() {
        this.props.createDocument().then(document => {
            let repositoryItemIDs = this.props.selected.map(item => item._id)
            this.props.attachDocument({repositoryItemIDs, documentID : document._id}).then(() => {
                this.props.clearSelected()
                let urlItems = window.location.pathname.split('/').slice(0, 4)
                urlItems.push('document')
                urlItems.push(document._id)
                console.log("URL", urlItems.join('/'))
                history.push(urlItems.join('/'))
            })

            /*
            this.props.attachDocument({})
            */
        })
    }


    render(){
        return(
            <SideNavbarContainer>
                <SearchbarWrapper 
                    border = {this.state.searchbarBorder}
                    //onFocus = {() => this.setState({searchbarBorder: "1px solid #19E5BE"})} 
                    //onBlur = {() => this.setState({searchbarBorder: ''})}>
                > 
                    <ion-icon style={{'color': '#1BE5BE', 'fontSize': '2.2rem'}} name="search-outline"></ion-icon>
                    <Searchbar placeholder = {'Search Docs..'} spellCheck = {false} />
                </SearchbarWrapper>
                <DocumentCreateButton onClick = { () => {this.createDocumentFromButton()}} >
                    <ion-icon style={{'color': 'white', 'fontSize': '2.4rem', 'margin-right': '1.5rem'}} name="add-outline"></ion-icon>
                    Create Document
                    <Bucket selected = {this.props.selected}/>
                </DocumentCreateButton>
               
                <DocumentationContainer>
                    <CodeDocumentContainer>
                            <CodeDocumentHeader>
                                move_track
                            </CodeDocumentHeader>
                            <CodeDocuments>
                                <CodeDocumentItem to ="/documentation">
                                    StdErrs
                                </CodeDocumentItem>
                                <CodeDocumentItem to ="/documentation">
                                    Keeping Track of While Loops
                                </CodeDocumentItem>
                                <CodeDocumentItem to ="/documentation">
                                    repoGetUpdate
                                </CodeDocumentItem>
                                <CodeDocumentItem to ="/documentation">
                                    repoPullFile
                                </CodeDocumentItem>
                                <CodeDocumentItem to ="/documentation">
                                    File Movement Diffs
                                </CodeDocumentItem>
                                <CodeDocumentItem to ="/documentation">
                                    Github Authorization
                                </CodeDocumentItem>
                            </CodeDocuments>
                        </CodeDocumentContainer>
                    <CodeDocumentContainer>
                        <CodeDocumentHeader >
                            file_copy_test.java
                        </CodeDocumentHeader>
                        <CodeDocuments>
                            <CodeDocumentItem to ="/documentation">
                                Understanding Copying
                            </CodeDocumentItem>
                            <CodeDocumentItem to ="/documentation">
                                Testing the Copy
                            </CodeDocumentItem>
                            <CodeDocumentItem to ="/documentation">
                                File API
                            </CodeDocumentItem>
                        </CodeDocuments>
                    </CodeDocumentContainer>
                    <CodeDocumentContainer>
                        <CodeDocumentHeader>
                            post_commit.py
                        </CodeDocumentHeader>
                        <CodeDocuments>
                            <CodeDocumentItem to ="/documentation">
                                Committing to the Repository
                            </CodeDocumentItem>
                            <CodeDocumentItem to ="/documentation">
                                DOxygen Pipeline
                            </CodeDocumentItem>
                        </CodeDocuments>
                    </CodeDocumentContainer>
                    <CodeDocumentContainer>
                        <CodeDocumentHeader>
                            snippet_val.py
                        </CodeDocumentHeader>
                        <CodeDocuments>
                            <CodeDocumentItem to ="/documentation">
                                Snippet Validation
                            </CodeDocumentItem>
                            <CodeDocumentItem to ="/documentation">
                                Levenshtein Algorithm
                            </CodeDocumentItem>
                            <CodeDocumentItem to ="/documentation">
                                Subsequence Location Calculation
                            </CodeDocumentItem>
                        </CodeDocuments>
                    </CodeDocumentContainer>
                </DocumentationContainer>
            </SideNavbarContainer>
        )
    }
}


const mapStateToProps = (state) => {
    return {
        selected : Object.values(state.selected)
    }
}

export default connect(mapStateToProps, { createDocument, attachDocument, clearSelected })(SideNavbar);


const SideNavbarContainer = styled.div`
    background-color: #F3F4F7;
    display: flex;
    flex-direction: column;
    height: 92vh;
`

const DocumentCreateButton = styled.div`
    position: relative;
    font-size: 1.4rem;
    font-weight:400;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    background-color: #1BE5BE;
    margin-left: 1.5rem;
    margin-right: 1.5rem;
    margin-top: 2rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    width: 30rem;
    height: 4.5rem;
    padding: 0.5rem 1rem;

    &:hover {
        box-shadow: 0 1px 2px 0 rgba(60,64,67,0.302), 0 1px 3px 1px rgba(60,64,67,0.149); 
    }
    
`

const SearchbarWrapper = styled.div`
    margin-top: 4rem;
    margin-left: 1.5rem;
    margin-right: 1.5rem;
    border-radius: 0.1rem;
    background-color: white;
    display: flex;
    align-items: center;
    width: 30rem;
    height: 4.5rem;
    padding: 0.5rem 1.5rem;
    
    
`

const Searchbar = styled.input`
    border-radius: 2px;
    border: none;
    padding: 0.4rem 0.4rem;
    font-size: 1.5rem;
    outline: none;
    color: #172A4E;
    margin-left: 1rem;
    margin-top: 0.1rem;
    &::placeholder {
        color: #172A4E;
        font-weight: 400;
    }
    font-weight: 400;
    width: 25rem;
`

const DocumentationContainer = styled.div`
    margin-top: 4rem;
    display: flex;
    flex-direction: column;
    border-top: 1px solid #D7D7D7;
    padding: 3rem 3rem;
    height: 70rem;
    overflow-y: scroll;

`

const CodeDocumentContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-bottom: 3rem;
`

const CodeDocumentHeader = styled.div`
    font-size: 1.6rem;
    color: #262626;
    margin-bottom: 2rem;
    cursor: pointer;
    &:hover {
        color: black;
    }
    
`

const CodeDocuments = styled.div`

`

const CodeDocumentItem = styled(Link)`
    display: block;
    cursor: pointer;
    font-size: 1.3rem;
    margin-bottom: 1rem !important;
    font-weight: 300 !important;
    &:hover {
        opacity: 1;
    }
    text-decoration: none; 
    &:focus, &:hover, &:visited, &:link, &:active {
        text-decoration: none;
        color: black;
    }
    opacity: 0.6;
    color: black;
`

