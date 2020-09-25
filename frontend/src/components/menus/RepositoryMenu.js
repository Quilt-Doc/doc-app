import React from 'react';

// react-redux
import { connect } from 'react-redux';

//history
import history from '../../history';

//router
import {withRouter, Link} from 'react-router-dom';

//chroma
import chroma from 'chroma-js';

//components
import { CSSTransition } from 'react-transition-group';

//styles
import styled from "styled-components";

//icons
import {RiGitRepositoryLine} from 'react-icons/ri'
import {AiOutlineCaretDown} from 'react-icons/ri'
import { AiFillCaretDown } from 'react-icons/ai';
import { FiChevronDown } from 'react-icons/fi';
import { VscRepo } from 'react-icons/vsc';

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
    handleClickOutside = (event) => {
        if (this.node && !this.node.contains(event.target)) {
            this.closeMenu()
        }
    }

    renderListItems(){
        let {workspaceId} = this.props.match.params
        return this.props.repositories.map((repo, i) => {
            const location = `/workspaces/${workspaceId}/repository/${repo._id}/dir`;
            return(
                <ListItem 
                    onClick = {() => {history.push(location); this.closeMenu()}} 
                >
                    <RiGitRepositoryLine style = {{marginRight: "0.7rem"}}/>
                    {repo.fullName}
                </ListItem>
            )
        })
    }

    openMenu(e) {
        e.stopPropagation(); 
        e.preventDefault(); 
        if (!this.state.open) {
            document.addEventListener('mousedown', this.handleClickOutside, false);
            this.setState({ open: true })
        }
        
    }

    closeMenu() {
        document.removeEventListener('mousedown', this.handleClickOutside, false);
        this.setState({ open: false })
    }



    render() {
        let {repositoryId, workspaceId} = this.props.match.params;
        return(
            <MenuContainer >
                  <SwitchButton active = {this.state.open} onClick = {(e) => this.openMenu(e)}>
                    <VscRepo style = {{
                            marginRight: "0.5rem",
                            fontSize: "1.7rem",
                            marginTop: "0.1rem"
                        }}/>
                    {this.props.repoName}
                    <FiChevronDown 
                        style = {{
                            marginLeft: "0.3rem",
                            marginTop: "0.2rem",
                            fontSize: "1.3rem"
                        }}
                    />
                </SwitchButton>
                <CSSTransition
                    in={this.state.open }
                    enter = {true}
                    exit = {true}
                    unmountOnExit = {true}
                    timeout={150}
                    classNames="dropmenu"
                >
                    <Container  ref = {node => this.node = node}>
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
    return {
        repositories:  state.workspaces[workspaceId].repositories,
        workspace: state.workspaces[workspaceId]
    }
}



export default withRouter(connect( mapStateToProps )(RepositoryMenu));

const Title = styled.div`
    font-size: 1.3rem;
    margin-right: 0.3rem;
    font-weight: 500;
`



const SwitchButton = styled.div`
    display: flex;
    align-items: center;
    font-size: 1.2rem;
    padding: 0rem 1rem;
    border-radius: 0.4rem;
    height: 3rem;
    font-weight: 500;
    opacity: ${props => props.active ? 1 : 0.9};
    background-color: ${props => props.active ? chroma('#5B75E6').alpha(0.2) : ""};
    &:hover {
        background-color: ${props => props.active ?  chroma('#5B75E6').alpha(0.2) : "#F4F4F6" };
    }
    cursor: pointer;
    border: 1px solid ${props => props.active ? chroma('#5B75E6').alpha(0.2) : "#E0E4e7"}; 
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

const MenuContainer = styled.div`
`


const DropButton = styled.div`
    width: 1.5rem;
    height: 1.5rem;
    margin-left: 0.6rem;
    margin-top: 0.4rem;
    border-radius: 0.3rem;
    display: flex;
    align-items: center;
    justify-content:  center;
    &:hover {
        background-color: white;
    }
    font-size: 1rem;
`

const RepositoryButton = styled(Link)`
    text-decoration: none;
    background-color:#414758; /* ${chroma("#5B75E6").alpha(0.15)}; */
    color: white;/*#5B75E6;*/
    font-weight: 500;
    padding: 0.8rem 0.9rem;
    display: inline-flex;
    border-radius: 0.3rem;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;*/
    align-items: center;
    cursor: pointer;
    &: hover {
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    }
    height: 3.4rem;
    letter-spacing: 1;
`

const Container = styled.div`
    width: 24rem;
    display: flex;
    flex-direction: column;
    color: #172A4E;
    box-shadow: 0 2px 2px 2px rgba(60,64,67,.15);
    position: absolute;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    margin-top: 2rem;
    z-index: 2;
    background-color: white;
    margin-top: 0.5rem;
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
    padding: 1rem;
    padding-top: 0rem;
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
