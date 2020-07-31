import React, { useRef, useState, useEffect } from 'react';
import {Node, Editor, Transforms} from 'slate'
import { useSlate, useEditor, useFocused, useSelected, ReactEditor } from 'slate-react';

//styles
import styled from "styled-components";
import chroma from 'chroma-js';
import { CSSTransition } from 'react-transition-group';

//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faParagraph,faCode, faPlus ,faTrash, faQuoteLeft, faBold, faTable, faImage,  faRemoveFormat, faLink,  faItalic, faUnderline, faStrikethrough, faListUl, faListOl  } from '@fortawesome/free-solid-svg-icons'

const Sidebar = (props) => {
    let editor = useSlate()
    let [rect, changeRect] = useState(null)
    let selection = editor.selection

    useEffect(() => {
        if (selection) {
            let path = [selection.anchor.path[0]]
            changeRect(ReactEditor.toDOMRange(editor, 
                {anchor: {offset: 0, path}, 
                focus: {offset: 0, path }}).getBoundingClientRect())
        }
    }
    , [selection])

    
    return (
        <SidebarContainer>
            {rect && 
                <ToolIcon 
                    rect = {rect} 
                    toggleBlock = {props.toggleBlock}
                    changeRect = {changeRect}
                    editor = {editor}
                />
            }
       </SidebarContainer>
    )
}

export default Sidebar


class ToolIcon extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            open: false
        }

    }

    openMenu(e) {
        e.preventDefault()
        document.addEventListener('mousedown', this.handleClickOutside, false);
        this.setState({open: true})
    }
    
    closeMenu(){
        document.removeEventListener('mousedown', this.handleClickOutside, false);
        this.setState({ open: false})
    }

    handleClickOutside = (event) => {
        if (this.node && !this.node.contains(event.target)) {
            this.closeMenu()
        }
    }
    
    toggleBlock = (e, type) => {
        e.preventDefault()
        e.stopPropagation()
        this.props.toggleBlock(type);
        this.closeMenu()
        let selection = this.props.editor.selection
        if (selection) {
            let path = selection.anchor.path
            setTimeout(() => {this.props.changeRect(ReactEditor.toDOMRange(this.props.editor, 
                {anchor: {offset: 0, path}, 
                focus: {offset: 0, path }}).getBoundingClientRect())}, 10)
        }
    }

    renderBlockIcon = (type) => {
        if (type) {
            switch(type){
                case "heading-one":
                    return <BlockIcon>H1</BlockIcon>
                case "heading-two":
                    return <BlockIcon>H2</BlockIcon>
                case "heading-three":
                    return <BlockIcon>H3</BlockIcon>
                case "bulleted-list":
                    return <FontAwesomeIcon icon={faListUl}/>
                case "numbered-list":
                    return <FontAwesomeIcon icon={faListOl}/>
                case "code-block":
                    return <FontAwesomeIcon icon={faCode}/>
                default:
                    return  <FontAwesomeIcon icon={faParagraph}/>
            }
        }
        return null
    }

    insertNode = (path) => {
        let {editor} = this.props
        if (path) {
            let item = { type: "paragraph", children: [] };
            Transforms.insertNodes(editor, item, {at: path}); 
        }
        this.closeMenu() 
    }

    render(){
        let {rect, editor} = this.props
        let {open} = this.state
        let type;
        let path;
        if (editor.selection && editor.selection.anchor) {
            path =  [editor.selection.anchor.path[0]]
            type = Node.get(editor, path).type
        }
       console.log(path && path[0] == 0)
        return(
            <BlockTool 
                onMouseDown = {(e) => {this.openMenu(e)}} 
                height = {rect.height} 
                top = {rect ? document.getElementById("rightView").scrollTop +  
                    rect.top - 125 + rect.height/2 : 0}
                active = {open}
            > 
            {this.renderBlockIcon(type)}
            <CSSTransition
                in = {open}
                unmountOnExit
                enter = {true}
                exit = {true}
                timeout = {150}
                classNames = "dropmenu"
                >
                    
                <BlockMenu  ref = {node => this.node = node}>
                   
                    <SmallHeaderContainer  
                        onClick = {() => this.insertNode(path)}
                        hoverColor = {"#F4F4F6"}>Insert Block Below
                        <FontAwesomeIcon style = {{marginLeft: "auto"}} icon={faPlus}/>
                    </SmallHeaderContainer>
                    { (path && path[0] !== 0) &&
                        <HeaderContainer onClick = {() => {
                            if (path) Transforms.removeNodes(editor, {at: path}); this.closeMenu()}}>
                            Remove Block
                            <FontAwesomeIcon style = {{marginLeft: "auto"}} icon={faTrash}/>
                        </HeaderContainer>
                    }
                    <SmallHeaderContainer>Turn Into</SmallHeaderContainer>
                    
                    <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "paragraph")}}>
                        <IntoIcon>
                            <FontAwesomeIcon icon={faParagraph}/>
                        </IntoIcon>
                        <IntoText>
                            Paragraph
                        </IntoText>
                    </IntoOption>
                    <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "heading-one")}}>
                        <IntoIcon>
                            H1
                        </IntoIcon>
                        <IntoText>
                            Heading 1
                        </IntoText>
                    </IntoOption>
                    <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "heading-two")}}>
                    <IntoIcon>
                        H2
                    </IntoIcon>
                    <IntoText>
                        Heading 2
                    </IntoText>
                </IntoOption>
                <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "heading-three")}}>
                    <IntoIcon>
                        H3
                    </IntoIcon>
                    <IntoText>
                        Heading 3
                    </IntoText>
                </IntoOption>
                <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "quote")}}>
                    <IntoIcon>
                        <FontAwesomeIcon icon={faQuoteLeft}/>
                    </IntoIcon>
                    <IntoText>
                        Quote
                    </IntoText>
                </IntoOption>
                <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "bulleted-list")}}>
                    <IntoIcon>
                        <FontAwesomeIcon icon={faListUl}/>
                    </IntoIcon>
                    <IntoText>
                        Bullet List
                    </IntoText>
                </IntoOption>
                <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "numbered-list")}}>
                    <IntoIcon>
                        <FontAwesomeIcon icon={faListOl}/>
                    </IntoIcon>
                    <IntoText>
                        Numbered List
                    </IntoText>
                </IntoOption>
                <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "code-block")}}>
                    <IntoIcon>
                        <FontAwesomeIcon icon={faCode}/>
                    </IntoIcon>
                    <IntoText>
                        Code Block
                    </IntoText>
                </IntoOption>
                </BlockMenu>
                </CSSTransition>
            </BlockTool>
        )
    }

}


const IntoOption = styled.div`
    display: flex;
    font-size: 1.2rem;
    padding: 0.8rem 1rem;
    color: #172A4E;
    &:hover {
        background-color: #F4F4F6;
    }
`

const IntoIcon = styled.div`
    width: 2.5rem;
    font-weight: 600;
`

const BlockIcon = styled.div`
    font-weight: 600;
    font-size: 1.35rem;
`

const IntoText = styled.div`

`

const SidebarContainer = styled.div`
	display: flex;
	flex-direction: column;
	width: 5rem;
    align-items: center;
   
`

const TopHeaderContainer = styled.div`
    height: 3.5rem;
    display: flex;
    align-items: center;
    font-size: 1.3rem;
    padding: 1rem;
    color: #172A4E;
    border-bottom: 1px solid #E0E4E7;
    font-weight: 600;
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
    &:hover {
        background-color: #F4F4F6;
    }
`

const SmallHeaderContainer = styled.div`
    height: 3.5rem;
    display: flex;
    align-items: center;
    font-size: 1.3rem;
    padding: 1rem;
    color: #172A4E;
    font-weight: 500;
    &:hover {
        background-color: ${props => props.hoverColor};
    }
`

const BlockMenu = styled.div`
    width: 18rem;
    height: 26rem;
    display: flex;
    flex-direction: column;
    position: absolute;
    background-color: white;

    z-index: 2;
    box-shadow: 0 2px 2px 2px rgba(60,64,67,.15);
    margin-top: 30rem;
    margin-left: -14rem;
    border-radius: 0.2rem;
    overflow-y: scroll;
    padding-bottom: 1rem;
`

const BlockTool = styled.div`
	font-size: 1.4rem;
	display: flex;
    align-items: center;
    
	border-right: 2px solid ${chroma('#19e5be').alpha(0.6)};
	padding: 0.4rem 1rem;
    transform: translateY(${props => props.top}px);
    z-index: 1;
    
    &:hover {
        background-color: ${chroma("#5B75E6").alpha(0.2)};
    }
    transition: transform 0.2s cubic-bezier(0, 0.475, 0.01, 1.035), background-color 0.1s ease-in-out;
    cursor: pointer;
    border-radius: 0.2rem;
    background-color: ${props => props.active ? chroma("#5B75E6").alpha(0.2) : 'white'};
`