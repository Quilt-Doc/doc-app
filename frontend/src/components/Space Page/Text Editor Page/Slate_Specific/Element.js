import React, { useRef, useState, useCallback } from 'react'

// slate
import { ReactEditor, useSlate, useSelected } from 'slate-react'
import { Editor, Node, Transforms } from 'slate'

//styles
import styled from 'styled-components'

//icons
import menu_editor from '../../../../images/menu_editor.svg'

//reactdnd
import {ItemTypes} from '../Drag_Types';
import { useDrag, useDrop} from 'react-dnd'
import { Transform } from 'stream';



class Element extends React.Component {

	constructor(props){
		super(props)
		this.state = {
			opacity: '0'
		}
	}

	
	renderElement(element, attributes, children) {
		if (element.type ==='list-item') {
			return <li {...attributes}>{children}</li>
		} else if (element.type === 'code-line') {
			return <CodeLine {...attributes}>{children}</CodeLine>
		} else {
			return <ElementWrapper element = {element} attributes = {attributes} children = {children}/>
		}		
	}

	render(){
		let attributes = this.props.attributes
		let children = this.props.children
		let element = this.props.element
		return (
			<>{this.renderElement(element, attributes, children)}</>
		)
	}
}

export default Element 
//Utility Components

function swapNodes(item, children, attributes, element, editor) {
	let oldPath = ReactEditor.findPath(editor, item.node)
	let movePath = ReactEditor.findPath(editor, element)
	if (movePath[0] > oldPath[0]) {
		movePath[0] -= 1
	} 
	Transforms.moveNodes(editor, 
		{
			at: oldPath,
			to: movePath
		})
}

const ElementWrapper = ({children, attributes, element}) => {
	let editor = useSlate()
	let [styles, changeStyles] = useState({opacity: 0})


	const [{ isOver, canDrop, borderTop, leftNavOpacity}, drop] = useDrop({
		accept: ItemTypes.SLATEBLOCK,
		drop: (item, monitor) => swapNodes(item, children, attributes, element, editor),
		collect: (monitor) => ({
			borderTop: monitor.isOver() ? "2px solid #1724AE;" : "",
			leftNavOpacity: monitor.canDrop() ? "0" : "1",
		  	isOver: !!monitor.isOver(),
		  	canDrop: !!monitor.canDrop()
		})
	})

	const [{opacity, padding}, drag, preview] = useDrag({
		item: { type: ItemTypes.SLATEBLOCK, node: element },
		collect: monitor => ({
			opacity: monitor.isDragging() ? 0.1 : 1,
		}),
	})

	const renderOpacity = () => {
		if (canDrop) {
			return leftNavOpacity
		} else {
			return styles.opacity
		}
	} 

	

	return (
		<Wrapper 
				ref={drop}
				onMouseEnter = {() => changeStyles({...styles, opacity: 1})}
				onMouseLeave = {() => changeStyles({...styles, opacity: 0})}
			>
				<LeftNav  opacity = {renderOpacity()}  contentEditable = {false} /*opacity = {this.state.opacity}*/>
					<BlockTool drag = {drag} element = {element}/>
				</LeftNav>
				<div ref = {preview}>
					{getCorrectElement(borderTop, element, attributes, children)}
				</div>
		</Wrapper>
	)
}

const getCorrectElement = (borderTop, element, attributes, children) => {
	let type = element.type
	switch (type) {
		case 'heading-one':
			return <H1 borderTop = {borderTop}  {...attributes}>{children}</H1>
		case 'heading-two':
			return <H2 borderTop = {borderTop} {...attributes}>{children}</H2>
		case 'heading-three':
			return <H3 borderTop = {borderTop} {...attributes}>{children}</H3>
		case 'bulleted-list':
			return <UL borderTop = {borderTop} {...attributes}>{children}</UL>
		case 'code-block':
			return <CodeBlock borderTop = {borderTop} {...attributes}>{children}</CodeBlock>
		case 'code-reference':
			return (
						<CodeReference  
							color = {element.color} 
							path = {element.path}
							name = {element.name}
							kind = {element.kind}
							{...attributes}>{children}
						</CodeReference>
							
					)
		default:
			return <P borderTop = {borderTop}  {...attributes}>{children}</P>
	}
}




const BlockTool = (props) => {
	let editor = useSlate()
	let [dropdownOpacity, setDropdownOpacity] = useState(0)
	const toolRef = useRef()
	const typeMapping = {
		"paragraph": {name: "Text", icon: "text-outline", description: "Paragraph style text markup"},
		"heading-one": {name: "Heading 1", icon: "filter-outline", description: "Large sized header for titles"},
		"heading-two": {name: "Heading 2", icon: "filter-outline", description: "Medium sized header to delineate sections"},
		"heading-three": {name: "Heading 3", icon: "filter-outline", description: "Subheader to delineate sections"},
		"list-item": {name: "Bullet list", icon: "list-outline", description: "Bulleted list to order items and text"},
		"code-line": {name: "Code snippet", icon: "code-slash-outline", description: "Block of inline, editable code"},
		"code-reference": {name: "Code reference", icon: "code-slash-outline", description: "Pointer to repository declarations"}
	}
	
	let insertBlock = () => {
		let node = { type: 'paragraph', children: [] }
		let point = Editor.end(editor, ReactEditor.findPath(editor, props.element))

		Transforms.splitNodes(
			editor, 
			{at: point}
		)

		let temp = ReactEditor.findPath(editor, props.element)
		temp[0] += 1
		Transforms.select(editor, temp)
		
		Transforms.insertNodes(
			editor,
			node,
			{ match: n => Editor.isBlock(editor, n), at: temp }
		)
			

		Transforms.select(editor, temp)
		
	
		ReactEditor.focus(editor)
	
	}

	const setNode = (type) => {
		Transforms.setNodes(editor, {type}, {at: ReactEditor.findPath(editor, props.element)})
	}

	const removeNode = () => {
		Transforms.removeNodes(editor, {at: ReactEditor.findPath(editor, props.element)})
	}

	const renderOptionsButtons = () => {
		return Object.keys(typeMapping).map(type => {
			return <OptionButton onClick = {() => setNode(type)}>{typeMapping[type].name}</OptionButton>
		})
	}


	return (
			<ToolbarContainer>
				<CreateBlockButton onClick = {() => {insertBlock()}}>
					<ion-icon style = {{'fontSize': '2rem'}}name="add-outline" ></ion-icon>
				</CreateBlockButton>
				<CreateBlockButton ref={props.drag} onClick = {() => {dropdownOpacity === 1 ? setDropdownOpacity(0) : setDropdownOpacity(1)}}>
					<ion-icon  style = {{'fontSize': '2rem'}} name="reorder-four-outline"></ion-icon>
				</CreateBlockButton>
				<OptionsMenu 
							contentEditable={false} 
							opacity = {dropdownOpacity}
							display = {dropdownOpacity === 1 ? '' : 'none'}
							style={{ userSelect: "none" }}
							>
					<OptionHeader 
						marginBottom = {'0.2rem'}
						borderBottom = {'1px solid #DFDFDF'}
						padding = {'1.5rem'}
						color = {'#ff4757'}
						hoverColor = {'#F7F9FB'}
						pointer = {'pointer'}
						onClick = {() => removeNode()}
						>	<ion-icon style ={{'fontSize': '1.4rem', 'marginRight': '0.5rem', 'width': '1.5rem'}} name="trash-outline"></ion-icon>
							Remove
						</OptionHeader>
					<OptionHeader padding = {'1.5rem'}>
						<ion-icon style ={{'fontSize': '1.4rem', 'marginRight': '0.5rem', 'width': '1.5rem'}} name="pencil-outline"></ion-icon>
						Set Markup
						</OptionHeader>
					{renderOptionsButtons()}
				</OptionsMenu>
			</ToolbarContainer>
	)
}

const OptionHeader = styled.div`
	height: 1.3rem;
	font-size: 1.3rem;
	display: flex;
	align-items: center;
	
	font-weight: 300;
	margin-bottom: ${props => props.marginBottom};
	border-bottom: ${props => props.borderBottom};
	padding: ${props => props.padding} 1rem;
	color: ${props => props.color};
	&:hover {
		cursor: ${props => props.pointer};
		background-color: ${props => props.hoverColor};
	}
`

const OptionButton = styled.div`
	font-size: 1.25rem;
	opacity: 0.8;
	font-weight: 300;
	margin-left: 0.2rem;
	padding: 0.6rem 0.8rem;
	&:hover {
		cursor: pointer;
		background-color: #F7F9FB;
		opacity: 1;
	}
`
const OptionsMenu = styled.div`
	width: 12rem;
	max-height: 31.5rem;
	position: absolute;
	box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
	overflow-y: scroll;
	color:  #262626;
	display: flex;
    flex-direction: column;
	
	transition: opacity 0.3s;
	background-color: white;
	border-radius: 3px;
	margin-top: 16rem;
	left: -2rem;
	z-index: 100;
	opacity: ${props => props.opacity};
	display: ${props => props.display};
	padding-bottom: 0.5rem;
`


const Menu = styled.div`
    width: 37rem;
    max-height: 31.5rem;
    position: absolute;
    z-index: 1;
    top: -10000px;
    left: -10000px;
    margin-top: -6px;
    opacity: 0;
    background-color: white;
    border-radius: 3px;
    transition: opacity 0.75s;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
	overflow-y: scroll;
	font-weight: 300;
	color:  #262626;
	
`


//Utility
const ToolbarContainer = styled.div`
	display: flex;
	align-items: center;
	margin-top: 0.3rem;
	position: relative;
`

const CreateBlockButton = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 0.3rem;
	color: #172A4E;
	opacity: 0.5;
	cursor: ${props => props.cursor};
	&:hover {
		background-color: #DFDFDF;
		opacity: 0.42;
		cursor: pointer;
	}
		/*border: 1px solid #262626;*/
	
`

const Wrapper = styled.div`
	position: relative;
	opacity = ${props => props.opacity};
	
`

const LeftNav = styled.span`
	position: absolute;
	left: -6rem;
	top: 0.2rem;
	padding-right: 1.1rem;
	padding-left: 1rem;
	opacity: ${props => props.opacity}; 
	transition: all .13s ease-in-out;
	
`

const StyledIcon = styled.img`
	width: ${props => props.width}rem;
	cursor: ${props => props.cursor};
	display: ${props => props.display};
`

//Markup Components

const H1 = styled.div`
  font-size: 3rem;
  /*letter-spacing: 1.78px;*/
  line-height: 1;
  margin-top: 3.5rem;
  color: #172A4E;
  border-top: 2px solid transparent;
  border-top: ${props => props.borderTop};
`

const H2 = styled.div`
  font-size: 2.5rem;
  /*letter-spacing: 1.33px;*/
  line-height: 1;
  text-transform: none;
  color: #172A4E;
  margin-top: 3rem;
  border-top: 2px solid transparent;
  border-top: ${props => props.borderTop};
`

const H3 = styled.div`
  font-size: 1.8rem;
  /*letter-spacing: -0.25px;*/
  line-height: 1.6;
  text-transform: none;
  margin-top: 2rem;
  color: #172A4E;
  border-top: 2px solid transparent;
  border-top: ${props => props.borderTop};
`

const P = styled.div`
  margin-top: 2rem !important;
  font-size: 1.6rem;
  line-height: 1.6;
  color: #172A4E;
  box-shadow: none;
  border-top: 2px solid transparent;
  border-top: ${props => props.borderTop};
`

const UL = styled.ul`
	margin-left: 2rem;
	border-top: 2px solid transparent;
  	border-top: ${props => props.borderTop};
`

const CodeBlock = styled.div`
    margin-top: 2.5rem;
    background-color: #F7F9FB;
	padding: 2.5rem;
	tab-size: 4;
	border-top: 2px solid transparent;
  	border-top: ${props => props.borderTop};
`

const CodeLine = styled.div`
	font-family: 'Roboto Mono', monospace !important;
    font-size: 1.35rem;
    padding: 0.1rem !important;
    boxShadow: 0 0 60px rgba(0, 0, 0, 0.08) !important;
	white-space: pre-wrap !important;
	color: #172A4E;
`


/*
  for further --
      case 'block-quote':
      return <blockquote {...attributes}>{children}</blockquote>
*/

// Reference Component
const CodeReference = (props) => {
	return (
		<CodeReferenceBox contentEditable = {false} color = {props.color} >
			<ReferenceClassName color = {props.color} >{props.kind}</ReferenceClassName>
			<CodeLine2>{props.path}<Name>{props.name}</Name></CodeLine2>
			<Source>[SOURCE]</Source>
		</CodeReferenceBox>
	)
}

const Name = styled.span`
    font-weight: bold;
    font-size: 1.4rem;
    color: #172A4E;
`

const Source = styled.div`
	font-size: 1rem;
	cursor: pointer;
	opacity: 0.5;
	transition: opacity 0.13s ease-in;
	&:hover {
		color: #19E5BE;
		opacity: 1;
	}
	align-self: flex-end;
`

const CodeLine2 = styled.div`
	font-family: 'Roboto Mono', monospace !important;
	font-size: 1.4rem;
	boxShadow: 0 0 60px rgba(0, 0, 0, 0.08) !important;
	white-space: pre-wrap !important;
	margin-left: 1.2rem;
	width: 170rem;
`

const ReferenceClassName = styled.div`
	text-transform: uppercase;
	color: ${props => props.color};
	font-size: 1.5rem;
	width: 15rem;
`

const CodeReferenceBox = styled.div`
	margin-top: 2.5rem;
	background-color: #F7F9FB;
	padding: 2rem;
	border-top: 2.25px solid ${props => props.color};
	display: flex;
`