import React from 'react';

// react-redux
import { connect } from 'react-redux';

//history
import history from '../../../history';

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
            console.log("HERE")
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
                    <ion-icon 
                        style = {{fontSize: "1.5rem", marginRight: "0.7rem"}} 
                        name="git-network-outline"></ion-icon>
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
                <RepositoryButton to = {`/workspaces/${workspaceId}/repository/${repositoryId}/dir`}>
                    <RiGitRepositoryLine style = {{ marginRight: "0.7rem", fontSize: "1.5rem"}}/>
                    {this.props.name /*.fullName.split("/")[1]*/}
                    
                    <DropButton onClick = {(e) => 
                        {this.openMenu(e)}
                    }>
                        <AiFillCaretDown/>
                    </DropButton>
                </RepositoryButton>
                {this.state.open && 
                    <CSSTransition
                    in={true}
                    appear = {true}
                    timeout={100}
                    classNames="menu"
                    >
                    <Container  ref = {node => this.node = node}>
                        <HeaderContainer>Select a repository</HeaderContainer>
                        <ListContainer>
                            {this.renderListItems()}
                        </ListContainer>
                    </Container>
                    </CSSTransition>
                }
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
    box-shadow: 0 2px 6px 2px rgba(60,64,67,.15);
    position: absolute;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    margin-top: 2rem;
    z-index: 2;
    background-color: white;
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
