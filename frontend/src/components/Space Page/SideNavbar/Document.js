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

//actions
import { createDocument, retrieveChildren, retrieveDocuments, attachChild, removeChild } from '../../../actions/Document_Actions';


//icons
import docIcon from '../../../images/doc.svg'
import godocIcon from '../../../images/google-docs.svg'
import doc2Icon from '../../../images/doc2.svg'
import doc3Icon from '../../../images/doc3.svg'
import doc4Icon from '../../../images/doc4.svg'



class Document extends Component {
    constructor(props){
        super(props)
        this.state = {
            createOpacity: '0',
            open: false
        }
    }

    createDocument(e){
        e.stopPropagation()
        e.preventDefault()
        let {workspaceID} = this.props.match.params
        this.props.createDocument({ workspaceID, title: "Dropping backend" }).then((child) => {
            this.props.attachChild(this.props.document._id, child._id)
        })
        /*
        this.props.createChild({parentID: this.props.document._id, 
            title: "nk", workspaceID: this.props.document.workspace._id}).then((child) => {
                this.setState({children: { ...this.state.children, [child._id]: child }});
            })*/
    }

    
    retrieveChildren = () => {
        this.props.retrieveDocuments({childrenIDs: this.props.document.children})
    }

    renderChildren = () => {
        let children = Object.values(this.props.children)
        return children.map((child) => {
            return <ConnectedDocument 
                    width = {this.props.width - 2} 
                    marginLeft = {this.props.marginLeft + 2} 
                    document = {child} />
        })
    }

    renderTitle() {
        return <Title>{this.props.document.title}</Title>
    }

    open(e) {
        e.stopPropagation();
        e.preventDefault();
        if (this.props.children.length === 0) {
            this.props.retrieveDocuments({childrenIDs: this.props.document.children}).then(() => {
                this.setState({open: true})
            })
        } else {
            this.setState({open: true})
        }
    }

    

    renderLeftIcon(){
        if (this.props.document.children.length > 0) {
            if (this.state.open === false){
                return (
                    <IconBorder2 onClick = {(e) => this.open(e)}>
                        <ion-icon 
                            name="chevron-forward-outline"
                            style={{'fontSize': '1.3rem', 'color': "#213A81"}}
                        ></ion-icon>
                    </IconBorder2>
                )
            } else {
                return (
                    <IconBorder2 onClick = {(e) => {e.stopPropagation(); e.preventDefault(); this.setState({open: false})}}>
                        <ion-icon 
                            name="chevron-down-outline"
                            style={{'fontSize': '1.3rem', 'color': "#213A81"}}
                        ></ion-icon>
                    </IconBorder2>
                )
            }
          
        } else {
            return (
                <IconBorder2>
                    <ion-icon 
                        name="ellipse-sharp"
                        style={{'fontSize': '0.4rem', 'color': "#213A81"}}
                    ></ion-icon>
                </IconBorder2>
            )
        }
    }

    renderDocumentUrl(){
        let {workspaceID} = this.props.match.params;
        const location = {
            pathname: `/workspaces/${workspaceID}/document/${this.props.document._id}`,
        }
        history.push(location)
    }
    /*onClick = {() => {this.retrieveChildren()}}*/
    render() {
        return (
            
            <>
                {this.props.document && 
                    <>
                        <CurrentReference 
                            onMouseEnter = {() => {this.setState({createOpacity: '1'})}} 
                            onMouseLeave = {() => {this.setState({createOpacity: '0'})}} 
                            
                            onClick = {() => this.renderDocumentUrl()}
                            width = {`${this.props.width}rem`} 
                            marginLeft = {`${this.props.marginLeft}rem`}
                        >
                            {this.renderLeftIcon()}
                            <ion-icon name="document-text-outline" style={{'fontSize': '1.7rem', 'color': "#213A81", marginRight: "0.8rem"}}></ion-icon>
                            {this.renderTitle()}
                            <IconBorder opacity = {this.state.createOpacity} onClick = {(e) => {this.createDocument(e)}}>
                                <ion-icon style={{'fontSize': '1.5rem'}} name="add-outline"></ion-icon>
                            </IconBorder>
                        </CurrentReference>
                        {this.props.children.length !== 0 && this.state.open && this.renderChildren()}
                    </>
                }
            </>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    let children = []
    if (ownProps.document && ownProps.document.children 
        && state.documents[ownProps.document.children[0]] !== undefined) {
        children = Object.values(ownProps.document.children.map(childID => state.documents[childID]))
    }
    return {
        children
    }
}
            
const ConnectedDocument = withRouter(connect(mapStateToProps, { createDocument, retrieveDocuments, attachChild, removeChild })(Document));
export default  ConnectedDocument;


const Title = styled.div`
    opacity: 1;
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
    width: 1.7rem;
    height: 1.7rem;
    margin-right: 0.5rem;
    border-radius: 0.3rem;
    transition: all 0.05s ease-out;
    &:hover {
        background-color: white;
        
    }
`

const CurrentReference = styled.div`
    display: flex;
    align-items: center;
    font-size: 1.4rem;
    &:hover {
        background-color: #EBECF0;
    }
    width: ${props => props.width};
    margin-left: ${props => props.marginLeft};
    padding: 1.2rem;
    border-radius: 0.3rem;
    height: 3.6rem;
    color: #172A4E;
    cursor: pointer;
`
