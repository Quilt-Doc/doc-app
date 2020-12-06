import React, { useRef, useEffect, useCallback, useState } from 'react'

// slate
import {  ReactEditor, useSlate } from 'slate-react'
import { Transforms, Editor, Node } from 'slate'

//styles
import styled from 'styled-components'
import chroma from 'chroma-js';

//animation
import { CSSTransition } from 'react-transition-group';

//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCode, faCheckSquare, faCube, faCut, faPlus ,faTrash, faQuoteLeft, faBold, faTable, faImage,  faRemoveFormat, faLink,  faItalic, faUnderline, faStrikethrough, faListUl, faListOl  } from '@fortawesome/free-solid-svg-icons'
import { BiParagraph } from 'react-icons/bi';

//lodash
import _ from 'lodash'


const MarkupMenu = (props) => {
	const editor = useSlate()
	let [rect, changeRect] = useState(null)
	let [open, changeOpen] = useState(false)
	let [position, changePosition] = useState(0);

	let menuButtonRefs = {};

	const typeMapping = {
		"paragraph": {name: "Paragraph", description: "Plain paragraph style text"},
		"heading-one": {name: "Heading 1", description: "Large sized header"},
		"heading-two": {name: "Heading 2",  description: "Medium sized header"},
		"heading-three": {name: "Heading 3", description: "Small sized header"},
		"quote": {name: "Quote", description: "Block for direct quotations"},
		"bulleted-list": {name: "Bulleted list", description: "Bulleted list to order phrases"},
		"numbered-list": {name: "Numbered list", description: "Numbered list to display series"},
		"code-block": {name: "Code block", description: "Block of inline, editable code"},
		"code-reference": {name: "Code reference", description: "Pointer to repository declarations"},
		"code-snippet": {name: "Code snippet", description: "Segments of code files"},
		"check-list":{name: "Check list", description: "Check list to keep track"},
		"link":{name: "Link", description: "Link to any url"},
		"table":{name: "Table", description: "Table for complex formatting"},
		"image":{name: "Image", description: "Image embedded into block"},
	}


	const toggleBlock = useCallback(
		(e, editor, range, type) => { /*selection_then, setActive, range, start_path) => {*/
			e.preventDefault()
			if (range.focus.offset !== range.anchor.offset) {
				range = _.cloneDeep(range)
				range.focus.offset += 1
			}

			const slateNode = Node.get(editor, [editor.selection.anchor.path[0]]);

            const { anchor: { offset }} = range;

			const filterText = Node.string(slateNode).slice(offset + 1, editor.selection.anchor.offset);
			console.log(filterText);

			const { selection: { focus }} = editor;
        	const { anchor } = range;
        
			Transforms.select(editor, { anchor, focus });
			Transforms.delete(editor)

			/*
			Transforms.select(editor, range)
			Transforms.delete(editor)
			*/
			/*
			if (blocktype === 'code-reference') {
				props.dispatch({type: 'markupMenuOff'})
				Transforms.insertText(editor, '*')
				ReactEditor.focus(editor)
				props.dispatch({type: 'referenceMenuOn'})
			} */

			//editor.insertBlock({type}, range);
			
			if (type === 'code-snippet') {
				editor.insertText('&');
				props.dispatch({type: "markupMenuOff"});
				/*
				props.dispatch({type: "snippetMenuOn"});
				*/
			} else {
				editor.insertBlock({type}, range)
			}
		}, []
	)

	/*
	const handleClickOutside = (event) => {
		if (ref && !ref.current.contains(event.target)){
			props.dispatch({type: 'markupMenuOff'})
		}
	}*/

	useEffect(() => {
		if (props.state.markupMenuActive && editor.selection) {
			//let editorContainer = document.getElementById("editorContainer");
			//if (editorContainer) editorContainer.style.overflowY = "hidden"
			//const domSelection= window.getSelection()
			
			let path = [editor.selection.anchor.path[0]]
			let offset = editor.selection.anchor.offset - 1
			let newRect = ReactEditor.toDOMRange(editor, 
							{anchor: {offset, path}, 
							focus: {offset, path }}).getBoundingClientRect();
			changeRect(newRect);
			//document.addEventListener("mousedown", handleClickOutside, false)
			changeOpen(true);
        } else {
			//document.removeEventListener("mousedown", handleClickOutside, false)
			//let editorContainer = document.getElementById("editorContainer");
			//if (editorContainer) editorContainer.style.overflowY = "scroll";
			changeOpen(false);
		}
	}, [props.state.markupMenuActive])


	useEffect(() => {
		// position refers to the current selection in the block types
		let {position} = props.state.hovered;
		if (position !== undefined && position !== null) {
			if (position in menuButtonRefs) {
				let buttonTop = menuButtonRefs[position].offsetTop
				let buttonH = menuButtonRefs[position].clientHeight
				let {clientHeight, scrollTop} = document.getElementById("markupMenuList")
				if (buttonTop + buttonH > clientHeight + scrollTop) {
					menuButtonRefs[position]
						.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
				} else if (scrollTop > buttonTop){
					menuButtonRefs[position]
						.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
				}
				//menuButtonRefs[position].scrollIntoView()
			}
		}
	}, [props.state.hovered.position])

	
	const renderMenuIcon = (type) => {
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
			case "code-reference":
				return <FontAwesomeIcon icon={faCube}/>
			case "code-snippet":
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
	

	const renderMenu = () => {

		
		return props.state.blocktypes.map((type, i) => {
			let icon = renderMenuIcon(type)
			return (
				<MenuButton  
					ref = {node =>{menuButtonRefs[i] = node;}}

					onMouseEnter = {() => props.dispatch({type: 'setHovered', payload: {position: i, ui: 'mouse'}})}

					active = { i === props.state.hovered.position }

					backgroundColor = {
						i === props.state.hovered.position ? '#F7F9Fb' : '#FFFFFF'
					} 
					onMouseDown={(e) => {toggleBlock(e, editor, props.range, type) }}
				>
					<IconBorder active = { i === props.state.hovered.position }>
						{icon}
					</IconBorder>
					<MenuButtonText>
						<MenuButtonTitle>{typeMapping[type].name}</MenuButtonTitle>
						<MenuButtonDescription>{typeMapping[type].description}</MenuButtonDescription>
					</MenuButtonText>
				</MenuButton>
			)
		})
	}
	/*
	el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`
    el.style.left = `${rect.left +
      window.pageXOffset -
      el.offsetWidth / 2 +
      rect.width / 2}px`
	*/

	return (
		<>
			<MenuContents 
				documentModal = {props.documentModal}
				open = {open}
				renderMenu = {renderMenu}
				rect = {rect}
				dispatch = {props.dispatch}
			/>
		</>
	)
}




class MenuContents extends React.Component {
	constructor(props){
		super(props)
	}

	componentDidUpdate(prevProps) {
		const {open} = this.props;
		if (prevProps.open !== open) {
			if (open) {
				document.addEventListener('mousedown', this.handleClickOutside, false);
			} else {
				document.removeEventListener('mousedown', this.handleClickOutside, false);
			}
		}
	}
	
    handleClickOutside = (event) => {
        if (this.node && !this.node.contains(event.target)) {
			document.removeEventListener('mousedown', this.handleClickOutside, false);
            this.props.dispatch({type: "markupMenuOff"})
        }
	}
	
	convertRemToPixels = (rem) => {    
		return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
	}

	render(){
		let {open, renderMenu, rect, documentModal} = this.props
		if (rect) {
			
			if (documentModal) {	
				let background = document.getElementById("documentModalBackground");
				rect = {left: rect.left, height: rect.height, top: rect.top + background.scrollTop};
			} 
			
			let height = this.convertRemToPixels(40);
			if (rect.top + height - 100 > window.innerHeight){
				rect = {top: rect.top - height , left: rect.left, height: rect.height}
				//rect.top = rect.top - height - rect.height;
			}
		}
		
		return(
			<CSSTransition
				in = {open}
				unmountOnExit
				enter = {true}
				exit = {true}
				timeout = {150}
				classNames = "dropmenu"
			>
				<Menu 
					ref = {node => this.node = node}
					style = {{
						top: rect ?  rect.top + rect.height/2 : 0, 
						left: rect ? rect.left : 0}}
				>
				<HeaderContainer>Insert Markup</HeaderContainer>
					<ListItemContainer id = "markupMenuList">
						{renderMenu()}
					</ListItemContainer>
				</Menu>
			</CSSTransition>
		)
	}
}



export default MarkupMenu

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
	box-shadow: 0 30px 60px -12px rgba(50,50,93,0.25),0 18px 36px -18px rgba(0,0,0,0.3);
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