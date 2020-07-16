import React from 'react';

//styles 
import styled from "styled-components"

//router
import history from '../../../history';

//misc
import { connect } from 'react-redux';

//components
import TextEditorView2 from '../Text Editor Page/TextEditorView2';

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
                <ModalContent onClick = {(e) => {e.stopPropagation()}}>
                    <ModalToolbar>
                        <ModalToolbarButton>
                            <ion-icon name="open-outline" style = {{fontSize: "1.7rem", marginTop: "-0.1rem", marginRight: "0.8rem"}}></ion-icon>
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
                    </ModalToolbar>
                    <ModalEditor>
                        <TextEditorView2/>
                    </ModalEditor>
                    
                </ModalContent>
            </ModalBackground>
        )
    }
}


export default DocumentModal


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
    margin: 8vh auto; /* 15% from the top and centered */
    

    border: 1px solid #888;
    width: 85vw; /* Could be more or less, depending on screen size */
    height: 84vh;
    border-radius: 0.4rem;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 98rem;
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
    align-items: center;
    font-size: 1.35rem;
    
    margin-right: 1rem;
    border-radius: 0.4rem;
    padding: 1rem;
    cursor: pointer;
    opacity: 0.7;
    &:hover {
        background-color: #F4F4F6; 
        opacity: 1;
    }
    opacity: ${props => props.opacity};
`

const Title = styled.div`
    margin-right: ${props => props.marginRight};
    color: ${props => props.color};
    opacity: ${props => props.opacity};
`