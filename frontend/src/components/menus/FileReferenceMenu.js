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
import {RiCheckFill, RiFileLine, RiAddLine, RiScissorsLine} from 'react-icons/ri'
import {AiFillFolder} from 'react-icons/ai';

//actions
import { attachDocumentReference, removeDocumentReference } from '../../actions/Document_Actions';
import { retrieveReferences, searchReferences} from '../../actions/Reference_Actions';

//loader
import { Oval } from 'svg-loaders-react';

//scrollIntoView
import scrollIntoView from 'scroll-into-view-if-needed'

//spinner
import { HiCheckCircle } from 'react-icons/hi';

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
        this.listItems = {};
        this.orderedRefs = [];
    }

    /**
     * Alert if clicked on outside of element
     */
    handleClickOutside = (event) => {
        if (this.node && !this.node.contains(event.target)) {
            this.closeMenu()
        }
    }

    checkScroll = () => {
        let { position } = this.state;

        if (position === -1) position = 0;

        const reference = this.orderedRefs[position + 1];

        let menuButton;
        if (reference) {
            menuButton = this.listItems[reference._id];
        }

        console.log("MENU BUTTON", menuButton);
        if (menuButton) {
            scrollIntoView(menuButton, {
                scrollMode: 'if-needed',
                block: 'nearest',
                inline: 'nearest',
                behavior: 'smooth'
            });
        }
    }


    searchReferences = async () => {

        const { typingTimeout } = this.state; 
        const { document: {repository}, searchReferences } = this.props;

        if (typingTimeout) {
           clearTimeout(this.state.typingTimeout);
        }

        let repositoryId  = repository._id;

        this.setState({
           search: this.input.value,
           typing: false,
           typingTimeout: setTimeout(async () => {
                let { workspaceId } = this.props.match.params;
                this.setState({loaded: false});
                if ( this.state.search === ""){
                   this.reset();
                } else {
                    let references = await searchReferences({workspaceId, userQuery: this.state.search,  repositoryId,  sort: "-name",  limit: 9}, true);
                    this.setState({references, position: -1});
                }
                this.setState({loaded: true});
            }, 100)
        });
    }

    reset = async () => {
        const { setReferences, retrieveReferences, match } = this.props;
        const { workspaceId } = match.params;
        const { document: { repository: {_id} }, searchReferences } = this.props;

        let setIds = setReferences.map(ref => ref._id);
        
        let references = await retrieveReferences({workspaceId, 
            limit: 9, referenceIds: setIds, repositoryId: _id,  sort: "-name", filterRoot: true}, true);
        
        this.setState({references, position: -1, loaded: true, search: ""});
    }

    handleSelect = (reference) => {
        const { setReferences, form, formRemoveReference, formAttachReference,
            removeDocumentReference, attachDocumentReference} = this.props;

        let setIds = setReferences.map(ref => ref._id);
        let isSelected = setIds.includes(reference._id);

        if (!form){
            let documentId = this.props.document._id
            let { workspaceId } = this.props.match.params;
            if (isSelected) {
                removeDocumentReference({workspaceId, documentId, referenceId: reference._id});
            } else {
                attachDocumentReference({workspaceId, documentId, referenceId: reference._id});
            }
        } else {
            if (isSelected) {
                formRemoveReference(reference)
            } else {
                formAttachReference(reference)
            }
        }
     
    }

    async setPosition(e) {
        const { references, position } = this.state;

        if (e.key === "Enter" && position >= 0) {
            let ref = references[position];
            this.setState({loaded: false});
            await this.handleSelect(ref);
            this.reset()
        } else {
            if (e.keyCode === 38) {
                if (position < 0){
                    this.setState({position: references.length - 1});
                } else {
                    this.setState({position: position - 1});
                }
            } else if (e.keyCode === 40) {
                if (position === references.length - 1){
                    this.setState({position: -1});
                } else {
                    this.setState({position: position + 1})
                }
            }
        } 

        this.checkScroll();
    }


    renderPath = (path) => {
        let splitPath = path.split('/');

        let pathLength = splitPath.length;

        if (pathLength > 3) {
            splitPath = [splitPath[0], '...', splitPath[pathLength - 2], splitPath[pathLength - 1]]
        }


        return(
            <Path>
                {splitPath.map((part, i) => {
                    let last = i === splitPath.length - 1;
                    return (
                        <>
                        <PathSection>
                            {part}
                        </PathSection>
                        {(!last) && 
                            <PathSlash>
                                /
                            </PathSlash>
                        }
                        </>
                    )
                })}
            </Path>
        )
    }   

    renderListItems(){
        let { references, position} = this.state;
        const { setReferences } = this.props;

        const setIds = setReferences.map(ref => ref._id);

        references = [...references];

        if (references.length === 0) {
            return (
                <Placeholder>
                    <RiFileLine
                        style = {{fontSize: "3rem", opacity: 0.4}}
                    />
                    <PlaceholderText>No reference results for query.</PlaceholderText>
                </Placeholder>
            )
        }

        references.sort((a, b) => {
            if (a.name > b.name){
                return 1
            } else {
                return -1
            }
        })

        let dirs = references.filter((ref) => {
            return ref.kind === "dir"
        })
        let files = references.filter((ref) => {
            return ref.kind === "file"
        })

        let listItems = {}

        let jsx = []
        let i = 0;
        let orderedRefs = []
        dirs.map((ref) => {
            let isSelected = setIds.includes(ref._id);
            let temp = i
            orderedRefs.push(ref);
            jsx.push(            
                <ListItem 
                    onClick = {() => {this.handleSelect(ref)}} 
                    onMouseEnter = {() => {this.setState({position: temp})}}
                    backgroundColor = {position === temp ? '#F4F4F6' : ""}
                    ref = { node => listItems[ref._id] = node }
                    key = { ref._id }
                 >
                    <AiFillFolder
                        style = {{fontSize: "1.7rem", marginRight: "1rem"}}
                    />
                    <ListItemDetail>
                        <Title>{ref.name ? ref.name : "Untitled"}</Title>
                        {this.renderPath(ref.path)}
                    </ListItemDetail>
                    {isSelected && 
                        <HiCheckCircle
                            style = {{ color: "#19e5be", marginLeft: "auto", fontSize: "2rem"}} 
                        />
                    }
                </ListItem>
            )
            i += 1;
        })

        files.map((ref) => {
            let isSelected = setIds.includes(ref._id);
            let temp = i
            orderedRefs.push(ref);
            jsx.push(
                <ListItem 
                    onClick = {() => {this.handleSelect(ref)}} 
                    onMouseEnter = {() => {this.setState({position: temp})}}
                    backgroundColor = {position === temp ? '#F4F4F6' : ""}
                    ref = { node => listItems[ref._id] = node }
                    key = { ref._id }
                 >
                    <RiFileLine
                        style = {{fontSize: "1.7rem", marginRight: "1rem"}}
                    />
                    <ListItemDetail>
                        <Title>{ref.name ? ref.name : "Untitled"}</Title>
                        {this.renderPath(ref.path)}
                    </ListItemDetail>
                    {isSelected && 
                        <RiCheckFill
                            style = {{ color: "#19e5be", marginLeft: "auto", fontSize: "2rem"}} 
                        />
                    }
                </ListItem>
            )
            i += 1;
        })

        this.listItems = listItems;
        this.orderedRefs = orderedRefs;

        return jsx;
    }

    openMenu(e){
        e.preventDefault();
        document.addEventListener('mousedown', this.handleClickOutside, false);
        this.setState({ open: true });
        this.reset();
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

    renderSearchBar = () => {
        return(
            <SearchbarWrapper>
                <RiFileLine
                    style = {{
                        fontSize: "1.7rem",  
                        minWidth: "3rem",
                        opacity: 0.4
                    }}
                />
                <SearchInput 
                    autoFocus = {true}
                    ref = {node => this.input = node} 
                    onChange = {this.searchReferences} 
                    onKeyDown = {(e) => this.setPosition(e)}  
                    placeholder = {"Search for references to attach"}
                />
            </SearchbarWrapper>
        )

        const {focused} = this.state;
        return (
            <SearchbarContainer>
                <SearchbarWrapper 
                    backgroundColor = {focused ? "white" : "#F7F9FB"}
                    border = {focused ? "2px solid #2684FF" : "1px solid #E0E4E7;"}
                >
                    <Searchbar 
                        ref = {node => this.input = node}
                        onFocus = {() => {this.setState({focused: true})}} 
                        onBlur = {() => {this.setState({focused: false})}} 
                        onKeyDown = {(e) => this.setPosition(e)}  
                        onChange = {(e) => {this.searchReferences(e)}} 
                        autoFocus 
                        placeholder = {"Find references..."}/>
                </SearchbarWrapper>
            </SearchbarContainer>
        )
    }

    renderLoader = () => {
        return (
            <Placeholder>
                <Oval stroke={'#DFDFDF'}/>
            </Placeholder>
        )
    }

    renderListContent = (flip) => {
        if (flip[0]){
            return(
                <>
                    <ListContainer>
                        {this.state.loaded ?  this.renderListItems() : this.renderLoader()}
                    </ListContainer>
                    {this.renderSearchBar()}
                    <HeaderContainer>Attach References</HeaderContainer>
                </>
            )
        } else {
            return(
                <>
                    {/*<HeaderContainer>Attach References</HeaderContainer>*/}
                    {this.renderSearchBar()}
                    <ListContainer>
                        {this.state.loaded ?  this.renderListItems() : this.renderLoader()}
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
        let flip = this.renderFlip()
        const { form } = this.props;
        const { open } = this.state;
        return(
            <MenuContainer >
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
                        form = {form}
                        ref = {node => this.node = node}
                        flip = {flip}
                    >
                        {this.renderListContent(flip)}
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


export default withRouter(connect(mapStateToProps, { attachDocumentReference, removeDocumentReference, retrieveReferences, searchReferences })(FileReferenceMenu));

const Placeholder = styled.div`
    height: 10rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`

const PlaceholderText = styled.div`
    margin-top: 1rem;
    font-size: 1.4rem;
    opacity: 0.5;
`       

const Path = styled.div`
    opacity: 0.5;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    width: 30rem;
    font-size: 1.1rem;
    display: flex;
`

const PathSection = styled.div`
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    max-width: 10rem;
`

const PathSlash = styled.div`
    padding-left: 0.5rem;
    padding-right: 0.5rem;
`

const SearchbarWrapper = styled.div`
    height: 4.5rem;
    padding: 0 0.5rem;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #E0E4E7;
`

const SearchInput = styled.input`
    height: 2rem;
    outline: none;
    border: none;
    background-color:transparent;
    &::placeholder {
        color: #172A4E;
        opacity: 0.4;
    }
    width: 100%;
    padding-right: 2rem;
    padding-left: 0.5rem;
    font-size: 1.3rem;
`

const Title = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-weight: 500;
    width: 30rem;
    font-size: 1.3rem;
    margin-bottom: 0.9rem;
`

const AddButton = styled.div`
    height: 3rem;
    width: 3rem;
    /*border: 1px solid ${props => props.active ? chroma('#6762df').alpha(0.2) : "#E0E4e7"}; */
    border-radius: 50%;
    
    font-size: 1.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    
    /*box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);*/
    /*
    background-color: ${props => props.active ? chroma('#6762df').alpha(0.2) : ""};
    */
    &:hover {
        background-color: ${chroma('#6762df').alpha(0.2)};
    }
    background-color: ${chroma('#6762df').alpha(0.1)};
    cursor: pointer;
`

const MenuContainer = styled.div`
`

const Container = styled.div`
    width: 40rem;
    display: flex;
    flex-direction: column;
    color: #172A4E;
    box-shadow: 0 30px 60px -12px rgba(50,50,93,0.25),0 18px 36px -18px rgba(0,0,0,0.3);
    position: absolute;
    border-radius: 0.4rem;
    font-size: 1.4rem;
    z-index: 2;
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
/*
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
*/
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

const ListContainer = styled.div`
    display: flex;
    flex-direction: column;
    max-height: 31.5rem;
    overflow-y: scroll;
    padding-bottom: 0.5rem;
`

const ListItem = styled.div`
    border-radius: 0.3rem;
    margin-bottom: 0rem
    color: #172A4E;
    padding: 1.2rem 1rem;
    display: flex;
    background-color: white;
    cursor: pointer;
    color: ${props => props.color};
    background-color: ${props => props.backgroundColor};
    border-bottom: ${props => props.border};
    box-shadow: ${props => props.shadow};
`

const ListItemDetail = styled.div`
    display: flex;
    flex-direction: column;
`