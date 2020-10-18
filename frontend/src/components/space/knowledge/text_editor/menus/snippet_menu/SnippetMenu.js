import React from 'react';

// react-redux
import { connect } from 'react-redux';

//router
import {withRouter} from 'react-router-dom';

//styles
import styled from "styled-components";

//components
import { CSSTransition } from 'react-transition-group';
import DocumentReferenceEditor from './DocumentReferenceEditor';

//slate
import {  ReactEditor } from 'slate-react'

//icons
import { RiFileLine } from 'react-icons/ri'
import {AiFillFolder} from 'react-icons/ai';

//actions
import { retrieveReferences, searchReferences} from '../../../../../../actions/Reference_Actions';

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
    }

    componentDidMount = () => {
        const { editor, editorState: {text} } = this.props;

        if (editor.selection) {
            let path = [editor.selection.anchor.path[0]];
            let offset = editor.selection.anchor.offset - 1;
            
            let newRect = ReactEditor.toDOMRange(editor, 
                {anchor: {offset, path}, focus: { offset, path }}).getBoundingClientRect();
            this.setState({rect: newRect, open: true});
            this.searchReferences(text);
    
            //window.addEventListener('keydown', this.handleKeyDown, false);
            document.addEventListener('mousedown', this.handleClickOutside, false);
    
            this.setState({loaded: true});
        }
    }

    componentDidUpdate =  (prevProps) => {
        const {editorState: {text} } = this.props;
        if (prevProps.editorState.text !== text) {
            this.searchReferences(text);
        }
    }

    removeListeners = () => {
        //window.removeEventListener('keydown', this.handleKeyDown, false);
        document.removeEventListener('mousedown', this.handleClickOutside, false);
    }

    handleSelect = (reference) => {
        this.removeListeners();
        this.setState({open: false, openedReference: reference});
    }

    /**
     * Alert if clicked on outside of element
     */
    turnSnippetMenuOff = () => {
        const { dispatch } = this.props;
        dispatch({type: "snippetMenuOff"})
    }

    handleClickOutside = (event) => {
        if (this.node && !this.node.contains(event.target)) {
            this.removeListeners();
            this.turnSnippetMenuOff();
        }
    }

    searchReferences = (text) => {

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
                    let references = await searchReferences({workspaceId, userQuery: text,  repositoryId,  sort: "name",  limit: 9}, true);
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
            limit: 9, repositoryId: _id,  sort: "name"}, true);
        
        this.setState({references, position: -1, loaded: true});
    }

    handleKeyDown = (e) => {
        const { references, position } = this.state;
        if (e.key === "Enter" && position >= 0) {
            e.preventDefault();
            let ref = references[position];
            this.handleSelect(ref)
        } else {
            e.preventDefault();
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
    }

    renderListItems = () => {
        let { references, position} = this.state;

        references = [...references];
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

        let jsx = []
        let i = 0;
        dirs.map((ref) => {
            let temp = i;
            jsx.push(            
                <ListItem 
                    onClick = {() => this.handleSelect(ref)} 
                    onMouseEnter = {() => {this.setState({position: temp})}}
                    backgroundColor = {position === temp ? '#F4F4F6' : ""}
                 >
                    <AiFillFolder
                        style = {{fontSize: "1.5rem", marginRight: "1rem"}} 
                    />
                    <Title>{ref.name ? ref.name : "Untitled"}</Title>
                </ListItem>
            )
            i += 1;
        })

        files.map((ref) => {
            let temp = i;
            jsx.push(
                <ListItem 
                    onClick = {() => this.handleSelect(ref)} 
                    onMouseEnter = {() => {this.setState({position: temp})}}
                    backgroundColor = {position === temp ? '#F4F4F6' : ""}
                 >
                    <RiFileLine
                        style = {{fontSize: "1.5rem", marginRight: "1rem"}}
                    />
                    <Title>{ref.name ? ref.name : "Untitled"}</Title>
                </ListItem>
            )
            i += 1;
        })
        return jsx;
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

    renderListContent = () => {
        return(
            <>
                <HeaderContainer>Find Reference to Embed Snippet</HeaderContainer>
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
        let { open, rect, documentModal, openedReference } = this.state;
        
        if (rect) {
			if (documentModal) {
				let background = document.getElementById("documentModalBackground");
				rect = {left: rect.left, height: rect.height, top: rect.top + background.scrollTop};
            } 
            /*
            if (this.node) {
                let { height } = this.node.getBoundingClientRect();
                if (rect.top + height > window.innerHeight){
                    rect = {top: rect.top - height , left: rect.left, height: rect.height}
                }
            }*/
			
		}
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
                        openedReference = {openedReference} 
                        undoModal = {this.turnSnippetMenuOff}
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


const Title = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-weight: 500;
    width: 20rem;
    font-size: 1.3rem;
`

const Container = styled.div`
    width: 30rem;
    display: flex;
    position: absolute;
    flex-direction: column;
    z-index: 1;
    background-color: white;
    border-radius: 0.2rem;
    box-shadow: 0 2px 2px 2px rgba(60,64,67,.15);
    color: #172A4E;
    margin-top: 2.2rem;
`

const ListItemContainer = styled.div`
	display: flex;
	flex-direction: column;
	padding: 0rem 1rem;
	max-height: 31.5rem;
	overflow-y: scroll;
	padding-bottom: 1rem;
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