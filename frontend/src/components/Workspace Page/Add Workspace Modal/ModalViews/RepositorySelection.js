import React from 'react';

import styled from 'styled-components';

//
import { connect } from 'react-redux';

import _ from 'lodash';

//actions
import {validateRepositories, pollRepositories, retrieveRepositories} from '../../../../actions/Repository_Actions';
import {checkInstallation, retrieveDomainRepositories} from '../../../../actions/Auth_Actions';
import { createWorkspace } from '../../../../actions/Workspace_Actions';

class RepositorySelection extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            selected: {},
            installationID: null, 
            polling: false
        }

       this.nameInput = React.createRef()
       this.keyInput = React.createRef()
    }

    // ORG LEVEL BUGS, FIND INSTALLATIONID + FULLNAME MAY BE BUGGY -- which repo to which installation id?
    componentDidMount(){
        this.props.checkInstallation(
            {accessToken: this.props.user.accessToken,
             platform: this.props.platform}).then(() => {
                let installs = this.props.installations.filter(inst => inst.account.type === 'User' 
                    && inst.account.id == this.props.user.profileID)
                if (installs.length === 0) {
                    return
                } else {
                    this.props.retrieveDomainRepositories({accessToken: this.props.user.accessToken})
                    this.setState({installationID:
                         installs[0].id})
                }
        })
    }

    turnCheckOn(id, fullName){
        if (id in this.state.selected) {
            this.setState({selected: _.omit(this.state.selected, id)})
        } else {
            let selected = {...this.state.selected}
            selected[id] = fullName;
            this.setState({selected})
        }
    }

    renderCheck(id){
        let display = id in this.state.selected ? "" : "none"
        return {'fontSize': "2rem", 'color': '#19E5BE', display}
    }

    renderCheckAll(){
        let display = Object.keys(this.state.selected).length === this.props.domainRepositories.length ? "" : "none"
        return {'fontSize': "2rem", 'color': '#19E5BE', display}
    }

    turnCheckOnAll(){
        if ( Object.keys(this.state.selected).length !== this.props.domainRepositories.length){
            let selected = {}
            this.props.domainRepositories.map(drepo => selected[drepo.id] = drepo.full_name)
            this.setState({selected})
        } else {
            this.setState({selected: {}})
        }  
    }

    renderCheckBoxBorder(id){
        return id in this.state.selected ? '#19E5BE' : '#D7D7D7';
    }

    renderCheckBoxBorderColorAll(){
        return Object.keys(this.state.selected).length === this.props.domainRepositories.length ? '#19E5BE' : '#D7D7D7';
    }


    renderDomainRepositories(){
        return this.props.domainRepositories.map(drepo => {
            return (
                <Repository>
                    <Check_Box_Border onClick = {() => {this.turnCheckOn(drepo.id, drepo.full_name)}}>
                        <Check_Box border_color = {this.renderCheckBoxBorder(drepo.id)}>
                            <ion-icon style={this.renderCheck(drepo.id)} name="checkmark-outline"></ion-icon>
                        </Check_Box>
                    </Check_Box_Border>
                    {drepo.full_name}
                </Repository>
            )
        })
    }

    reset(){
        this.props.clearModal()
        this.props.changeMode(1);
    }

    pollRepositories(fullNames){
        this.props.pollRepositories({fullNames, installationID: this.state.installationID}).then(({finished}) => {
            if (finished === true){
                clearInterval(this.interval)
                this.props.retrieveRepositories({fullNames: Object.values(this.state.selected), installationId: this.state.installationID}).then(() => {
                    let repositoryIDs = Object.keys(this.props.repositories)
                    this.props.createWorkspace({name: this.nameInput.current.value, 
                        creatorID: this.props.user._id, repositoryIDs, icon: this.props.workspaces.length, 
                        key: this.keyInput.current.value}).then(() => {
                        this.reset()
                    })
                })
            }
        })
    }



    createWorkspace(){
        this.props.validateRepositories({selected: this.state.selected, 
            installationID: this.state.installationID, accessToken: this.props.user.accessToken}).then((response) => {
            this.interval = setInterval(this.pollRepositories(response), 3000);
        })
    }   


    render(){
        if (this.props.domainRepositories) {
            return (
                <>
                    <ModalHeader>Create a Workspace</ModalHeader>
                    <Field>
                        <FieldName>Workspace Name</FieldName>
                        <FieldInput ref = {this.nameInput}></FieldInput>
                    </Field>
                    <Field2>
                        <FieldName>Workspace Key</FieldName>
                        <FieldInput ref = {this.keyInput}></FieldInput>
                    </Field2>
                    <RepositoryContainer>
                        <ListToolBar>
                            <ListName>Repositories</ListName>
                            <Check_Box_Border onClick = {() => {this.turnCheckOnAll()}}>
                                <Check_Box border_color = {this.renderCheckBoxBorderColorAll()}>
                                    <ion-icon style={this.renderCheckAll()} name="checkmark-outline"></ion-icon>
                                    </Check_Box>
                            </Check_Box_Border>
                        </ListToolBar>
                        <RepositoryList>
                           {this.renderDomainRepositories()}
                        </RepositoryList>
                    </RepositoryContainer>
                   
                    <SubmitButton onClick = {() => this.createWorkspace()}>CREATE</SubmitButton>
                </>
            )
        } else {
            return null
        }
        
    }
}


const mapStateToProps = (state) => {
    return {
        user: state.auth.user,
        installations: state.auth.installations,
        domainRepositories: state.auth.domainRepositories,
        repositories: state.repositories,
        workspaces: Object.values(state.workspaces.workspaces)
    }
}

export default connect(mapStateToProps, {checkInstallation, retrieveDomainRepositories, 
    validateRepositories, pollRepositories, createWorkspace, retrieveRepositories})(RepositorySelection);

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

const Field2 = styled.div`
    margin: 0 auto;
    margin-top: 1rem;
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