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
import { RiLayoutMasonryLine, RiPencilLine } from 'react-icons/ri'
import { HiDownload } from 'react-icons/hi';
import { makeGetChildDocuments } from '../../../selectors';


class DocumentNavbar extends React.Component {

    async componentDidMount(){
        const { retrieveDocuments, match } = this.props;
        const { workspaceId } = match.params;
        const { rootDocument } = this.props;

        // retrieve the children of the root (root is hidden, these are the first layer of docs)
        await retrieveDocuments({workspaceId, documentIds: rootDocument.children, minimal: true});
    }
    
     // render the documents on the navbar
     renderDocuments = () => {
        const { documents, rootDocument } = this.props;

        return documents.map((document, i) => {
            return (
                <Document 
                    last = {i === documents.length - 1} 
                    width =  {23} 
                    marginLeft = {0} 
                    document = {document}
                    parent = {rootDocument}
                    order = {i}
                />
            )
        })
    }

    renderDocumentSection = () => {
        const { documents } = this.props;
        return (
            <DocumentationContainer backend={HTML5Backend} >
                {documents.length > 0 && this.renderDocuments()}
            </DocumentationContainer>
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
            <Container id = "docnavbar">
                <Top>
                    <Header>KNOWLEDGE</Header>

                </Top>
                <DocumentContainer>
                    {this.renderDocumentSection()}
                </DocumentContainer>
            </Container>
        )
    }
}

const makeMapStateToProps = () => {
    const getChildDocuments = makeGetChildDocuments();

    const mapStateToProps = (state, ownProps) => {
        let {workspaceId} = ownProps.match.params;
        let {documents, auth, workspaces, references} = state;

        const workspace = workspaces[workspaceId];

        const rootDocument = Object.values(documents).filter(document => document.root)[0];
        documents = getChildDocuments({parent: rootDocument, documents});
        
        const rootReference = Object.values(references).filter(
            reference => 
                (reference.path === "" 
                    && reference.repository._id === workspace.repositories[0]._id)
            )[0];

        return {
            rootReference,
            rootDocument,
            documents,
            user: auth.user,
            workspace
        }
    }

    return mapStateToProps;
}

export default withRouter(connect(makeMapStateToProps, { retrieveDocuments, retrieveReferences })(DocumentNavbar));

const Top = styled.div`
    display: flex;
    align-items: center;
`

const Header = styled.div`
    font-size: 1.1rem;
    font-weight: 400;
    display: inline-flex;
    border-bottom: 2px solid #172A4E;
    height: 2.8rem;
    padding-right: 3.5rem;
    display: flex;
    align-items: center;
`

const NavbarElement = styled.div`
    font-size: 2rem;
    background-color: white;
    height: 3rem;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 0.3rem;
    cursor: pointer;
    margin-left: auto;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
`

const Container = styled.div`
    /*border-top: 2px solid #252832;*/
    display: flex;
    flex-direction: column;
    color: white;
    min-width: 25rem;
    max-width: 25rem;
    overflow-y: scroll;
    padding: 2.1rem;
    color: #172A4E;
    border-top-left-radius: 1rem;

    background-color: #f6f7f9;
    
`

const DocumentContainer = styled.div`
    margin-top: 1rem;
    height: height: calc(100vh - 7.5rem);
    overflow-y: scroll;
`


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
        
const DocumentationContainer = styled(DndProvider)`
    display: flex;
    flex-direction: column;  
`

const Section = styled.div`
    margin-top: ${props => props.margin};
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