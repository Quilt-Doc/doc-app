import React from 'react';

//styles 
import styled from "styled-components";

//redux
import { connect } from 'react-redux';

//components
import Bucket from '../../General Components/Top Navbar/Bucket';
import Document from './Document';
import TextEditorView2 from '../Text Editor Page/TextEditorView2';

//react-router
import { Link , withRouter } from 'react-router-dom';
import history from '../../../history';

//actions
import { createDocument, retrieveDocuments } from '../../../actions/Document_Actions';
import { attachDocument } from '../../../actions/RepositoryItem_Actions';
import { clearSelected } from '../../../actions/Selected_Actions';
import { setCreation } from '../../../actions/UI_Actions';

//icons
import repoIcon3 from '../../../images/w4.svg'
import codeIcon from '../../../images/code.svg'

class SideNavbar extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            searchbarBorder: '',
            modalDisplay: ''
        }
    }

    componentDidMount(){
        let { workspaceID } = this.props.match.params
        this.props.retrieveDocuments({workspaceID, root: true})
    }

    renderDocuments(){
        return this.props.documents.map(document => {return <Document width =  {23} marginLeft = {0} document = {document}/>})
    }

    createDocumentFromButton() {
        /*
        this.props.history.push({
            pathname: '/pathname',
            search: '?stuff=done'
          })*/
        
        let {workspaceID, repositoryID} = this.props.match.params
        
        this.props.createDocument({authorID: this.props.user._id,
            workspaceID, repositoryID, root: true,
            referenceIDs: this.props.selected.map(item => item._id)}).then((document) => {
            this.props.setCreation(true)
            history.push(`?document=${document._id}`)
            this.props.clearSelected()
            
            //history.push(`workspaces/${workspaceID}/repository/${repositoryID}/document/${document._id}`)
        })
    }

    undoModal(){
        this.setState({'modalDisplay': 'none'})
        history.push(history.location.pathname)
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

    renderCodebaseLink(){
        let repositoryID = this.props.workspace.repositories[0]._id
        let { workspaceID } = this.props.match.params
        return `/workspaces/${workspaceID}/repository/${repositoryID}/dir`
    }

    openModal(){
        this.setState({modalDisplay: ''})
    }
    /*onClick = { () => {this.createDocumentFromButton()}}*/
    render(){
        return(
            <>
            <SideNavbarContainer>
                <RepositoryDetail>
                    <RepositoryIcon><StyledIcon src = {repoIcon3}/></RepositoryIcon>
                    <RepositoryName>kgodara/doc-app</RepositoryName>
                </RepositoryDetail>
                
                <DocumentCreateButton onClick = {() => {this.createDocumentFromButton()}} >
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
                <Block>
                    <Deline>Codebase</Deline>
                    <PageSection2 to = {this.renderCodebaseLink()}>
                        <StyledIcon2 src={codeIcon} />
                       
                        <PageName2>fsanal / test</PageName2>
                        <CodebaseChevBorder>
                            <ion-icon style={{'fontSize': '1.7rem', 'marginTop': '0.1rem'}} name="chevron-down-sharp"></ion-icon>
                        </CodebaseChevBorder>
                    </PageSection2>
                </Block>
                <Block marginTop = {"1rem"}>
                    <Deline>Documents</Deline>
                    <DocumentationContainer>
                        {this.props.documents.length > 0 && this.renderDocuments()}
                    </DocumentationContainer>
                </Block>
                
            </SideNavbarContainer>

            </>
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

const mapStateToProps = (state, ownProps) => {
    let {workspaceID} = ownProps.match.params
    console.log(Object.values(state.documents))
    return {
        documents:  Object.values(state.documents).filter(document => document.root === true),
        user: state.auth.user,
        selected : Object.values(state.selected),
        repositoryItems: Object.values(state.repositoryItems),
        workspace: state.workspaces[workspaceID]
    }
}

export default withRouter(connect(mapStateToProps, { createDocument, attachDocument, clearSelected, retrieveDocuments, setCreation })(SideNavbar));


const ModalToolbar = styled.div`
   
    height: 4rem;
    padding: 2.7rem 1rem;
    
    display: flex;
    align-items: center;

`

const ModalEditor = styled.div`
    overflow-y: scroll;
    padding-top: 5rem;
`

const Title = styled.div`
    margin-right: ${props => props.marginRight};
    color: ${props => props.color};
    opacity: ${props => props.opacity};
`

const ModalCreateButton = styled.div`
   
    border-radius: 0.5rem;
    margin-left: auto;
    margin-right: 3rem;
    padding-top: 0.8rem;
    padding-bottom: 0.8rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    font-size: 1.35rem;
    color: white;
    background-color: #19E5BE;
    cursor: pointer;

    &:hover {
       box-shadow: 0 1px 2px 0 rgba(60,64,67,0.302), 0 1px 3px 1px rgba(60,64,67,0.149); 
    }
`

const ModalToolbarButton = styled.div`
    display: flex;
    align-items: center;
    font-size: 1.35rem;
    
    margin-right: 1rem;
    border-radius: 0.4rem;
    padding: 1rem;
    cursor: pointer;
    opacity: 0.7;
    &:hover {
        background-color: #F4F4F6; 
        opacity: 1;
    }
    opacity: ${props => props.opacity};
`
const Divider = styled.div`
    border-right: 1px solid #172A4E;
    opacity: 0.5;
    height: 1.5rem;
    margin-right: 1rem;
`

const ModalBackground = styled.div`
    position: fixed; /* Stay in place */
    z-index: 10000; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: hidden; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
    display: ${props => props.display};
`

/* Modal Content/Box */
const ModalContent = styled.div`
    background-color: #fefefe;
    margin: 8vh auto; /* 15% from the top and centered */
    

    border: 1px solid #888;
    width: 85vw; /* Could be more or less, depending on screen size */
    height: 84vh;
    border-radius: 0.4rem;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 98rem;
`

const StyledIcon2 = styled.img`
    width: 2.5rem;
    margin-right: 0.2rem;

`

const IconBorder = styled.div`
    margin-left: auto;
    margin-right: 0.2rem;
    display: flex;
    align-items: center;
    opacity: 0.7;
    width: 1.9rem;
    height: 1.9rem;
    border-radius: 0.3rem;
    &: hover {
        opacity: 1;
        background-color: #F4F4F6; 
    }
    cursor: pointer;
    justify-content: center;
    transition: all 0.1s ease-in;
    border: 1px solid #172A4E;
`

const Deline = styled.div`
    
    text-transform: uppercase;
    color: #172A4E;
    opacity: 0.5;
    font-size: 1.15rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
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


const PageSection2 = styled(Link)`
    text-decoration: none;
    color: #172A4E;
    width: 23rem;
    padding: 1.8rem 1.2rem;
    border-radius: 0.5rem;
    height: 3.6rem;
    display: flex;
    align-items: center;
    cursor: pointer;
    background-color: white;
    /*border: 1px solid rgba(136, 147, 165, 0.5);*/
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    &:hover {
        background-color: #F4F4F6; 
    }
    
`
const PageName2= styled.div`
    margin-left: 1.2rem;
    font-size: 1.4rem;
    font-weight: bold;
`

const CodebaseChevBorder = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 2.5rem;
    height: 2.5rem;
    margin-left: auto;
    border-radius: 0.3rem;
    &:hover {
        background-color: white;
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

const Block = styled.div`
    padding: 1rem 2rem;
    margin-top: 2rem;
    margin-top: ${props => props.marginTop};
`
              
const DocumentationContainer = styled.div`
    display: flex;
    flex-direction: column;
   
    height: 38rem;
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