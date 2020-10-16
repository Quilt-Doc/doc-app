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

//actions
import { retrieveReferences } from '../../actions/Reference_Actions';

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

    changeRepository = async (repo) => {
        const { match, retrieveReferences } = this.props;
        const { workspaceId } = match.params;
        let references = await retrieveReferences({ workspaceId, repositoryId: repo._id, path: ""}, true);

        const location = `/workspaces/${workspaceId}/repository/${repo._id}/dir/${references[0]._id}`;
        history.push(location); 
        this.closeMenu();
    }

    renderListItems(){
        let {workspaceId} = this.props.match.params
        return this.props.repositories.map((repo, i) => {
            return(
                <ListItem 
                    onClick = {() => {this.changeRepository(repo)}} 
                >
                    <VscRepo style = {{marginRight: "0.7rem"}}/>
                    <Title>{repo.fullName}</Title>
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
        return(
            <MenuContainer >
                <Header  active = {this.state.open} onClick = {(e) => this.openMenu(e)}>
                    <LimitedTitle>{this.props.repoName}</LimitedTitle>
                    <FiChevronDown 
                        style = {{
                            marginLeft: "3.5rem",
                            marginRight: "0.5rem",
                            marginTop: "0.3rem",
                            fontSize: "1.45rem"
                        }}
                    />
                </Header>   
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



export default withRouter(connect( mapStateToProps, {retrieveReferences} )(RepositoryMenu));

const LimitedTitle = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    max-width: 25rem;
`

const MenuContainer = styled.div`
`

const Header = styled.div`
    font-size: 1.1rem;
    font-weight: 400;
    display: inline-flex;
    border-bottom: 2px solid #172A4E;
    height: 2.8rem;
    display: flex;
    align-items: center;
    &:hover {
        background-color: ${props => props.active ? chroma("#6762df").alpha(0.2) : "#dae3ec;"};
    }
    background-color: ${props => props.active ? chroma("#6762df").alpha(0.2)  : ""};
    cursor: pointer;
    border-top-left-radius: 0.2rem;
    border-top-right-radius: 0.2rem;
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

const ListContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 1rem;
`

const ListItem = styled.div`
    height: 3.5rem;
    border-radius: 0.3rem;
    margin-bottom: 0rem
    color: #172A4E;
    padding: 1rem;
    display: flex;
    align-items: center;
    font-weight: 600;
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

const Title = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-weight: 500;
    width: 18rem;
    font-size: 1.25rem;
`