import React from 'react';

// react-redux
import { connect } from 'react-redux';

//history
import history from '../../../history';

//router
import {withRouter, Link} from 'react-router-dom';

//chroma
import chroma from 'chroma-js';

//actions
import {editDocument} from '../../../actions/Document_Actions';

//components
import { CSSTransition } from 'react-transition-group';

//icons
import {RiGitRepositoryLine} from 'react-icons/ri'
import {FiFileText, FiChevronDown} from 'react-icons/fi'

//styles
import styled from "styled-components";

class RepositoryMenu extends React.Component {
    
    constructor(props) {
        super(props)

        this.state = {
            open: false,
            position: 0,
            documents: []
        }

        this.menuRef = React.createRef();
    }


    /**
     * Alert if clicked on outside of element
     */

    selectRepository(repo){
        if (this.props.form){
            this.props.selectRepository(repo)
            this.closeMenu()
        } else {
            this.props.editDocument(this.props.document._id, {repositoryId: repo._id}); 
            this.closeMenu()
        }
    }
    

    renderListItems(){
        return this.props.repositories.map((repo, i) => {
            return(
                <ListItem 
                    onClick = {() => {
                        this.selectRepository(repo)
                    }} 
                >
                    <RiGitRepositoryLine style = {
                        {fontSize: "1.5rem", marginRight: "0.7rem"}
                        }
                    />
                    {repo.fullName}
                </ListItem>
            )
        })
    }

    openMenu(e) {
        e.preventDefault(); 
        document.addEventListener('mousedown', this.handleClickOutside, false);
        this.setState({ open: true })
    }

    closeMenu() {
        document.removeEventListener('mousedown', this.handleClickOutside, false);
        this.setState({ open: false })
    }

    handleClickOutside = (event) => {
        if (this.node && !this.node.contains(event.target)) {
            this.closeMenu()
        }
    }

    renderFullName(){
        let split = this.props.document.repository.fullName.split("/")
        return `${split[1]}`
    }

    renderFormFullName(repo){
       
    }

    render() {
        return(
            <MenuContainer >
                {!this.props.form ?
                    <RepositoryButton onClick = {(e) => {this.openMenu(e)}}> 
                        <RiGitRepositoryLine style = {
                                        { marginRight: "0.65rem", fontSize: "1.7rem"}
                        }/>
                        {this.props.document.repository ? this.renderFullName() : "Select repository"}
                        <FiChevronDown
                            style = {{  fontSize: "1.3rem",
                                        marginTop: "0.25rem",
                                        marginLeft: "0.8rem"}} 
                        /> 
                    </RepositoryButton>
                    :
                    <Provider onClick = {(e) => {this.openMenu(e)}}>
                        <RiGitRepositoryLine style = {{marginTop: "-0.15rem", marginRight: "1rem"}}/>
                        {this.props.formRepository ? this.props.formRepository.fullName.split("/")[1] : "None Selected"}
                        <FiChevronDown style = {{ marginLeft: "1rem"}}/>
                    </Provider>
                }
                
                <CSSTransition
                    in={this.state.open}
                    unmountOnExit
                    enter = {true}
                    exit = {true}
                    timeout = {150}
                    classNames = "dropmenu"
                >
                    <Container marginTop = {this.props.form ? "-3rem" : ""}  ref = {node => this.node = node}>
                        <HeaderContainer>Select a repository</HeaderContainer>
                        <ListContainer>
                            {this.renderListItems()}
                        </ListContainer>
                    </Container>
                </CSSTransition>
            </MenuContainer>
        )
    } 
}

const mapStateToProps = (state, ownProps) => {
    console.log(ownProps.match.params);
    let {workspaceId} = ownProps.match.params
    console.log(workspaceId)
    console.log("WORKSPACES", state.workspaces[workspaceId])
    let repositories =  state.workspaces[workspaceId] ? state.workspaces[workspaceId].repositories : [];
    console.log(repositories)
    return {
        repositories,
        workspace: state.workspaces[workspaceId]
    }
}



export default withRouter(connect( mapStateToProps, {editDocument} )(RepositoryMenu));

const Provider = styled.div`
    background-color: #363b49;
    padding: 1rem 2rem;
    border-radius: 0.4rem;
    font-weight: 500;
    font-size: 1.7rem;
    display: inline-flex;
    align-items: center;
    margin-bottom: 4rem;
    &:hover {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    cursor: pointer;
`

const RepositoryButton = styled.div`
    /*background-color: #f4f7fa;*/
    /*color: ${chroma("#5B75E6").alpha(0.9)};*/
   
   
    border-radius: 0.3rem;
    font-size: 1.5rem;
    /*padding: 0.5rem 1rem;*/
    margin-right: 1.35rem;
    display: inline-flex;
    align-items: center;
    margin-bottom: 2rem;
  /*  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);*/
    font-weight: 600;
    cursor: pointer;
`

const RepoName = styled.div`
    font-weight: 500;
`

const NoneMessage = styled.div`
    font-size: 1.3rem;
    opacity: 0.5;
`


const ModalToolbarButton = styled.div`
    display: flex;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    padding: 0.8rem;
    font-size: 1.3rem;
    
    margin-right: 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    &:hover {
        background-color: #F4F4F6; 
        opacity: 1;
    }
    margin-left: ${props => props.marginLeft};
    opacity: ${props => props.opacity};
`

const MenuContainer = styled.div`
`


const DropButton = styled.div`
    width: 2.5rem;
    height: 2.5rem;
    margin-left: 1rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content:  center;
    &:hover {
        background-color: white;
    }
`


const Container = styled.div`
    width: 24rem;
    display: flex;
    flex-direction: column;
    color: #172A4E;
    box-shadow: 0 2px 2px 2px rgba(60,64,67,.15);
    position: absolute;
    font-size: 1.4rem;
    margin-top: -1rem;
    z-index: 2;
    background-color: white;
    border-radius: 0.2rem;
    margin-top: ${props => props.marginTop};
`

const SearchbarContainer = styled.div`
    height: 5.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom:  1px solid #E0E4E7;
`

const SearchbarWrapper = styled.div`
    width: 22rem;
    height: 3.5rem;
    border: 1px solid  #E0E4E7;
    background-color: ${props => props.backgroundColor};
    border: ${props => props.border};
    border-radius: 0.4rem;
    padding: 1.5rem;
    align-items: center;
    display: flex;
`


const Searchbar = styled.input`
    width: 18rem;
    margin-left: 0.9rem;
    &::placeholder {
        color: #172A4E;
        opacity: 0.4;
    }
    &:focus {
        background-color: white;
    }
    background-color: #F7F9FB;
    border: none;
    outline: none;
    font-size: 1.4rem;
    color: #172A4E;
    
`

const HeaderContainer = styled.div`
    height: 3.5rem;
    display: flex;
    align-items: center;
    font-size: 1.3rem;
    padding: 1rem;
    color: #172A4E;
    font-weight: 500;
    border-bottom: 1px solid #E0E4E7;
`

const ListHeader = styled.div`
    height: 3rem;
  
    padding: 1.5rem;
    align-items: center;
    display: flex;
    font-size: 1.4rem;
    opacity: 0.8;

`

const ListContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 1rem 0rem;
`

const ListItem = styled.div`
    height: 3.5rem;
    border-radius: 0.3rem;
    margin-bottom: 0rem
    color: #172A4E;
    padding: 1rem;
    display: flex;
    align-items: center;
    
    background-color: white;
    /*border: 1px solid #E0E4E7;*/
    &:hover {
        background-color: #F4F4F6;
    }
    font-weight: 500;
   
    cursor: pointer;
    color: ${props => props.color};
    background-color: ${props => props.backgroundColor};
    border-bottom: ${props => props.border};
    box-shadow: ${props => props.shadow};
`

const ListCreate = styled.div`
    height: 3.5rem;
    border-radius: 0.4rem;
    margin-bottom: 0.7rem;
    background-color: #F7F9FB;
 
    color: #172A4E;
    padding: 1rem;
    display: flex;
    align-items: center;
    cursor: pointer;
    box-shadow: ${props => props.shadow};
    border-bottom: ${props => props.border};
`
