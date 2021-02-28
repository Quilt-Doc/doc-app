import React from 'react'; 

//styles 
import styled from "styled-components";
import chroma from 'chroma-js';

//components 
import AddOption from './ModalViews/AddOption';
import PlatformSelection from './ModalViews/PlatformSelection';
import RepositorySelection from './ModalViews/RepositorySelection';
import SearchWorkspace from './ModalViews/SearchWorkspace';

//animation
import { CSSTransition } from 'react-transition-group';

//redux
import { connect } from 'react-redux';

//actions
import {checkInstallation, retrieveDomainRepositories} from '../../../actions/Auth_Actions';
import {validateRepositories, pollRepositories, retrieveRepositories} from '../../../actions/Repository_Actions';
import { createWorkspace } from '../../../actions/Workspace_Actions';

//router
import { Link } from 'react-router-dom';

class WorkspaceModal extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            'mode': 1,
            'platform': null,
            'loaded': false,
             installationId: null
        }
    }
    
    componentDidMount(){
        this.props.checkInstallation(
            {accessToken: this.props.user.accessToken,
             platform: "github"}).then(() => {
                let installs = this.props.installations.filter(inst => inst.account.type === 'User' 
                    && inst.account.id == this.props.user.profileId)

                if (installs.length === 0) {
                    this.setState({loaded:true})
                    return
                } else {
                    this.props.retrieveDomainRepositories({accessToken: this.props.user.accessToken}).then(() => {
                        console.log("DOMAIN REPOS", this.props.domainRepositories)
                    })
                    this.setState({loaded: true, installationId: installs[0]._id})
                }
        })
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
            <ModalBackground 
                onClick = {() => this.reset()} 
                display = {this.props.modalDisplay}
            >
                 <CSSTransition
                    in={true}
                    appear = {true}
                    timeout={300}
                    classNames="modal"
                >   
                    <ModalContent onClick = {(e) => e.stopPropagation()}>
                        <FormContainer>
                        <ModalHeader>Create a Workspace</ModalHeader>
                       
                        <Message2>Give your workspace a name</Message2>
                        <FieldInput placeholder = {"Workspace name.."} ref = {this.nameInput}></FieldInput>
                        <Message2>Select repositories to document</Message2>
                        <SubHeader>Active Repositories</SubHeader>
                        
                            <RepoList>
                                <Repo>
                                    <ion-icon  style = {
                                    { marginRight: "0.5rem", fontSize: "1.4rem"}
                                    } name="git-network-outline"></ion-icon>
                                    fsanal / FinanceNewsApp
                                </Repo>
                                <Repo>
                                    <ion-icon  style = {
                                    { marginRight: "0.5rem", fontSize: "1.4rem"}
                                    } name="git-network-outline"></ion-icon>
                                    fsanal / DocApp
                                </Repo>
                                <Repo>
                                    <ion-icon  style = {
                                    { marginRight: "0.5rem", fontSize: "1.4rem"}
                                    } name="git-network-outline"></ion-icon>
                                    fsanal / test
                                </Repo>
                            </RepoList>
                        <SubHeader2>Inactive Repositories
                            <InstallButton2 
                                href =  "https://github.com/apps/docapp-test/installations/new?state=installing"
                            >
                                <ion-icon 
                                    name="logo-github"
                                    style = {{'fontSize':'2.3rem', 'marginRight': '0.7rem'}}
                                ></ion-icon>
                                Add new repositories
                            </InstallButton2>

                        </SubHeader2>
                            <RepoList>
                                <Repo2>
                                    <ion-icon  style = {
                                    { marginRight: "0.5rem", fontSize: "1.4rem"}
                                    } name="git-network-outline"></ion-icon>
                                    fsanal / FinanceNewsApp
                                </Repo2>
                                <Repo2>
                                    <ion-icon  style = {
                                    { marginRight: "0.5rem", fontSize: "1.4rem"}
                                    } name="git-network-outline"></ion-icon>
                                    fsanal / DocApp
                                </Repo2>
                                <Repo2>
                                    <ion-icon  style = {
                                    { marginRight: "0.5rem", fontSize: "1.4rem"}
                                    } name="git-network-outline"></ion-icon>
                                    fsanal / test
                                </Repo2>
                            </RepoList>
                           
                            </FormContainer>
                            <BottomSection>
                                    <CreateButton>Create</CreateButton>
                            </BottomSection>
                    </ModalContent>
                </CSSTransition>
            </ModalBackground>
        )
    }
}

{/*<Message>Install Docapp on Github to get started</Message>
                        <InstallButton 
                            href =  "https://github.com/apps/docapp-test/installations/new?state=installing"
                        >
                            <ion-icon 
                                name="logo-github"
                                style = {{'fontSize':'2.3rem', 'marginRight': '0.7rem'}}
                            ></ion-icon>
                            Install Docapp
</InstallButton>*/}

const mapStateToProps = (state) => {
    return {
        user: state.auth.user,
        installations: state.auth.installations,
        domainRepositories: state.auth.domainRepositories,
        repositories: state.repositories,
        workspaces: Object.values(state.workspaces)
    }
}

export default connect(mapStateToProps, {checkInstallation, retrieveDomainRepositories, 
    validateRepositories, pollRepositories, createWorkspace, retrieveRepositories})(WorkspaceModal);


const CreateButton = styled.div`
    margin-left: auto;
    font-size: 1.5rem;
    font-weight: 500;
    padding: 0.7rem 1.2rem;
    background-color:   ${chroma("#6762df").alpha(0.15)}; 
    border-radius: 0.3rem;
`

const BottomSection = styled.div`
    display: flex;
    align-items: center;
    padding-left: 5rem;
    padding-right: 5rem;
    border-top: 1px solid #ced2d9;
    height: 5rem;

`

const FieldInput = styled.input`
    outline: none;
    height: 3.5rem;
    width: 30rem;
    border-radius: 0.3rem;
    border: 1px solid #E0E4E7;
    padding: 1rem;
    color: #172A4E;
    font-weight: 500;
    font-size: 1.5rem;
    background-color: #FAFBFC;
    margin-top: 0.5rem;
    &:focus {
        background-color: white;
        border: 2px solid #2684FF
    }
    &::placeholder {
        color: #172A4E;
        opacity: 0.4;
    }
    margin-left: 5rem;
`

const FieldName = styled.div`
    font-weight: bold;
    color: #172A4E;
    margin-bottom: 1rem;
`

const Repo = styled.div`
    font-size: 1.5rem;
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
    
    background-color: ${chroma("#6762df").alpha(0.15)}; 
    border-radius: 0.3rem;
    margin-bottom:1rem;

    &: hover {
        background-color: ${chroma("#6762df").alpha(0.5)};
       /* box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;*/
    }
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 1rem;
    transition: all 0.1s ease-in-out;
`

const Repo2 = styled.div`
    font-size: 1.5rem;
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
    opacity: 0.4;
    background-color: ${chroma("#6762df").alpha(0.15)}; 
    border-radius: 0.3rem;
    margin-bottom:1rem;
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 1rem;  
`

const RepoList = styled.div`
    margin-top: 2rem;
    margin-bottom: 2rem;
    font-weight:500;
    padding-left: 5rem;
    padding-right: 5rem;
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

const FormContainer = styled.div`
    height: 53rem;
    overflow-y: scroll;
`
  
  /* Modal Content/Box */
const ModalContent = styled.div`
    background-color: #fefefe;
    margin: 7% auto; /* 15% from the top and centered */
   
    border: 1px solid #888;
    width: 70rem; /* Could be more or less, depending on screen size */

    border-radius: 5px;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 96rem;

`
/*27rem*/
const SubHeader = styled.div`
    font-weight: 500;
    font-size: 1.7rem;
    margin-top: 1.5rem;
    display: flex;
    align-items: center;
    padding-left: 5rem;
    padding-right: 5rem;

`

const SubHeader2 = styled.div`
    font-weight: 500;
    font-size: 1.7rem;
    margin-top: 4rem;
    display: flex;
    align-items: center;
    padding-left: 5rem;
    padding-right: 5rem;
  
`

const ModalHeader = styled.div`
    font-size: 2.5rem;
    color: #172A4E;
    padding-top: 5rem;
    padding-left: 5rem;
    padding-right: 5rem;
 
`

const Message = styled.div`
    margin-top: 7rem;
    font-size: 1.5rem;
    margin-bottom: 1.2rem;
    opacity: 0.5;
    padding-left: 5rem;
    padding-right: 5rem;
`

const Message2 = styled.div`
    margin-top: 4rem;
    font-size: 1.5rem;
    margin-bottom: 1.2rem;
    opacity: 0.5;
    padding-left: 5rem;
    padding-right: 5rem;
`

const InstallButton = styled.a`
    text-decoration: none;
    color: #172A4E;
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.4rem;
    background-color: #313b5e;
    &:hover {
        background-color:  #39466f;
    }
    color: white;
    width: 20rem;
`


const InstallButton2 = styled.a`
    text-decoration: none;
    color: #172A4E;
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1.4rem;
    background-color: #313b5e;
    &:hover {
        background-color:  #39466f;
    }
    color: white;
    width: 20rem;
    margin-left: auto;
`

