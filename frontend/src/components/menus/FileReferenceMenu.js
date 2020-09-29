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

//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCube, faPlus } from '@fortawesome/free-solid-svg-icons'
import {RiCheckFill, RiGitRepositoryLine, RiFileFill, RiFileLine, RiAddLine} from 'react-icons/ri'
import {AiFillFolder} from 'react-icons/ai';
import {BiCubeAlt} from 'react-icons/bi';

//actions
import { attachDocumentReference, removeDocumentReference } from '../../actions/Document_Actions';
import { retrieveReferences } from '../../actions/Reference_Actions';

//spinner
import MoonLoader from "react-spinners/MoonLoader";
import { BiCube } from 'react-icons/bi';

class FileReferenceMenu extends React.Component {
    
    constructor(props){
        super(props)

        this.state = {
            open: false,
            search: '',
            typing: false,
            typingTimeout: 0, 
            loaded: false,
            position: 0,
            references: []
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


    searchReferences = (event) => {

        if (this.state.typingTimeout) {
           clearTimeout(this.state.typingTimeout);
        }

        let repositoryId  =  this.props.document.repository._id
        let setIds = this.props.setReferences.map(ref => ref._id)

        this.setState({
           search: event.target.value,
           typing: false,
           typingTimeout: setTimeout(() => {
               let { workspaceId } = this.props.match.params;
                if ( this.state.search === ""){
                    this.props.retrieveReferences({workspaceId, limit: 9, referenceIds: setIds, repositoryId,  sort: "-name"}, true).then((references) => {
                        this.setState({references, position: -1})
                    })
                } else {
                    this.props.retrieveReferences({workspaceId, search: this.state.search,  repositoryId,  sort: "-name",  limit: 9}, true).then((references) => {
                        this.setState({references, position: -1})
                    }); 
                }
            }, 200)
        });
    }

    renderMarginTop() {
        /*
        if (this.props.marginTop){
            return this.props.marginTop
        } else if (window.innerHeight - this.addButton.offsetTop + this.addButton.offsetHeight > 300) {
            return "-30rem"
        } else {
            return "-5rem"
        }*/
        return 0;
    }

    handleSelect(setBool, referenceId, reference){
        if (!this.props.form){
            let documentId = this.props.document._id
            let { workspaceId } = this.props.match.params;
            if (setBool) {
                this.props.removeDocumentReference({workspaceId, documentId, referenceId});
            } else {
                this.props.attachDocumentReference({workspaceId, documentId, referenceId});
            }
        } else {
            if (setBool) {
                this.props.formRemoveReference(reference)
            } else {
                this.props.formAttachReference(reference)
            }
        }
     
    }

    async setPosition(e) {
        // UP
        let repositoryId = this.props.document.repository._id;
        let workspaceId = this.props.match.params;
        if (e.key === "Enter" && this.state.position >= 0) {
            let ref = this.state.references[this.state.position]
            this.setState({loaded: false})
            let referenceIds = this.props.setReferences.map(reference => reference._id)
            await this.handleSelect(referenceIds.includes(ref._id), ref._id)
            this.props.retrieveReferences({workspaceId, limit: 9, referenceIds, repositoryId}, true).then((references) => {
                this.setState({loaded: true, search: '', references})
            })
        } else {
            if (e.keyCode === 38) {
                if (this.state.position <= 0){
                    this.setState({position: this.state.references.length - 1})
                } else {
                    this.setState({position: this.state.position - 1})
                }
            } else if (e.keyCode === 40) {
                if (this.state.position >  this.state.references.length - 2){
                    this.setState({position: 0})
                } else {
                    this.setState({position: this.state.position + 1})
                }
            }
        } 
    }

    renderFolders(){

    }

    renderListItems(setIds){
        let references = [...this.state.references];
        references.sort((a, b) => {
            if (a.name > b.name){
                return 1
            } else {
                return -1
            }
        })

        console.log("REFS", references);
        let dirs = references.filter((ref) => {
            return ref.kind === "dir"
        })
        let files = references.filter((ref) => {
            return ref.kind === "file"
        })

        let jsx = []
        let i = 0;
        dirs.map((ref) => {
            let setBool = setIds.includes(ref._id)
            let temp = i
            jsx.push(            
                <ListItem 
                    onClick = {() => {this.handleSelect(setBool, ref._id, ref)}} 
                    onMouseEnter = {() => {this.setState({position: temp})}}
                
                    backgroundColor = {this.state.position === temp ? '#F4F4F6' : ""}
                 >
                    <AiFillFolder
                        style = {{fontSize: "1.5rem", marginRight: "1rem"}} 
                    />
                    {ref.name ? ref.name : "Untitled"}
                    {setBool && 
                        <RiCheckFill
                            style = {{ color: "#19e5be", marginLeft: "auto", fontSize: "2rem"}} 
                        />
                    }
                </ListItem>
            )
            i += 1;
        })

        files.map((ref) => {
            let setBool = setIds.includes(ref._id)
            let temp = i
            jsx.push(
                <ListItem 
                    onClick = {() => {this.handleSelect(setBool, ref._id, ref)}} 
                    onMouseEnter = {() => {this.setState({position: temp})}}
                
                    backgroundColor = {this.state.position === temp ? '#F4F4F6' : ""}
                 >
                     <RiFileLine
                            style = {{fontSize: "1.5rem", marginRight: "1rem"}}
                    />
                    {ref.name ? ref.name : "Untitled"}
                    {setBool && 
                        <RiCheckFill
                            style = {{ color: "#19e5be", marginLeft: "auto", fontSize: "2rem"}} 
                        />
                    }
                </ListItem>
            )
            i += 1;
        })
        return jsx;
    }

    openMenu(e){
        e.preventDefault()
        document.addEventListener('mousedown', this.handleClickOutside, false);
        this.setState({
            open: true
        })
        let ids = this.props.setReferences.map(ref => ref._id)
        let repositoryId = this.props.document.repository._id
        let { workspaceId } = this.props.match.params;

        this.props.retrieveReferences({workspaceId, limit: 9, referenceIds: ids, repositoryId}, true).then((references) => {
            this.setState({references, loaded: true })
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

    renderListContent = (flip, setIds) => {
        if (flip[0]){
            return(
                <>
                    <ListContainer>
                        {this.state.loaded ?  this.renderListItems(setIds) : <MoonLoader size = {12}/>}
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
                                onChange = {(e) => {this.searchReferences(e)}} 
                                value = {this.state.search}
                                autoFocus 
                                placeholder = {"Find references..."}/>
                        </SearchbarWrapper>
                    </SearchbarContainer>
                    <HeaderContainer>Attach References</HeaderContainer>
                    
                </>
            )
        } else {
            return(
                <>
                    <HeaderContainer>Attach References</HeaderContainer>
                    <SearchbarContainer>
                        <SearchbarWrapper 
                            backgroundColor = {this.state.focused ? "white" : "#F7F9FB"}
                            border = {this.state.focused ? "2px solid #2684FF" : "1px solid #E0E4E7;"}
                        >
                        
                            <Searchbar 
                                onFocus = {() => {this.setState({focused: true})}} 
                                onBlur = {() => {this.setState({focused: false})}} 
                                onKeyDown = {(e) => this.setPosition(e)}  
                                onChange = {(e) => {this.searchReferences(e)}} 
                                value = {this.state.search}
                                autoFocus 
                                placeholder = {"Find references..."}/>
                        </SearchbarWrapper>
                    </SearchbarContainer>
                    <ListContainer>
                        {this.state.loaded ?  this.renderListItems(setIds) : <MoonLoader size = {12}/>}
                    </ListContainer>
                </>
            )
        }
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


    render() {
        let setIds = this.props.setReferences.map(ref => ref._id)
        let flip = this.renderFlip()
        return(
            <MenuContainer mLeft = {this.props.form ? "" : "auto"} >
                    {this.props.form ?
                        <AddButton 
                            ref = {addButton => this.addButton = addButton} 
                            onClick = {(e) => this.openMenu(e)}
                            active = {this.state.open}
                        >
                            <RiAddLine />
                        </AddButton>
                         :
                        <PageIcon 
                            active = {this.state.open} 
                            onClick = {(e) => {this.openMenu(e)}} 
                            ref = {addButton => this.addButton = addButton}
                        >
                            <BiCube style = {{marginRight: "0.5rem"}}/>
                            <Title>Attach References</Title>
                        </PageIcon>
                    }
                    <CSSTransition
                         in = {this.state.open}
                         unmountOnExit
                         enter = {true}
                         exit = {true}       
                         timeout = {150}
                         classNames = "dropmenu"
                    >
                        <Container 
                            form = {this.props.form}
                            ref = {node => this.node = node}
                            flip = {flip}
                        >
                            {this.renderListContent(flip, setIds)}
                        </Container>
                    </CSSTransition>
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


export default withRouter(connect(mapStateToProps, { attachDocumentReference, removeDocumentReference, retrieveReferences })(FileReferenceMenu));



const Title = styled.div`
    font-size: 1.3rem;
    margin-right: 0.3rem;
    font-weight: 500;
`

const PageIcon = styled.div`
    margin-right: 1.2rem;
    display: flex;
    align-items: center;
    font-size: 1.5rem;

    padding: 0.5rem 1rem;
    &:hover {
        background-color: ${props => props.active ? chroma('#5B75E6').alpha(0.2) : "#F4F4F6"};
        
    }
    background-color: ${props => props.active ? chroma('#5B75E6').alpha(0.2) : ""};
    cursor: pointer;
    border-radius: 0.3rem;
    margin-left: auto;
    /*
    margin-left: ${props => props.mLeft ? props.mLeft : "0rem"};*/
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
    background-color: ${props => props.active ? chroma('#5B75E6').alpha(0.2) : ""};
    &:hover {
        background-color: ${props => props.active ?  chroma('#5B75E6').alpha(0.2) : "#F4F4F6" };
    }
    cursor: pointer;
`


const AddBigButton = styled.div`
    background-color: #f4f7fa;
    display: flex;
    align-items: center;
    display: inline-flex;
    font-weight: 500;
    font-size: 1.25rem;
    border-radius: 4px;
    padding: 0.5rem 0.8rem;
    cursor: pointer;
    
    &:hover {
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
        opacity: 1;
    }
    opacity: 1;
    margin-bottom: 1rem;
`

/*
const AddButton = styled.div`
    width: 2.3rem;
    height: 2.3rem;
    background-color: #f4f7fa;
    border-radius: 0.2rem;
    opacity: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    &:hover {
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    }
    color: #172A4E;
`*/

const NoneMessage = styled.div`
    font-size: 1.4rem;
    opacity: 0.5;
`



const MenuContainer = styled.div`
    margin-left: ${props => props.mLeft};
`


const Container = styled.div`
    width: 30rem;
    display: flex;
    flex-direction: column;
    color: #172A4E;
    box-shadow: 0 2px 2px 2px rgba(60,64,67,.15);
    position: absolute;
    border-radius: 0.2rem;
    font-size: 1.4rem;
    z-index: 2;
    background-color: white;
    bottom:${props => props.flip[0] ? `${props.flip[1]}px` : ""};
    top: ${props => !props.flip[0] ? `${props.flip[1]}px` : ""};
    margin-left: ${props => props.form ? "" : "-14rem"};
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
    width: 28rem;
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
    
    background-color: white;

   
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
