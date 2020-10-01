import React from 'react';

//styles 
import styled from "styled-components";

//redux
import { connect } from 'react-redux';

//components
import Document from './document_hierarchy/Document';

//react-dnd
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

//react-router
import { Link, withRouter } from 'react-router-dom';
import history from '../../../history';

//actions
import { retrieveDocuments } from '../../../actions/Document_Actions';
import { retrieveReferences } from '../../../actions/Reference_Actions';

//icons
import { FiTrash } from 'react-icons/fi'
import { RiLayoutMasonryLine, RiSettings5Line, RiCodeSLine, RiStackLine} from 'react-icons/ri'
import { HiDownload } from 'react-icons/hi';
import { BiGridAlt } from 'react-icons/bi';
import { makeGetChildDocuments } from '../../../selectors';

// sidenavbar -- contains main icons to navigate between workspace and the documents that exist in the workspace
class SideNavbar extends React.Component {

    async componentDidMount(){
        const { retrieveDocuments, retrieveReferences, match, workspace } = this.props;
        const { repositories } = workspace;
        const { workspaceId } = match.params;

        const repositoryId = repositories[0]._id;

        
        await Promise.all([
            // retrieve the root document of the workspace and clear on root retrieval
            retrieveDocuments({workspaceId, root: true, minimal: true}, true),
            // retrieve the root reference of the workspace
            retrieveReferences({ workspaceId, repositoryId, path: ""})
        ]);

        const { rootDocument } = this.props;

        // retrieve the children of the root (root is hidden, these are the first layer of docs)
        await retrieveDocuments({workspaceId, documentIds: rootDocument.children, minimal: true});
    }

    // render the documents on the sidenavbar
    renderDocuments = () => {
        const { documents, rootDocument } = this.props;

        return documents.map((document, i) => {
            return (
                <Document 
                    last = {i === documents.length - 1} 
                    width =  {23} 
                    marginLeft = {2} 
                    document = {document}
                    parent = {rootDocument}
                    order = {i}
                />
            )
        })
    }

    //TODO: MOVE RENDERCODEBASE LINK INTO COMPONENTDIDMOUNT
    renderCodebaseLink = async () => {
        let { match, workspace, rootReference, retrieveReferences } = this.props;
        const { repositories } = workspace;
        const { workspaceId } = match.params;
       
        let repositoryId = repositories[0]._id;
       
        if (!rootReference) {
            rootReference = await retrieveReferences({ workspaceId, repositoryId, path: ""}, true);
            rootReference = rootReference[0];
        } 
        
        let referenceId = rootReference._id;
        

        return `/workspaces/${workspaceId}/repository/${repositoryId}/dir/${referenceId}`;
    }

    renderDashboardLink(){
        let { workspaceId } = this.props.match.params;
        return `/workspaces/${workspaceId}/dashboard`;
    }

    renderInfobankLink(){
        let { workspaceId } = this.props.match.params
        return `/workspaces/${workspaceId}/infobank`;
    }

    renderTopSection = () => {
        return (
            <Section>
                <NavbarButton
                    active = {history.location.pathname.split("/")[3] === "dashboard"}
                    to = {this.renderDashboardLink()}
                >
                    <NavbarIcon><BiGridAlt/></NavbarIcon>
                    Dashboard
                </NavbarButton>
                <NavbarButton 
                    active = {history.location.pathname.split("/")[3] === "repository"}
                    to = {this.renderCodebaseLink()}
                >
                    <NavbarIcon><RiCodeSLine/></NavbarIcon>  
                    Codebase    
                </NavbarButton>
                <NavbarButton
                    active = {history.location.pathname.split("/")[3] === "infobank"}
                    to = {this.renderInfobankLink()}
                >
                    <NavbarIcon><RiStackLine/></NavbarIcon>
                    Infobank
                </NavbarButton>
                <NavbarButton>
                    <NavbarIcon><RiSettings5Line/></NavbarIcon>  
                    Settings 
                </NavbarButton>
            </Section>  
        );
    }

    renderDocumentSection = () => {
        const { documents } = this.props;
        return (
            <Section margin = {"2.5rem"}>
                <Deline>
                    <Circle/>
                    Knowledge
                </Deline>
                <DocumentationContainer backend={HTML5Backend} >
                    {documents.length > 0 && this.renderDocuments()}
                </DocumentationContainer>
            </Section>
        )
    }

    renderBottomSection = () => {
        return (
            <Section margin = {"2rem"}>
                <NavbarButton2>
                    <IconBorder2/>
                    <RiLayoutMasonryLine style = 
                    {{ fontSize: "1.7rem",
                        marginRight: "0.9rem",
                        width: "1.6rem"
                    }}/>
                    Templates
                </NavbarButton2>
                <NavbarButton2>
                    <IconBorder2/>
                    <HiDownload style = 
                    {{ fontSize: "1.7rem",
                        marginRight: "0.9rem",
                        width: "1.6rem"
                    }}/>
                    Import    
                </NavbarButton2>
                <NavbarButton2>
                    <IconBorder2/>
                    <FiTrash style = 
                    {{ fontSize: "1.5rem",
                        marginRight: "0.9rem",
                        width: "1.6rem"
                    }}/>
                    Trash
                </NavbarButton2>
            </Section>
        );
    }


    render(){
        return(
            <SideNavbarContainer id = {"sidenavbar"}>
                 <WorkspaceDetail>
                    <WorkspaceIcon>P</WorkspaceIcon>
                    <WorkspaceName>Pegasus</WorkspaceName>
                </WorkspaceDetail>
                {this.renderTopSection()}
                {this.renderDocumentSection()}
                {this.renderBottomSection()}
            </SideNavbarContainer>
        )
    }
}
 

const makeMapStateToProps = () => {
    const getChildDocuments = makeGetChildDocuments();

    const mapStateToProps = (state, ownProps) => {
        let {workspaceId} = ownProps.match.params;
        let {documents, auth, workspaces, references} = state;
        
        const rootDocument = Object.values(documents).filter(document => document.root)[0];
        documents = getChildDocuments({parent: rootDocument, documents});
        const rootReference = Object.values(references).filter(reference => reference.path === "")[0];

        return {
            rootReference,
            rootDocument,
            documents,
            user: auth.user,
            workspace: workspaces[workspaceId],
        }
    }

    return mapStateToProps;
}

export default withRouter(connect(makeMapStateToProps, { retrieveDocuments, retrieveReferences })(SideNavbar));

//Styled Components

const IconBorder2 = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 1.7rem;
    min-height: 1.7rem;
    margin-left: -0.3rem;
    margin-right: 0.5rem;
    font-size: 1.3rem;
    opacity: 0.9;
    border-radius: 0.3rem;
`

const SideNavbarContainer = styled.div`
    /*border-top: 2px solid #252832;*/
    background-color:#2B2F3A; 
    display: flex;
    flex-direction: column;
    padding-top: 1rem;
    color: white;
    min-width: 25rem;
    max-width: 25rem;
    overflow-y: scroll;
`
          
const DocumentationContainer = styled(DndProvider)`
    display: flex;
    flex-direction: column;  
`

const Section = styled.div`
    margin-top: ${props => props.margin};
`

const NavbarButton = styled(Link)`
    display: flex;
    align-items: center;
    font-size: 1.3rem;
    font-weight: 500;
    text-decoration: none;
    color: white;
    padding-top: 0.4rem;
    padding-bottom: 0.4rem;
    margin-bottom: 0.4rem;
    padding-left: 2rem;
    padding-right: 2rem;
    &:hover {
        background-color: #414858;
    }
    background-color: ${props => props.active ? '#414858' : ""};
`

const NavbarButton2 = styled(Link)`
    display: flex;
    align-items: center;
    font-size: 1.3rem;
    font-weight: 500;
    text-decoration: none;
    color: white;
    height: 2.9rem;
    margin-bottom: 0.4rem;
    padding-left: 2rem;
    padding-right: 2rem;
    &:hover {
        background-color: #414858;
    }
    background-color: ${props => props.active ? '#414858' : ""};
`

const NavbarIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2.25rem;
    width: 2.25rem;
    font-size: 1.3rem;
    font-weight: 500;
    background-color: #383e4c;
    border-radius: 0.3rem;
    cursor: pointer;
    margin-right: 1.3rem;
    /*
    margin-left: 2rem;
    &:hover {
        background-color: ${props => props.emph };
    }*/
    /*border-bottom: ${props => props.active ? "2px solid #5B75E6" : ""};*/
`

const Circle = styled.div`
    border-radius: 50%;
    height: 0.6rem;
    width: 0.6rem;
    background-color: #6FEAE1;
    margin-right: 0.7rem;
`

const Deline = styled.div`
    font-weight: 500;
    text-transform: uppercase;
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
    display: flex;
    align-items: center;
    padding-left: 2rem;
    padding-right: 2rem;
    
`

const WorkspaceDetail = styled.div`
    display: flex;
    align-items: center;
    margin-top: 1rem;
    margin-bottom: 2rem;
    &:hover {
        background-color: #414858;
    }
    padding:1rem 2rem;
    cursor: pointer;
`

const WorkspaceName = styled.div`
    font-size: 1.42rem;
    font-weight: 600;
    color: white;
`

const WorkspaceIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2.9rem;
    width: 2.9rem;
    background-color: #5B75E6;
    border-radius: 0.3rem;
    margin-right: 1.3rem;
    font-size: 1.3rem;
`