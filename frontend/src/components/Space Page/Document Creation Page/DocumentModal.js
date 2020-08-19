import React from 'react';

//styles 
import styled from "styled-components"

//router
import history from '../../../history';
import {withRouter} from 'react-router-dom';

//misc
import { connect } from 'react-redux';

//components
import TextEditorView2 from '../Text Editor Page/TextEditorView2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAlignLeft, faAlignRight, faAlignCenter, faListUl, faListOl  } from '@fortawesome/free-solid-svg-icons'
import { CSSTransition } from 'react-transition-group';


class DocumentModal extends React.Component {
    constructor(props){
        super(props)
    }

    componentDidMount(){

    }

    undoModal(){
        history.push(history.location.pathname)
    }

    render(){
        return(
            <ModalBackground onClick = {() => {this.undoModal()}}>
                <CSSTransition
                    in={true}
                    appear = {true}
                    timeout={300}
                    classNames="modal"
                >   
                    <ModalContent onClick = {(e) => {e.stopPropagation()}}>
                        <TextEditorView2/>
                    </ModalContent>
                </CSSTransition>
            </ModalBackground>
        )
    }
}

/* <ModalToolbar>
                        <ModalToolbarButton>
                            <ion-icon name="open" style = {{color: "#5B75E6", fontSize: "1.7rem", marginTop: "-0.1rem", marginRight: "0.8rem"}}></ion-icon>
                            <Title>Open Document</Title>
                        </ModalToolbarButton>
                        <Divider/>
                        <ModalToolbarButton opacity = {"1"}>
                            
                            <Title  opacity = {"0.7"} marginRight = {"1rem"}>Location: </Title>
                            <ion-icon name="document-text-outline" style={{'fontSize': '1.7rem', 'color': "#172A4E", marginRight: "0.7rem"}}></ion-icon>
                            Understanding the backend
                        </ModalToolbarButton>
                        <Divider/>
                        <ModalToolbarButton>
                            
                            <ion-icon name="cube-outline" style={{'fontSize': '1.7rem', marginRight: "0.7rem"}}></ion-icon>
                            3 References
                        </ModalToolbarButton>
                        <Divider/>
                        <ModalToolbarButton>
                            <ion-icon name="pricetag-outline" style={{ 'fontSize': '1.7rem', marginRight: "0.7rem"}}></ion-icon>
                            3 Tags
                        </ModalToolbarButton>
                        
                        <ion-icon name="ellipsis-horizontal" style={{ 'fontSize': '2.3rem', marginLeft: "auto", marginRight: "0.7rem"}}></ion-icon>
                    </ModalToolbar>*/


export default withRouter(DocumentModal)


const IconBold = styled.div`
    font-size: 1.5rem;
`

const IconItalic = styled.div`
    font-style: italic;
    font-size: 1.5rem;
`

const IconUnderline = styled.div`
    text-decoration: underline;
    font-size: 1.5rem;
`

const IconBlock = styled.div`
    display: flex;
    padding-left: 1.3rem;
    padding-right: 1rem;
    border-right: 2px solid #F4F4F6; 
    align-items: center;
    height: 2.3rem;
`

const IconBorder = styled.div`
    margin-left: ${props => props.marginLeft};
    margin-right: 0.3rem;
    display: flex;
    font-size: 1.3rem;
    align-items: center;
    justify-content: center;

    width: 2.8rem;
    height: 2.8rem;
    border-radius: 0.3rem;
      
    &:hover {
        opacity: 1;
        background-color: #F4F4F6; 
    }

    cursor: pointer;
    transition: all 0.1s ease-in;
`

const ModalToolbar = styled.div`
    height: 4rem;
    padding: 2.7rem 1rem;
    display: flex;
    align-items: center;
`

const ModalEditor = styled.div`
    overflow-y: scroll;
    padding-top: 5rem;
`

const Divider = styled.div`
    border-right: 1px solid #172A4E;
    opacity: 0.5;
    height: 1.5rem;
    margin-right: 1rem;
`


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

/* Modal Content/Box */
const ModalContent = styled.div`
    background-color: #fefefe;
    margin: 7vh auto; /* 15% from the top and centered */
    
    width: 85vw; /* Could be more or less, depending on screen size */
    height: 87vh;
    border-radius: 0.2rem;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 94rem;
`

const StyledIcon2 = styled.img`
    width: 2.5rem;
    margin-right: 0.2rem;

`

const ModalCreateButton = styled.div`
   
    border-radius: 0.5rem;
    margin-left: auto;
    margin-right: 3rem;
    padding-top: 0.8rem;
    padding-bottom: 0.8rem;
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    font-size: 1.35rem;
    color: white;
    background-color: #19E5BE;
    cursor: pointer;

    &:hover {
       box-shadow: 0 1px 2px 0 rgba(60,64,67,0.302), 0 1px 3px 1px rgba(60,64,67,0.149); 
    }
`

const ModalToolbarButton = styled.div`
    display: flex;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    padding: 0.8rem;
    font-size: 1.4rem;
    
    margin-right: 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    &:hover {
        background-color: #F4F4F6; 
        opacity: 1;
    }
    margin-left: ${props => props.marginLeft};
    opacity: ${props => props.opacity};
`

const Title = styled.div`
    margin-right: ${props => props.marginRight};
    color: ${props => props.color};
    opacity: ${props => props.opacity};
`