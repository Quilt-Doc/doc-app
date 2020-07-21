import React from 'react';

//styles 
import styled from "styled-components";

//redux
import { connect } from 'react-redux';

//components
import Bucket from '../../General/Top Navbar/Bucket';
import Document from './Document';
import TextEditorView2 from '../Text Editor Page/TextEditorView2';

//react-dnd
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

//react-router
import { Link , withRouter } from 'react-router-dom';
import history from '../../../history';

//actions
import { createDocument, retrieveDocuments,  moveDocument } from '../../../actions/Document_Actions';
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
        let { workspaceId } = this.props.match.params
        this.props.retrieveDocuments({workspaceId, parentId: ""})
    }

    renderDocuments(){
        return this.props.documents.map(document => {return (
        <Document width =  {23} marginLeft = {0} document = {document}/>)})
    }

    createDocumentFromButton() {
        /*
        this.props.history.push({
            pathname: '/pathname',
            search: '?stuff=done'
          })*/
        
        let {workspaceId, repositoryId} = this.props.match.params
        
        this.props.createDocument({authorId: this.props.user._id,
            workspaceId, parentId: "", title: "",
            referenceIds: this.props.selected.map(item => item._id)}).then((documents) => {
            console.log("CREATED DOCS", documents)
            console.log(documents)
            let document = documents.result[0]
            this.props.setCreation(true)
            history.push(`?document=${document._id}`)
            this.props.clearSelected()
            
            //history.push(`workspaces/${workspaceId}/repository/${repositoryId}/document/${document._id}`)
        })
    }

    undoModal(){
        this.setState({'modalDisplay': 'none'})
        history.push(history.location.pathname)
    }


    renderCodebaseLink(){
        console.log("WORKSPACE", this.props.workspace)
        let repositoryId = this.props.workspace.repositories[0]._id
        let { workspaceId } = this.props.match.params
        return `/workspaces/${workspaceId}/repository/${repositoryId}/dir`
    }

    openModal(){
        this.setState({modalDisplay: ''})
    }
    /*onClick = { () => {this.createDocumentFromButton()}}*/
    render(){
        let { workspaceId } = this.props.match.params
        return(
            <>
            <SideNavbarContainer>
        
                <RepositoryDetail>
                    <RepositoryIcon><StyledIcon src = {repoIcon3}/></RepositoryIcon>
                    <RepositoryName>Customer Feedback</RepositoryName>
                </RepositoryDetail>
                {/*<DocumentCreateButton onClick = {() => {this.createDocumentFromButton()}} >
                    <ion-icon style={{'color': 'white', 'fontSize': '1.8rem', 'margin-right': '0.5rem'}} name="add-outline"></ion-icon>
                    Create
                    <Bucket selected = {this.props.selected}/>
                </DocumentCreateButton>*/}
              
                <PageSectionContainer>
                    <PageSection2 onClick = {() => {this.createDocumentFromButton()}}>
                        <ion-icon 
                            style={{'fontSize': '1.8rem', marginRight: '-0.3rem'}}
                            name="add-outline"></ion-icon>
                        <PageName>Create</PageName>
                    </PageSection2>
                    <PageSection to = {this.renderCodebaseLink()}>
                        <ion-icon 
                            style={{'fontSize': '1.5rem'}}
                            name="code-outline"></ion-icon>
                        <PageName>Codebase</PageName>
                    </PageSection>
                   
                    <PageSection to = {`/workspaces/${workspaceId}/coverage`}>
                        <ion-icon style={{'fontSize': '1.5rem'}} name="analytics-outline"></ion-icon>
                        <PageName >
                             
                             Track Coverage
                        </PageName>
                    </PageSection>
                    <PageSection to = {`/workspaces/${workspaceId}/request`}>
                        <ion-icon style={{'fontSize': '1.5rem'}} name="git-pull-request-outline"></ion-icon>
                        <PageName>
                            Request Documentation
                        </PageName>
                    </PageSection>
                    <PageSection>
                        <ion-icon style={{'fontSize': '1.5rem'}} name="cog-outline"></ion-icon>
                        <PageName>Settings</PageName>
                    </PageSection>
                </PageSectionContainer>
               
                <Block marginTop = {"1rem"}>
                    <Deline>Documents</Deline>
                    <DocumentationContainer backend={HTML5Backend} >
                        {this.props.documents.length > 0 && this.renderDocuments()}
                    </DocumentationContainer>
                </Block>
                
            </SideNavbarContainer>

            </>
        )
    }
}

/* 
     <DocumentCreateButton onClick = {() => {this.createDocumentFromButton()}} >
                    <ion-icon style={{'color': 'white', 'fontSize': '2rem', 'margin-right': '1.5rem'}} name="add-outline"></ion-icon>
                    Create Document
                    <Bucket selected = {this.props.selected}/>
                </DocumentCreateButton>
<Block>
                    <Deline>Codebase</Deline>
                    <PageSection2 to = {this.renderCodebaseLink()}>
                        <StyledIcon2 src={codeIcon} />
                       
                        <PageName2>fsanal / test</PageName2>
                        <CodebaseChevBorder>
                            <ion-icon style={{'fontSize': '1.7rem', 'marginTop': '0.1rem'}} name="chevron-down-sharp"></ion-icon>
                        </CodebaseChevBorder>
                    </PageSection2>
                </Block>*/
/*

  
                <DocumentCreateButton onClick = {() => {this.createDocumentFromButton()}} >
                    <ion-icon style={{'color': 'white', 'fontSize': '2rem', 'margin-right': '1.5rem'}} name="add-outline"></ion-icon>
                    Create Document
                    <Bucket selected = {this.props.selected}/>
                </DocumentCreateButton>
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
    let {workspaceId} = ownProps.match.params
    return {
        documents:  Object.values(state.documents).filter(document => document.parent === null),
        user: state.auth.user,
        selected : Object.values(state.selected),
        repositoryItems: Object.values(state.repositoryItems),
        workspace: state.workspaces[workspaceId],
        /*repositories: state.repostiorei*/
    }
}

export default withRouter(connect(mapStateToProps, { createDocument, moveDocument, attachDocument, clearSelected, retrieveDocuments, setCreation })(SideNavbar));

const Deline = styled.div`
    font-weight: 400;
    text-transform: uppercase;
    color: #172A4E;
    opacity: 0.5;
    font-size: 1.15rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
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
    font-weight: 600;
    color: #172A4E;
`

const PageSectionContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 2.3rem;
    
`

const PageSection = styled(Link)`
    text-decoration: none;
    margin-left: 2rem;
    color: #172A4E;
    width: 23rem;
    padding: 1.2rem;
    border-radius: 0.3rem;
    margin-right: 2rem;
    height: 2.9rem;
    display: flex;
    align-items: center;
    cursor: pointer;
    &:hover {
        background-color: #EBECF0
    }
`


const PageSection2 = styled(Link)`
    text-decoration: none;
    margin-left: 2rem;

    width: 23rem;
    padding: 1.2rem;
    border-radius: 0.3rem;
    margin-right: 2rem;
    height: 2.9rem;
    display: flex;
    align-items: center;
    cursor: pointer;
    background-color: #5B75E6;/*#00B389 */
    color: white;
    font-weight: 500;
    margin-bottom: 1.5rem;
    
    
    &:hover {
        box-shadow: 0 1px 2px 0 rgba(60,64,67,0.302), 0 1px 3px 1px rgba(60,64,67,0.149); 
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
    margin-left: 1rem;
    font-size: 1.35rem;
    font-weight: 400;
    opacity: 1;
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
`



const DocumentCreateButton = styled.div`
    position: relative;
    font-size: 1.35rem;
    font-weight:400;
    letter-spacing: 0.5px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    background-color:#19E5BE;
    /*border: 2px solid #19E5BE;*/
    margin-left: 2rem;
    margin-right: 1rem;
    margin-top: 2rem;
    border-radius: 0.3rem;
    display: flex;
    width: 23rem;
    align-items: center;
    height: 2.7rem;
    padding: 0rem 1rem;
    /*
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    */
    &:hover {
        box-shadow: 0 1px 2px 0 rgba(60,64,67,0.302), 0 1px 3px 1px rgba(60,64,67,0.149); 
    }
    
`

const DocumentRequestButton = styled.div`
    position: relative;
    font-size: 1.4rem;
    font-weight:400;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    background-color: #262E49;
    /*border: 2px solid #19E5BE;*/
    margin-left: 2rem;
    margin-right: 2rem;
    margin-top: 1rem;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    width: 13rem;
    height: 3.3rem;
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
              
const DocumentationContainer = styled(DndProvider)`
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