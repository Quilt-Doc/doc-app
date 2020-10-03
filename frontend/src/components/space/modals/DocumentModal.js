import React from 'react';

//styles 
import styled from "styled-components"

//router
import history from '../../../history';
import {withRouter} from 'react-router-dom';

//components
import EditorWrapper from '../knowledge/text_editor/EditorWrapper';
import { CSSTransition } from 'react-transition-group';

//spinner
import MoonLoader from "react-spinners/MoonLoader";


class DocumentModal extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            loading: false
        }
    }

    undoModal(){
        history.push(history.location.pathname)
    }

    renderContent(){
        return  (
                    <EditorWrapper 
                        setLoading = {(loading) => {this.setState({loading})}} 
                        documentModal = {true}
                    />)
    }



    render(){
        let {loading} = this.state;
        return(
            <ModalBackground onClick = {() => {this.undoModal()}}>
                <CSSTransition
                    in={true}
                    appear = {true}
                    timeout={300}
                    classNames="modal"
                >   
                    <ModalContent 
                        loading = {loading} 
                        onClick = {(e) => {e.stopPropagation()}}
                        isDocument = {true}
                    >
                        {loading ? 
                            <Center><MoonLoader style = {{color: "#E0E4E7"}} size = {35}/></Center> : 
                            this.renderContent()
                        }
                    </ModalContent>
                </CSSTransition>
            </ModalBackground>
        )
    }
}

export default withRouter(DocumentModal)


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
    margin: 5vh auto; /* 15% from the top and centered */
    width: 83vw; /* Could be more or less, depending on screen size */
    min-height: 50rem;
    border-radius: 0.3rem;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 95rem;
`

const Center = styled.div`
    height: 100%;
    width: 100%;
    padding-left: 3rem;
    padding-top: 3rem;
`