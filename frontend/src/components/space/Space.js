import React from 'react';

//styles 
import styled from "styled-components";
import { PRIMARY_COLOR, SECONDARY_COLOR, PRIMARY_LIGHT_COLOR, APP_LIGHT_PRIMARY_COLOR, TEXT_COLOR } from '../../styles/colors';
import { DARK_SHADOW_1, DARK_SHADOW_2 } from '../../styles/shadows';

//components
import EditorWrapper from './knowledge/text_editor/EditorWrapper';
import Infobank from './infobank/Infobank';
import TrelloTest from '../trello_test/TrelloTest';
import GoogleTest from '../google_test/GoogleTest';
import SideNavbar from './side_navbar/SideNavbar';
import DocumentNavbar from './side_navbar/DocumentNavbar';
import MainNavbar from './main_navbar/MainNavbar';
import Knowledge from './knowledge/Knowledge';
import Dashboard from './dashboard/Dashboard';
import ReferenceEditor from './codebase/reference_editor/ReferenceEditor';
import DirectoryNavigator from './codebase/directory_navigator/DirectoryNavigator';
import DocumentModal from './modals/DocumentModal';
import DocumentCreationModal from './modals/DocumentCreationModal';
import Search from './search/Search';
import TopNavbar from './top_navbar/TopNavbar';
import Settings from './settings/Settings';
import { CSSTransition } from 'react-transition-group';

//react-router
import { Router, Route } from 'react-router-dom';
import history from '../../history';

//react-redux
import { connect } from 'react-redux';

//actions
import { getWorkspace } from '../../actions/Workspace_Actions';
import { retrieveDocuments } from '../../actions/Document_Actions';
import { retrieveReferences } from '../../actions/Reference_Actions';
import { retrieveTags } from '../../actions/Tag_Actions';
import { getPendingCount } from '../../actions/Notification_Actions'
import TicketTest from '../trello_test/TicketTest';

// component that holds the features of an individual workspace
class Space extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            // checks whether the data needed for the component is loaded
            loaded: false, 
            search: false
        }
    }

    // loads the resources needed for the workspace
    async componentDidMount(){
        const { retrieveDocuments, retrieveTags, getWorkspace, getPendingCount, match, user } = this.props;
        const { workspaceId } = match.params;

        await Promise.all([
            // get the workspace from workspaceId
            getWorkspace(workspaceId),
            // get the tags of the workspace
            retrieveTags({workspaceId}),
            // retrieve the root document of the workspace and clear on root retrieval
            retrieveDocuments({workspaceId, root: true, minimal: true}, true),
            // retrieve number of visible notifications
            getPendingCount({workspaceId, userId: user._id})
        ])

        const { retrieveReferences, workspace } = this.props;
        const { repositories } = workspace;
        const repositoryId = repositories[0]._id;

        // retrieve the root reference of the workspace
        await retrieveReferences({ workspaceId, repositoryId, path: ""})
        
        this.setState({loaded: true})
    }

    componentDidUpdate = (prevProps) => {
        const { getPendingCount, match, user } = this.props;
        const { workspaceId } = match.params;

        if (prevProps.location.pathname !== this.props.location.pathname) {
            getPendingCount({workspaceId, userId: user._id})
        }
    }

    // checks whether a modal should be open by checking the url params 
    checkParam = (param) => {
        let { search } = history.location;
        let params = new URLSearchParams(search)
        let check = params.get(param);
        if ( check !== null && check !== undefined ){
            return true
        }
        return false
    }

    // renders the needed modal based on param on url
    renderModal = () => {
        if (this.checkParam('document')) return <DocumentModal/>;
        if (this.checkParam('create_document')) return <DocumentCreationModal/>;
    }
    
    renderSearch = () => {
        const { search } = this.state;
        return search ? <Search setSearch = {this.setSearch}/> : null;
    }

    setSearch = (search) => {
        this.setState({search});
    }

    // renders the content of the workspace (SideNavbar and feature in RightView)... depending on url form
    // we will show one of our features components
    renderBody = () => {
        
        return (
            <>
                <CSSTransition
                    in={true}
                    appear = {true}
                    timeout={500}
                    classNames="sidenav"
                >
                    <div>
                        <Container>
                            {/*<SideNavbar setSearch = {this.setSearch}/>*/}        
                                <SideNavbar setSearch = {this.setSearch}/>     
                                
                                <RightView id = {"rightView"} >
                                    <Router history = {history}>
                                        <Route path = "/workspaces/:workspaceId/ticket_test" component = { TicketTest } />
                                        <Route path = "/workspaces/:workspaceId/trello_test" component = { TrelloTest } />
                                        <Route path = "/workspaces/:workspaceId/google_test" component = { GoogleTest } />
                                        <Route path = "/workspaces/:workspaceId/dashboard" component = { Dashboard } />
                                        <Route path = "/workspaces/:workspaceId/repository/:repositoryId/dir/:referenceId" component = { DirectoryNavigator } />
                                        <Route path = "/workspaces/:workspaceId/repository/:repositoryId/code/:referenceId" component = { ReferenceEditor } />
                                        <Route path = "/workspaces/:workspaceId/document/:documentId?" component = { Knowledge } />
                                        <Route path = "/workspaces/:workspaceId/infobank" component = { Infobank } />
                                        <Route path = "/workspaces/:workspaceId/settings" component = { Settings } />
                                    </Router>
                                </RightView>
                        </Container>
                    </div>
                    </CSSTransition>
                {this.renderSearch()}
                {this.renderModal()}
            </>
        )
    }


    // renders the content body if loaded
    render() {
        const {loaded} = this.state;
        return loaded ? this.renderBody() : null
    }
}


const mapStateToProps = (state, ownProps) => {
    let { documents, workspaces, references, auth: { user } } = state;
    let { workspaceId } = ownProps.match.params;

    const workspace = workspaces[workspaceId];

    return {
        workspace: workspaces[workspaceId],
        user
    }
}


export default connect(mapStateToProps, { getWorkspace, retrieveDocuments, 
    retrieveReferences, retrieveTags, getPendingCount })(Space);


// Styled Components
const AppContainer = styled.div`
    border-top-left-radius: 1rem;
    background-color: ${APP_LIGHT_PRIMARY_COLOR};
    height: 100%;
    width: 100%;
    box-shadow: ${DARK_SHADOW_1};
    color: ${TEXT_COLOR};
    color: #172A4E;
`

const RightContainer = styled.div`
    width: 100%;
    color: white;

`

const Container = styled.div`
    display: flex;
    flex: 1;
    background-color: ${PRIMARY_COLOR};
    /*#171c25;*/
    
    /*#272a35;*/
`

const RightView = styled.div`
    width: 100%;
    overflow-y: scroll;
    /*height: calc(100vh - 5.5rem);*/
    z-index: 1;
    height: 100vh;
    background-color: ${APP_LIGHT_PRIMARY_COLOR};
    border-top-left-radius: 1.2rem;
`