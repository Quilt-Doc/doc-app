import React, { useState, useEffect } from 'react';
import {Node, Transforms} from 'slate'
import { useSlate, ReactEditor } from 'slate-react';

//styles
import styled from "styled-components";
import chroma from 'chroma-js';
import { CSSTransition } from 'react-transition-group';

//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCode,faTrash, faQuoteLeft, faListUl, faListOl  } from '@fortawesome/free-solid-svg-icons'
import { BiLink, BiParagraph, BiTable } from 'react-icons/bi';
import { GrBlockQuote } from 'react-icons/gr';
import { AiOutlineOrderedList, AiOutlineUnorderedList } from 'react-icons/ai';
import { HiCode } from 'react-icons/hi';
import { RiInformationLine, RiScissorsLine } from 'react-icons/ri';
import { BsImageFill, BsListCheck } from 'react-icons/bs';
import { IoMdAttach } from 'react-icons/io';

const Sidebar = (props) => {
    let editor = useSlate();
    let [top, changeTop] = useState(null);
    let selection = editor.selection;
    let type;
    let path;

    if (editor.selection && editor.selection.anchor) {
        path =  [editor.selection.anchor.path[0]]
        type = Node.get(editor, path).type
    }

    useEffect(() => {
        
        if (selection) {
            try {
                let path = [selection.anchor.path[0]];
                let rect = ReactEditor.toDOMRange(editor, 
                                {anchor: {offset: 0, path}, 
                    focus: {offset: 0, path }}).getBoundingClientRect();
                if (props.documentModal) {
                    changeTop(document.getElementById("documentModalBackground").scrollTop + rect.top - 183 + rect.height/2);
                } else {
                    const slateNode = Node.get(editor, path);
                    type = slateNode.type;

                    let parentOffsetTop = document.getElementById("editorSubContainer").offsetTop;
                    let newTop = document.getElementById("editorContainer").scrollTop + rect.top + rect.height/2 - parentOffsetTop - 13;

                    if (type === "reference-snippet") {
                        newTop -= ReactEditor.toDOMNode(editor, slateNode).getBoundingClientRect().height;
                    }
                    if (type === "code-block") newTop -= 23
                    changeTop(newTop);
                }
            } catch (err) {
                console.log(err);
            }
        }
    }
    , [selection, type])

    
    return (
        <SidebarContainer>
            {(top && ReactEditor.isFocused(editor)) &&
                <ToolIcon 
                    top = {top} 
                    toggleBlock = {props.toggleBlock}
                    editor = {editor}
                    documentModal = {props.documentModal}
                    currentType = {type}
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
        const { currentType } = this.props;
        e.preventDefault()
        e.stopPropagation()

        if (currentType !== 'reference-snippet' && currentType !== 'code-block' && currentType !== 'attachment') {
            this.props.toggleBlock(type);
            this.closeMenu()
        }
    }

    renderBlockIcon = (type) => {
        if (type) {
            switch (type) {
                case "heading-one":
                    return <HeadingText>{"H1"}</HeadingText>
                case "heading-two":
                    return <HeadingText>{"H2"}</HeadingText>
                case "heading-three":
                    return <HeadingText>{"H3"}</HeadingText>
                case "quote":
                    return <GrBlockQuote/>
                case "bulleted-list":
                    return <AiOutlineUnorderedList/>
                case "numbered-list":
                    return <AiOutlineOrderedList/>
                case "code-block":
                    return <HiCode/>
                case "reference-snippet":
                    return <RiScissorsLine/>
                case "check-list":
                    return <BsListCheck/>
                case "link":
                    return <BiLink/>
                case "note":
                    return < RiInformationLine/>
                case "table":
                    return <BiTable/>
                case "image":
                    return <BsImageFill/>
                case "attachment":
                    return <IoMdAttach/>
                default:
                    return  <BiParagraph/>
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

    convertRemToPixels = (rem) => {    
		return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }
    
    renderMarginTop = () => {
        if (this.tool) {
            let rect = this.tool.getBoundingClientRect();
            if (rect.top + this.convertRemToPixels(14) 
                > window.innerHeight
            ) {
                return -20
            }
        }
    }

    renderMarginLeft = () => { 
        const {documentModal} = this.props;

        if (this.tool) {
            if (documentModal) return -1;
            if (this.tool.getBoundingClientRect().left - this.convertRemToPixels(18) 
                < (document.getElementById("docnavbar").clientWidth + this.convertRemToPixels(5))
            ) {
                return -1
            }
        }
    }

    render(){
        let {top, editor, currentType} = this.props
        let {open} = this.state
        let type;
        let path;
        if (editor.selection && editor.selection.anchor) {
            path =  [editor.selection.anchor.path[0]]
            type = Node.get(editor, path).type
        }

        let active = currentType !== 'reference-snippet' 
            && currentType !== 'code-block'
            && currentType !== 'attachment';

        return(
            <BlockTool 
                ref = {tool => this.tool = tool}
                onMouseDown = {(e) => {this.openMenu(e)}} 
                top = {top ? top : 0}
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
                    
                <BlockMenu 
                    marginTop = {this.renderMarginTop()}
                    marginLeft = {this.renderMarginLeft()}
                    ref = {node => this.node = node}
                >
                   
                    <SmallHeaderContainer  
                        onClick = {() => this.insertNode(path)}
                        hoverColor = {"#F4F4F6"}>Insert Block Below
                        <ion-icon style = {{marginLeft: "auto", fontSize: "1.7rem"}} name = {"add-outline"}>

                        </ion-icon>
                    </SmallHeaderContainer>
                    { (path && path[0] !== 0) &&
                        <HeaderContainer onClick = {() => {
                            if (path) Transforms.removeNodes(editor, { at: path }); this.closeMenu();}}>
                            Remove Block
                            <FontAwesomeIcon style = {{marginLeft: "auto"}} icon={faTrash}/>
                        </HeaderContainer>
                    }
                        <TurnIntoContainer active = {active}>
                            <SmallHeaderContainer>Turn Into</SmallHeaderContainer>
                            <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "paragraph")}}>
                                <IntoIcon>
                                    <BiParagraph/>
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
                    </TurnIntoContainer>
                </BlockMenu>
                </CSSTransition>
            </BlockTool>
        )
    }

}

const TurnIntoContainer = styled.div`
    opacity: ${props => props.active ? 1 : 0.5};
`

const HeadingText = styled.div`
    font-family: 'Slabo 27px', serif;
`

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
	min-width: 7rem;
    align-items: flex-end;
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
    max-height: 26rem;
    display: flex;
    flex-direction: column;
    position: absolute;
    background-color: white;

    z-index: 0;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px, rgba(9, 30, 66, 0.25) 0px 4px 8px -2px;
    margin-top: 30rem;
    margin-left: -15.5rem;
    margin-left: ${props => {return props.marginLeft}}rem;
    margin-top: ${props => props.marginTop}rem;
    border-radius: 0.2rem;
    overflow-y: scroll;
    padding-bottom: 1rem;

`

const BlockTool = styled.div`
	font-size: 1.6rem;
	display: flex;
    align-items: center;
    
	border-right: 2px solid ${props => !props.active ? chroma("#6762df").alpha(0.3) : chroma("#6762df").alpha(1)};
	padding: 0.4rem 0.8rem;
    transform: translateY(${props => props.top}px);
    z-index: 1;
    
    &:hover {
        background-color: ${chroma("#6762df").alpha(0.35)};
    }
    transition: transform 0.2s cubic-bezier(0, 0.475, 0.01, 1.035), background-color 0.1s ease-in-out;
    cursor: pointer;
    border-top-left-radius: 0.2rem;
    border-bottom-left-radius: 0.2rem;
    background-color: ${props => !props.active ? chroma("#6762df").alpha(0.2) : chroma("#6762df").alpha(0.35)};
`