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
import { moveDocument, retrieveDocuments, searchDocuments } from '../../actions/Document_Actions';

//spinner
import MoonLoader from "react-spinners/MoonLoader";

//icons
import {RiFileTextLine, RiFileList2Fill, RiFileList2Line} from 'react-icons/ri'
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
           typingTimeout: setTimeout(async () => {
                if ( this.state.search === ""){
                    await this.reset();
                } else {
                    let documents = await searchDocuments({ minimalDocuments: true, userQuery: this.state.search, 
                        workspaceId, sort: "-title",  limit: 9});
                    this.setState({ documents, position: -1 })
                }
            }, 100)
        });
    }

    handleSelect(parentId, doc) {

        let {workspaceId} = this.props.match.params;
       
        if (this.props.form) {
           this.props.selectParent(doc)
           this.closeMenu()
        }
        /* else {
            let documentId = this.props.document._id
            
            this.props.moveDocument({workspaceId, documentId, parentId, order: 0}).then(() => {
                this.closeMenu()
            })
        }*/

    }

    async setPosition(e) {
        // UP
        let { workspaceId } = this.props.match.params;
        if (e.key === "Enter" && this.state.position >= 0) {
            let doc = this.state.documents[this.state.position]
            this.setState({loaded: false})
            await this.handleSelect(doc._id, doc)
            this.reset();
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
        const { workspace } = this.props;
        const { documents } = this.state;
        console.log("DOCUMENTS", documents);
        return documents.map((doc, i) => {
            return(
                <ListItem 
                    onClick = {() => {this.handleSelect(doc._id, doc)}} 
                    onMouseEnter = {() => {this.setState({position: i})}}
                    backgroundColor = {this.state.position === i ? '#F4F4F6' : ""}
                >
                    {doc.title ? <RiFileList2Line  style = {{fontSize: "1.5rem", marginRight: "1rem"}}/>
                        : <WorkspaceIcon>{workspace.name.charAt(0)}</WorkspaceIcon>}
                    <Title>{doc.title ? doc.title : workspace.name}</Title>
                </ListItem>
            )
        })
    }

    openMenu = async () =>{
        document.addEventListener('mousedown', this.handleClickOutside, false);
        this.setState({open: true});
        await this.reset();
    }

    reset = async () => {
        const { rootDocument, match, parent, retrieveDocuments } = this.props;
        const { workspaceId } = match.params;

        let documentIds = [rootDocument._id];
        if (parent && parent._id !== rootDocument._id) documentIds.push(parent._id);

        const documents = await retrieveDocuments({ limit: 9, documentIds, workspaceId, sort: "-title", fill: true}, false, true)
        this.setState({documents, position: -1, loaded: true})
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

    renderFlip = () => {
        if (this.props.form && this.addButton){
            let rect = this.addButton.getBoundingClientRect()
            if (rect.top + 350 > window.innerHeight){
				return [true, window.innerHeight - rect.top + 10];
            } else {
                return [false, rect.top + rect.height + 5];
            }
        }
        return [false, 0]
    }

    renderListContent = (flip) => {
        if (flip[0]) {
            return(
                <>
                    <ListContainer>
                        {this.state.loaded ?  this.renderListItems() : <MoonLoader size = {12}/>}
                    </ListContainer>
                    <SearchbarContainer>
                        <SearchbarWrapper 
                            backgroundColor = {this.state.focused ? "white" : "#F7F9FB"}
                            border = {this.state.focused ? "2px solid #2684FF" : "1px solid #E0E4E7;"}
                        >
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
                    <HeaderContainer>Choose Location</HeaderContainer>
                </>
            )
        } else {
            return (
                <>
                    <HeaderContainer>Choose Location</HeaderContainer>
                        <SearchbarContainer>
                            <SearchbarWrapper 
                                backgroundColor = {this.state.focused ? "white" : "#F7F9FB"}
                                border = {this.state.focused ? "2px solid #2684FF" : "1px solid #E0E4E7;"}
                            >
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
                </>
            )
        }
    }
    
    renderParentTitle = () => {
        const { parent, workspace } = this.props;
        if (!parent || this.props.parent.title !== "") {
            return (
                <>
                    <IconBorder>
                        <RiFileList2Fill/>
                    </IconBorder>
                    <ParentTitle>{this.props.parent ? this.props.parent.title : "Select Location"}</ParentTitle>
                </>
            )
        }  else {
            return (
                <>
                    <WorkspaceIcon large = {true}>{workspace.name.charAt(0)}</WorkspaceIcon>
                    <Title>{workspace.name}</Title>
                </>
            )
        }
    }

    render() {
        let flip = this.renderFlip()
        return (
            <MenuContainer  >
                {this.props.form ?
                     <MenuButton active = {this.state.open} onClick = {() => this.openMenu()} ref = {addButton => this.addButton = addButton}>
                        {this.renderParentTitle()}
                        <FiChevronDown 
                                style = {{
                                    marginLeft: "0.5rem",
                                    marginTop: "0.3rem",
                                    fontSize: "1.45rem"
                                }}
                            />
                    </MenuButton>
                        :
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
                        <Container flip = {flip} ref = {node => this.node = node}>
                            {this.renderListContent(flip)}
                        </Container>
                    </CSSTransition>
                }
            </MenuContainer>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    let {workspaceId} = ownProps.match.params
    let {documents, workspaces, references} = state;
    
    const rootDocument = Object.values(documents).filter(document => document.root)[0];

    return {
        workspace: state.workspaces[workspaceId],
        rootDocument
    }
}



export default withRouter(connect(mapStateToProps, { moveDocument, retrieveDocuments, searchDocuments })(DocumentMenu2));

const WorkspaceIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: ${props => props.large ? "1.8rem" : "1.5rem"};
    width: ${props => props.large ? "1.8rem" : "1.5rem"};
    background-color: #5B75E6;
    border-radius: 0.2rem;
    font-size: ${props => props.large ? "1.2rem" : "0.8rem"};
    border: none;
    color: white;
    text-decoration: none;
    &:hover {
        background-color: #7a8feb;
    }
    transition: background-color 0.1s ease-in;
    cursor: pointer;
    margin-right: 1rem;
`

const ParentTitle = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    max-width: 22rem;
`

const Title = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-weight: 500;
    width: 18rem;
    font-size: 1.3rem;
`

const IconBorder = styled.div`
    font-size: 1.8rem;
    margin-right: 0.7rem;
    color: #2684FF;
    width: 2rem;
    display: flex;
    align-items: center;
`

const MenuButton = styled.div`
    display: flex;
    align-items: center;
    border: 1px solid ${props => props.active ? chroma('#5B75E6').alpha(0.2) : "#E0E4E7"}; 
    font-size: 1.4rem;
    padding: 0rem 1.5rem;
    border-radius: 0.4rem;
    height: 3.5rem;
    font-weight: 500;
    display: inline-flex;
    background-color: ${props => props.active ? chroma('#5B75E6').alpha(0.2) : ""};
    &:hover {
        background-color: ${props => props.active ?  chroma('#5B75E6').alpha(0.2) : "#F4F4F6" };
    }
    cursor: pointer;
`

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
    box-shadow: 0 2px 2px 2px rgba(60,64,67,.15);
    position: absolute;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    z-index: 2;
    background-color: white;
    bottom: ${props => props.flip[0] ? `${props.flip[1]}px` : ""};
    top: ${props => !props.flip[0] ? `${props.flip[1]}px` : ""};
`

const SearchbarContainer = styled.div`
    height: 5.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid #E0E4E7;
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
    font-weight: 500;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`

const HeaderContainer = styled.div`
    height: 3.5rem;
    display: flex;
    align-items: center;
    font-size: 1.3rem;
    padding: 1rem;
    color: #172A4E;
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
    font-weight: 500;
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
