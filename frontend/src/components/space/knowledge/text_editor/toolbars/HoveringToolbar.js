import React, { useRef, useState, useEffect, useCallback } from 'react'

//slate
import { ReactEditor, useSlate } from 'slate-react'
import { Editor, Range, Node, Transforms } from 'slate'

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//hotkeys
import isHotkey from 'is-hotkey'

//animation
import { CSSTransition } from 'react-transition-group';

//lodash
import _ from 'lodash';

//menus
import BlockTypeMenu from '../menus/BlockTypeMenu';
import ColorMenu from '../menus/ColorMenu';

//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBold, faTable, faImage,  faRemoveFormat, faLink,  faItalic, faUnderline, faStrikethrough, faListUl, faListOl  } from '@fortawesome/free-solid-svg-icons'


//editor utility
import { 
    toggleBlockActive, toggleBlock, isMarkActive, toggleMark, removeMarks
} from '../slate/Utility';

import {
    isLinkActive, insertLink, unwrapLink
} from '../slate/WithLinks'

import { AiOutlineBold, AiOutlineItalic, AiOutlineOrderedList, AiOutlineStrikethrough, AiOutlineUnderline, AiOutlineUnorderedList } from 'react-icons/ai';
import { BsCode } from 'react-icons/bs';
import { MdFormatClear, MdFormatUnderlined } from 'react-icons/md'
import {  BiBold, BiItalic, BiLink, BiStrikethrough } from 'react-icons/bi';
import { MENU_SHADOW } from '../../../../../styles/shadows';
import { HiCode, HiLink } from 'react-icons/hi';

const HOTKEYS = {
	'mod+b': 'bold',
	'mod+i': 'italic',
	'mod+u': 'underlined',
	'mod+e': 'code',
    'mod+shift+s': 'strike',
    'mod': '',
    'shift': '',
    'shift+mod': ''
}

const HoveringToolbar = () => {
    const menu = useRef();
    const editor = useSlate();
  
    const [open, setOpen] = useState(false);
    const [rect, setRect] = useState({ top: 0, left: 0 });

    const { selection } = editor;

    let path;
    let type;

    if (editor.selection && editor.selection.anchor) {
        path =  [editor.selection.anchor.path[0]]
        type = Node.get(editor, path).type
    }

    const convertRemToPixels = (rem) => {    
		return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
	}
 
    const checkSelection = useCallback(() => {
        if ( !selection || !ReactEditor.isFocused(editor) 
            || Range.isCollapsed(selection) || Editor.string(editor, selection) === '' || type === 'title') {
            //selection is not a range
            return true;
        } else {
            return false;
        }
    }, [selection, type])

    const handleMouseUp = useCallback((event) => {
        if (checkSelection()) {
            if (open) { 
                setOpen(false);
                setRect(null);
            }
        } else {
            const domSelection = window.getSelection()
            const domRange = domSelection.getRangeAt(0)
            const rect = domRange.getBoundingClientRect();

            const parentRect = 
                document.getElementById('editorSubContainer').getBoundingClientRect();

            let newRect = {
                top: rect.top - parentRect.top - convertRemToPixels(5.5), 
                left: rect.left - parentRect.left - 30,
            }
            
            setRect(newRect);
            setOpen(true);
        }
    }, [checkSelection, open]);

    useEffect(() => {
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mouseup', handleMouseUp)
        };
    }, [handleMouseUp])

    const handleKeyDown = useCallback((event) => {
        for (const hotkey in HOTKEYS) {
            if (isHotkey(hotkey, event)) {
                return;
            }
        }
        setOpen(false);
    }, [])

    useEffect(() => {
        if (open) {
            console.log("LISTENER ADDED");
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, handleKeyDown])
    
    /*
    const calculateRect = (clientRect) => {
        const { top, left, height } = clientRect;
        let rect = { top, left, height };
        
        if (documentModal) {	
            const { scrollTop } = document.getElementById("documentModalBackground");
            rect.top = rect.top + scrollTop;
        } 
       
        if (menu.current) {
            if (rect.top + 385 - 100 > window.innerHeight){
                rect.top = rect.top - 385;
            }
        }

        rect.top = rect.top + rect.height/2;
        return rect;
    }*/

    const renderMarkers = () => {
        const markers = [
            { type: "bold", icon: <BiBold/> },
            { type: "italic", icon: <BiItalic/> },
            { type: "underlined", icon: <MdFormatUnderlined style = {{marginTop: "0.15rem"}}/>, fontSize: "1.65rem"},
            { type: "strike", icon: <BiStrikethrough/>},
            { type: "code", icon: <HiCode/>, fontSize: "1.7rem"},
        ]

        return markers.map(({type, icon, fontSize}) =>
            <IconBorder
                fontSize = {fontSize}
                active={isMarkActive(editor, type)}
                onMouseDown={event => {
                    event.preventDefault();
                    toggleMark(editor, type);
                }}
            >
                {icon}
            </IconBorder>
        )
    }

    const renderMenu = () => {
        return (
            <>
                <IconBlock>    
                    <BlockContainer>
                        <BlockTypeMenu toggleBlock = {(format) => toggleBlock(editor, format)} type = {type}/>
                    </BlockContainer>
                </IconBlock>
                <IconBlock>
                    {renderMarkers()}
                    <IconBorder 
                        fontSize = {"1.7rem"}
                        onMouseDown = {event => { event.preventDefault(); removeMarks(editor);}}
                    >
                        <MdFormatClear/>
                    </IconBorder>
                </IconBlock>
                <IconBlock>
                    <ColorMenu
                        editor = {editor}
                        back = {false}
                    />
                    <ColorMenu editor = {editor}
                        back = {true}/>
                </IconBlock>
                <IconBlock position = {"relative"}>
                    <IconBorder 
                        fontSize = {"1.7rem"}
                        active = {isLinkActive(editor)}
                        onMouseDown={event => {
                            event.preventDefault()
                            if (isLinkActive(editor)) {
                                unwrapLink(editor);
                            } else {
                                const url = window.prompt('Enter the URL of the link:')
                                if (!url) return
                                insertLink(editor, url)
                            }
                        }}
                    >
                        <HiLink/>
                    </IconBorder>
                </IconBlock>
            </>
        )
    }

    return (
        open && 
            <Container  
                open = { open }
                ref = { menu }
                rect = { rect }
                style = {{
                    left: rect ? rect.left : '-1000px'
                }}
            >
                {renderMenu()}
            </Container>
    )
}


const LinkMenu = ({editor}) => {
    const inputRef = useRef();

    return (
        <LinkMenuContainer>
            <LinkMenuHeader>
                <BiLink/>
                <LinkMenuHeaderText>Paste a Link</LinkMenuHeaderText>
            </LinkMenuHeader>  
            <LinkMenuInput 
                ref = {inputRef}
                placeholder = {"Paste your link here.."}

            />
            <LinkMenuEmbedButton>Embed</LinkMenuEmbedButton>
        </LinkMenuContainer>
    )
}


const SubContainer = styled.div`
    position: relative;
`

const LinkMenuEmbedButton = styled.div`
    font-size: 1.5rem;
    background-color: ${chroma('#6762df').alpha(0.15)};
    font-weight: 500;
    padding: 1rem 2rem;
    border-radius: 0.3rem;
    cursor: pointer;
    &:hover {
        background-color: ${chroma('#6762df').alpha(0.3)};
    }
    display: flex;
    align-items: center;
    margin-top: 1.5rem;
`

const LinkMenuContainer = styled.div`
    position: absolute;
    top: 3rem;
    right: 0rem;
    padding: 1.5rem 1rem;
    width: 30rem;
    background-color: white;
    box-shadow: ${MENU_SHADOW};
    border-radius: 0.3rem;
`
const LinkMenuHeader = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 0.8rem;
`

const LinkMenuInput = styled.input`
    outline: none;
    border: none;
    font-size: 1.3rem;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    padding: 1.5rem 1rem;
    /*height: 3rem;*/
    width: 100%;
    border-radius: 0.3rem;
    background-color: ${chroma("#6762df").alpha(0.15)};
    color: #172A4E;

    &::placeholder {
        color: #172A4E;
        opacity: 0.5;
    }
`

const LinkMenuHeaderText = styled.div`
    font-size: 1.4rem;
    font-weight: 500;
    margin-left: 0.5rem;
`



  /*<CSSTransition
in = {true}
unmountOnExit
appear = {true}
timeout = {150}
classNames = "dropmenu"
>
        </CSSTransition>*/

export default HoveringToolbar;

const BlockContainer = styled.div`
    height: 100%;
`

const Container = styled.div`
    background-color: white;
    transform: translateY(${props => props.rect.top}px);
    z-index: 1;
    position: absolute;
    box-shadow: rgba(60, 64, 67, 0.15) 0px 2px 6px 2px;
    border-radius: 0.4rem;
    display: flex;
    align-items: center;
    height: 3.4rem;

`

const IconBlock = styled.div`
    display: flex;
    padding: 0rem 1.3rem;
    border-right: 1px solid #e7edf3;
    align-items: center;
    height: 3.4rem;
    &:first-of-type {
        padding: 0rem;
    }
    &:last-of-type {
        border-right:none;
    }

    position: ${props => props.position};
`

const IconBorder = styled.div`
    margin-left: ${props => props.marginLeft};
    margin-right: 0.3rem;
    display: flex;
    font-size: ${props => props.fontSize ? props.fontSize : "1.65rem"};
    align-items: center;
    justify-content: center;
   
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 0.3rem;
      
    &:hover {
        opacity: 1;
        background-color: ${props => props.active ? chroma("#6762df").alpha(0.2) : "#F4F4F6"};
    }
    
    cursor: pointer;
    transition: all 0.1s ease-in;
    background-color: ${props => props.active ? chroma("#6762df").alpha(0.2)  : "white"};
    color: #172A4E;
`