
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
import { object } from 'prop-types';

//spinner
import MoonLoader from "react-spinners/MoonLoader";

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
    handleClickOutside = (event) => {
        if (this.node && !this.node.contains(event.target)) {
            this.closeMenu()
        }
    }


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
        if (this.props.marginTop){
            return this.props.marginTop
        } else if (window.innerHeight - this.addButton.offsetTop + this.addButton.offsetHeight > 300) {
            return "-30rem"
        } else {
            return "-5rem"
        }
    }

    handleSelect(labelBool, tagId){
        if (labelBool) {
            this.props.removeTag(tagId)
        } else {
            this.props.attachTag(tagId)
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
                await this.handleSelect(this.props.setTags.map(tag => tag.label).includes(tag.label), tag._id)
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

    renderListItems(objectLabels){
        return this.props.tags.map((tag, i) => {
            let labelBool = objectLabels.includes(tag.label)
                //let icon =  ref.kind === 'dir' ? <ion-icon style = {{marginRight: "0.5rem", fontSize: "1.3rem"}} name="folder-sharp"></ion-icon> 
            //: <ion-icon style = {{marginRight: "0.5rem", fontSize: "1rem"}} name="document-outline"></ion-icon>; 
            let color = tag.color < this.colors.length ? this.colors[tag.color] : 
                this.colors[tag.color - Math.floor(tag.color/this.colors.length) * this.colors.length];
            let border = this.state.position === i ? `1px solid ${color}` : '';
            let shadow = this.state.position === i ? 'rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px' :'';
            console.log("COLORES", color)
            return(
                <ListItem 
                    onClick = {() => {this.handleSelect(labelBool, tag._id)}} 
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

    openMenu(){
        document.addEventListener('mousedown', this.handleClickOutside, false);
        let ids = this.props.setTags.map(tag => tag._id)
        this.props.retrieveTags({limit: 9, tagIds: ids, workspaceId: this.props.workspace._id}).then(() => {
            this.setState({loaded: true, open:true})
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

    render() {
        this.colors = ['#5352ed', 
        '#ff4757', '#20bf6b','#1e90ff', '#ff6348', '#e84393', '#1e3799', '#b71540', '#079992'
        ]
        console.log("TAGS", this.props.setTags)
        let objectLabels = this.props.setTags.map(tag => tag.label)
        return(
            <MenuContainer  >
                {!this.props.modalButton ?
                    <AddButton ref = {addButton => this.addButton = addButton} onClick = {() => this.openMenu()}>
                        <ion-icon style = {{fontSize: "1.5rem"}} name="add-outline"></ion-icon>
                    </AddButton> :
                    <ModalToolbarButton onClick = {() => this.openMenu()}>
                        <ion-icon name="pricetag-outline" style={{ 'fontSize': '2.3rem', 'marginRight': '0.7rem'}}></ion-icon> 
                        {this.props.setTags.length}  
                    </ModalToolbarButton>
                }
                {this.state.open && 
                    <CSSTransition
                        in={true}
                        appear = {true}
                        timeout={100}
                        classNames="menu"
                    >
                    <Container marginLeft = {this.props.marginLeft} marginTop = {this.renderMarginTop()} ref = {node => this.node = node}>
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


const ModalToolbarButton = styled.div`
    display: flex;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    padding: 0.8rem;
    font-size: 1.4rem;
    
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
    width: 28rem;
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
    margin-left: ${props => props.marginLeft};
`

const SearchbarContainer = styled.div`
    height: 5.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom:  1px solid #E0E4E7;
`

const HeaderContainer = styled.div`
    height: 3.5rem;
    display: flex;
    align-items: center;
    font-size: 1.3rem;
    padding: 1rem;
    color: #172A4E;
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