
import React from 'react';

// react-redux
import { connect } from 'react-redux';

//components
import { CSSTransition } from 'react-transition-group';

//router
import {withRouter} from 'react-router-dom';

//chroma
import chroma from 'chroma-js';

//styles
import styled from "styled-components";

//actions
import { retrieveTags, createTag } from '../../../actions/Tag_Actions';

//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTag, faPlus } from '@fortawesome/free-solid-svg-icons'
import {BiPurchaseTag} from 'react-icons/bi';
import {BsTag} from 'react-icons/bs';
import {TiTag} from 'react-icons/ti';
//spinner
import MoonLoader from "react-spinners/MoonLoader";
import { RiAddLine } from 'react-icons/ri';

class LabelMenu extends React.Component {
    
    constructor(props){
        super(props)

        this.state = {
            open: false,
            search: '',
            typing: false,
            typingTimeout: 0, 
            create: '',
            loaded: false,
            position: 0
        }

        this.menuRef = React.createRef();
    }




    /**
     * Alert if clicked on outside of element
     */
  

    searchTags = (event) => {

        if (this.state.typingTimeout) {
           clearTimeout(this.state.typingTimeout);
        }
        
        let ids = this.props.setTags.map(tag => tag._id)
       
        let {workspaceId} = this.props.match.params
        this.setState({
           search: event.target.value,
           typing: false,
           typingTimeout: setTimeout(() => {
                if ( this.state.search === ""){
                    this.props.retrieveTags({limit: 9, tagIds: ids, workspaceId}).then(() => {
                        this.setState({create: "", position: -1})
                    })
                } else {
                    this.props.retrieveTags({search: this.state.search, limit: 9, workspaceId}).then(() => {
                        let labels = this.props.tags.map(tag => tag.label)
                        if (labels.includes(this.state.search)) {
                            this.setState({create: "", position: -1})
                        } else {
                            this.setState({create: this.state.search, position: -1})
                        }
                    });
                }
            }, 200)
        });
    }



    createTag = () => {
        this.setState({loaded: false, create: ""})
        this.props.createTag({label: this.state.search, workspaceId: this.props.workspace._id}).then((tag) => {
            this.props.attachTag(tag._id).then(() => {
                let ids = this.props.setTags.map(tag => tag._id)
                this.props.retrieveTags({limit: 9, tagIds: ids, workspaceId: this.props.workspace._id}).then(() => {
                    this.setState({loaded: true, search: ''})
                })
            })
           
        })
    }

    removeTag = (tag) => {
        this.props.removeTag(tag._id)
    }

    renderMarginTop() {
        return "1rem";
    }

    handleSelect(labelBool, tagId, tag){
        if (!this.props.form){
            if (labelBool) {
                this.props.removeTag(tagId)
            } else {
                this.props.attachTag(tagId)
            }
        } else {
            if (labelBool) {
                this.props.removeTag(tag)
            } else {
                this.props.attachTag(tag)
            }
        }
       
    }

    async setPosition(e) {
        // UP
        if (e.key === "Enter" && this.state.position >= 0) {
            
            if (this.state.position === this.props.tags.length){
                this.createTag()
            } else {
                let tag = this.props.tags[this.state.position]
                this.setState({loaded: false, create: ""})
                await this.handleSelect(this.props.setTags.map(tag => tag.label).includes(tag.label), tag._id, tag)
                let ids = this.props.setTags.map(tag => tag._id)
                this.props.retrieveTags({limit: 9, tagIds: ids, workspaceId: this.props.workspace._id}).then(() => {
                    this.setState({loaded: true, search: ''})
                })
            }
        } else if (this.state.create === "") {
            if (e.keyCode === 38) {
                if (this.state.position === 0){
                    this.setState({position: this.props.tags.length - 1})
                } else {
                    this.setState({position: this.state.position - 1})
                }
            } else if (e.keyCode === 40) {
                
                if (this.state.position > this.props.tags.length - 2){
                    this.setState({position: 0})
                } else {
                    this.setState({position: this.state.position + 1})
                }
            }
        } else {
            if (e.keyCode === 38) {
                if (this.state.position <= 0){
                    this.setState({position: this.props.tags.length})
                } else {
                    this.setState({position: this.state.position - 1})
                }
            } else if (e.keyCode === 40) {
                if (this.state.position > this.props.tags.length - 1){
                    this.setState({position: 0})
                } else {
                    this.setState({position: this.state.position + 1})
                }
            }
        }
    }

    renderTop = () => {
        if (this.addButton){
            let {top, height} = this.addButton.getBoundingClientRect();
            console.log(top + height - 100);
            return top + height + 10;
        }
        return 0;
    }

    renderLeft = () => {
        if (!this.props.dirview && this.addButton){
            let {left} = this.addButton.getBoundingClientRect();
            return left;
        } else if (this.props.dirview ) {
            return;
        }
        return 0;
    }

    renderListItems(objectLabels){
        return this.props.tags.map((tag, i) => {
            let labelBool = objectLabels.includes(tag.label)
                //let icon =  ref.kind === 'dir' ? <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.3rem"}} name="folder-sharp"></ion-icon> 
            //: <ion-icon style = {{marginRight: "0.5rem", fontSize: "1rem"}} name="document-outline"></ion-icon>; 
            let color = tag.color < this.colors.length ? this.colors[tag.color] : 
                this.colors[tag.color - Math.floor(tag.color/this.colors.length) * this.colors.length];
            let border = this.state.position === i ? `1px solid ${color}` : '';
            let shadow = this.state.position === i ? 'rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px' :'';
            return(
                <ListItem 
                    onClick = {(e) => {e.preventDefault();this.handleSelect(labelBool, tag._id, tag)}} 
                    onMouseEnter = {() => {this.setState({position: i})}}
                    border = {border}
                    shadow = {shadow}
                    color = {color} 
                    backgroundColor = {chroma(color).alpha(0.2)}
                >
                    {tag.label}
                    {labelBool && <ion-icon 
                        style = {{marginLeft: "auto", fontSize: "1.5rem"}} 
                        name="checkmark-outline"></ion-icon>}
                </ListItem>
            )
        })
    }

    openMenu(e){
        e.preventDefault()
        document.addEventListener('mousedown', this.handleClickOutside, false);
        this.setState({open: true, 
                       left: this.renderLeft(), 
                       top: this.renderTop()
                        })
        let ids = this.props.setTags.map(tag => tag._id)
        this.props.retrieveTags({limit: 9, tagIds: ids, workspaceId: this.props.workspace._id}).then(() => {
            this.setState({loaded: true})
        })
    }

    closeMenu(){
        document.removeEventListener('mousedown', this.handleClickOutside, false);
        this.setState({ 
            open: false,
            loaded: false,
            search: '',
            typing: false,
            typingTimeout: 0, 
            create: '',
            position: -1})
    }

    handleClickOutside = (event) => {
        if (this.node && !this.node.contains(event.target)) {
            this.closeMenu()
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

    renderListContent = (flip, objectLabels) => {
        if (flip[0]) {
            return(
                <>
                    <ListContainer>
                        {this.state.loaded ?  this.renderListItems(objectLabels) : <MoonLoader size = {12}/>}
                        {this.state.create !== "" &&
                            <ListCreate 
                                onMouseEnter = {() => this.setState({position: this.props.tags.length})} 
                                onClick = {() => {this.createTag()}}
                                border = {this.state.position === this.props.tags.length ? `1px solid ${chroma("#172A4E").alpha(0.7)}` : ''}
                                shadow = {this.state.position === this.props.tags.length ? 'rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px' :''}
                            >
                                {`Create "${this.state.create}"`}
                            </ListCreate>
                        }
                    </ListContainer>
                    <SearchbarContainer>
                        <Searchbar 
                            onKeyDown = {(e) => this.setPosition(e)}  
                            onChange = {(e) => {this.searchTags(e)}} 
                            value = {this.state.search}
                            autoFocus 
                            placeholder = {"Find labels..."}
                        />
                    </SearchbarContainer>
                    <HeaderContainer>Add labels</HeaderContainer>
                </>
            )
        } else {
            return(
                <>
                    <HeaderContainer>Add labels</HeaderContainer>
                    <SearchbarContainer>
                        <Searchbar 
                            onKeyDown = {(e) => this.setPosition(e)}  
                            onChange = {(e) => {this.searchTags(e)}} 
                            value = {this.state.search}
                            autoFocus 
                            placeholder = {"Find labels..."}
                        />
                    </SearchbarContainer>
                    <ListContainer>
                        {this.state.loaded ?  this.renderListItems(objectLabels) : <MoonLoader size = {12}/>}
                        {this.state.create !== "" &&
                            <ListCreate 
                                onMouseEnter = {() => this.setState({position: this.props.tags.length})} 
                                onClick = {() => {this.createTag()}}
                                border = {this.state.position === this.props.tags.length ? `1px solid ${chroma("#172A4E").alpha(0.7)}` : ''}
                                shadow = {this.state.position === this.props.tags.length ? 'rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px' :''}
                            >
                                {`Create "${this.state.create}"`}
                            </ListCreate>
                        }
                    </ListContainer>
                </>
            )
        }
    }


    render() {
        this.colors = ['#5352ed', 
        '#ff4757', '#20bf6b','#1e90ff', '#ff6348', '#e84393', '#1e3799', '#b71540', '#079992'
        ]

        let objectLabels = this.props.setTags.map(tag => tag.label)
        let flip = this.renderFlip()
        return(
            <MenuContainer  >
                {this.props.form ?
                    <AddButton 
                        ref = {addButton => this.addButton = addButton} 
                        onClick = {(e) => this.openMenu(e)}
                        active = {this.state.open}
                    >
                        <RiAddLine />
                    </AddButton> :
                    <PageIcon 
                        active = {this.state.open} onClick = {(e) => this.openMenu(e)} ref = {addButton => this.addButton = addButton}>
                        <TiTag style = {{fontSize: "1.5rem", marginRight: "0.5rem", marginTop: "0.1rem"}}/>
                        <Title3>Add Labels</Title3>
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
                        ref = {node => this.node = node}
                        flip = {flip}
                        form = {this.props.form}
                        dirview = { this.props.dirview }
                    >
                        {this.renderListContent(flip, objectLabels)}
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



export default withRouter(connect(mapStateToProps, { retrieveTags, createTag })(LabelMenu));



const PageIcon = styled.div`
    opacity: ${props => props.active ? 1 : 0.9};
    display: flex;
    align-items: center;
    font-size: 1.4rem;
   
   /*color: white;*/
    /*background-color: #4c5367;*/
   /* opacity: 0.8;*/
   padding: 0.5rem 1rem;
    &:hover {
        background-color: ${props => props.active ? chroma('#5B75E6').alpha(0.2) : "#F4F4F6"};
        
    }
    background-color: ${props => props.active ? chroma('#5B75E6').alpha(0.2) : ""};
    cursor: pointer;
    border-radius: 0.3rem;
`

const Title3 = styled.div`
    font-size: 1.2rem;
    margin-right: 0.3rem;
    font-weight: 400;
`

const Title = styled.div`
    font-weight: 500;
`

const AddBigButton = styled.div`
    background-color:white;
    display: flex;
    align-items: center;
    display: inline-flex;
    font-weight: 500;
    font-size: 1.35rem;
    border-radius: 4px;
    padding: 0.35rem 0.8rem;
    cursor: pointer;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    &:hover {
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
        opacity: 1;
    }
    opacity: 1;
    margin-bottom: 1rem;
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

const Container = styled.div`
    width: 28rem;
    display: flex;
    flex-direction: column;
    color: #172A4E;
    box-shadow: 0 2px 2px 2px rgba(60,64,67,.15);
    position: absolute;
    border-radius: 0.2rem;
    font-size: 1.4rem;
    z-index: 3;
    background-color: white;
    bottom:${props => props.flip[0] ? `${props.flip[1]}px` : ""};
    top: ${props => !props.flip[0] ? `${props.flip[1]}px` : ""};
    margin-left: ${props => props.form ? "" : "-16.8rem"};
`

const SearchbarContainer = styled.div`
    height: 5.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid #E0E4E7;
    border-bottom:  1px solid #E0E4E7;
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
    border-radius: 0.4rem;
    margin-bottom: 0.7rem;
    color: #2980b9;
    padding: 1rem;
    display: flex;
    align-items: center;
   
    background-color: rgba(51, 152, 219, 0.1);

   
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

const Searchbar = styled.input`
    width: 26rem;
    height: 3.5rem;
    border: 1px solid  #E0E4E7;
    background-color: #F7F9FB;
    border-radius: 0.4rem;
    padding: 1.5rem;
    &:focus {
        background-color: white;
        border: 2px solid #2684FF;

    }
    &::placeholder {
        color: #172A4E;
        opacity: 0.4;
    }
    outline: none;
    font-size: 1.4rem;
    color: #172A4E;
    
`