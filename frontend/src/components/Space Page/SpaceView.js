import React from 'react';

//styles 
import styled from "styled-components";


//components
import TextEditorView from './Text Editor Page/TextEditorView';
//import RepositoryView from './Repository Page/RepositoryView';
import SideNavbar from './SideNavbar/SideNavbar';
import RequestView from './Request Page/RequestView';
import CodeView from './Code Editing Page/CodeView';
import DocumentModal from './Document Creation Page/DocumentModal';
import RequestModal from './Request Page/RequestModal';
import RepositoryCoverageView from './Repository Coverage Page/RepositoryCoverageView';
import { CSSTransition } from 'react-transition-group';

//react-router
import { Switch, Route } from 'react-router-dom';
import history from '../../history';

//react-redux
import { connect } from 'react-redux';

//actions
import { retrieveWorkspaces } from '../../actions/Workspace_Actions';
import { setCurrentRepository } from '../../actions/Repository_Actions';
import { updateRightViewScroll } from '../../actions/UI_Actions';
import DirectoryView from './Directory Navigation Page/DirectoryView';

//icons
import {FiFileText, FiGitPullRequest} from 'react-icons/fi'
import {RiScissors2Line,RiSettings5Line, RiCodeSLine, RiPencilLine, RiPieChart2Line} from 'react-icons/ri'

class SpaceView extends React.Component {
    constructor(props) {
        super(props);
        this.rightViewRef = React.createRef()
        this.state = {
            ready: false
        }
    }

    // SET KEY TO UNIQUE
    componentDidMount(){
        
        this.props.retrieveWorkspaces({memberUserIds: [this.props.user._id]}).then(() => {
            this.setState({ready: true})
        })
    }

    onScroll = () => {
        //this.props.updateRightViewScroll(this.rightViewRef.current.scrollTop)
    }

    checkDoc = () => {
        let search = history.location.search
        let params = new URLSearchParams(search)
        let documentId = params.get('document') 
        if (documentId !== null && documentId !== undefined){
            return true
        }
        return false
    }   

    checkRequest = () => {
        let search = history.location.search
        let params = new URLSearchParams(search)
        let requestId = params.get('request') 
        if (requestId !== null && requestId !== undefined){
            return true
        }
        return false
    }

    render() {
        if (this.state.ready) {
            return (
                <>
                <CSSTransition
                    in={true}
                    appear = {true}
                    timeout={500}
                    classNames="sidenav"
                >
                    <Container>
                        <SideNavbar/>
                        
                        <RightView id = {"rightView"} ref = {this.rightViewRef} onScroll = {this.onScroll}>
                            <Switch history = {history}>
                                <Route path = "/workspaces/:workspaceId/repository/:repositoryId/dir/:referenceId?" component = { DirectoryView } />
                                <Route path = "/workspaces/:workspaceId/repository/:repositoryId/code/:referenceId" component = { CodeView } />
                                <Route path = "/workspaces/:workspaceId/document/:documentId" component = { TextEditorView } />
                                <Route path = "/workspaces/:workspaceId/request" component = { RequestView } />
                                <Route path = "/workspaces/:workspaceId/coverage" component = { RepositoryCoverageView } />
                            </Switch>
                        </RightView>
                       
                    </Container>
                    </CSSTransition>
                    {this.checkDoc() ? <DocumentModal/> : this.checkRequest() ? <RequestModal/> : <></>}
                </>
            );
        } return null
    }
}

/*<Route path = "/workspaces/:workspaceId/coverage" component = {} />*/

const mapStateToProps = (state) => {
    return {
        workspaces: Object.values(state.workspaces),
        user: state.auth.user
    }
}



export default connect(mapStateToProps, { updateRightViewScroll, retrieveWorkspaces })(SpaceView);

/*  
<ModalBackground display = {this.state.modalDisplay} onClick = {() => this.setState({'modalDisplay': 'none'})}>
                    <ModalContent onClick = {(e) => {e.stopPropagation()}}>
                        <Document>
                           
                        </Document>
                    </ModalContent>
                </ModalBackground>
*/

//Styled Components

const NavbarIcon2 = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 5rem;
    width: 5rem;
    font-size: 1.8rem;
    margin-bottom: 2.5rem;
    background-color: #323B5D;
    border-radius: 0.3rem;
    cursor: pointer;
    border-radius: 50%;
    &:hover {
        background-color: ${props => props.emph };
    }
    border: 1px solid #5B75E6;
   
    position: relative;
`

const NavbarIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 4rem;
    width: 4rem;
    font-size: 1.8rem;
    margin-bottom: 1rem;
    background-color: #323B5D;
    border-radius: 0.3rem;
    cursor: pointer;
    /*
    &:hover {
        background-color: ${props => props.emph };
    }*/
    border-bottom: ${props => props.active ? '2px solid #5B75E6' : "" };

`


const LeftMostNav = styled.div`
    width: 27rem;
    background-color: #272F49;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 2rem;
    color: white;
    border-right: 4.5px solid #5B75E6;
`

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


// Modal
/* The Modal (background) */
const ModalBackground = styled.div`
    display: ${props => props.display};
    position: fixed; /* Stay in place */
    z-index: 20; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: hidden; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
`
  
  /* Modal Content/Box */
const ModalContent = styled.div`
    background-color: #fefefe;
    margin: 4.5% auto; /* 15% from the top and centered */
    padding: 20px;
    border: 1px solid #888;
    width: 73vw; /* Could be more or less, depending on screen size */
    height: 85vh;
    border-radius: 5px;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    max-width: 96rem;
    overflow-y: scroll;
`
//background: rgba(45, 170, 219, 0.3); on highlight
const Document = styled.div`
    width: 100%;
`

