import React from 'react';

//styles 
import styled from "styled-components";

//redux
import { connect } from 'react-redux';

//react-router
import { Link, withRouter } from 'react-router-dom';
import history from '../../../history';

//icons
import { RiSettings5Line, RiCodeSLine, RiStackLine, RiFileTextLine, RiPencilLine, RiNotification2Line} from 'react-icons/ri'
import { BiBell, BiGridAlt } from 'react-icons/bi';
import { CgBell, CgSearch } from 'react-icons/cg';

//components
import CreateButton from './CreateButton';

class SideNavbar extends React.Component {

    renderDashboardLink = () => {
        let { workspaceId } = this.props.match.params;
        return `/workspaces/${workspaceId}/dashboard`;
    }

    renderInfobankLink = () => {
        let { workspaceId } = this.props.match.params
        return `/workspaces/${workspaceId}/infobank`;
    }

    renderCodebaseLink = () => {
        const { match, workspace, rootReference } = this.props;
        const { repositories } = workspace;
        const { workspaceId } = match.params;

        const repositoryId = repositories[0]._id;
        const referenceId = rootReference._id;
        
        return `/workspaces/${workspaceId}/repository/${repositoryId}/dir/${referenceId}`;
    }

    renderKnowledgeLink = () => {
        const { rootDocument: { children }, match } = this.props;
        const { workspaceId } = match.params;

        const childId = children.length > 0 ? children[0] : "";
        return `/workspaces/${workspaceId}/document/${childId}`;
    }

    renderTopSection = () => {
        return (
            <Section>
                <NavbarIcon
                    active = {history.location.pathname.split("/")[3] === "dashboard"}
                    to = {this.renderDashboardLink()}
                >
                    <BiGridAlt/>
                </NavbarIcon>
                <NavbarIcon
                    active = {history.location.pathname.split("/")[3] === "document"}
                    to = {this.renderKnowledgeLink()}
                >
                    <RiFileTextLine/>
                </NavbarIcon>  
                <NavbarIcon
                    active = {history.location.pathname.split("/")[3] === "repository"}
                    to = {this.renderCodebaseLink()}
                >
                    <RiCodeSLine/>
                </NavbarIcon>  
                <NavbarIcon
                     active = {history.location.pathname.split("/")[3] === "infobank"}
                     to = {this.renderInfobankLink()}
                >
                    <RiStackLine/>
                </NavbarIcon>
                <NavbarIcon>
                    <RiSettings5Line/>
                </NavbarIcon>  
            </Section>  
        );
    }

    renderBottomSection = () => {
        return (
            <Section marginTop = {'auto'} marginBottom = {'5rem'}>
                <IconBorder>
                    <CgSearch/>
                </IconBorder>
                <IconBorder>
                    <BiBell/>
                </IconBorder>
            </Section>
        )
    }

    render(){
        return (
            <SideNavbarContainer>
                <WorkspaceIcon>P</WorkspaceIcon>
                {this.renderTopSection()}
                {this.renderBottomSection()}
                <CreateButton/>
            </SideNavbarContainer>
        )
    }
}


const mapStateToProps = (state, ownProps) => {
    let {workspaceId} = ownProps.match.params;
    let {documents, workspaces, references} = state;
    
    const rootDocument = Object.values(documents).filter(document => document.root)[0];
    const rootReference = Object.values(references).filter(reference => reference.path === "")[0];

    return {
        rootReference,
        rootDocument,
        workspace: workspaces[workspaceId],
    }
}

export default withRouter(connect(mapStateToProps, { })(SideNavbar));

//Styled Components
const IconBorder = styled.div`
    height: 4.5rem;
    width: 4.5rem;

    font-size: 2.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    &:hover {
        background-color: #3b404f;
    }
    cursor: pointer;
`

const SideNavbarContainer = styled.div`
    /*border-top: 2px solid #252832;*/
    background-color:#272a35;
    display: flex;
    flex-direction: column;
    color: white;
    min-width: 6rem;
    max-width: 6rem;
    overflow-y: scroll;
    height: 100vh;
    align-items: center;
    padding-top: 2.5rem;
    /*
    border-radius: 1.7rem;
    border-top-left-radius: 0rem;
    border-bottom-left-radius: 0rem;
    */
`

const Section = styled.div`
    margin-top: ${props => props.marginTop};
    margin-bottom: ${props => props.marginBottom};
`

const NavbarIcon = styled(Link)`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 3.2rem;
    width: 3.2rem;
    font-size: 1.6rem;
    font-weight: 500;
    background-color:${props => props.active ? '#464c5d' : '#3b404f'};
    border-radius: 0.3rem;
    cursor: pointer;
    margin-bottom: 1.3rem;

    &:hover {
        border: 1px solid #5B75E6;
        background-color:#464c5d;
    }
    transition: background-color 0.1s ease-in;
    text-decoration: none;
    border: ${props => props.active ?  '1px solid #5B75E6': 'none'};
    color: white;
`

const NavbarIcon2 = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 5.5rem;
    width: 100%;
    font-size: 2.1rem;
    font-weight: 500;
    /*background-color:${props => props.active ? '#464c5d' : '#3b404f'};*/
    cursor: pointer;
    &:hover {
        background-color:#464c5d;
    }
    margin-top: auto;
    transition: background-color 0.1s ease-in;
    border-top: 1px solid #19e5be;
    color: white;
`

const WorkspaceDetail = styled.div`
    display: flex;
    align-items: center;
    margin-top: 1rem;
    margin-bottom: 2rem;
    &:hover {
        background-color: #414858;
    }
    padding:1rem 2rem;
    cursor: pointer;
`


const WorkspaceIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 3.2rem;
    width: 3.2rem;
    background-color: #5B75E6;
    border-radius: 0.3rem;
    font-size: 1.3rem;
    margin-bottom: 1.3rem;
`