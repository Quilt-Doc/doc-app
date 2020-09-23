
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
import { retrieveChildren, attachReference, removeReference } from '../../../actions/Document_Actions';

//spinner
import MoonLoader from "react-spinners/MoonLoader";
import { RiStackLine } from 'react-icons/ri';

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
                    this.props.retrieveChildren({limit: 9, documentIds: ids, workspaceId}).then((documents) => {
                        this.setState({documents, position: -1})
                    })
                } else {
                    this.props.retrieveChildren({search: this.state.search, workspaceId, sort: "-title",  limit: 9}).then((documents) => {
                        this.setState({documents, position: -1})
                    });
                }
            }, 200)
        });
    }

    renderMarginTop() {
        return 0;
        if (this.props.marginTop){
            return this.props.marginTop
        } else if (window.innerHeight - this.addButton.offsetTop + this.addButton.offsetHeight > 300) {
            return "-30rem"
        } else {
            return "-5rem"
        }
    }

    handleSelect(setBool, documentId){
        let { workspaceId } = this.props.match.params;
        let referenceId = this.props.reference._id
        if (setBool) {
            this.props.removeReference({workspaceId, documentId, referenceId})
        } else {
            this.props.attachReference({workspaceId, documentId, referenceId})
        }
    }

    async setPosition(e) {
        // UP
        let { workspaceId } = this.props.match.params;
        if (e.key === "Enter" && this.state.position >= 0) {
            let doc = this.state.documents[this.state.position]
            this.setState({loaded: false})
            let documentIds = this.props.setDocuments.map(document => document._id)
            await this.handleSelect(documentIds.includes(doc._id), doc._id)
            this.props.retrieveChildren({limit: 9, documentIds, workspaceId}).then((documents) => {
                this.setState({loaded: true, search: '', documents})
            })
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
                //let icon =  ref.kind === 'dir' ? <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.3rem"}} name="folder-sharp"></ion-icon> 
            //: <ion-icon style = {{marginRight: "0.5rem", fontSize: "1rem"}} name="document-outline"></ion-icon>; 
            //let color = tag.color < this.colors.length ? this.colors[tag.color] : this.colors[this.colors.length % tag.color];
            //let border = this.state.position === i ? `1px solid ${color}` : '';
            //let shadow = this.state.position === i ? 'rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px' :'';
           
            return(
                <ListItem 
                    onClick = {() => {this.handleSelect(setBool, doc._id)}} 
                    onMouseEnter = {() => {this.setState({position: i})}}
                   
                    backgroundColor = {this.state.position === i ? '#F4F4F6' : ""}
                >
                    <ion-icon 
                        style = {{fontSize: "1.5rem", marginRight: "0.7rem"}} 
                        name="document-text-outline"></ion-icon>
                    {doc.title ? doc.title : "Untitled"}
                    {setBool && <ion-icon 
                        style = {{marginLeft: "auto", fontSize: "1.5rem"}} 
                        name="checkmark-outline"></ion-icon>}
                </ListItem>
            )
        })
    }

    openMenu(){
        document.addEventListener('mousedown', this.handleClickOutside, false);
        let ids = this.props.setDocuments.map(doc => doc._id)
        let { workspaceId } = this.props.match.params
        this.props.retrieveChildren({limit: 9, documentIds: ids, workspaceId}).then((documents) => {
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
        return(
            <MenuContainer  
                mLeft = {this.props.mLeft}
            >
                <PageIcon 
                    
                    active = {this.state.open} 
                    onClick = {(e) => {this.openMenu()}} 
                >
                    <RiStackLine style = {{fontSize: "1.5rem", marginRight: "0.5rem"}}/>
                    <Title>Attach Information</Title>
                </PageIcon>

                    <CSSTransition
                        in={this.state.open}
                        enter = {true}
                        exit = {true}
                        unmountOnExit = {true}
                        timeout={150}
                        classNames="dropmenu"
                    >
                    <Container marginTop = {this.renderMarginTop()} ref = {node => this.node = node}>
                        <HeaderContainer>Attach Information</HeaderContainer>
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



export default withRouter(connect(mapStateToProps, { attachReference, removeReference, retrieveChildren })(DocumentMenu));

const Title = styled.div`
    font-size: 1.2rem;
    margin-right: 0.3rem;
    font-weight: 400;
`

const PageIcon = styled.div`
    margin-right: 1.2rem;
    display: flex;
    align-items: center;
    font-size: 1.5rem;
    opacity: ${props => props.active ? 1 : 0.9};
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


const MenuContainer = styled.div`
    margin-left: ${props => props.mLeft ? props.mLeft : "0rem"};
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
    z-index: 3;
    margin-top: 0.5rem;
    background-color: white;
    margin-left: -8rem;
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
