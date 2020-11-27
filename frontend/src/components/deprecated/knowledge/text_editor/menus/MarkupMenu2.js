import React, { useEffect, useCallback, useState } from 'react'

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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCode, faCheckSquare, faCube, faCut, faPlus ,faTrash, faQuoteLeft, faBold, faTable, faImage,  faRemoveFormat, faLink,  faItalic, faUnderline, faStrikethrough, faListUl, faListOl  } from '@fortawesome/free-solid-svg-icons'
import { BiParagraph } from 'react-icons/bi';

//types
import { 
	SET_MARKUP_MENU_ACTIVE
} from '../editor/reducer/Editor_Types';

//lodash
import _ from 'lodash'


const MarkupMenu = (props) => {

    const { documentModal, dispatch } = props;

    const editor = useSlate();
    
    const [range, setRange] = useState(null);

    const [initialSelection, setInitialSelection] = useState(null);

    const [rect, setRect] = useState({top: 0, left: 0});

    const [open, setOpen] = useState(false);

    const [filteredOptions, setFilteredOptions] = useState(Object.values(defaultOptions));

    const [currentPosition, setCurrentPosition] = useState(0);

    let menuButtons = {};

    let menu = null;


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
        const option = filteredOptions[currentPosition];

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
            setFilteredOptions(newOptions);
            setCurrentPosition(-1);
        }
    }, [filterText]);


    const handleKeyDown = useCallback((event) => {
        const { key, keyCode } = event;

        if (key === "Enter") {
            event.preventDefault();
            const currentOption = filteredOptions[currentPosition];
            insertBlock(currentOption);
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
        if (menu && !menu.contains(event.target)) {
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
            rect.top = rect.top + scrollTop;
        } 
       
        if (menu) {
            let menuHeight = menu.getBoundingClientRect().height;
            if (rect.top + menuHeight - 100 > window.innerHeight){
                rect.top = rect.top - menuHeight;
            }
        }

        rect.top = rect.top + rect.height/2;
        return rect;
    }


    const insertBlock = useCallback((option) => {
        const { type } = option;

        Transforms.delete(editor, {
            at: editor.selection,
            distance: filterText.length,
            unit: 'character',
            reverse: true
        })

        if (type !== "reference-snippet") {
            editor.insertBlock({ type })
        } else {
            editor.insertText("&") // needs change
        }

        closeMenu();
    }, [filterText, range, initialSelection]);
    

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
                    <IconBorder>
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
                ref = { node => menu = node }
                rect = {rect}
                style = {{
                    top: rect.top,
                    left: rect.left
                }}
            >
                <HeaderContainer>Insert Markup</HeaderContainer>
                <ListItemContainer id = "markupMenuList">
                    {renderOptions()}
                </ListItemContainer>
            </Menu>
        </CSSTransition>
	)
}


const defaultOptions = {
    "paragraph": {type: "paragraph", name: "Paragraph", description: "Plain paragraph style text"},
    "heading-one": {type: "heading-one", name: "Heading 1", description: "Large sized header"},
    "heading-two": {type: "heading-two", name: "Heading 2",  description: "Medium sized header"},
    "heading-three": {type: "heading-three", name: "Heading 3", description: "Small sized header"},
    "quote": { type: "quote", name: "Quote", description: "Block for direct quotations"},
    "bulleted-list": { type: "bulleted-list", name: "Bulleted List", description: "Bulleted list to order phrases"},
    "numbered-list": { type: "numbered-list", name: "Numbered List", description: "Numbered list to display series"},
    "code-block": { type: "code-block", name: "Code Block", description: "Block of inline, editable code"},
    "reference-snippet": { type: "reference-snippet", name: "Reference Snippet", description: "Segments of repository files"},
    "check-list": { type: "check-list", name: "Check List", description: "Check list to keep track"},
    "link": { type: "link", name: "Link", description: "Link to any url"},
    "table": { type: "table", name: "Table", description: "Table for complex formatting"},
    "image": { type: "image", name: "Image", description: "Image embedded into block"},
}

const getMenuIcon = (type) => {
    switch (type) {
        case "heading-one":
            return "H1"
        case "heading-two":
            return "H2"
        case "heading-three":
            return "H3"
        case "quote":
            return <FontAwesomeIcon icon = {faQuoteLeft}/>
        case "bulleted-list":
            return <FontAwesomeIcon icon={faListUl}/>
        case "numbered-list":
            return <FontAwesomeIcon icon={faListOl}/>
        case "code-block":
            return <FontAwesomeIcon icon={faCode}/>
        case "reference-snippet":
            return <FontAwesomeIcon icon={faCut}/>
        case "check-list":
            return <FontAwesomeIcon icon={faCheckSquare}/>
        case "link":
            return <FontAwesomeIcon icon={faLink}/>
        case "table":
            return <FontAwesomeIcon icon={faTable}/>
        case "image":
            return <FontAwesomeIcon icon={faImage}/>
        default:
            return  <BiParagraph/>
    }	
}


export default MarkupMenu;


const ListItemContainer = styled.div`
	display: flex;
	flex-direction: column;
	padding: 0rem 0rem;
	max-height: 35rem;
	overflow-y: scroll;
	padding-bottom: 1rem;
`

const Menu = styled.div`
	width: 31rem;
    position: absolute;
    z-index: 1;
    background-color: white;
	border-radius: 0.3rem;
    display: flex;
    flex-direction: column;
	box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px, rgba(9, 30, 66, 0.25) 0px 4px 8px -2px;
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
    border-radius: 0.3rem;
    width: 4.5rem;
    height: 4.5rem;
    background-color: white;
    display: flex;
    justify-content: center;
    align-items: center;
	
	font-size: 1.7rem;
	
	border: 1px solid ${props => props.active ? chroma('#6762df').alpha(0.4) : "#E0E4E7"};
	font-weight: 400;
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
`