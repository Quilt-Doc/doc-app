import React from 'react';

//styles 
import styled from "styled-components"

//icons 
import gitlabIcon from '../../../../images/gitlab.svg'

class PlatformSelection extends React.Component {

    setConnection() {
        this.props.setPlatform("Github")
        this.props.changeMode(4)
    }

    render(){
        return (
            <>
                <ModalHeader>Select a Platform</ModalHeader>
                <Container>
                <FieldName>Find repositories on Github</FieldName>
                    <ConnectButton onClick = {() => this.setConnection()}>
                        <IconBorder marginRight = {"2.2rem"} width = {"3.5rem"}>
                            <ion-icon style = {{'fontSize':'3rem',  
                                                'color': '#172A4E'}} 
                                        name="logo-github">     
                            </ion-icon>
                        </IconBorder>
                        <Text>Github</Text>
                    </ConnectButton>
                <FieldName marginTop = {"2rem"}>Find repositories on Bitbucket</FieldName>
                    <ConnectButton onClick = {() => this.setConnection()}>
                        <IconBorder  marginRight = {"2.2rem"} width = {"3.5rem"}>
                            <ion-icon style = {{'fontSize':'2.5rem',  
                                                'color': '#172A4E'}} 
                                        name="logo-bitbucket">     
                            </ion-icon>
                        </IconBorder>
                        <Text>Bitbucket</Text>
                    </ConnectButton>
                <FieldName marginTop = {"2rem"}>Find repositories on Gitlab</FieldName>
                <ConnectButton onClick = {() => this.setConnection()}>
                    <IconBorder marginRight = {"2.2rem"} width = {"3.5rem"}>
                        <img src = {gitlabIcon} style = {{'height': '2.5rem',  
                                            'color': '#172A4E'}} 
                                    />
                    </IconBorder>
                    <Text>Gitlab</Text>
                </ConnectButton>
                </Container>
            </>
        )
    }
}

export default PlatformSelection;

const ModalHeader = styled.div`
    font-size: 2.5rem;
    color: #172A4E;2
`

const Container = styled.div`
    margin: 0 auto;
`

const FieldName = styled.div`
    color: #172A4E;
    margin-top: 4rem;
    margin-bottom: 1rem;
    margin-top: ${props => props.marginTop};
`

const ConnectButton = styled.div`
    border: 1px solid #19e5be;
    color: #172A4E;
    display: flex;
    align-items: center;
    padding: 0.7rem;
    width: 22rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.4rem;
    &:hover {
        background-color:  #F7F9FB;
    }
`

const IconBorder = styled.div`
    display: flex;
    align-items: center;
    jusify-content: center;
    width: 3.5rem;
    height: 3rem;
    margin-left: 2rem;
    margin-right: 2rem;
    margin-right: ${props => props.marginRight};
`

const Text = styled.div`
    margin-top: 0.25rem;
`

