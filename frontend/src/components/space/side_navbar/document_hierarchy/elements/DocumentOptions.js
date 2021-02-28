import React from 'react';

//styles
import styled from "styled-components";
import chroma from 'chroma-js';
import { CSSTransition } from 'react-transition-group';

//icons
import { BsTrash2 } from 'react-icons/bs';
import { FiFileText, FiTrash, FiTrash2 } from 'react-icons/fi';

//redux
import {connect} from 'react-redux';

//actions
import {deleteDocument} from '../../../actions/Document_Actions';

class DocumentOptions extends React.Component {
    constructor(props){
        super(props)

        this.state = {
            open: false
        }
    }
    openMenu(e) {
        e.preventDefault()
        document.addEventListener('mousedown', this.handleClickOutside, false);
      
        this.setState({open: true})
    }
    
    closeMenu(){
        document.removeEventListener('mousedown', this.handleClickOutside, false);
        this.setState({ open: false})
    }

    handleClickOutside = (e) => {
        if (this.node && !this.node.contains(e.target)) {
            e.preventDefault()
            this.closeMenu()
        }
    }

    render(){
        let {open} = this.state;
        let {on, document} = this.props;
        return(
            <>
                {/*
                <CSSTransition
                            in = {open}
                            unmountOnExit
                            enter = {true}
                            exit = {true}
                            timeout = {150}
                            classNames = "dropmenu"
                        >
                    <DocumentMenu  ref = {node => this.node = node}>

                    </DocumentMenu>
                </CSSTransition>*/}
                    { on &&
                        <IconBorder2 onClick = {(e) => {
                            e.preventDefault(); e.stopPropagation();
                            let { workspaceId } = this.props.match.params;
                            this.props.deleteDocument({workspaceId, documentId: document._id})}}
                        >
                            <FiTrash/>
                        </IconBorder2>
                    }
                </>
        )
    }
}

const mapStateToProps = (state, ownProps) => {

    return {
        
    }
}

export default connect(mapStateToProps, { deleteDocument })(DocumentOptions)

const DocumentMenu = styled.div`
    width: 18rem;
    height: 10rem;
    margin-left: -10rem;
    display: flex;
    flex-direction: column;
    position: absolute;
    background-color: white;
    z-index: 2;
    box-shadow: 0 30px 60px -12px rgba(50,50,93,0.25),0 18px 36px -18px rgba(0,0,0,0.3);
    border-radius: 0.2rem;
    overflow-y: scroll;
    padding-bottom: 1rem;
`

const IconBorder2 = styled.div`
    width: 1.9rem;
    height: 1.9rem;
	margin-right: 0.5rem;
	font-size: 1.3rem;
    border-radius: 0.2rem;
	color: white;
	align-items: center;
    justify-content: center;
    display: flex;
    cursor: pointer;
    background-color: #2B2F3A;
    opacity: 0.8;
    &: hover {
		opacity: 1;
    }

`