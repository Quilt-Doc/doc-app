import React from 'react';

//styles 
import styled from "styled-components";

//components
import TextEditorView from './Text Editor Page/TextEditorView';
import RepositoryNavigation from './RepositoryNavigation';
import RepositoryView from './Repository Page/RepositoryView';
import SideNavbar from './SideNavbar';
import DocumentCreationView from './Document Creation Page/DocumentCreationView';

//react-router
import { Switch, Route } from 'react-router-dom';
import history from '../../history';

//react-redux
import { connect } from 'react-redux';

//actions
import { updateRightViewScroll } from '../../actions/UI_Actions';

class SpaceView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
           'modalDisplay': 'none'
        } 
        this.rightViewRef = React.createRef()
    }

    onScroll = () => {
        //this.props.updateRightViewScroll(this.rightViewRef.current.scrollTop)
    }

    render() {
        return (
            <>
                <Container>
                    <SideNavbar  openModal = {() => this.setState({'modalDisplay': ''})}/>
                    <RightView ref = {this.rightViewRef} onScroll = {this.onScroll}>
                        <Switch history = {history}>
                            <Route exact path = "/repository" component = {RepositoryView} />
                            <Route path = "/repository" component = {RepositoryNavigation}/>
                            <Route path = "/document/:documentID" component = { TextEditorView } />
                        </Switch>
                    </RightView>
                </Container>
                <DocumentCreationView display = {this.state.modalDisplay} clearModal = {() => this.setState({'modalDisplay':'none'})}/>
            </>
        );
    }
}

const mapStateToProps = (state) => {
    return {
        
    }
}



export default connect(mapStateToProps, { updateRightViewScroll })(SpaceView);

/*  
<ModalBackground display = {this.state.modalDisplay} onClick = {() => this.setState({'modalDisplay': 'none'})}>
                    <ModalContent onClick = {(e) => {e.stopPropagation()}}>
                        <Document>
                           
                        </Document>
                    </ModalContent>
                </ModalBackground>
*/

//Styled Components

const Container = styled.div`
    display: flex;
`


const RightView = styled.div`
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    background-color: white;
    width: 100%;
    padding-top: 4rem;
    padding-left: 0rem;
    overflow-y: scroll;
    
    height: 92vh;

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

