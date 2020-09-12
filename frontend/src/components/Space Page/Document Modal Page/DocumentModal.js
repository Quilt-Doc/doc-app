import React from 'react';

//styles 
import styled from "styled-components"

//router
import history from '../../../history';
import {withRouter} from 'react-router-dom';

//components
import TextEditorView from '../Text Editor Page/TextEditorView';
import { CSSTransition } from 'react-transition-group';
import CreationView from './CreationView';

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
        let search = history.location.search
        let params = new URLSearchParams(search)
        let documentId = params.get('document');
        let creating =  params.get('create_document');
        if (!documentId){
            return <CreationView history = {history} setLoading = {(loading) => {this.setState({loading})}} />
        } else {
            return  (
                    <TextEditorView 
                        setLoading = {(loading) => {this.setState({loading})}} 
                        creating = {creating ? true : false} 
                        documentModal = {true}
                    />)
        }
    }

    isDocument = () => {
        let search = history.location.search
        let params = new URLSearchParams(search)
        let documentId = params.get('document');
        if (documentId) {
            return true
        } else {
            return false
        }
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
                        isDocument = {this.isDocument()}
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
`

const ModalContent = styled.div`
    background-color: white;
    margin: 5vh auto; /* 15% from the top and centered */
    width: 83vw; /* Could be more or less, depending on screen size */
    height: 91vh;
    min-height: 50rem;
    border-radius: 0.3rem;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 105rem;
    overflow-y: ${props => props.isDocument ? "scroll" : ""};
`

const Center = styled.div`
    height: 100%;
    width: 100%;
    padding-left: 3rem;
    padding-top: 3rem;
`