import React from 'react';

//styles 
import styled from "styled-components"

//misc
import { connect } from 'react-redux';

class DocumentCreationView extends React.Component {
    constructor(props){
        super(props)
    }

    render(){
        return(
            <ModalBackground onClick = {this.props.clearModal} display = {this.props.display}>
                <ModalContent onClick = {(e) => e.stopPropagation()}>
                    <ModalHeader>Create a Document</ModalHeader>
                    <ModalContainer>
                        <FormsContainer>
                            <FormContainer>
                                <FormHeader>Repository Address</FormHeader>
                                <StyledInput ref={this.addressInput} placeholder = {'github.com/repository-address'}  />
                            </FormContainer>
                            <FormContainer>
                                <FormHeader>Repository Name</FormHeader>
                                <StyledInput ref={this.nameInput} placeholder = {'repository-address'}  />
                            </FormContainer>
                            <SubmitButton onClick = {() => this.createRepository()}>CREATE</SubmitButton>
                        </FormsContainer>
                    </ModalContainer>
                </ModalContent>
            </ModalBackground>
        )
    }
}


const mapStateToProps = (state) => {
    return {
        repositories: Object.values(state.repositories.repositories)
    }
}

export default connect(mapStateToProps)(DocumentCreationView)

const ModalBackground = styled.div`
    /*display: none;  Hidden by default */
    position: fixed; /* Stay in place */
    z-index: 10000; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: hidden; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
    cursor: pointer;
    display: ${props => props.display};
`

const ModalContent = styled.div`
    background-color: #fefefe;
    margin: 4.5% auto; /* 15% from the top and centered */
    padding: 5rem;
    padding-bottom: 2rem;
    border: 1px solid #888;
    width: 73vw; /* Could be more or less, depending on screen size */
    height: 50rem;
    border-radius: 5px;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 96rem;
`

const ModalHeader = styled.div`
    font-size: 4rem;
    color: #172A4E;
    font-weight:bold;
    letter-spacing: 0.1rem;
`

const ModalContainer = styled.div`
    display: flex;
`


const FormContainer = styled.div`
    display: flex;
    flex-direction: column
`
const FormHeader = styled.div`
    font-size: 1.6rem;
    color: #172A4E;
    letter-spacing: 0.05rem;
    margin-top: 2rem;
    margin-bottom: 1rem;
`

const FormsContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 6rem;
`

const SubmitButton = styled.div`
    margin-top: 4.5rem;
    padding: 0.5rem;
    width: 7.7rem;
    display: inline-block;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-radius: 0.4rem;
    color: #19E5BE;
    border: 1px solid #19E5BE;
    &:hover {
        color: white;
        background-color: #19E5BE;
    }
    cursor: pointer;
`


const StyledInput = styled.input`
    height: 4rem;
    width: 42rem;
    padding: 0.8rem;
    font-size: 1.6rem;
    color: #172A4E;
    border-radius: 0.4rem;
    border: 1px solid #D7D7D7;
    outline: none;
    &:focus {
        border: 1.5px solid #19E5BE;
    }
`
