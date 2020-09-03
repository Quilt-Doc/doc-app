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

//actions
import { moveDocument, retrieveChildren } from '../../../actions/Document_Actions';

//spinner
import MoonLoader from "react-spinners/MoonLoader";

//icons
import {RiFileTextLine} from 'react-icons/ri'
import {FiChevronDown} from 'react-icons/fi'

class DocumentMenu2 extends React.Component {
    
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

        let { workspaceId } =  this.props.match.params

        this.setState({
           search: event.target.value,
           typing: false,
           typingTimeout: setTimeout(() => {
                if ( this.state.search === ""){
                    if (this.props.parent) {
                        this.props.retrieveChildren({limit: 8, workspaceId, sort: "-title"}).then((documents) => {
                            documents = [...documents, this.props.parent]
                            this.setState({documents, position: -1})
                        })
                    } else {
                        this.props.retrieveChildren({limit: 9, workspaceId, sort: "-title"}).then((documents) => {
                            this.setState({documents, position: -1})
                        })
                    }
                } else {
                    this.props.retrieveChildren({search: this.state.search, workspaceId, sort: "-title",  limit: 9}).then((documents) => {
                        this.setState({documents, position: -1})
                    }); 
                }
            }, 200)
        });
    }

    renderMarginTop() {
        return "-3rem";
        if (this.props.marginTop){
            return this.props.marginTop
        } else if (window.innerHeight - this.addButton.offsetTop + this.addButton.offsetHeight > 300) {
            return "-30rem"
        } else {
            return "-5rem"
        }
    }

<<<<<<< HEAD
    handleSelect(parentId) {
        let documentId = this.props.document._id;
        let {workspaceId} = this.props.match.params;
        this.props.moveDocument({workspaceId, documentId, parentId, order: 0}).then(() => {
            this.closeMenu()
        })
=======
    handleSelect(parentId, doc) {
       
        if (this.props.form) {
           this.props.selectParent(doc)
           this.closeMenu()
        } else {
            let documentId = this.props.document._id
            this.props.moveDocument({documentId, parentId, order: 0}).then(() => {
                this.closeMenu()
            })
        }

>>>>>>> 18bcacd53e6f9e483e57724e2210d65a898887fb
    }

    async setPosition(e) {
        // UP
        let { workspaceId } = this.props.match.params;
        if (e.key === "Enter" && this.state.position >= 0) {
            let doc = this.state.documents[this.state.position]
            this.setState({loaded: false})
            await this.handleSelect(doc._id, doc)
            if (this.props.parent){
            this.props.retrieveChildren({limit: 8, workspaceId, sort: "-title"}).then((documents) => {
                documents = [...documents, this.props.parent]
                this.setState({documents, loaded: true,  search: '', position: -1})
            })} else {
                this.props.retrieveChildren({limit: 9, workspaceId, sort: "-title"}).then((documents) => {
                    this.setState({documents,loaded: true,  search: '', position: -1})
                })
            }
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

    renderListItems(){
        return this.state.documents.map((doc, i) => {
            return(
                <ListItem 
                    onClick = {() => {this.handleSelect(doc._id, doc)}} 
                    onMouseEnter = {() => {this.setState({position: i})}}
                    backgroundColor = {this.state.position === i ? '#F4F4F6' : ""}
                >
                    <RiFileTextLine  style = {{fontSize: "1.5rem", marginRight: "1rem"}}/>
                    {doc.title ? doc.title : "Untitled"}
                </ListItem>
            )
        })
    }

    openMenu(){
        document.addEventListener('mousedown', this.handleClickOutside, false);
        let { workspaceId } = this.props.match.params
        this.setState({open: true})
        if (this.props.parent) {
            this.props.retrieveChildren({limit: 8, workspaceId, sort: "-title"}).then((documents) => {
                documents = [...documents, this.props.parent]
                this.setState({documents, position: -1, loaded: true})
            })
        } else {
            this.props.retrieveChildren({limit: 9, workspaceId, sort: "-title"}).then((documents) => {
                this.setState({documents, loaded: true, position: -1})
            })
        }
        
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
        console.log("PARENT", this.props.parent)
        return (
            <MenuContainer  >
                {this.props.form ?
                    <Provider ref = {addButton => this.addButton = addButton} onClick = {() => this.openMenu()}>
                        <RiFileTextLine style = {{marginTop: "-0.15rem", marginRight: "1rem"}}/>
                        {this.props.parent ? this.props.parent.title : "None Selected"}
                        <FiChevronDown style = {{ marginLeft: "1rem"}}/>
                    </Provider> :
                    <Provider ref = {addButton => this.addButton = addButton} onClick = {() => this.openMenu()}>
                        <RiFileTextLine style = {{marginTop: "-0.15rem", marginRight: "1rem"}}/>
                            None Selected
                        <FiChevronDown style = {{ marginLeft: "1rem"}}/>
                    </Provider>
                }
                {this.state.open && 
                    <CSSTransition
                        in = {this.state.open}
                        unmountOnExit
                        enter = {true}
                        exit = {true}       
                        timeout = {150}
                        classNames = "dropmenu"
                    >
                        <Container marginTop = {this.renderMarginTop()} ref = {node => this.node = node}>
                            <HeaderContainer>Choose Location</HeaderContainer>
                            <SearchbarContainer>
                                <SearchbarWrapper 
                                    backgroundColor = {this.state.focused ? "white" : "#F7F9FB"}
                                    border = {this.state.focused ? "2px solid #2684FF" : "1px solid #E0E4E7;"}
                                >
                                    <ion-icon name="search-outline" style = {{fontSize: "2.3rem", color: '#172A4E', opacity: 0.4}}></ion-icon>
                                    <Searchbar 
                                        onFocus = {() => {this.setState({focused: true})}} 
                                        onBlur = {() => {this.setState({focused: false})}} 
                                        onKeyDown = {(e) => this.setPosition(e)}  
                                        onChange = {(e) => {this.searchDocuments(e)}} 
                                        value = {this.state.search}
                                        autoFocus 
                                        placeholder = {"Find a document..."}/>
                                </SearchbarWrapper>
                            </SearchbarContainer>
                            <ListContainer>
                                {this.state.loaded ?  this.renderListItems() : <MoonLoader size = {12}/>}
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
        workspace: state.workspaces[workspaceId]
    }
}



export default withRouter(connect(mapStateToProps, { moveDocument, retrieveChildren })(DocumentMenu2));


const Provider = styled.div`
    background-color: #363b49;
    padding: 1rem 2rem;
    border-radius: 0.4rem;
    font-weight: 500;
    font-size: 1.7rem;
    display: inline-flex;
    align-items: center;
    margin-bottom: 4rem;
    &:hover {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    cursor: pointer;
`

const Parent = styled.div`
    font-weight: 500;
`

const NoneMessage = styled.div`
    font-size: 1.3rem;
    opacity: 0.5;
`

const ModalToolbarButton = styled.div`
    display: flex;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    padding: 0.8rem;
    font-size: 1.3rem;
    
    margin-right: 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    &:hover {
        background-color: #F4F4F6; 
        opacity: 1;
    }
    margin-left: ${props => props.marginLeft};
    opacity: ${props => props.opacity};
`

const MenuContainer = styled.div`
   
`

const AddButton = styled.div`
    width: 2.3rem;
    height: 2.3rem;
    background-color: #F7F9FB;
    border: 1px solid #E0E4E7;
    opacity: 0.4;
    border-radius: 0.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    &:hover {
        opacity: 1
    }
    color: #172A4E;
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
    margin-top: -5rem;
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
    border-bottom: 1px solid #E0E4E7;
    font-weight: 500;
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
