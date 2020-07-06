import React from 'react';

//styles 
import styled from "styled-components"

//images
import repoIcon1 from '../../images/repo1.svg'
import repoIcon2 from '../../images/repo2.svg'
import repoIcon3 from '../../images/repo3.svg'
import repoIcon4 from '../../images/repo4.svg'
import repoIcon5 from '../../images/repo5.svg'
import repoIcon6 from '../../images/repo6.svg'
import repoIcon7 from '../../images/repo7.svg'
import repoBackground from '../../images/repoBackground.svg'
import gitlabIcon from '../../images/gitlab.svg'

//components
import WorkspaceModal from './Add Workspace Modal/WorkspaceModal';

//actions
import { createRepository, retrieveRepositories, updateRepositoryCommit} from '../../actions/Repository_Actions'

// Old
// import {getRepositoryRefs} from '../../actions/Repository_Actions';


//react-router
import { Link } from 'react-router-dom';

//misc
import { connect } from 'react-redux';

class WorkspaceView extends React.Component {
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

    renderLink(id) {
        return `/repository/directory/${id}`
    }

    renderRepositories() {
        let icons = [repoIcon1, repoIcon2, repoIcon3, repoIcon4, repoIcon5, repoIcon6, repoIcon7]

        let repositoriesJSX = []
        this.props.repositories.map((repository, i) => {
            repositoriesJSX.push(
                <Link key = {i} to = {this.renderLink(repository._id)}><WorkspaceBox onClick = {() => {console.log(repository.link)}}>
                    <StyledIcon src = {icons[repository.icon]}/>
                    {repository.name}
                </WorkspaceBox></Link>
            )
            return
        })

        this.count = repositoriesJSX.length

        repositoriesJSX.push( <WorkspaceBox fd = {"row"} opacity = {0.5} onClick = {() => this.setState({modalDisplay: ''})}>
                                <ion-icon style={{'fontSize':'2rem', 'marginRight': '0.5rem'}} name="add-outline"></ion-icon>
                                Add Workspace
                            </WorkspaceBox>
        )

        repositoriesJSX.push( <WorkspaceBox fd = {"row"} opacity = {0.5} onClick = {() => this.setState({modalDisplay: ''})}>
                                <ion-icon style={{'fontSize':'2rem', 'marginRight': '0.5rem'}} name="add-outline"></ion-icon>
                                To Workspace
                            </WorkspaceBox>
        )

        repositoriesJSX.push( <WorkspaceBox fd = {"row"} opacity = {0.5} onClick = {() => this.setState({modalDisplay: ''})}>
                                <ion-icon style={{'fontSize':'2rem', 'marginRight': '0.5rem'}} name="add-outline"></ion-icon>
                                rat Workspace
                            </WorkspaceBox>
        )
        
        let allJSX = []
        for (let i = 0; i < repositoriesJSX.length; i+= 3) {
            allJSX.push(<WorkspaceRow>
                {repositoriesJSX.slice(i, i + 3).map(repositoryJSX => {
                    return repositoryJSX
                })}
            </WorkspaceRow>)
        }
        
        return allJSX
    }

    createRepository() {
        this.props.createRepository({name: this.nameInput.current.value, link: this.addressInput.current.value, icon: this.count}).then((repo_data) => {
            this.props.updateRepositoryCommit({ repo_id: repo_data['_id'], repo_link: repo_data['link']})
            this.clearModal()
        })

    }

    clearModal() {
        this.setState({modalDisplay: 'none'})
        //this.nameInput.current.value = "";
        //this.addressInput.current.value = "";
    }

    render() {
        if (this.props.repositories){
            return (
                <Container>
                    <Header>Workspaces</Header>
                    <WorkspaceContainer>
                        {this.renderRepositories()}
                    </WorkspaceContainer>
                    <WorkspaceModal 
                        clearModal = {() => this.clearModal()}
                        modalDisplay = {this.state.modalDisplay}
                    />
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

export default connect(mapStateToProps, {createRepository, retrieveRepositories, updateRepositoryCommit})(WorkspaceView);


const StyledIcon = styled.img`
    width: 5rem;
    margin-bottom: 1.5rem;
`

const Header = styled.div`
    font-size: 2.5rem;
    color: #172A4E;
    margin-bottom: 5rem;
`

const Container = styled.div`
    margin: 0 auto;
    margin-top: 4rem;
`

const WorkspaceContainer = styled.div`
    background-color:  #F7F9FB;
    margin-top: 3rem;
    display: flex;
    flex-direction: column;
    border-radius: 0.3rem;
    padding-bottom: 4rem;
    width: 87rem;

`

const WorkspaceRow = styled.div`
    display: flex;
    margin-top: 4rem;
`

const WorkspaceBox = styled.div`
    background-color: white;
    margin-left: 4rem;
    margin-right: 4rem;
    position: relative;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 21rem;
    height: 14rem;
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
    
    opacity: ${props => props.opacity};
    flex-direction: ${props => props.fd};
`  