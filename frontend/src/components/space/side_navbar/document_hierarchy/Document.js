import React, { Component } from 'react'

//styles
import styled from 'styled-components';

//lodash
import _ from 'lodash';

//components
import DraggableDocument from './DraggableDocument';

//actions
import { moveDocument, retrieveDocuments, setDocumentOpen } from '../../../../actions/Document_Actions';

//router
import { withRouter } from 'react-router-dom';
import history from '../../../../history';

//redux
import { connect } from 'react-redux';

//icons
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { makeGetChildDocuments } from '../../../../selectors';

class Document extends Component {
    constructor(props){
        super(props)
    }

    //FARAZ TODO: Need to send to document creation modal, not auto create. Check title field.
    createDocument = async (e) => {
        e.stopPropagation()
        e.preventDefault()
        const { document: { _id } } = this.props;
        history.push(`?create_document=true&parent_id=${_id}`);
    }

    renderChildren = () => {
        const { children, document } = this.props;
        return children.map((child, i) => {
            return (
                <ConnectedDocument
                    width = {this.props.width - 2} 
                    marginLeft = {this.props.marginLeft + 2} 
                    document = {child} 
                    order = {i}
                    last = {i === children.length - 1}
                    parent = {document}
                />
            )
        })
    }

    open = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        const { children, document, match, retrieveDocuments, setDocumentOpen } = this.props;
        let {workspaceId} = match.params;

        if (children.length !== document.children.length) {
            await retrieveDocuments({workspaceId, documentIds: document.children, minimal: true});
            setDocumentOpen({documentId: document._id, open: true})
        } else {
            setDocumentOpen({documentId: document._id, open: true})
        }
    }

    close = (e) => {
        const { document: { _id}, setDocumentOpen } = this.props;
        e.stopPropagation(); 
        e.preventDefault(); 
        setDocumentOpen({documentId: _id, open: false});
    }

    renderLeftIcon = () =>{
        const {children, open, title} = this.props.document;
        if (title === "a") console.log("OPEN", open);
        if (children.length > 0) {
            if (!open){
                return (
                    <IconBorder active = {true} onClick = {this.open}>
                        <FiChevronRight/>
                    </IconBorder>
                )
            } else {
                return (
                    <IconBorder active = {true} onClick = {this.close}>
                         <FiChevronDown/>
                    </IconBorder>
                )
            }
        } else {
            return (
                <IconBorder active = {false} >
                    <FiChevronRight/>
                </IconBorder>
            )
        }
    }

    renderDocumentUrl = () =>{
        let {workspaceId} = this.props.match.params;
        const location = {
            pathname: `/workspaces/${workspaceId}/document/${this.props.document._id}`,
        }
        history.push(location)
    }

    render() {
        const { document, children, width, last, moveDocument } = this.props;
        const { open } = document;
        return (
            <>
                { document && 
                        < DraggableDocument
                            {...this.props}
                            moveDocument = {moveDocument}
                            children = {children}
                            open = {open}
                            width = {width}
                            last = {last}

                            renderChildren = {this.renderChildren}
                            renderDocumentUrl = {this.renderDocumentUrl}
                            renderLeftIcon = {this.renderLeftIcon}
                            createDocument = {this.createDocument}
                        />
                }
            </>
        )
    }
}


const makeMapStateToProps = () => {
    const getChildDocuments = makeGetChildDocuments();

    const mapStateToProps = (state, ownProps) => {
        const { document } = ownProps; 
        const {documents, auth} = state;

        if (document && document.title == "XYZOS") {
            console.log("DOCUMENTS IN DOCUMENT", documents);
        }
        
        const children = getChildDocuments({parent: document, documents});

        return {
            children,
            user: auth.user,
        }
    }

    return mapStateToProps;
}


const ConnectedDocument = withRouter(connect(makeMapStateToProps, { 
    moveDocument, setDocumentOpen, retrieveDocuments })(Document));

export default ConnectedDocument;


//Styled Components
const IconBorder = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 1.7rem;
    min-height: 1.7rem;
    margin-right: 0.3rem;
    margin-left: 0.4rem;
    font-size: 1.3rem;
    border-radius: 0.3rem;
    transition: all 0.05s ease-out;
    color: #172A4e;
    cursor: ${props => props.active ? "pointer" : "default"};
    opacity: ${props => props.active ? 1 : 0.3};
    &:hover {
        background-color: ${props => props.active ? "#f7f9fb" : ""};
    }
`
