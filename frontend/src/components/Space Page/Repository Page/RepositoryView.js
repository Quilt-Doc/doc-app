import React from 'react';

//styles 
import styled from "styled-components"

//images
import repoIcon1 from '../../../images/repo1.svg'
import repoIcon2 from '../../../images/repo2.svg'
import repoIcon3 from '../../../images/repo3.svg'
import repoIcon4 from '../../../images/repo4.svg'
import repoIcon5 from '../../../images/repo5.svg'
import repoIcon6 from '../../../images/repo6.svg'
import repoIcon7 from '../../../images/repo7.svg'
import repoBackground from '../../../images/repoBackground.svg'

//actions
import { createRepository, retrieveRepositories/*, repoUpdateCommit */} from '../../../actions/Repository_Actions'

//react-router
import { Link } from 'react-router-dom';

//misc
import { connect } from 'react-redux';

class RepositoryView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
           modalDisplay: 'none',
        }

        this.count = 0
        this.addressInput = React.createRef();
        this.nameInput = React.createRef();
    }

    componentDidMount() {
        this.props.retrieveRepositories()
    }

    renderLink(link) {
        let position = link.indexOf('github.com/');
        return `/repository/directory/${link.slice(position + 11, link.length)}`
    }

    renderRepositories() {
        let icons = [repoIcon1, repoIcon2, repoIcon3, repoIcon4, repoIcon5, repoIcon6, repoIcon7]

        let repositoriesJSX = []
        this.props.repositories.map((repository, i) => {
            repositoriesJSX.push(
                <Link key = {i} to = {this.renderLink(repository.link)}><RepoBox onClick = {() => {console.log(repository.link)}}>
                    <StyledIcon src = {icons[repository.icon]}/>
                    {repository.name}
                </RepoBox></Link>
            )
            return
        })

        this.count = repositoriesJSX.length

        repositoriesJSX.push( <RepoBox opacity = {0.5} onClick = {() => this.setState({modalDisplay: ''})}>
                                <ion-icon style={{'fontSize':'6rem', 'marginBottom': '0.45rem'}} name="add-outline"></ion-icon>
                                Add New Repository
                            </RepoBox>
        )
        
        let allJSX = []
        for (let i = 0; i < repositoriesJSX.length; i+= 3) {
            allJSX.push(<RepoRow>
                {repositoriesJSX.slice(i, i + 3).map(repositoryJSX => {
                    return repositoryJSX
                })}
            </RepoRow>)
        }
        
        return allJSX
    }

    createRepository() {
        this.props.createRepository({name: this.nameInput.current.value, link: this.addressInput.current.value, icon: this.count}).then((repo_data) => {
            //this.props.repoUpdateCommit({ repo_id: repo_data[0], repo_link: repo_data[1]})
            this.clearModal()
        })

    }

    clearModal() {
        this.setState({modalDisplay: 'none'})
        this.nameInput.current.value = "";
        this.addressInput.current.value = "";
    }

    render() {
        if (this.props.repositories){
            return (
                <Container>
                    <Header>Repositories</Header>
                    <RepoContainer>
                        {this.renderRepositories()}
                    </RepoContainer>
                    <ModalBackground onClick = {() => this.clearModal()} display = {this.state.modalDisplay}>
                        <ModalContent onClick = {(e) => e.stopPropagation()}>
                            <ModalHeader>Link to a Repository</ModalHeader>
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
                                <ModalImage/>
                            </ModalContainer>
                        </ModalContent>
                    </ModalBackground>
                </Container>
            )
        }
        return null
    }
}

const mapStateToProps = (state) => {
    return {
        repositories: Object.values(state.repositories.repositories)
    }
}

export default connect(mapStateToProps, {createRepository, retrieveRepositories/*, repoUpdateCommit*/})(RepositoryView);


const StyledIcon = styled.img`
    width: 5rem;
    margin-bottom: 1.5rem;
`

const Header = styled.div`
    font-size: 3.5rem;
    color: #172A4E;
    font-weight: bold;
    letter-spacing: 0.1rem;
`

const Container = styled.div`
    width: 110rem;
    margin: 0 auto;
    margin-top: 7rem;
`

const RepoContainer = styled.div`
    background-color: rgba(244, 244, 246, 0.7);
    margin-top: 3rem;
    display: flex;
    flex-direction: column;
    border-radius: 0.3rem;
    width: 98rem;
    padding-bottom: 4rem;
`

const RepoRow = styled.div`
    display: flex;
    margin-top: 4rem;
`

const RepoBox = styled.div`
    background-color: white;
    margin-left: 4.5rem;
    margin-right: 4rem;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 24rem;
    height: 17rem;
    display: flex;
    border-radius: 5px;
    transition: box-shadow 0.1s ease, transform 0.1s ease;
    &:hover {
        cursor: pointer;
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;
        opacity: 1;
    }
    font-size: 1.5rem;
    color: #172A4E;
    font-weight: bold;
    opacity: ${props => props.opacity};
`


// Modal
/* The Modal (background) */
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
    display: ${props => props.display};
`
  
  /* Modal Content/Box */
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

const ModalImage = styled.div`
    height: 35rem;
    width: 48rem;
    margin-left: 3rem;
    background-image: url(${repoBackground});
    background-size: cover;
`
const ModalHeader = styled.div`
    font-size: 4rem;
    color: #172A4E;
    font-weight:bold;
    letter-spacing: 0.1rem;
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