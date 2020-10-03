import React from 'react';
import styled from 'styled-components';
import { RiMoreFill } from 'react-icons/ri';
import { FiTrash } from 'react-icons/fi';

import chroma from 'chroma-js';

import {connect} from 'react-redux';
import {withRouter} from 'react-router-dom';

import history from '../../history';

//components
import { CSSTransition } from 'react-transition-group';

//actions
import { deleteDocument } from '../../actions/Document_Actions';


class DocumentOptionsMenu extends React.Component {
    constructor(props){
        super(props)

        this.state = {
            open: false
        }
    }

    componentDidMount(){
        this.getDateItem()
    }

    openMenu(e){
        e.preventDefault()
        document.addEventListener('mousedown', this.handleClickOutside, false);
        this.setState({
                    open: true, 
                    left: this.renderLeft(), 
                    top: this.renderTop()
                })
    }

    closeMenu(){
        document.removeEventListener('mousedown', this.handleClickOutside, false);
        this.setState({ 
            open: false,
            /*
            search: '',
            typing: false,
            typingTimeout: 0, 
            create: '',
        position: -1}*/})
    }

    handleClickOutside = (event) => {
        if (this.node && !this.node.contains(event.target)) {
            this.closeMenu()
        }
    }

    renderTop = () => {
        if (this.button){
            let {top, height} = this.button.getBoundingClientRect();
            return top + height + 10;
        }
        return 0;
    }

    renderLeft = () => {
        if (this.button) {
            let {left} = this.button.getBoundingClientRect();
            return left - 140;
            
        }
        return 0;
    }


    getDateItem = () => {
        let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let item =  new Date(this.props.document.created)
        let dateString = `Created ${months[item.getMonth()]} ${item.getDate()}, ${item.getFullYear()}`;
        return dateString
    }

    deleteDoc = () => {
        const {  deleteDocument, document: {_id}, match } = this.props;
        let { workspaceId } = match.params;
        history.push(`/workspaces/${workspaceId}/document`);
        deleteDocument({documentId: _id, workspaceId});
    }


    render() {
        let {open, left, top} = this.state;
        return (
            <Container>

                <Button
                      onClick = {(e) => {this.openMenu(e)}}
                      ref = {button => this.button = button}
                      active = {open}
                >
                    <RiMoreFill/>
                </Button>
                <CSSTransition
                    in = {open}
                    unmountOnExit
                    enter = {true}
                    exit = {true}       
                    timeout = {150}
                    classNames = "dropmenu"
                >
                    <Menu
                        left = {left}
                        top = {top}
                        ref = {node => this.node = node}
                    >
                        <SmallHeaderContainer onClick = {() => {this.deleteDoc()}} >

                            <FiTrash style = {{marginRight: "1rem"}}/>
                            Delete Document
                        </SmallHeaderContainer>
                        <AuthorNote>
                            <AuthorIcon>F</AuthorIcon>
                            <Description>
                                <DateComp>
                                    {this.getDateItem()}
                                </DateComp>
                                <Author>
                                    by Faraz Sanal
                                </Author>
                            </Description>
                            {/*
                            <IconContainer>
                                
                            </IconContainer>
                            <Description>
                                <Date></Date>
                                <Author></Author>
                            </Description>*/}
                        </AuthorNote>
                    </Menu>
                </CSSTransition>
            </Container>
        )
    }
}

const mapStateToProps = () => {
    return (
        {}
    )
}

export default withRouter(connect(mapStateToProps, {deleteDocument})(DocumentOptionsMenu))

const Container = styled.div`

`

const Description = styled.div`
    display: flex;
    flex-direction: column;
    opacity: 0.5;
`

const DateComp = styled.div`
    font-size: 1.05rem;
    margin-bottom: 0.2rem;
`

const Author = styled.div`
    font-size: 1.05rem;
`

const AuthorIcon = styled.div`
    align-items: center;
    justify-content: center;
    font-size: 1.45rem;
    display: flex;
    background-color: ${chroma('#00579B')};
    border-radius: 50%;
    width: 2.5rem;
    height: 2.5rem;
    color: white;
    margin-right: 1rem;
`

const AuthorNote = styled.div`
    display: flex;
    height: 5rem;
    align-items: center;
    padding: 0 1rem;

`


const Menu = styled.div`
    width: 20rem;
    display: flex;
    flex-direction: column;
    position: absolute;
    background-color: white;
    z-index: 0;
    box-shadow: 0 2px 2px 2px rgba(60,64,67,.15);
    border-radius: 0.2rem;
    overflow-y: scroll;
    /*
    top: ${props => props.top}px;
    left: ${props => props.left -20}px;
    */
    margin-top: 0.5rem;
    margin-left: -17rem;
`

const SmallHeaderContainer = styled.div`
    height: 4rem;
    display: flex;
    align-items: center;
    font-size: 1.3rem;
    padding: 1rem;
    color: #172A4E;
    font-weight: 500;
    &:hover {
        background-color: #F4F4F6; 
    }
    cursor: pointer;
    border-bottom: 1px solid #e0e4e7;
`

const Button = styled.div`
    width: 3rem;
	height: 3rem;
    display: flex;
    font-size: 2.4rem;
    justify-content: center;
    align-items: center;
    opacity: 0.8;
    position: relative;
    z-index: 0;
    border-radius: 0.3rem;
    &:hover {
        background-color:  ${props => props.active ? chroma("#5B75E6").alpha(0.2) : "#dae3ec;"};
    }
    background-color: ${props => props.active ? chroma("#5B75E6").alpha(0.2)  : ""};
    cursor: pointer;
`