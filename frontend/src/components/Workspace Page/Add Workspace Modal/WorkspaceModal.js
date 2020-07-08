import React from 'react'; 

//styles 
import styled from "styled-components";

//components 
import AddOption from './ModalViews/AddOption';
import PlatformSelection from './ModalViews/PlatformSelection';
import RepositorySelection from './ModalViews/RepositorySelection';
import SearchWorkspace from './ModalViews/SearchWorkspace';




class WorkspaceModal extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            'mode': 1,
            'platform': null,
        }
    }

    changeMode = (mode) => {
        this.setState({mode})
    }

    setPlatform = (platform) => {
        this.setState({platform})
    }

    renderModalContent(){
        if (this.state.mode === 1) {
            return <AddOption changeMode = {this.changeMode}/>
        } else if (this.state.mode === 2) {
            return <SearchWorkspace changeMode = {this.changeMode}/>
        } else if (this.state.mode === 3) {
            return <PlatformSelection 
                        changeMode = {this.changeMode}
                        setPlatform = {this.setPlatform}
                    />
        } else if (this.state.mode === 4) {
            return <RepositorySelection 
                clearModal = {() => this.props.clearModal()}
                platform = {this.state.platform} 
                changeMode = {this.changeMode}/>
        }
    }

    reset(){
        this.props.clearModal()
        this.changeMode(1)
    }

    render(){
        return (
            <ModalBackground onClick = {() => this.reset()} display = {this.props.modalDisplay}>
                <ModalContent onClick = {(e) => e.stopPropagation()}>
                    {this.renderModalContent()}
                </ModalContent>
            </ModalBackground>
        )
    }
}

export default WorkspaceModal;


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
    margin: 7% auto; /* 15% from the top and centered */
    padding: 5rem;
    padding-bottom: 2rem;
    border: 1px solid #888;
    width: 44rem; /* Could be more or less, depending on screen size */
    height: 62rem;
    border-radius: 5px;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 96rem;
`