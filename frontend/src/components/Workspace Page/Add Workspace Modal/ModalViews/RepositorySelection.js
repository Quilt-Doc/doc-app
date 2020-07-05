import React from 'react';

import styled from 'styled-components';

class RepositorySelection extends React.Component {
    constructor(props) {
        super(props)
    }

    renderCheck(){
        return
    }

    render(){
        return(
            <>
                <ModalHeader>Create a Workspace</ModalHeader>
                <Field>
                    <FieldName>Workspace Name</FieldName>
                    <FieldInput></FieldInput>
                </Field>
                <RepositoryContainer>
                    <ListToolBar>
                        <ListName>Repositories</ListName>
                        <Check_Box_Border onClick = {() => {this.turnCheckOn(this.props.item)}}>
                            <Check_Box /*border_color = {this.state.check_box_border_color}*/>
                                <ion-icon style={this.renderCheck()} name="checkmark-outline"></ion-icon>
                                </Check_Box>
                        </Check_Box_Border>
                    </ListToolBar>
                    <RepositoryList>
                        <Repository>
                            <Check_Box_Border onClick = {() => {this.turnCheckOn(this.props.item)}}>
                                <Check_Box /*border_color = {this.state.check_box_border_color}*/>
                                    <ion-icon style={this.renderCheck()}name="checkmark-outline"></ion-icon>
                                </Check_Box>
                            </Check_Box_Border>
                            kgodara / doc-app
                        </Repository>
                        <Repository>
                            <Check_Box_Border onClick = {() => {this.turnCheckOn(this.props.item)}}>
                                <Check_Box /*border_color = {this.state.check_box_border_color}*/>
                                    <ion-icon style={this.renderCheck()}name="checkmark-outline"></ion-icon>
                                </Check_Box>
                            </Check_Box_Border>
                            pytorch / fairseq
                        </Repository>
                        <Repository>
                            <Check_Box_Border onClick = {() => {this.turnCheckOn(this.props.item)}}>
                                <Check_Box /*border_color = {this.state.check_box_border_color}*/>
                                    <ion-icon style={this.renderCheck()} name="checkmark-outline"></ion-icon>
                                </Check_Box>
                            </Check_Box_Border>
                            pytorch / fairseq
                        </Repository>
                        <Repository>
                            <Check_Box_Border onClick = {() => {this.turnCheckOn(this.props.item)}}>
                                <Check_Box /*border_color = {this.state.check_box_border_color}*/>
                                    <ion-icon style={this.renderCheck()} name="checkmark-outline"></ion-icon>
                                </Check_Box>
                            </Check_Box_Border>
                            pytorch / fairseq
                        </Repository>
                        <Repository>
                            <Check_Box_Border onClick = {() => {this.turnCheckOn(this.props.item)}}>
                                <Check_Box /*border_color = {this.state.check_box_border_color}*/>
                                    <ion-icon style={this.renderCheck()} name="checkmark-outline"></ion-icon>
                                </Check_Box>
                            </Check_Box_Border>
                            pytorch / fairseq
                        </Repository>
                    </RepositoryList>
                </RepositoryContainer>
               
                <SubmitButton>CREATE</SubmitButton>
            </>
        )
    }
}

export default RepositorySelection;

const ModalHeader = styled.div`
    font-size: 2.5rem;
    color: #172A4E;2
`

const RepositoryContainer = styled.div`
    margin: 2rem auto; 
    width: 30rem;
    border-radius: 0.3rem;
    border: 1px solid #DFDFDF;
    display: flex;
    flex-direction: column;
    color: #172A4E;
`

const ListToolBar = styled.div`
    height: 4.5rem;
    display: flex;
    border-bottom: 1px solid #EDEFF1;
    align-items: center;
`

const RepositoryList = styled.div`
    display: flex; 
    flex-direction: column;
    overflow-y: scroll;
    height: 20rem;
`

const ListName = styled.div`
    margin-left: 2rem;
    color: #172A4E;
    font-size: 1.7rem;
    font-weight: 300;
    margin-right: 13rem;
`

const Check_Box_Border = styled.div`
    height: 4rem;
    width: 4rem;
    margin-right: 1rem;
    &:hover {
        background-color: #F4F4F6;
    }
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 50%;
`

const Check_Box = styled.div`
    height: 1.6rem;
    width: 1.6rem;
    background-color: white;
    border: 1.3px solid ${props => props.border_color};
    border-radius: 0.2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    
    &:hover {

    }
`

const Repository = styled.div`
    display: flex;
    align-items: center;
    padding: 0.5rem;
    color: #172A4E;
`

const SubmitButton = styled.div`
    font-size: 1.3rem;
    margin-left: 24rem;
    margin-top: 1rem;
    padding: 0.75rem;
    width: 7.8rem;
    display: inline-block;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-radius: 0.4rem;
    color: #172A4E;
    border: 1px solid #172A4E;
    &:hover {
        color: white;
        background-color: #19E5BE;
    }
    cursor: pointer;
    width: ${props => props.width};
    margin-top: ${props => props.marginTop};
`


const FieldName = styled.div`
    font-weight: bold;
    color: #172A4E;
    margin-bottom: 1rem;
`

const Field = styled.div`
    margin: 0 auto;
    margin-top: 3.5rem;
    margin-bottom: 0rem;
`

const FieldInput = styled.input`
    outline: none;
    height: 3.5rem;
    width: 30rem;
    border-radius: 0.3rem;
    border: 1px solid #DFDFDF;
    padding: 1rem;
    color: #172A4E;
    font-size: 1.5rem;
    background-color: #FAFBFC;

    &:focus {
        background-color: white;
        border: 1px solid #19E5BE;
    }
`