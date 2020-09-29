import React, { Component } from 'react'

//styles
import styled from 'styled-components';

//lodash
import _ from 'lodash';

//components
import DraggableDocument from './DraggableDocument';

//actions
import { moveDocument, retrieveDocuments } from '../../../../actions/Document_Actions';

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
        this.state = {
            open: false
        }
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
        const { children, document, match, retrieveDocuments} = this.props;
        let {workspaceId} = match.params;
        if (children.length !== document.children.length) {
            await retrieveDocuments({workspaceId, documentIds: document.children, minimal: true});
            this.setState({open: true});
        } else {
            this.setState({open: true});
        }
    }

    renderLeftIcon = () =>{
        const {children} = this.props.document;
        const {open} = this.state;
        if (children.length > 0) {
            if (!open){
                return (
                    <IconBorder onClick = {(e) => this.open(e)}>
                        <FiChevronRight/>
                    </IconBorder>
                )
            } else {
                return (
                    <IconBorder onClick = {(e) => {e.stopPropagation(); e.preventDefault(); this.setState({open: false})}}>
                         <FiChevronDown/>
                    </IconBorder>
                )
            } 
        } else {
            return (
                <IconBorder notActive = {true} />
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
        const { open } = this.state;
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
        
        const children = getChildDocuments({document, documents});

        return {
            children,
            user: auth.user,
        }
    }

    return mapStateToProps;
}


const ConnectedDocument = withRouter(connect(makeMapStateToProps, { moveDocument, retrieveDocuments })(Document));

export default ConnectedDocument;


//Styled Components
const IconBorder = styled.div`
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
    transition: all 0.05s ease-out;
    &:hover {
        background-color: ${props => props.notActive ? "" : "#2B2F3A"};
    }
`

const CurrentReference = styled.div`
    display: flex;
    align-items: center;
    font-size: 1.4rem;
    background-color: ${props => props.backgroundColor};
    &:hover {
        background-color: #EBECF0;
    }
    transition: background-color 0.15s ease-out;
    width: ${props => props.width};
    margin-left: ${props => props.marginLeft};
    padding: 1.2rem;
    border-radius: 0.3rem;
    height: 3.6rem;
    color: #172A4E;
    cursor: pointer;
`
