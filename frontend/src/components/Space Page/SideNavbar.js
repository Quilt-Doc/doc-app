import React from 'react';

//styles 
import styled from "styled-components";

//redux
import { connect } from 'react-redux';

//components
import Bucket from '../General Components/Top Navbar/Bucket';

//react-router
import { Link } from 'react-router-dom';
import history from '../../history';

//actions
import { createDocument } from '../../actions/Document_Actions';
import { attachDocument } from '../../actions/RepositoryItem_Actions';
import { clearSelected } from '../../actions/Selected_Actions';

//icons
import repoIcon3 from '../../images/repo4.svg'

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
                //let urlItems = window.location.pathname.split('/').slice(0, 2)
                //urlItems.push('document')
                //urlItems.push(document._id)
                //console.log("URL", urlItems.join('/'))
                history.push(`/document/${document._id}`)
            })

            /*
            this.props.attachDocument({})
            */
        })
    }

    renderCodeDocumentNavigation(){
        let items = this.props.repositoryItems.filter(item => 
            {return item.documents && item.documents.length > 0}
        )
        items = items.sort((a, b) => {
            if (a.documents.length > b.documents.length) return 1; 
            else if (a.documents.length > b.documents.length) return -1; 
            else if (a.name > b.name) return 1;
            else if (b.name > a.name) return -1;
            else return 0;
        })
        return items.map(item => {
            return (<CodeDocumentContainer>
                        <CodeDocumentHeader>
                            {item.name}
                        </CodeDocumentHeader>
                        <CodeDocuments>
                            {item.documents.map(document => {
                                return (
                                    <CodeDocumentItem to ="/documentation">
                                        {document.title ? document.title : "Untitled"}
                                    </CodeDocumentItem>
                                )   
                            }) }
                        </CodeDocuments>
                    </CodeDocumentContainer>
                    )
        })
    }


    render(){
        return(
            <SideNavbarContainer>
                <RepositoryDetail>
                    <RepositoryIcon><StyledIcon src = {repoIcon3}/></RepositoryIcon>
                    <RepositoryName>kgodara/doc-app</RepositoryName>
                </RepositoryDetail>
                
                <DocumentCreateButton onClick = { () => {this.createDocumentFromButton()}} >
                    <ion-icon style={{'color': 'white', 'fontSize': '2.4rem', 'margin-right': '1.5rem'}} name="add-outline"></ion-icon>
                    Create Document
                    <Bucket selected = {this.props.selected}/>
                </DocumentCreateButton>
                <PageSectionContainer>
                    <PageSection>
                        <ion-icon 
                            style={{'fontSize': '1.7rem'}}
                            name="newspaper-outline"></ion-icon>
                        <PageName>Overview</PageName>
                    </PageSection>
                    <PageSection>
                        <ion-icon style={{'fontSize': '1.7rem'}} name="analytics-outline"></ion-icon>
                        <PageName>
                             
                             Track Coverage
                        </PageName>
                    </PageSection>
                    <PageSection>
                        <ion-icon style={{'fontSize': '1.7rem'}} name="git-pull-request-outline"></ion-icon>
                        <PageName>
                            Request Documentation
                        </PageName>
                    </PageSection>
                    <PageSection>
                        <ion-icon style={{'fontSize': '1.7rem'}} name="cog-outline"></ion-icon>
                        <PageName>Settings</PageName>
                    </PageSection>
                </PageSectionContainer>
                <DocumentationContainer>
                    <Deline>Documents</Deline>

                    <CurrentReference>
                        <ion-icon style={{'color': '#19E5BE', 'fontSize': '1.8rem', 'marginRight': "1rem"}} name="folder-open-sharp"></ion-icon>
                        backend
                    </CurrentReference>
                    <ChildDocument>
                        <li>Starting the server</li>
                    </ChildDocument>
                    <ChildDocument>
                        <li>Running Index.js</li>
                    </ChildDocument>
                    <CurrentReference>
                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "1rem"}} name="folder-sharp"></ion-icon>
                        apis
                    </CurrentReference>
                    <CurrentReference>
                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "1rem"}} name="folder-sharp"></ion-icon>
                        controllers
                    </CurrentReference>
                    <CurrentReference>
                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "1rem"}} name="folder-sharp"></ion-icon>
                        models
                    </CurrentReference>
                    <CurrentReference>
                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "1rem"}} name="document-outline"></ion-icon>
                        index.js
                    </CurrentReference>
                    <ChildDocument>
                        <li>authCheck</li>
                    </ChildDocument>
                    <ChildDocument>
                        <li>mongoose</li>
                    </ChildDocument>
                    <ChildDocument>
                        <li>cors</li>
                    </ChildDocument>
                    {this.renderCodeDocumentNavigation()}

                </DocumentationContainer>
            </SideNavbarContainer>
        )
    }
}

/*
<SearchbarWrapper 
                    border = {this.state.searchbarBorder}
                    //onFocus = {() => this.setState({searchbarBorder: "1px solid #19E5BE"})} 
                    //onBlur = {() => this.setState({searchbarBorder: ''})}>
                > 
                    <ion-icon style={{'color': '#1BE5BE', 'fontSize': '2.2rem'}} name="search-outline"></ion-icon>
                    <Searchbar placeholder = {'Search Docs..'} spellCheck = {false} />
                </SearchbarWrapper>*/

/*<CodeDocuments>
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
                         <CodeDocuments>
                            <CodeDocumentItem to ="/documentation">
                                Committing to the Repository
                            </CodeDocumentItem>
                            <CodeDocumentItem to ="/documentation">
                                DOxygen Pipeline
                            </CodeDocumentItem>
                        </CodeDocuments>
                        
                        
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

                        
                        
                        
                        */

const mapStateToProps = (state) => {
    return {
        selected : Object.values(state.selected),
        repositoryItems: Object.values(state.repositoryItems)
    }
}

export default connect(mapStateToProps, { createDocument, attachDocument, clearSelected })(SideNavbar);

const Deline = styled.div`
    text-transform: uppercase;
    color: #172A4E;
    opacity: 0.5;
    font-size: 1.2rem;
    margin-bottom: 1rem;
`
const ChildDocument = styled.div`
    display: flex;
    align-items: center;
    font-size: 1.35rem;
    &:hover {
        background-color: #EBECF0;
    }
    margin-left: 2rem;
    width: 21rem;
    padding: 1.2rem;
    border-radius: 0.3rem;
    height: 3.6rem;
    color: #172A4E;
    cursor: pointer;
    font-weight: 300;
`

const DocumentName = styled.div`

`

const CurrentReference = styled.div`
    display: flex;
    align-items: center;
    font-size: 1.35rem;
    &:hover {
        background-color: #EBECF0;
    }
    width: 23rem;
    padding: 1.2rem;
    border-radius: 0.3rem;
    height: 3.6rem;
    color: #172A4E;
    cursor: pointer;
`

const StyledIcon = styled.img`
    width: 2.8rem;
`
const RepositoryDetail = styled.div`
    display: flex;
    align-items: center;
    margin-left: 2rem;
    margin-top: 2rem;
    
`
const RepositoryName = styled.div`
    margin-left: 1.5rem;
    font-size: 1.4rem;
    font-weight: bold;
    color: #172A4E;
`


const PageSectionContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 2rem;
    
`

const PageSection = styled.div`
    margin-left: 2rem;
    color: #172A4E;
    width: 23rem;
    padding: 1.2rem;
    border-radius: 0.3rem;
    margin-right: 2rem;
    height: 3.6rem;
    display: flex;
    align-items: center;
    cursor: pointer;
    &:hover {
        background-color: #EBECF0
    }
`

const PageName = styled.div`
    margin-left: 1.2rem;
    font-size: 1.35rem;
`

const RepositoryIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 5.5rem;
    height: 4rem;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    
`

///
const SideNavbarContainer = styled.div`
    background-color: #F7F9FB;
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
    margin-left: 2rem;
    margin-right: 2rem;
    margin-top: 2rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    width: 23rem;
    height: 3.7rem;
    padding: 0.5rem 1rem;

    &:hover {
        box-shadow: 0 1px 2px 0 rgba(60,64,67,0.302), 0 1px 3px 1px rgba(60,64,67,0.149); 
    }
    
`

const SearchbarWrapper = styled.div`
    margin-top: 4rem;
    margin-left: 1.5rem;
    margin-right: 1.5rem;
    border-radius: 0.5rem;
    border: 1px solid #DFE1E5;
    background-color: white;
    display: flex;
    align-items: center;
    width: 26rem;
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
        color: #6B778C;
        font-weight: 400;
    }
    font-weight: 400;
    width: 25rem;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`
              
const DocumentationContainer = styled.div`
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    padding: 1rem 2rem;
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