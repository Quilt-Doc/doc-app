
import React from 'react';

// react-redux
import { connect } from 'react-redux';

//router
import {withRouter} from 'react-router-dom';

//chroma
import chroma from 'chroma-js';

//styles
import styled from "styled-components";

//components
import { CSSTransition } from 'react-transition-group';

//FARAZ TODO: REPLACE retrieveDocuments
//actions
import { searchDocuments, retrieveDocuments, attachDocumentReference, removeDocumentReference } from '../../actions/Document_Actions';

//icons
import { RiAddLine, RiCheckFill, RiFile2Line, RiFileList2Line, RiFileTextLine } from 'react-icons/ri';
import { CgSearch } from 'react-icons/cg';

//spinner
import MoonLoader from "react-spinners/MoonLoader";


class DocumentMenu extends React.Component {
    constructor(props){
        super(props)

        this.state = {
            open: false,
            search: '',
            typing: false,
            typingTimeout: 0, 
            loaded: false,
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


    searchDocuments = (event) => {

        if (this.state.typingTimeout) {
           clearTimeout(this.state.typingTimeout);
        }
        
        let ids = this.props.setDocuments.map(doc => doc._id)
        let { workspaceId } =  this.props.match.params

        this.setState({
           search: event.target.value,
           typing: false,
           typingTimeout: setTimeout(() => {
                if ( this.state.search === ""){
                    this.props.retrieveDocuments({fill: true, limit: 9, documentIds: ids, workspaceId}, false, true).then((documents) => {
                        console.log("DOCUMENT MENU DOCUMENTS", documents);
                        this.setState({documents, position: -1})
                    })
                } else {
                    this.props.searchDocuments({userQuery: this.state.search, workspaceId, sort: "-title",  limit: 9}, true).then((documents) => {
                        this.setState({documents, position: -1})
                    });
                }
            }, 200)
        });
    }

    handleSelect(setBool, documentId){
        let { workspaceId } = this.props.match.params;
        let referenceId = this.props.reference._id
        if (setBool) {
            this.props.removeDocumentReference({workspaceId, documentId, referenceId})
        } else {
            this.props.attachDocumentReference({workspaceId, documentId, referenceId})
        }
    }

    async setPosition(e) {
        // UP
        let { workspaceId } = this.props.match.params;
        if (e.key === "Enter" && this.state.position >= 0) {
            let doc = this.state.documents[this.state.position];
            this.setState({loaded: false});
            let documentIds = this.props.setDocuments.map(document => document._id);
            await this.handleSelect(documentIds.includes(doc._id), doc._id)
            let documents = await this.props.retrieveDocuments({fill: true, limit: 9, documentIds, workspaceId}, false, true);
            this.setState({loaded: true, search: '', documents});
        } else {
            if (e.keyCode === 38) {
                if (this.state.position <= 0){
                    this.setState({position: this.state.documents.length - 1})
                } else {
                    this.setState({position: this.state.position - 1})
                }
            } else if (e.keyCode === 40) {
                if (this.state.position >  this.state.documents.length - 2){
                    this.setState({position: 0})
                } else {
                    this.setState({position: this.state.position + 1})
                }
            }
        } 
    }

    renderListItems(setIds){
        return this.state.documents.map((doc, i) => {
            let setBool = setIds.includes(doc._id)
           
            return(
                <ListItem 
                    onClick = {() => {this.handleSelect(setBool, doc._id)}} 
                    onMouseEnter = {() => {this.setState({position: i})}}
                   
                    backgroundColor = {this.state.position === i ? '#F4F4F6' : ""}
                >
                    <RiFileList2Line  style = {{minWidth: "2rem", fontSize: "1.5rem", marginRight: "0.5rem"}}/>
                    <Title>{doc.title ? doc.title : "Untitled"}</Title>
                    {setBool &&  <RiCheckFill
                            style = {{ color: "#19e5be", marginLeft: "auto", fontSize: "2rem"}} 
                        />
                    }
                </ListItem>
            )
        })
    }

    openMenu(){
        document.addEventListener('mousedown', this.handleClickOutside, false);
        let ids = this.props.setDocuments.map(doc => doc._id)
        let { workspaceId } = this.props.match.params
        this.props.retrieveDocuments({fill: true, limit: 9, documentIds: ids, workspaceId}, false, true).then((documents) => {
            console.log("DOCUMENTS RETRIEVED", documents);
            this.setState({documents, loaded: true, open:true})
        })
    }

    closeMenu(){
        document.removeEventListener('mousedown', this.handleClickOutside, false);
        this.setState({ 
            open: false,
            loaded: false,
            search: '',
            documents: [],
            typing: false,
            typingTimeout: 0,
            position: -1})
    }

    render() {
        let setIds = this.props.setDocuments.map(doc => doc._id)
        const {open} = this.state;
        return(
            <MenuContainer>
                <AddButton 
                    ref = {addButton => this.addButton = addButton} 
                    onClick = {(e) => this.openMenu(e)}
                    active = {open}
                >
                    <RiAddLine/>
                </AddButton>
                <CSSTransition
                    in={this.state.open}
                    enter = {true}
                    exit = {true}
                    unmountOnExit = {true}
                    timeout={150}
                    classNames="dropmenu"
                >
                <Container ref = {node => this.node = node}>
                    <HeaderContainer>Attach Information</HeaderContainer>
                    <SearchbarContainer>
                        <SearchbarWrapper 
                            backgroundColor = {this.state.focused ? "white" : "#F7F9FB"}
                            border = {this.state.focused ? "2px solid #2684FF" : "1px solid #E0E4E7;"}
                        >
                                <CgSearch style = {{fontSize: "2.3rem", color: '#172A4E', opacity: 0.4}}/>
                            <Searchbar 
                                onFocus = {() => {this.setState({focused: true})}} 
                                onBlur = {() => {this.setState({focused: false})}} 
                                onKeyDown = {(e) => this.setPosition(e)}  
                                onChange = {(e) => {this.searchDocuments(e)}} 
                                value = {this.state.search}
                                autoFocus 
                                placeholder = {"Find documents..."}/>
                        </SearchbarWrapper>
                    </SearchbarContainer>
                    <ListContainer>
                        {this.state.loaded ?  this.renderListItems(setIds) : <MoonLoader size = {12}/>}
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
        tags: Object.values(state.tags).sort((a, b) => {
            if (a.label > b.label) {
                return 1
            } else {
                return -1
            }
        }),
        workspace: state.workspaces[workspaceId]
    }
}



export default withRouter(connect(mapStateToProps, { attachDocumentReference, removeDocumentReference, retrieveDocuments, searchDocuments })(DocumentMenu));

const Title = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
	font-weight: 500;
	width: 13rem;
	font-size: 1.25rem;
`

const MenuContainer = styled.div`
`


const AddButton = styled.div`
    height: 3rem;
    width: 3rem;
    border: 1px solid ${props => props.active ? chroma('#5B75E6').alpha(0.2) : "#E0E4e7"}; 
    border-radius: 50%;
    font-size: 1.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    background-color: ${props => props.active ? chroma('#5B75E6').alpha(0.2) : "white"};
    &:hover {
        background-color: ${props => props.active ?  chroma('#5B75E6').alpha(0.2) : "#F4F4F6" };
    }
    cursor: pointer;
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
    z-index: 3;
    margin-top: 10px;
    background-color: white;
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
