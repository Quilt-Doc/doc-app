import React from 'react';

//styles 
import styled from "styled-components";

//components
import EditorWrapper from './text_editor/EditorWrapper';
import Infobank from './infobank/Infobank';
import SideNavbar from './side_navbar/SideNavbar';
import MainNavbar from './main_navbar/MainNavbar';
import Dashboard from './dashboard/Dashboard';
import ReferenceEditor from './codebase/reference_editor/ReferenceEditor';
import DirectoryNavigator from './codebase/directory_navigator/DirectoryNavigator';
import DocumentModal from './modals/DocumentModal';
import DocumentCreationModal from './modals/DocumentCreationModal';
import { CSSTransition } from 'react-transition-group';
                                                                                        
//react-router
import { Router, Route } from 'react-router-dom';
import history from '../../history';

//react-redux
import { connect } from 'react-redux';

//actions
import { retrieveWorkspaces } from '../../actions/Workspace_Actions';

// component that holds the features of an individual workspace
class Space extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            // checks whether the data needed for the component is loaded
            loaded: false
        }
    }

    // loads all the workspaces so that belong to the user
    async componentDidMount(){
        const { user, retrieveWorkspaces } = this.props;
        if (user) {
            await retrieveWorkspaces({memberUserIds: [user._id]});
            this.setState({loaded: true})
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
                        <MainNavbar/>
                        <Container>
                            <SideNavbar/>
                            <RightView id = {"rightView"} >
                                <Router history = {history}>
                                    <Route path = "/workspaces/:workspaceId/repository/:repositoryId/dir/:referenceId?" component = { DirectoryNavigator } />
                                    <Route path = "/workspaces/:workspaceId/repository/:repositoryId/code/:referenceId" component = { ReferenceEditor } />
                                    <Route path = "/workspaces/:workspaceId/document/:documentId" component = { EditorWrapper } />
                                    <Route path = "/workspaces/:workspaceId/dashboard" component = { Dashboard } />
                                    <Route path = "/workspaces/:workspaceId/infobank" component = { Infobank } />
                                </Router>
                            </RightView>
                        </Container>
                    </div>
                </CSSTransition>
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

const mapStateToProps = (state) => {
    return {
        user: state.auth.user
    }
}


export default connect(mapStateToProps, { retrieveWorkspaces })(Space);


// Styled Components
const Container = styled.div`
    display: flex;
    flex: 1;
`

const RightView = styled.div`
    /*box-shadow: 0 2px 4px rgba(0,0,0,0.1);*/
    width: 100%;
    overflow-y: scroll;
    height: calc(100vh - 5.5rem);
    z-index: 1;
    background-color: #f7f9fb;
`