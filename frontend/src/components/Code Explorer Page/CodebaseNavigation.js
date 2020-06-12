import React from 'react';

//styles 
import styled from "styled-components"

//images
import bucket_icon from '../../images/bucket.svg'
import doc_icon from '../../images/paper.svg';

//react-router
import { Router, Route, Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import history from '../../history';

//components
import HoveringMenuExample from '../Text Editor/HoveringMenuExample';
import DirectoryViewer from './DirectoryViewer'
import CodeView from '../Code Viewer Page/CodeView'

//actions
import { repoRefreshPathNew, repoGetFile, repoParseFile, repoClearFile} from '../../actions/Repo_Actions';

//misc
import { connect } from 'react-redux';



class CodebaseNavigation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
           'file_item_background_color': '',
           'modal_display': 'none',
           'file': false
        }
 
       
    }




    renderHeader() {
        //this.props.location.pathname
    }


    render() {
            return (
                <>
                    <Container>
                        <Header>Pytorch / Fairseq</Header>
                        <Router history = {history}>
                            <Route path = "/codebase/directory/:link" component = { DirectoryViewer } />
                            <Route path = "/codebase/codeview/:link" component = { CodeView } />
                        </Router>
                    </Container> 
                    <Modal_Background display = {this.state.modal_display} onClick = {() => this.setState({'modal_display': 'none'})}>
                        <Modal_Content onClick = {(e) => {e.stopPropagation()}}>
                            <Document>
                                <HoveringMenuExample/>
                            </Document>
                            
                        </Modal_Content>
                    </Modal_Background>
                </>
            );
    }
}

/*

<Top_Navbar>
                        <Navbar_Button margin_left = {'-0.2'} border_radius = {'0.5rem'} onClick = {() => this.setState({modal_display: ''})}>
                            <ion-icon style={{'margin-right': "1rem", 'font-size': '3rem'}} name="create-outline"></ion-icon>
                            Create Doc
                        </Navbar_Button>
                        <Navbar_Button margin_left = {'75'} border_radius = {'50%'}>
                            <Styled_Icon width = {'3.5'} src = {bucket_icon}/>
                        </Navbar_Button>
                    </Top_Navbar>

                    */
/*
{this.renderFolders()}
*/

/*
<File_Line>
                                <Check_Box_Border onClick = {() => {}}>
                                    <Check_Box />
                                </Check_Box_Border>
                                <File_Item background_color = {this.state.file_item_background_color} >
                                    <Hover_File_Item  
                                        onMouseEnter = {() => this.hoverFileItem()}
                                        onMouseLeave = {() => this.unhoverFileItem()}
                                    >
                                        <ion-icon style={{'margin-right': "1rem", 'font-size': '2rem'}}  name="folder"></ion-icon>
                                        <Filename>BERT</Filename>
                                    </Hover_File_Item >
                                    <Statistics>
                                        <Styled_Icon width = {'2'}  src = {doc_icon}/>
                                        <Document_Count color = {'#172A4E'}>13</Document_Count>
                                    </Statistics>
                                </File_Item>
                            </File_Line>
                            <File_Line>
                                <Check_Box_Border onClick = {() => {}}>
                                    <Check_Box />
                                </Check_Box_Border>
                                <File_Item background_color = {this.state.file_item_background_color} >
                                    <Hover_File_Item  
                                        onMouseEnter = {() => this.hoverFileItem()}
                                        onMouseLeave = {() => this.unhoverFileItem()}
                                    >
                                        <ion-icon style={{'margin-right': "1rem", 'font-size': '2rem'}}  name="folder"></ion-icon>
                                        <Filename>BERT</Filename>
                                    </Hover_File_Item >
                                    <Statistics>
                                        <Styled_Icon width = {'2'}  src = {doc_icon}/>
                                        <Document_Count color = {'#172A4E'}>13</Document_Count>
                                    </Statistics>
                                </File_Item>
                            </File_Line>
                            <File_Line>
                                <Check_Box_Border onClick = {() => {}}>
                                    <Check_Box />
                                </Check_Box_Border>
                                <File_Item background_color = {this.state.file_item_background_color} border_bottom = {'1px solid #EDEFF1;'}>
                                    <Hover_File_Item  
                                        onMouseEnter = {() => this.hoverFileItem()}
                                        onMouseLeave = {() => this.unhoverFileItem()}
                                    >
                                        <ion-icon style={{'margin-right': "1rem", 'font-size': '2rem'}}  name="folder"></ion-icon>
                                        <Filename>BERT</Filename>
                                    </Hover_File_Item >
                                    <Statistics>
                                        <Styled_Icon width = {'2'}  src = {doc_icon}/>
                                        <Document_Count color = {'#172A4E'}>13</Document_Count>
                                    </Statistics>
                                </File_Item>
                            </File_Line>

*/


export default CodebaseNavigation
/*

 <Modal_Background>
                    <Modal_Content>
                        <Document>
                            <HoveringMenuExample/>
                        </Document>
                       
                    </Modal_Content>
                </Modal_Background>

                */
/*
 <Document_Template_Guide>
                        </Document_Template_Guide>
                        */

/*
       <Modal_Background>
                    <Modal_Content>
                        <Document>

                        </Document>
                        <Document_Template_Guide>

                        </Document_Template_Guide>
                    </Modal_Content>
                </Modal_Background>
*/



const Container = styled.div`
    width: 120rem;
    margin: 0 auto;
    margin-top: 5rem;
    
`

// DIRECTORY COMPONENTS

const Header = styled.div`
    font-size: 3.5rem;
    color: #172A4E;
    font-weight: bold;
    letter-spacing: 0.1rem;
    margin-bottom: 7rem;
`

const Directory_Container = styled.div`
    width: 100rem;
    margin-top: 7rem;
    border-radius: 0.1rem;
    display: flex;
    flex-direction: column;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`

// Modal

// Modal
/* The Modal (background) */
const Modal_Background = styled.div`
    display: ${props => props.display};
    position: fixed; /* Stay in place */
    z-index: 1; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: hidden; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
`
  
  /* Modal Content/Box */
const Modal_Content = styled.div`
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
`
//background: rgba(45, 170, 219, 0.3); on highlight
const Document = styled.div`
    width: 100%;
`

