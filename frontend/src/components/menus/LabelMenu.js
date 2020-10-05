
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
import { createTag } from '../../actions/Tag_Actions';

//icons
import { RiCheckFill } from 'react-icons/ri';
import { RiAddLine } from 'react-icons/ri';

//spinner
import MoonLoader from "react-spinners/MoonLoader";


class LabelMenu extends React.Component {
    
    constructor(props){
        super(props)

        this.state = {
            open: false,
            loaded: false,
            position: 0,
            currentTags: []
        }

        this.menuRef = React.createRef();
    }




    /**
     * Alert if clicked on outside of element
     */
  

    searchTags = () => {

        const { tags } = this.props;
        const search = this.input ? this.input.value : "";

        if (search === "") {
            this.reset();
        } else {
            let currentTags = tags.filter(tag => tag.label.includes(search)).slice(0, 9);
            this.setState({position: -1, currentTags});
        }
    }

    reset = () => {
        const { setTags, tags } = this.props;

        let ids = setTags.map(tag => tag._id)
        let currentTags = setTags.slice(0, 9);
        if (setTags.length < 9) {
            let filtered = tags.filter(tag => !(ids.includes(tag._id)))
            filtered = filtered.slice(0, 9 - setTags.length);
            currentTags = [...currentTags, ...filtered];
        }

        this.setState({position: -1, currentTags, loaded: true});
    }

    createTag = async () => {
        const { createTag, match, attachTag, setTags, form } = this.props;
        const { workspaceId } = match.params;

        this.setState({ loaded: false });

        const tag = await createTag({label: this.input ? this.input.value : "", workspaceId});

        await attachTag(tag);

        this.reset();
    }


    handleSelect(tag){
        const { setTags, form, attachTag, removeTag } = this.props;

        const ids = setTags.map(tag => tag._id);
        const isIncluded = ids.includes(tag._id);


        if (isIncluded) {
            removeTag(tag);
        } else {
            attachTag(tag);
        }
    }

    async setPosition(e) {
        // UP
        const { position, currentTags } = this.state;
       
        if (e.key === "Enter" && position >= 0) {
            let tag = currentTags[position];

            this.setState({loaded: false});
            
            await this.handleSelect(tag);

            this.reset();
        } else {
            let newPosition;
            if (e.keyCode === 38) {
                if (position === -1) {
                    newPosition = currentTags.length - 1;
                } else {
                    newPosition = position - 1;
                }
            } else if (e.keyCode === 40) {
                if (position === currentTags.length - 1) {
                    newPosition = -1;
                } else {
                    newPosition = position + 1;
                }
            }
            this.setState({position: newPosition});
        }
    }

    renderColor = (tag) => {
        let colors = ['#5352ed', '#ff4757', '#20bf6b','#1e90ff', '#ff6348', 
            '#e84393', '#1e3799', '#b71540', '#079992'];

         return tag.color < colors.length ? colors[tag.color] : 
            colors[tag.color - Math.floor(tag.color/colors.length) * colors.length];
    }

    renderListItems(){
        //console.log("HERE LOADED LIST ITEMS");
        const { setTags, tags } = this.props;
        const { currentTags, position } = this.state;
        
        console.log("SET TAGS", setTags);
        
        const selectedLabels = setTags.map(tag => tag.label);
        let contentJSX = currentTags.map((tag, i) => {
            let isSelected = selectedLabels.includes(tag.label);
            
            let color = this.renderColor(tag);
            let border = position === i ? `1px solid ${color}` : '';
            let shadow = position === i ? 'rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px' :'';
           
            return(
                <ListItem 
                    onClick = {(e) => { e.preventDefault(); this.handleSelect(tag)}} 
                    onMouseEnter = {() => {this.setState({position: i})}}
                    border = {border}
                    shadow = {shadow}
                    color = {color} 
                    backgroundColor = {chroma(color).alpha(0.2)}
                >
                    {tag.label}
                    { isSelected && 
                        <RiCheckFill style = {{marginLeft: "auto", fontSize: "2rem"}} />
                    }
                </ListItem>
            )
        })

        const value = this.input ? this.input.value : "";
        const labels = tags.map(tag => tag.label);
        const canCreate = (!labels.includes(value) && value !== "");

        if (canCreate) {
            contentJSX.push(
                <ListCreate onClick = {() => {this.createTag()}}>
                    {`Create "${value}"`}
                </ListCreate>
            )
        }
            
        return contentJSX;
    }

    openMenu(e){
        e.preventDefault()
        document.addEventListener('mousedown', this.handleClickOutside, false);
        this.reset();
        this.setState({ open: true });
    }

    closeMenu(){
        document.removeEventListener('mousedown', this.handleClickOutside, false);
        this.setState({ open: false, loaded: false, position: -1})
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

    renderListContainer = () => {
        const { loaded } = this.state;
        const { tags } = this.props;
        const value = this.input ? this.input.value : "";
        if (value !== "" || tags.length > 0) {
            return (
                <ListContainer>
                    { loaded ?  this.renderListItems() : <LoaderContainer><MoonLoader size = {12}/></LoaderContainer>}
                </ListContainer>
            )
        } else {
            return (
                <Placeholder>No tags in workspace. Type to create!</Placeholder>
            )
        }
    }

    renderSearchContainer = () => {
        return (
            <SearchbarContainer>
                <Searchbar 
                    ref = {node => this.input = node}
                    onKeyDown = {(e) => this.setPosition(e)}  
                    onChange = {(e) => {this.searchTags(e)}} 
                    autoFocus 
                    placeholder = {"Find labels..."}
                />
            </SearchbarContainer>
        )
    }

    renderListContent = (flip) => {
        if (flip[0]) {
            return(
                <>
                    {this.renderListContainer()}
                    {this.renderSearchContainer()}
                    <HeaderContainer>Add labels</HeaderContainer>
                </>
            )
        } else {
            return(
                <>
                    <HeaderContainer>Add labels</HeaderContainer>
                    {this.renderSearchContainer()}
                    {this.renderListContainer()}
                </>
            )
        }
    }


    render() {
        const { open } = this.state;
        const { form } = this.props;

        this.colors = ['#5352ed', 
            '#ff4757', '#20bf6b','#1e90ff', '#ff6348', '#e84393', '#1e3799', '#b71540', '#079992'
        ]

        let flip = this.renderFlip()
        return(
            <MenuContainer  >
                <AddButton 
                    ref = {addButton => this.addButton = addButton} 
                    onClick = {(e) => this.openMenu(e)}
                    active = {open}
                >
                    <RiAddLine />
                </AddButton>
                <CSSTransition
                    in = {open}
                    unmountOnExit
                    enter = {true}
                    exit = {true}       
                    timeout = {150}
                    classNames = "dropmenu"
                >
                    <Container 
                        ref = {node => this.node = node}
                        flip = {flip}
                        form = {form}
                    >
                        {this.renderListContent(flip)}
                    </Container>
                </CSSTransition>
            </MenuContainer>
        )
    }
    
}

const mapStateToProps = (state) => {
    let { tags } = state;
    return {
       tags: Object.values(tags)
    }
}

export default withRouter(connect(mapStateToProps, { createTag })(LabelMenu));

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
    ${props => (props.form && props.flip[0]) ? `bottom: ${props.flip[1]}px` : ""};
    ${props => (props.form && !props.flip[0]) ? `top: ${props.flip[1]}px` : ""};
    margin-top: ${props => !props.form ? "10px": ""};
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

const ListContainer = styled.div`
    display: flex;
    flex-direction: column;
    padding: 1rem;
`

const LoaderContainer = styled.div`
    height: 10rem;
`

const Placeholder = styled.div`
    height: 10rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #172A4E;
    font-weight: 500;
    opacity: 0.7;
    font-size: 1.3rem;
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
    &:hover {
        border: 1px solid ${chroma("#172A4E").alpha(0.7)};
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    }
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