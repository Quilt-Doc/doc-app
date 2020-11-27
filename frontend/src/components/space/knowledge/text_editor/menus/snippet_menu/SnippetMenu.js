import React from 'react';

// react-redux
import { connect } from 'react-redux';

//router
import {withRouter} from 'react-router-dom';

//utility
import scrollIntoView from 'scroll-into-view-if-needed'

//styles
import styled from "styled-components";
import chroma from 'chroma-js';

//components
import { CSSTransition } from 'react-transition-group';
import DocumentReferenceEditor from './DocumentReferenceEditor';

//slate
import { ReactEditor } from 'slate-react'

//icons
import { RiFileLine } from 'react-icons/ri'
import { RiScissorsLine } from 'react-icons/ri';
import {AiFillFolder} from 'react-icons/ai';

//actions
import { retrieveReferences, searchReferences} from '../../../../../../actions/Reference_Actions';

//types
import { SET_SNIPPET_MENU_ACTIVE } from '../../editor/reducer/Editor_Types'

//spinner
import MoonLoader from "react-spinners/MoonLoader";

class SnippetMenu extends React.Component {
    
    constructor(props){
        super(props)

        this.state = {
            open: false,
            typing: false,
            typingTimeout: 0, 
            loaded: false,
            position: -1,
            references: [],
            openedReference: null
        }

        this.menuRef = React.createRef();
        this.listItems = {};
    }

    componentDidMount = () => {
        const { editor, dispatch } = this.props;
        const { selection } = editor;
        if (selection) {
            this.reset();

            const path = [selection.anchor.path[0]];
            const offset = selection.anchor.offset;

            const range = {anchor: {offset, path}, focus: {offset, path}};
            const rect = this.calculateRect(ReactEditor.toDOMRange(editor, range).getBoundingClientRect());

            this.setState({range: selection, rect, open: true});
            
            window.addEventListener('keydown', this.handleKeyDown, false);
            document.addEventListener('mousedown', this.handleClickOutside, false);

            this.setState({loaded: true});
        } else {
            dispatch({type: SET_SNIPPET_MENU_ACTIVE, payload: false});
        }   
    }

    componentDidUpdate = (prevProps, prevState) => {
        const { position } = this.state
        if (prevState.position !== position) {
            this.checkScroll();
        }
    }   

    checkScroll = () => {
        let { position, references } = this.state;

        if (position === -1) position = 0;

        const reference = references[position];

        let menuButton;
        if (reference) {
            menuButton = this.listItems[reference._id];
        }

        if (menuButton) {
            scrollIntoView(menuButton, {
                scrollMode: 'if-needed',
                block: 'nearest',
                inline: 'nearest',
                behavior: 'smooth'
            });
        }
    }

    calculateRect = (clientRect) => {
        const { documentModal } = this.props;

        const { top, left, height } = clientRect;
        let rect = { top, left, height };
        
       
        /*
        if (this.menu.current) {
            if (rect.top + 385 - 100 > window.innerHeight){
                rect.top = rect.top - 385;
            }
        }*/

        const parentRect = document.getElementById('editorSubContainer').getBoundingClientRect();

        rect.top = rect.top - parentRect.top;
        rect.left = rect.left - parentRect.left;

        rect.top = rect.top + rect.height/2;
        return rect;
    }


    removeListeners = () => {
        window.removeEventListener('keydown', this.handleKeyDown, false);
        document.removeEventListener('mousedown', this.handleClickOutside, false);
    }

    handleSelect = (e, reference) => {
        e.preventDefault();
        this.removeListeners();
        this.setState({open: false, openedReference: reference});
    }

    /**
     * Alert if clicked on outside of element
     */
    turnSnippetMenuOff = () => {
        const { dispatch } = this.props;
        dispatch({type: SET_SNIPPET_MENU_ACTIVE, payload: false})
    }

    handleClickOutside = (event) => {
        if (this.node && !this.node.contains(event.target)) {
            this.removeListeners();
            this.turnSnippetMenuOff();
        }
    }

    searchReferences = async () => {

        if (!this.input) return;

        const text = this.input.value;

        const { typingTimeout } = this.state; 
        const { document: {repository}, searchReferences } = this.props;

        if (typingTimeout) {
           clearTimeout(this.state.typingTimeout);
        }

        let repositoryId  = repository._id;

        this.setState({
           typing: false,
           typingTimeout: setTimeout(async () => {
                let { workspaceId } = this.props.match.params;
                if (text === ""){
                   this.reset();
                } else {
                    let references = await searchReferences({ workspaceId, userQuery: text,  kinds: ['file'],
                        repositoryId,  sort: "name",  limit: 7 }, true);
                    this.setState({references, position: -1});
                }
            }, 150)
        });
    }

    reset = async () => {
        const { retrieveReferences, match } = this.props;
        const { workspaceId } = match.params;
        const { document: { repository: {_id} } } = this.props;
        
        let references = await retrieveReferences({workspaceId, 
            limit: 7, repositoryId: _id,  sort: "name", kinds: ['file'], filterRoot: true}, true);
        
        this.setState({references, position: -1, loaded: true});
    }

    handleKeyDown = (e) => {
        const { references, position } = this.state;
        
        if (e.key === "Enter" && position >= 0) {
            e.preventDefault();
            let ref = references[position];
            this.handleSelect(e, ref)
        } else {
            if (e.keyCode === 38) {
                e.preventDefault();
                if (position < 0){
                    this.setState({position: references.length - 1});
                } else {
                    this.setState({position: position - 1});
                }
            } else if (e.keyCode === 40) {
                e.preventDefault();
                if (position === references.length - 1){
                    this.setState({position: -1});
                } else {
                    this.setState({position: position + 1})
                }
            }
        } 
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

    renderListItems = () => {
        let { references, position } = this.state;

        references = [...references];

        let jsx = []
        let i = 0;

        let listItems = {};

        references.map((ref) => {
            let temp = i;
            jsx.push(
                <ListItem 
                    ref = { node => listItems[ref._id] = node }
                    key = { ref._id }
                    onMouseDown = { (e) => this.handleSelect(e, ref) } 
                    onMouseEnter = { () => {this.setState({position: temp})} }
                    backgroundColor = {position === temp ? chroma('#6762df').alpha(0.15) : ""}
                 >
                    <RiFileLine
                        style = {{fontSize: "1.7rem", marginRight: "1rem"}}
                    />
                    <ListItemDetail>
                        <Title>{ref.name ? ref.name : "Untitled"}</Title>
                        {this.renderPath(ref.path)}
                    </ListItemDetail>
                    
                </ListItem>
            )
            i += 1;
        })

        this.listItems = listItems;

        return jsx;
    }

    renderSearchbar = () => {
        return(
            <SearchbarWrapper>
                <RiScissorsLine 
                    style = {{
                        fontSize: "2rem",
                        minWidth: "3rem",
                        opacity: 0.4,
                    }}
                />
                <SearchInput 
                    autoFocus = {true}
                    ref = {node => this.input = node} 
                    onChange = {this.searchReferences} 
                    placeholder = {"Search for references to embed a snippet"}
                />
            </SearchbarWrapper>
        )
    }

    renderListContent = () => {
        return(
            <>
                {this.renderSearchbar()}
                <ListItemContainer>
                    {this.state.loaded ?  this.renderListItems() : <MoonLoader size = {12}/>}
                </ListItemContainer>
            </>
        )
    }

    convertRemToPixels = (rem) => {    
		return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }
    
    render() {
        const { open, rect, openedReference, range } = this.state;
        const { editor } = this.props;

        return (
            <>
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
                        style = {{
                            top: rect ?  rect.top + rect.height/2 : 0, 
                            left: rect ? rect.left : 0}}
                    >
                        {this.renderListContent()}
                    </Container>
                </CSSTransition>
                {openedReference && 
                    <DocumentReferenceEditor 
                        range = {range}
                        openedReference = {openedReference} 
                        undoModal = {this.turnSnippetMenuOff}
                        editor = {editor}
                    />
                }
            </>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    let {workspaceId} = ownProps.match.params
    return {
        workspace: state.workspaces[workspaceId]
    }
}


export default withRouter(connect(mapStateToProps, { retrieveReferences, searchReferences })(SnippetMenu));

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

const Container = styled.div`
    width: 40rem;
    display: flex;
    position: absolute;
    flex-direction: column;
    z-index: 1;
    background-color: white;
    border-radius: 0.3rem;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px, rgba(9, 30, 66, 0.25) 0px 4px 8px -2px;
    color: #172A4E;
    margin-top: 2.2rem;
`

const ListItemContainer = styled.div`
	display: flex;
	flex-direction: column;
	max-height: 31.5rem;
	overflow-y: scroll;
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