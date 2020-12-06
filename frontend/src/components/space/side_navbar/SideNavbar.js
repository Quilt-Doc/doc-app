import React from 'react';

//styles 
import styled from "styled-components";

//redux
import { connect } from 'react-redux';
import { PRIMARY_COLOR, SECONDARY_COLOR, TERTIARY_COLOR, TEXT_COLOR } from '../../../styles/colors';

//react-router
import { Link, withRouter } from 'react-router-dom';
import history from '../../../history';

//icons
import { RiSettings5Line, RiCodeSLine, RiStackLine, RiFileTextLine, RiPencilLine, RiNotification2Line, RiNotification3Line} from 'react-icons/ri'
import { BiBell, BiGridAlt, BiLayer } from 'react-icons/bi';
import { CgBell, CgSearch } from 'react-icons/cg';
import final_logo from '../../../images/final_logo_2.svg';

//components
import CreateButton from './CreateButton';
import { IoMdBook } from 'react-icons/io';
import { AiOutlineCodeSandbox } from 'react-icons/ai';
import { TiBell } from 'react-icons/ti';
import { VscBell } from 'react-icons/vsc';
import NotificationWrapper from './notifications/NotificationsWrapper';

class SideNavbar extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            notificationsOpen: false
        }
    }

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
        return `/workspaces/${workspaceId}/document`;
    }

    renderSettingsLink = () => {
        const { match } = this.props;
        const { workspaceId } = match.params;
        return `/workspaces/${workspaceId}/settings`;
    }

    renderTopSection = () => {
        return (
            <>
                <CreateButton/>
                <Section>
                    <NavbarIcon
                        active = {history.location.pathname.split("/")[3] === "dashboard"}
                        to = {this.renderDashboardLink()}
                    >
                        <BiGridAlt/>
                    </NavbarIcon>
                    <NavbarIcon
                        fontSize = {"2rem"}
                        active = {history.location.pathname.split("/")[3] === "document"}
                        to = {this.renderKnowledgeLink()}
                    >
                        <IoMdBook/>
                    </NavbarIcon>  
                    <NavbarIcon
                        fontSize = {"2.1rem"}
                        active = {history.location.pathname.split("/")[3] === "repository"}
                        to = {this.renderCodebaseLink()}
                    >
                        <AiOutlineCodeSandbox/>
                    </NavbarIcon>  
                    <NavbarIcon
                        fontSize = {"1.9rem"}
                        active = {history.location.pathname.split("/")[3] === "infobank"}
                        to = {this.renderInfobankLink()}
                    >
                        <BiLayer/>
                    </NavbarIcon>
                </Section>  
            </>
        );
    }

    renderBottomSection = () => {
        const { setSearch, setNotifications, pendingNotifications } = this.props;
        const { notificationsOpen } = this.state;

        return (
            <Section marginTop = {'auto'} marginBottom = {'5rem'}>
                <NavbarIcon
                        active = {history.location.pathname.split("/")[3] === "settings"}
                        to = {this.renderSettingsLink()}
                >
                    <RiSettings5Line/>
                </NavbarIcon>  
                <NavbarIcon
                    onClick = {() => {this.setState({notificationsOpen: !notificationsOpen})}} 
                    id = {"notificationsBorder"} 
                    active = {notificationsOpen}
                >   
                    {(pendingNotifications !== 0) && <PendingAlert>{pendingNotifications}</PendingAlert>}
                    <BiBell/>
                <NotificationWrapper
                    closeBubble = {() => this.setState({notificationsOpen: false})}
                    notificationsOpen = {notificationsOpen}
                />
                </NavbarIcon>
                <NavbarIcon  onClick = {() => setSearch(true)}>
                    <CgSearch/>
                </NavbarIcon>
              
            </Section>
        )
    }

    render(){
        const {workspace: {name}} = this.props;
        return (
            <SideNavbarContainer id = "sidenavbar">
                {/*
                <CreateButton/>
                <WorkspaceIcon to = {"/workspaces"}>{name[0]}</WorkspaceIcon>
                */}
                

                <IconsContainer>
                    <LogoContainer to = {"/workspaces"}>
                        <LogoIcon src = {final_logo}/>
                    </LogoContainer>
                    {this.renderTopSection()}
                    {this.renderBottomSection()}
                </IconsContainer>
                
                
               
            </SideNavbarContainer>
        )
    }
}


const mapStateToProps = (state, ownProps) => {
    let {workspaceId} = ownProps.match.params;
    let {documents, workspaces, references, ui } = state;
    let { pendingNotifications } = ui;

    const rootDocument = Object.values(documents).filter(document => document.root)[0];
    const rootReference = Object.values(references).filter(reference => reference.path === "")[0];

    return {
        rootReference,
        rootDocument,
        workspace: workspaces[workspaceId],
        pendingNotifications
    }
}

export default withRouter(connect(mapStateToProps, { })(SideNavbar));

const Divider2 = styled.div`
    background-color: #2b3345;
    height: 0.2rem;
    border-radius: 0.4rem;
    width: 4rem;
    margin-left: 2rem;
    margin-bottom: 2rem;
`

const LogoContainer = styled(Link)`
    width: 6rem;
    margin-left: 1rem;
    border-radius: 50%;
    display: flex;
    /*margin-bottom: 1.5rem;*/
    align-items: center;
    justify-content: center;
    height: 6rem;
    margin-top: 0.5rem;
    margin-bottom: 1.5rem;
    text-decoration: none;
    
    &:hover {
        background-color: #2b3345;
    }
`

const LogoIcon = styled.img`
    width: 4.5rem;
    
    margin-left: -2.6rem;
    /*
    margin-left: 0.9rem;
    margin-bottom: 1.5rem;
    */
`

const Divider = styled.div`
    height: 1px;
    width: 5rem;
    margin-left: 2rem;
    background-color: white;
`

const IconsContainer = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 1.5rem;
`

//Styled Components
const IconBorder = styled.div`
    height: 4.5rem;
    width: 4.5rem;
    margin-bottom: ${props => props.marginBottom ? props.marginBottom : "2.3rem"};
    font-size: 2.15rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    &:hover {
        background-color: #3b404f;
    }
    background-color: ${props => props.active ? '#3b404f' : ''};
    cursor: pointer;
`

const SideNavbarContainer = styled.div`
    /*border-top: 2px solid #252832;*/
    /*
    background-color: #272a35 /#2C2E33 ${PRIMARY_COLOR}; #F1F2F4
    */
    display: flex;
    flex-direction: column;

    color: white;
    min-width: 6.5rem;
    max-width: 6.5rem;
    overflow-y: scroll;
    height: 100vh;
    align-items: center;
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
    height: 4.5rem;
    width: 100%;
    
    font-size: ${props => props.fontSize ? props.fontSize : "1.9rem"};
    font-weight: 500;
    /*
    background-color:#3b404f;
    */
    cursor: pointer;
    margin-bottom: 1.5rem;

    
    &:hover {
        border-left: ${props => props.active ? `2.5px solid ${SECONDARY_COLOR}` : '2.5px solid white'};
    }
    

    transition: all 0.15s ease-in;
    text-decoration: none;
    
    /*border: ${props => props.active ?  'px solid #f27448': 'none'};*/

    border-left: ${props => props.active ? `2.5px solid ${SECONDARY_COLOR}` : `2.5px solid transparent`};
    border-right: 2.5px solid transparent;
    color: ${props => props.active ? SECONDARY_COLOR : TERTIARY_COLOR};
`


const NavbarIcon2 = styled(Link)`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 5rem;
    width: 8rem;
    font-size: 2.3rem;
    font-weight: 500;
    /*
    background-color:#3b404f;
    */
    cursor: pointer;
    margin-bottom: 2.3rem;
    /*
    &:hover {
        border: 1px solid #6762df;
    }
    */

    transition: background-color 0.1s ease-in;
    text-decoration: none;
    
    /*border: ${props => props.active ?  '1px solid #f27448': 'none'};*/

    border-left: ${props => props.active ? `3px solid ${SECONDARY_COLOR}` : `3px solid transparent`};
    border-right: 3px solid transparent;
    color: ${props => props.active ? SECONDARY_COLOR : TERTIARY_COLOR};
`

const WorkspaceIcon = styled(Link)`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 3.2rem;
    width: 3.2rem;
    background-color:#6762df;
    border-radius: 0.3rem;
    font-size: 1.3rem;
    margin-bottom: 1.3rem;
    border: none;
    color: white;
    text-decoration: none;
    &:hover {
        background-color: #7a8feb;
    }
    transition: background-color 0.1s ease-in;
    cursor: pointer;
`

const PendingAlert = styled.div`
    position: absolute;
    margin-left: 1.5rem;
    margin-top: -2.2rem;
    background-color: #ff4757;
    color: white;
    min-width: 1.8rem;
    min-height: 1.8rem;
    font-size: 1.2rem;
    font-weight: 500;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
`


const UserButton = styled.div`
    border: 1px solid #6762df;
    height: 4rem;
    width: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.7rem;
    cursor: pointer;
    font-size: 1.6rem;
    color: ${TEXT_COLOR};
`