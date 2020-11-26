import React from 'react';

// react-redux
import { connect } from 'react-redux';


//router
import {withRouter, Link} from 'react-router-dom';

//chroma
import chroma from 'chroma-js';

//actions
import {editDocument} from '../../actions/Document_Actions';

//components
import { CSSTransition } from 'react-transition-group';

//icons
import {RiGitRepositoryLine} from 'react-icons/ri'
import {FiFileText, FiChevronDown} from 'react-icons/fi'
import {VscRepo} from 'react-icons/vsc';

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
            let { workspaceId } = this.props.match.params;
            this.props.editDocument({workspaceId, documentId: this.props.document._id, repositoryId: repo._id, referenceIds: []}); 
            this.closeMenu()
        }
    }
    

    renderListItems(){
        const { emptyReferences, repositories } = this.props;
        return repositories.map((repo, i) => {
            return(
                <ListItem 
                    onClick = {() => {
                        if (emptyReferences) emptyReferences();
                        this.selectRepository(repo);
                    }} 
                >
                    <VscRepo style = {
                        {fontSize: "1.5rem", marginRight: "0.7rem"}
                        }
                    />
                     <Title>{repo.fullName}</Title>
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


    flip = () => {
        if (this.props.form && this.addButton){
            let rect = this.addButton.getBoundingClientRect()
            if (rect.top + 350 > window.innerHeight){
				return window.innerHeight - rect.top + 10;
            }
        }
    }

    render() {
        let repoName = this.props.form ? this.props.formRepository ? this.props.formRepository.fullName.split("/")[1] : "Select Repository" :
            this.props.document.repository ? this.renderFullName() : "Select Repository"
        const { darkBorder } = this.props;
        let borderColor = darkBorder ? "#172A4E" : '#E0E4E7';
        return(
            <MenuContainer >
                 <MenuButton borderColor = {borderColor}  active = {this.state.open} onClick = {(e) => this.openMenu(e)}>
                        <IconBorder>    
                            <VscRepo/>
                        </IconBorder>
                    
                        <LimitedTitle>{repoName}</LimitedTitle>
                        <FiChevronDown 
                                style = {{
                                    marginLeft: "0.5rem",
                                    marginTop: "0.3rem",
                                    fontSize: "1.45rem"
                                }}
                            />
                 </MenuButton>
                <CSSTransition
                    in={this.state.open}
                    unmountOnExit
                    enter = {true}
                    exit = {true}
                    timeout = {150}
                    classNames = "dropmenu"
                >
                    <Container  flip = {this.flip()}   ref = {node => this.node = node}>
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
    let {workspaceId} = ownProps.match.params
    let repositories =  state.workspaces[workspaceId] ? state.workspaces[workspaceId].repositories : [];
    return {
        repositories,
        workspace: state.workspaces[workspaceId]
    }
}



export default withRouter(connect( mapStateToProps, {editDocument} )(RepositoryMenu));

const LimitedTitle = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    max-width: 22rem;
`

const IconBorder = styled.div`
    font-size: 1.8rem;
    margin-right: 0.7rem;
    width: 2rem;
    display: flex;
    align-items: center;
    margin-top: 0.1rem;
`

const MenuButton = styled.div`
    display: flex;
    align-items: center;
    font-size: 1.4rem;
    padding: 0rem 1.5rem;
    border-radius: 0.4rem;
    height: 3.5rem;
    font-weight: 500;
    display: inline-flex;
    background-color: ${props => props.active ? chroma('#6762df').alpha(0.2) : ""};
    &:hover {
        background-color: ${props => props.active ?  chroma('#6762df').alpha(0.2) : "#F4F4F6" };
    }
    cursor: pointer;
    border: 1px solid ${props => props.active ? chroma('#6762df').alpha(0.2) : props.borderColor}; 
`

const Title = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-weight: 500;
    width: 18rem;
    font-size: 1.3rem;
`

const PageIcon = styled.div`
    margin-right: 1.5rem;
    display: flex;
    align-items: center;
    font-size: 1.5rem;
   
   /*color: white;*/
    /*background-color: #4c5367;*/
   /* opacity: 0.8;*/
   padding: 0.5rem 1rem;
    &:hover {
        background-color: #F4F4F6;
        
    }
    cursor: pointer;
    border-radius: 0.3rem;
    background-color: ${props => props.active ? "#F4F4F6" : ""};
`


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
    /*color: ${chroma("#6762df").alpha(0.9)};*/
   
   
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
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px, rgba(9, 30, 66, 0.25) 0px 4px 8px -2px;
    position: absolute;
    font-size: 1.4rem;
    margin-top: 0.5rem;
    z-index: 2;
    background-color: white;
    border-radius: 0.2rem;
    bottom: ${props => `${props.flip}px`};
    margin-top: ${props => props.flip ? "" : '0.5rem'};
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
