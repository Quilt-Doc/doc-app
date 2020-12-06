import React, { useEffect, useCallback, useState, useRef } from 'react'

// slate
import {  ReactEditor, useSlate } from 'slate-react'
import { Transforms, Editor, Node } from 'slate'

//utility
import scrollIntoView from 'scroll-into-view-if-needed'

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//animation
import { CSSTransition } from 'react-transition-group';

//icons
import { BiCodeBlock, BiLink, BiNote, BiParagraph, BiTable, BiVideo } from 'react-icons/bi';
import { BsImageFill, BsListCheck } from 'react-icons/bs';
import { CgCheckR } from 'react-icons/cg';
import { HiCode, HiLink } from 'react-icons/hi';
import { RiScissorsLine, RiInformationLine } from 'react-icons/ri';
import { GrBlockQuote } from 'react-icons/gr';
import { IoMdAttach } from 'react-icons/io';

//types
import { 
    SET_MARKUP_MENU_ACTIVE, 
    SET_SNIPPET_MENU_ACTIVE, 
    SET_ATTACHMENT_MENU_ACTIVE,
    SET_IMAGE_MENU_ACTIVE,
    SET_VIDEO_MENU_ACTIVE
} from '../editor/reducer/Editor_Types';

//lodash
import _ from 'lodash'
import { AiOutlineOrderedList, AiOutlineUnorderedList } from 'react-icons/ai';
import { GoQuote, GoTextSize } from 'react-icons/go';


const MarkupMenu = (props) => {

    const { doc, documentModal, dispatch } = props;

    const editor = useSlate();
    
    const [range, setRange] = useState(null);

    const [initialSelection, setInitialSelection] = useState(null);

    const [rect, setRect] = useState({top: 0, left: 0});

    const [open, setOpen] = useState(false);

    const [filteredOptions, setFilteredOptions] = useState(Object.values(defaultOptions));

    const [currentPosition, setCurrentPosition] = useState(0);

    let menuButtons = {};

    let menu = useRef();


    useEffect(() => {
        let path = [editor.selection.anchor.path[0]];
        let offset = editor.selection.anchor.offset - 1;

        let newRange = {anchor: {offset, path}, focus: {offset, path}};

        setRange(newRange);
        setInitialSelection(editor.selection);

        let clientRect = ReactEditor.toDOMRange(editor, newRange).getBoundingClientRect();

        setRect(calculateRect(clientRect));
        setOpen(true);

    }, []);
    

    useEffect(() => {
        let checkPosition = currentPosition;

        if (checkPosition === -1) checkPosition = 0;

        const option = filteredOptions[checkPosition];

        if (!option) return;

        const { type } = option;
        
        const menuButton = menuButtons[type];

        if (!menuButton) return;
 
        scrollIntoView(menuButton, {
            scrollMode: 'if-needed',
            block: 'nearest',
            inline: 'nearest',
            behavior: 'smooth'
        })
       
    }, [currentPosition]);


    let filterText = "/";
    if (range) {
        const slateNode = Node.get(editor, [editor.selection.anchor.path[0]]);
        const { anchor: { offset }} = range;
        filterText = Node.string(slateNode).slice(offset, editor.selection.anchor.offset).toLowerCase();
    }

    useEffect(() => {
        if (filterText === "") {
            closeMenu();
        } else {
            const newOptions = Object.values(defaultOptions).filter(option => option.name.toLowerCase().includes(filterText.slice(1)));
            
            if (newOptions.length === 0) {
                closeMenu()
            } else {
                setFilteredOptions(newOptions);
                setCurrentPosition(-1);
            }
        }
    }, [filterText]);


    const handleKeyDown = useCallback((event) => {
        const { key, keyCode } = event;

        if (key === "Enter") {
            event.preventDefault();
            const currentOption = filteredOptions[currentPosition];
            if (currentOption) insertBlock(currentOption);
        } else if (keyCode === 38) {
            event.preventDefault();
            if (currentPosition === -1) {
                setCurrentPosition(filteredOptions.length - 1);
            } else {
                setCurrentPosition(currentPosition - 1);
            }
        } else if (keyCode === 40) {
            event.preventDefault();

            if (currentPosition === filteredOptions.length - 1) {
                setCurrentPosition(-1);
            } else {
                setCurrentPosition(currentPosition + 1);
            }
        }
    }, [currentPosition, filteredOptions]);
    

    const closeMenu = async () => {
        await setOpen(false);
        dispatch({type: SET_MARKUP_MENU_ACTIVE, payload: false});
    }


    const handleClickOutside = useCallback((event) => {
        if (menu.current && !menu.current.contains(event.target)) {
            console.log(menu.current.getBoundingClientRect())
            closeMenu();
        }
    }, [menu]);


    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);

        return () => { 
            window.removeEventListener("keydown", handleKeyDown); 
        }
    }, [handleKeyDown])


    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);

        return () => { 
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [handleClickOutside])


    const calculateRect = (clientRect) => {
        const { top, left, height } = clientRect;
        let rect = { top, left, height };
        
        if (documentModal) {	
           
            const { scrollTop } = document.getElementById("documentModalBackground");
            //rect.top = rect.top + scrollTop;
        } else {
            /*
            console.log("ENTERD HERE");
            const { scrollTop } = document.getElementById("rightView");
            console.log("SCROLL TOP", scrollTop)
            rect.top = rect.top - scrollTop;
            */
        }
       
        if (menu.current) {
            if (rect.top + 385 - 100 > window.innerHeight){
                rect.top = rect.top - 385;
            }
        }

        const parentRect = document.getElementById('editorSubContainer').getBoundingClientRect();

        rect.top = rect.top - parentRect.top;
        rect.left = rect.left - parentRect.left;

        rect.top = rect.top + rect.height/2;
        return rect;
    }


    const insertBlock = useCallback(async (option) => {
        const { type } = option;

        Transforms.delete(editor, {
            at: editor.selection,
            distance: filterText.length,
            unit: 'character',
            reverse: true
        });

        let attributes = { type };

        if (type === "check-list") attributes.isSelected = false;


        if (type === "reference-snippet") {
            if (!doc.repository) {
                alert("Please attach a repository to embed a snippet.");
            } else {
                await setOpen(false);
                dispatch({type: SET_SNIPPET_MENU_ACTIVE, payload: true});
            }
        } else if (type === "attachment") {
            //editor.insertBlock({name: "rumbo.png", type: "attachment"});
            await setOpen(false);
            dispatch({type: SET_ATTACHMENT_MENU_ACTIVE, payload: true});
        } else if (type === "image") {
            //editor.insertBlock({name: "rumbo.png", type: "attachment"});
            await setOpen(false);
            dispatch({type: SET_IMAGE_MENU_ACTIVE, payload: true});
        } else if (type === "video") {
            await setOpen(false);
            dispatch({type: SET_VIDEO_MENU_ACTIVE, payload: true});
        } {
            editor.insertBlock(attributes);
            //editor.insertText("&") // needs change
        }

        closeMenu();
    }, [filterText, range, initialSelection, doc]);
    

    const renderOptions = useCallback(() => {
        const buttons = filteredOptions.map((option, i) => {
            const { name, type, description } = option;
            const icon = getMenuIcon(type);
            return (
                <MenuButton  
                    key = { type }
                    ref = { node => menuButtons[type] = node }
                    onMouseOver = { (e) => {e.stopPropagation(); setCurrentPosition(i) }}
                    active = { currentPosition === i }
                    onMouseDown={ (event) => {
                        event.preventDefault()
                        insertBlock(option) 
                    }}
                >
                    <IconBorder active = { currentPosition === i }>
                        {icon}
                    </IconBorder>
                    <MenuButtonText>
                        <MenuButtonTitle>{ name }</MenuButtonTitle>
                        <MenuButtonDescription>{ description }</MenuButtonDescription>
                    </MenuButtonText>
                </MenuButton>
            )
        })
        return buttons;
    }, [filteredOptions, currentPosition]);
  
	return (
        <CSSTransition
            in = {open}
            unmountOnExit
            enter = {true}
            exit = {true}
            timeout = {150}
            classNames = "dropmenu"
        >
            <Menu 
                ref = { menu }
                rect = {rect}
                style = {{
                    top: rect.top,
                    left: rect.left
                }}
                onMouseDown = {(e) => e.preventDefault()}
            >
                <ListItemContainer id = "markupMenuList">
                    {renderOptions()}
                </ListItemContainer>
            </Menu>
        </CSSTransition>
	)
}


const defaultOptions = {
    "paragraph": {type: "paragraph", name: "Paragraph", description: "Plain paragraph style text"},
    "quote": { type: "quote", name: "Quote", description: "Block for direct quotations"},
    "note": { type: "note", name: "Note", description: "Informational note to guide readers"},
    "heading-one": {type: "heading-one", name: "Heading 1", description: "Large sized header"},
    "heading-two": {type: "heading-two", name: "Heading 2",  description: "Medium sized header"},
    "heading-three": {type: "heading-three", name: "Heading 3", description: "Small sized header"},
    "bulleted-list": { type: "bulleted-list", name: "Bulleted List", description: "Bulleted list to order phrases"},
    "numbered-list": { type: "numbered-list", name: "Numbered List", description: "Numbered list to display series"},
    "check-list": { type: "check-list", name: "Check List", description: "Check list to keep track"},
    "code-block": { type: "code-block", name: "Code Block", description: "Block of inline, editable code"},
    "reference-snippet": { type: "reference-snippet", name: "Reference Snippet", description: "Segments of repository files"},
    "attachment": { type: "attachment", name: "Attachment", description: "Upload a local file" },
    "link": { type: "link", name: "Link", description: "Link to any url"},
    "image": { type: "image", name: "Image", description: "Image embedded into block"},
    "video": { type: "video", name: "Video", description: "Embed or upload a video"}
}

const getMenuIcon = (type) => {
    switch (type) {
        case "heading-one":
            return <HeadingText type = {1}>{"H1"}</HeadingText>
        case "heading-two":
            return <HeadingText type = {2}>{"H2"}</HeadingText>
        case "heading-three":
            return <HeadingText type = {3}>{"H3"}</HeadingText>
        case "quote":
            return <GoQuote/>
        case "bulleted-list":
            return <AiOutlineUnorderedList/>
        case "numbered-list":
            return <AiOutlineOrderedList/>
        case "code-block":
            return <BiCodeBlock/>
        case "reference-snippet":
            return <RiScissorsLine/>
        case "check-list":
            return <CgCheckR/>
        case "attachment":
            return <IoMdAttach/>
        case "link":
            return <HiLink/>
        case "note":
            return <BiNote/>
        case "video":
            return <BiVideo/>
        case "image":
            return <BsImageFill/>
        default:
            return  <GoTextSize/>
    }	
}


export default MarkupMenu;

const ListItemContainer = styled.div`
	display: flex;
	flex-direction: column;
	max-height: 35rem;
	overflow-y: scroll;
`

const Menu = styled.div`
	width: 31rem;
    position: absolute;
    z-index: 3;
    background-color: white;
	border-radius: 0.4rem;
    display: flex;
    flex-direction: column;
    box-shadow:  0 30px 60px -12px rgba(50,50,93,0.25),0 18px 36px -18px rgba(0,0,0,0.3);
	color:  #172A4e;
    margin-top: 2.2rem;
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

const MenuHeader = styled.div`
	font-size: 1.5rem;
	
    opacity: 0.6;
    margin-top: 0.3rem;
    margin-bottom: 1rem;
    margin-left: 0.4rem;
`

const MenuButtonText = styled.div`
    margin-left: 2.5rem;
	
`

const MenuButtonTitle = styled.div`
	font-size: 1.4rem;
	margin-bottom: 0.5rem;
	font-weight: 400;
`

const MenuButtonDescription = styled.div`
	font-size: 1.2rem;
	opacity: 0.6;
`

const IconBorder = styled.div`
    border-radius: 0.4rem;
    width: 4.5rem;
    height: 4.5rem;
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
	font-size: 2.5rem;
    background-color: ${props => props.active ? chroma('#6762df').alpha(0.2) : ""};
    border: ${props => props.active ? "" : "1px solid #e0e4e7"};
	font-weight: 400;
`

const HeadingText = styled.div`
    letter-spacing: 1.5;
    font-weight: 500;
    font-size: 1.8rem;

`

const MenuButton = styled.div`
	min-height: 6rem;
	max-height: 6rem;
    cursor: pointer;
    display: flex;
    background-color: ${props => props.active ? chroma('#6762df').alpha(0.15) : "" };
    align-items: center;
	padding: 0.7rem 1.3rem;
    transition: background-color 0.05s ease-out;
    &:first-of-type {
        border-top-left-radius: 0.4rem;
        border-top-right-radius: 0.4rem;
    }

    &:last-of-type {
        border-bottom-left-radius: 0.4rem;
        border-bottom-right-radius: 0.4rem;
    }
`