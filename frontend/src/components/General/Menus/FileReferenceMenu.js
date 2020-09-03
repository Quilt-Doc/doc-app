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

//actions
import { attachReference, removeReference } from '../../../actions/Document_Actions';
import { localRetrieveReferences } from '../../../actions/Reference_Actions';

//spinner
import MoonLoader from "react-spinners/MoonLoader";

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
                    this.props.localRetrieveReferences({workspaceId, limit: 9, referenceIds: setIds, repositoryId,  sort: "-name"}).then((references) => {
                        this.setState({references, position: -1})
                    })
                } else {
                    this.props.localRetrieveReferences({workspaceId, search: this.state.search,  repositoryId,  sort: "-name",  limit: 9}).then((references) => {
                        this.setState({references, position: -1})
                    }); 
                }
            }, 200)
        });
    }

    renderMarginTop() {
        if (this.props.marginTop){
            return this.props.marginTop
        } else if (window.innerHeight - this.addButton.offsetTop + this.addButton.offsetHeight > 300) {
            return "-30rem"
        } else {
            return "-5rem"
        }
    }

    handleSelect(setBool, referenceId){
        let documentId = this.props.document._id
        let { workspaceId } = this.props.match.params;
        if (setBool) {
            this.props.removeReference({workspaceId, documentId, referenceId})
        } else {
            this.props.attachReference({workspaceId, documentId, referenceId})
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
            this.props.localRetrieveReferences({workspaceId, limit: 9, referenceIds, repositoryId}).then((references) => {
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

    renderListItems(setIds){
        return this.state.references.map((ref, i) => {
            let setBool = setIds.includes(ref._id)
                //let icon =  ref.kind === 'dir' ? <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.3rem"}} name="folder-sharp"></ion-icon> 
            //: <ion-icon style = {{marginRight: "0.5rem", fontSize: "1rem"}} name="document-outline"></ion-icon>; 
            //let color = tag.color < this.colors.length ? this.colors[tag.color] : this.colors[this.colors.length % tag.color];
            //let border = this.state.position === i ? `1px solid ${color}` : '';
            //let shadow = this.state.position === i ? 'rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px' :'';
           
            return(
                <ListItem 
                    onClick = {() => {this.handleSelect(setBool, ref._id)}} 
                    onMouseEnter = {() => {this.setState({position: i})}}
                   
                    backgroundColor = {this.state.position === i ? '#F4F4F6' : ""}
                >
                    {ref.kind === "file" ? <ion-icon 
                        style = {{fontSize: "1.5rem", marginRight: "0.7rem"}} 
                        name="document-outline"></ion-icon> : 
                        <ion-icon 
                        style = {{fontSize: "1.5rem", marginRight: "0.7rem"}} 
                        name="folder"></ion-icon>}
                    {ref.name ? ref.name : "Untitled"}
                    {setBool && <ion-icon 
                        style = {{marginLeft: "auto", fontSize: "1.5rem"}} 
                        name="checkmark-outline"></ion-icon>}
                </ListItem>
            )
        })
    }

    openMenu(e){
        e.preventDefault()
        document.addEventListener('mousedown', this.handleClickOutside, false);
        this.setState({open: true})
        let ids = this.props.setReferences.map(ref => ref._id)
        let repositoryId = this.props.document.repository._id
        let { workspaceId } = this.props.match.params;

        this.props.localRetrieveReferences({workspaceId, limit: 9, referenceIds: ids, repositoryId}).then((references) => {
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

    render() {
        let setIds = this.props.setReferences.map(ref => ref._id)
        return(
            <MenuContainer  >
                    <AddBigButton onClick = {(e) => this.openMenu(e)} ref = {addButton => this.addButton = addButton}>
                        <FontAwesomeIcon 
                            icon={faCube}
                            style = {{marginRight: "0.5rem"}}
                        />
                        Add References
                    </AddBigButton> 
                    <CSSTransition
                         in = {this.state.open}
                         unmountOnExit
                         enter = {true}
                         exit = {true}       
                         timeout = {150}
                         classNames = "dropmenu"
                    >
                        <Container marginTop = {this.renderMarginTop()} ref = {node => this.node = node}>
                            <HeaderContainer>Add References</HeaderContainer>
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
                                        onChange = {(e) => {this.searchReferences(e)}} 
                                        value = {this.state.search}
                                        autoFocus 
                                        placeholder = {"Find references..."}/>
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
        workspace: state.workspaces[workspaceId]
    }
}


export default withRouter(connect(mapStateToProps, { attachReference, removeReference, localRetrieveReferences })(FileReferenceMenu));


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
`


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
`

const NoneMessage = styled.div`
    font-size: 1.4rem;
    opacity: 0.5;
`



const MenuContainer = styled.div`
`


const Container = styled.div`
    width: 24rem;
    display: flex;
    flex-direction: column;
    color: #172A4E;
    box-shadow: 0 2px 2px 2px rgba(60,64,67,.15);
    position: absolute;
    border-radius: 0.2rem;
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
