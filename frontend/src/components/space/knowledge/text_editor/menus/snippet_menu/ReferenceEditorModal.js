import React from 'react';

//styles 
import styled from "styled-components"

//router
import {withRouter} from 'react-router-dom';

//components
import { CSSTransition } from 'react-transition-group';


class ReferenceEditorModal extends React.Component {

    render(){
        const { undoModal } = this.props;
        return(
            <ModalBackground onClick = {() => {undoModal()}}>
                <CSSTransition
                    in={true}
                    appear = {true}
                    timeout={300}
                    classNames="modal"
                >   
                    <ModalContent 
                        onClick = {(e) => {e.stopPropagation()}}
                    >

                    </ModalContent>
                </CSSTransition>
            </ModalBackground>
        )
    }
}

export default withRouter(ReferenceEditorModal);


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
    overflow-y: scroll;
`

const ModalContent = styled.div`
    background-color: white;
    margin: 20vh auto; /* 15% from the top and centered */
    width: 83vw; /* Could be more or less, depending on screen size */
    min-height: 50rem;
    border-radius: 0.3rem;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 95rem;
`
