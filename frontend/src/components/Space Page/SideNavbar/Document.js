import React, { Component } from 'react'

//styles
import styled from 'styled-components';

//lodash
import _ from 'lodash';

//router
import { withRouter } from 'react-router-dom';
import history from '../../../history';

//redux
import { connect } from 'react-redux';

//document
import DraggableDocument from './DraggableDocument';

//actions
import { createDocument, moveDocument, retrieveChildren, retrieveDocuments} from '../../../actions/Document_Actions';
import { setCreation } from '../../../actions/UI_Actions';
import { clearSelected } from '../../../actions/Selected_Actions';

//icons
import docIcon from '../../../images/doc.svg'
import godocIcon from '../../../images/google-docs.svg'
import doc2Icon from '../../../images/doc2.svg'
import doc3Icon from '../../../images/doc3.svg'
import doc4Icon from '../../../images/doc4.svg'

import { AiOutlineCaretRight} from 'react-icons/ai';
import { FiChevronRight, FiChevronDown } from 'react-icons/fi';

class Document extends Component {
    constructor(props){
        super(props)
        this.state = {
            createOpacity: '0',
            open: false
        }
    }

    createDocument = (e) => {
        e.stopPropagation()
        e.preventDefault()
        let {workspaceId} = this.props.match.params
        this.props.createDocument({title: "", authorId: this.props.user._id, parentId: this.props.document._id, workspaceId, referenceIds: this.props.selected.map(item => item._id) }).then((documents) => {
            console.log("DOCUMENTS", documents)
            let child =  documents.result[0]
            this.props.setCreation(true)
            history.push(`?document=${child._id}`)
            this.props.clearSelected()
            this.props.retrieveDocuments({workspaceId, childrenIds: this.props.document.children}).then(() => {
                this.setState({open: true})
            })
        })
        /*
        this.props.createChild({parentId: this.props.document._id, 
            title: "nk", workspaceId: this.props.document.workspace._id}).then((child) => {
                this.setState({children: { ...this.state.children, [child._id]: child }});
            })*/
    }

    
    retrieveChildren = () => {
        let {workspaceId} = this.props.match.params
        this.props.retrieveDocuments({workspaceId, childrenIds: this.props.document.children})
    }

    renderChildren = () => {
        let children = Object.values(this.props.children)
        children.sort((a, b) => {
            if (a.order < b.order) {
                return -1
            } else {
                return 1
            }
        })
        return children.map((child) => {
            return <ConnectedDocument
                        width = {this.props.width - 2} 
                        marginLeft = {this.props.marginLeft + 2} 
                        document = {child} 
                    />
        })
    }

    renderTitle = () => {
        let { title } = this.props.document
        if (!title) {
            title = "Untitled"
        }
        return <Title width = {this.props.width - 7} >{title}</Title>
    }
    

    open = (e) => {
        e.stopPropagation();
        e.preventDefault();
        let {workspaceId} = this.props.match.params;
        if (this.props.children.length !== this.props.document.children.length) {
            this.props.retrieveDocuments({workspaceId, childrenIds: this.props.document.children}).then(() => {
                this.setState({open: true})
            })
        } else {
            this.setState({open: true})
        }
    }

    

    renderLeftIcon = () =>{
        if (this.props.document.children.length > 0) {
            if (this.state.open === false){
                return (
                    <IconBorder2 onClick = {(e) => this.open(e)}>
                        <FiChevronRight/>
                    </IconBorder2>
                )
            } else {
                return (
                    <IconBorder2 onClick = {(e) => {e.stopPropagation(); e.preventDefault(); this.setState({open: false})}}>
                         <FiChevronDown/>
                    </IconBorder2>
                )
            }
          
        } else {
            return (
                <IconBorder2 notActive = {true}>
                   
                </IconBorder2>
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
    /*onClick = {() => {this.retrieveChildren()}}*/
    render() {
        return (
            <>
                { this.props.document && 
                        < DraggableDocument
                            {...this.props}
                            moveDocument = {this.props.moveDocument}
                            renderDocumentUrl = {this.renderDocumentUrl}
                            renderLeftIcon = {this.renderLeftIcon}
                            renderTitle = {this.renderTitle}
                            createDocument = {this.createDocument}
                            children = {this.props.children}
                            open = {this.state.open}
                            renderChildren = {this.renderChildren}
                            width = {this.props.width}
                        />
                }
            </>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    let children = []
    if (ownProps.document && ownProps.document.children 
        && state.documents[ownProps.document.children[0]] !== undefined) {
        children = Object.values(ownProps.document.children.map(childId => state.documents[childId]))
    }
    return {
        children,
        user: state.auth.user,
        selected : Object.values(state.selected),
    }
}
            
const ConnectedDocument = withRouter(connect(mapStateToProps, { createDocument, moveDocument, retrieveDocuments, setCreation, clearSelected })(Document));

export default  ConnectedDocument;


const Title = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-weight: 500;
`

const StyledIcon2 = styled.img`
    width: 1.8rem;
    margin-right: 0.8rem;
`
/*<ion-icon style={{'fontSize': '1.3rem'}} name="add-outline"></ion-icon>*/
const IconBorder = styled.div`
    margin-left: auto;
    margin-right: -0.3rem;
    display: flex;
    align-items: center;
    justify-content: center;

    width: 1.9rem;
    height: 1.9rem;

   
    border-radius: 0.3rem;

    color: #213A81;
    background-color: white;
    
    opacity: ${props => props.opacity};
    /*transition: all 0.05s ease-out;*/
    /*background-color: white;*/
    cursor: pointer;
    &: hover {
        opacity: 1;
        background-color: #F4F4F6; 
    }
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
