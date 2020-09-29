import React from 'react';

//styles 
import styled from "styled-components";

class AddOption extends React.Component {
    constructor(props) { 
        super(props)
    }

    render(){
        return (
            <>
                <ModalHeader>Add a Workspace</ModalHeader>
                <ModalContainer>
                    <FormsContainer>
                        <WorkspaceOption onClick = {() => this.props.changeMode(2)}>
                            <ion-icon style = {{'fontSize': '2.2rem', 'marginRight': '1rem'}} name="search-outline"></ion-icon>
                            Search for an existing Workspace
                        </WorkspaceOption>
                        <WorkspaceOption onClick = {() => this.props.changeMode(3)}>
                            <ion-icon style = {{'fontSize': '2.7rem', 'marginRight': '0.6rem'}} name="add-outline"></ion-icon>
                            Create a new Workspace
                        </WorkspaceOption>
                    </FormsContainer>
                    
                </ModalContainer>
            </>
        )
    }
}

export default AddOption;

/*<ModalImage/>*/

const ModalHeader = styled.div`
    font-size: 2.5rem;
    color: #172A4E;
`

const ModalContainer = styled.div`
    display: flex;
`

const FormsContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 15rem;
`

const WorkspaceOption = styled.div`
    font-size: 1.6rem;
    color: #172A4E;
    height: 3rem;
    padding: 3rem;
    border: 1px solid #D7D7D7;
    margin-bottom: 2.5rem;
    display: flex;
    align-items: center;
    border-radius: 0.7rem;
    width: 34rem;
    cursor: pointer;
    &:hover {
        background-color: #F4F4F6;
    }

`