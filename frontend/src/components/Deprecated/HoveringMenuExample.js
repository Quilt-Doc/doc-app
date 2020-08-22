
import React, { useReducer, useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Slate, Editable, ReactEditor, withReact, useSlate } from 'slate-react'
import { Node, Editor, Transforms, Text, createEditor } from 'slate'
//import { css } from 'emotion'
import { withHistory } from 'slate-history'
import _ from 'lodash'
import styled from "styled-components";
import SyntaxHighlighter from 'react-syntax-highlighter';
import Prism from 'prismjs'

import more_editor_icon from '../../../images/more_editor.svg'

import "../../../css/prism.css";

import { Range, Point } from 'slate'

import menu_editor from '../../../images/menu_editor.svg'


//PREVENT SCROLL IF ACTIVE

//Heading1 or Text hovered results in scrolling messup
// STATIC METHOD STRING INTERPOLATION
// TOOLBAR ON SMALL BUTTON
// MAKE IT CHANGE THE NODE IF THE OFFSET IS 0
// FIX DROPDOWN RENDERING WEIRDLY DEPENDING ON PLACE
// MODIFY LEVEL OF DETAIL IN REFERENCE
// MAY NEED TO CHECK LOCATION OF ATTRIBUTES --- HIGHEST LEVEL ELEM?
// CHANGE BACKWARD BEHAVIOR IF AFTER A REFERENCE


//BUGS
//TEXT AREA SCROLL BUG
//HOVER POSITION IN DROPDOWN JUMPING SOMETIMES OR NOT MOVING ON DOWN PRESS

//EXTENSIONS/MAYBE
// INSERT P NODE BELOW CODE OR LIST IF CREATED


//Priorities
// FIX MARGINS
// CLEAN DROPDOWN LOOK
// PLACEHOLDER FOR PARAGRAPH ELEMENT
// FIX EMBEDDABLE
// FIX TOOLBAR
// FIX CREATION
// IMPLEMENT DRAGGING


const SHORTCUTS = {
	'*': 'code-line',
	'-': 'list-item',
	'+': 'list-item',
	'>': 'block-quote',
	'#': 'heading-one',
	'##': 'heading-two',
	'###': 'heading-three',
	'####': 'heading-four',
	'#####': 'heading-five',
	'######': 'heading-six',
}

const editor_reducer = (state, action) => {
	switch (action.type) {
		case 'turn_active_on':
			console.log("WHATS WRONG")
			console.log(state.is_active)
			if (!state.is_active) {
				return { ...state, is_active: true, is_active_count: 1, ...action.payload }
			} else {
				let is_active_count = state.is_active_count + 1
				return { ...state, is_active_count }
			}
		case 'turn_active_off':
			return { ...state, is_active: false, is_active_count: 0, hovered: {position: 0, ui: 'mouse'},  blockLength: 7, blocks: [
				{name: "Text", icon: "text-outline", block: "paragraph"},
				{name: "Heading 1", icon: "filter-outline", block: "heading-one"},
				{name: "Heading 2", icon: "filter-outline", block: "heading-two"},
				{name: "Heading 3", icon: "filter-outline", block: "heading-three"},
				{name: "Bullet list", icon: "list-outline", block: "list-item"},
				{name: "Code snippet", icon: "code-slash-outline", block: "code-line"},
				{name: "Code reference", icon: "code-slash-outline", block: "code-reference"}
			 ]}
		case 'add_text':
			//const active = state.is_active
			const new_text = state.text + action.payload
			return { ...state, text: new_text }
		case 'update_focus':
			if (state.is_active) {
				return { ...state, focus: action.payload }
			} else {
				return state
			}
		case 'setHovered':
			return {...state, hovered: action.payload}
		case 'setLengthBlocks':
			return {...state, hovered: {position: 0, ui: state.hovered.ui}, blockLength: action.payload, blocks: action.filterBlocks}
		default:
			return state
	}
}

function getContent(token) {
	if (typeof token === 'string') {
		return token
	} else if (typeof token.content === 'string') {
		return token.content
	} else {
		return token.content.map(getContent).join('')
	}
}

const HoveringMenuExample = () => {
	const [value, setValue] = useState(initialValue)

	const initial_reducer_state = { is_active: false, start_path: null, end_path: null, text: '', rect: null, hovered: {position: 0, ui: 'mouse'}, blockLength: 7, blocks: [
		{name: "Text", icon: "text-outline", block: "paragraph"},
		{name: "Heading 1", icon: "filter-outline", block: "heading-one"},
		{name: "Heading 2", icon: "filter-outline", block: "heading-two"},
		{name: "Heading 3", icon: "filter-outline", block: "heading-three"},
		{name: "Bullet list", icon: "list-outline", block: "list-item"},
		{name: "Code snippet", icon: "code-slash-outline", block: "code-line"},
		{name: "Code reference", icon: "code-slash-outline", block: "code-reference"}
	 ]}

	const [state, dispatch] = useReducer(
		editor_reducer,
		initial_reducer_state
	);

	const renderElement = useCallback(props => <Element {...props} />, [])
	const renderLeaf = useCallback(props => <Leaf {...props} />, [])


	///add number of new lines to index, make start length of last guy

	const editor = useMemo(() => withShortcuts(withHistory(withReact(createEditor())), dispatch), [])
	
	const decorate = useCallback(([node, path]) => {
		const ranges = []
		//console.log("ORIGINAL PATH", path)
		if (node.type == 'code-block') {
			let childTexts = []
			for (let child of Node.texts(node)) { 
				childTexts.push(child[0].text)
			}
			//console.log("CHILDTEXTS", childTexts)
			if (childTexts !== []) {
				const string = childTexts.join('\n')
				const grammar = Prism.languages["python"]
				const tokens = Prism.tokenize(string, grammar).reverse()

				const identifiers = {
										'keyword':'#C679DD',
										'boolean': '#56B6C2',
										'function': '#61AEEE',
										'class-name': '#E6C07A',
										'string': '#98C379',
										'triple-quoted-string': '#98C379',
										'number': '#D19966'
									 }

				
				//tokens.forEach(token => console.log(token))

				let start = 0
				let index = 0
				let maxCount = 0
				//console.log("STARTED")
				//tokens.forEach(token => console.log(token))
				while (tokens.length != 0) {
					let token = tokens.pop()
					if (typeof token !== "string") {
						
						if (token.type in identifiers) {
							let pathToStyle = path.concat([index, 0])
							ranges.push({
								anchor: { path: pathToStyle, offset: start },
								focus: { path: pathToStyle, offset: start + token.length },
								color: identifiers[token.type]
							})
							//console.log(ranges)
						} else if (token.type === "comment") {
							let pathToStyle = path.concat([index, 0])
							ranges.push({
								anchor: { path: pathToStyle, offset: start },
								focus: { path: pathToStyle, offset: start + token.length },
								color: '#5C6370',
								oblique: true
							})
						}
						start += token.length
					} else {
						let content = getContent(token).split("\n")
						if (content.length > 1) {
							index += content.length - 1
							start = content[content.length - 1].length
						} else {
							start += content[0].length
						}
					}
				}
			}
		}
		return ranges
	}, [])
	/*
	
	  {
		type: 'code-line',
		children: [{text:'import numpy as np'}]
	  }, 
	  {
		type: 'code-line',
		children: [{text:'  def pingu(x: int):'}]
	  }],
	*/
	
	const insertBlock = (editor, blocktype) => { /*selection_then, setActive, range, start_path) => {*/
		let range = { anchor: state.anchor, focus: state.focus }
		if (range.focus.offset !== range.anchor.offset) {
			range = _.cloneDeep(range)
			range.focus.offset += 1
		}
		//console.log(range)
		Transforms.select(editor, range)
		Transforms.delete(editor)
		const node = { type: blocktype, children: [] }

		console.log(Editor.end(editor, range.focus.path))
		Transforms.insertNodes(
			editor,
			node,
			{ match: n => Editor.isBlock(editor, n), at: Editor.end(editor, range.focus.path) }
		)

		

		Transforms.select(editor, { offset: 0, path: [range.focus.path[0] + 1, 0] })
		if (blocktype === 'code-line') {
			const list = { type: 'code-block', children: [] }
			Transforms.wrapNodes(editor, list, {
				match: n => n.type === 'code-line',
			})
		}

		if (blocktype === 'list-item') {
			const list = { type: 'bulleted-list', children: [] }
			Transforms.wrapNodes(editor, list, {
				match: n => n.type === 'list-item',
			})
		}

		ReactEditor.focus(editor)
		dispatch({ type: 'turn_active_off' })
	}


	
	



	
	let range = { anchor: state.anchor, focus: state.focus }

	console.log(state.is_active)
	return (
		<Slate editor={editor} value={value} onChange={value => setValue(value)}>
			<HoveringToolbar dispatch={dispatch} range={range} active={state.is_active} rect={state.rect} hovered = {state.hovered} blockLength = {state.blockLength}/>
			<StyledEditable
				onClick = {() => {
					if (state.is_active){
						dispatch({'type': 'turn_active_off'})
					}
					
				}}
				onKeyDown={event => {
					if (event.key === "Tab") {
						event.preventDefault()
						editor.insertText("\t")
					} else if (event.key === "Enter") {
						if (state.is_active) {
							event.preventDefault()
							insertBlock(editor, state.blocks[state.hovered.position].block)
							dispatch({type: 'turn_active_off'})
						} else {
							const { selection } = editor
							const match = Editor.above(editor, {
								match: n => Editor.isBlock(editor, n),
							})
							const [block, path] = match
	
							if (block.type !== 'code-line' && block.type !== 'list-item' && Range.isCollapsed(selection)) {
								event.preventDefault()
								const end = Editor.end(editor, path)
								const start = Editor.start(editor, path)
								if (Point.equals(selection.anchor, end)) {
									const node = { type: "paragraph", children: [] }
									Transforms.insertNodes(editor, node, {at: end})
									Transforms.select(editor, [end.path[0] + 1, 0])
								} else if (Point.equals(selection.anchor, start))  { 
									const node = { type: "paragraph", children: [] }
									Transforms.insertNodes(editor, node, {at: start})
								} else {
									Transforms.splitNodes(editor)
									Transforms.setNodes(
										editor, 
										{type: 'paragraph'},
										{ match: n => Editor.isBlock(editor, n)}
									)
								}
							}
						}
					} else if (state.is_active && event.keyCode === 40) {
						event.preventDefault()
						console.log("HOVER POSITION", state.hovered.position)
						console.log("BLOCKLENGTH", state.blockLength)
						
						if (state.hovered.position + 1 < state.blockLength) {
							dispatch({type: 'setHovered', payload: {position: state.hovered.position + 1, ui: 'key'}})
						}
					} else if (state.is_active && event.keyCode === 38) {
						event.preventDefault()
						if (state.hovered.position !== 0) {
							dispatch({type: 'setHovered', payload: {position: state.hovered.position - 1, ui: 'key'}})
						}
					}
				}}
				renderElement={renderElement}
				renderLeaf={renderLeaf}
				placeholder="Enter some text..."
				spellCheck="false"
				decorate={decorate}
			/>
		</Slate>
	)
}

const toggleFormat = (editor, format) => {
	const isActive = isFormatActive(editor, format)
	Transforms.setNodes(
		editor,
		{ [format]: isActive ? null : true },
		{ match: Text.isText, split: true }
	)
}

const isFormatActive = (editor, format) => {
	const [match] = Editor.nodes(editor, {
		match: n => n[format] === true,
		mode: 'all',
	})
	return !!match
}


const HoveringToolbar = (props) => {
	const ref = useRef()
	const editor = useSlate()
	//onBlur={() => {
	// editor.lastSelection = editor.selection;
	//}}
	let blockTypes = [
						{name: "Text", icon: "text-outline", block: "paragraph"},
						{name: "Heading 1", icon: "filter-outline", block: "heading-one"},
						{name: "Heading 2", icon: "filter-outline", block: "heading-two"},
						{name: "Heading 3", icon: "filter-outline", block: "heading-three"},
						{name: "Bullet list", icon: "list-outline", block: "list-item"},
						{name: "Code snippet", icon: "code-slash-outline", block: "code-line"},
						{name: "Code reference", icon: "code-slash-outline", block: "code-reference"}
					 ]
	let filteredBlockTypes = blockTypes
	const toggleBlock = useCallback(
		(editor, props, blocktype) => { /*selection_then, setActive, range, start_path) => {*/
			let range = props.range
			console.log("RANGE BLOCK", range)
			console.log(Editor.start(editor, range.anchor.path))
			if (props.range.focus.offset !== props.range.anchor.offset) {
				range = _.cloneDeep(props.range)
				range.focus.offset += 1
			}
			//console.log(range)
			Transforms.select(editor, range)
			Transforms.delete(editor)
			const node = { type: blocktype, children: [] }

			console.log(Editor.start(editor, range.anchor.path))
			console.log(range.anchor)
			if (!Point.equals(range.anchor, Editor.start(editor, range.anchor.path))) {
				Transforms.insertNodes(
					editor,
					node,
					{ match: n => Editor.isBlock(editor, n), at: Editor.end(editor, range.focus.path) }
				)
	
				Transforms.select(editor, { offset: 0, path: [range.focus.path[0] + 1, 0] })
			} else {
				Transforms.setNodes(
					editor,
					{ type: blocktype },
					{ match: n => Editor.isBlock(editor, n) }
				)
			}
			if (blocktype === 'code-line') {
				const list = { type: 'code-block', children: [] }
				Transforms.wrapNodes(editor, list, {
					match: n => n.type === 'code-line',
				})
			}

			if (blocktype === 'list-item') {
				const list = { type: 'bulleted-list', children: [] }
				Transforms.wrapNodes(editor, list, {
					match: n => n.type === 'list-item',
				})
			}


			ReactEditor.focus(editor)

			//Transforms.liftNodes(editor, {at: next_item.focus})

			props.dispatch({ type: 'turn_active_off' })


			//Transforms.delete(editor)



			//const tempo = _.cloneDeep(selection_then)
			//tempo['path'][0] += 1
			//console.log(selection_then)
			//console.log(tempo)
			/*
			tempo[1] = tempo[1] + 1
			console.log(tempo)
			selection_then['path'] = tempo
			console.log(editor)
			*/
			//Transforms.select(editor, selection_then)

			//const nodette = { type: 'heading-one', children: [] }

			/*
			Transforms.insertNodes(
			  editor,
			  nodette,
			  { at: dropdown_options.start_path }
			)
			Transforms.delete(editor)
			//console.log(editor)
			*/
			/*
			 setDropdownOptions({
			   isactive: false, 
			   start_path: null,
			   end_path: null,
			   rect: null
			 })
			*/
		}, []
	)

	useEffect(() => {
		const el = ref.current

		if (!el) {
			return
		}
		//|| !ReactEditor.isFocused(editor) || !Range.isCollapsed(selection)
		if (!props.active || !props.rect) {
			el.removeAttribute('style')
			return
		}
		
		

		el.style.opacity = 1
		el.style.top = `${props.rect.top + window.pageYOffset + 15 + props.rect.height}px`
		el.style.left = `${props.rect.left + window.pageXOffset + 2.5}px`
	})

	if (props.active) {
		for (let t of Node.texts(editor, {from: props.range.anchor.path, to: props.range.anchor.path})){
			let filterText = t[0].text.slice(props.range.anchor.offset + 1, props.range.focus.offset + 1)
			filteredBlockTypes = blockTypes.filter(blocktype => {
				return blocktype.name.toLowerCase().includes(filterText.toLowerCase())
			})
		}

		if (filteredBlockTypes.length === 0) {
			props.dispatch({ type: 'turn_active_off' })
		}
	}

	const renderFilterBlocks = () => {
		let blocks = filteredBlockTypes.map((block, i) => {
						let backgroundColor = 'white'
						if (i === props.hovered.position) {
							backgroundColor = '#F4F4F6'
						}
						return (
							//onMouseEnter
							<MenuButton  
								onMouseEnter = {() => props.dispatch({type: 'setHovered', payload: {position: i, ui: 'mouse'}})}
								backgroundColor = {backgroundColor} 
								onClick={() => { toggleBlock(editor, props, block.block) }}
							>
								<IconBorder><ion-icon style={{ 'fontSize': '20px !important' }} name={block.icon}></ion-icon></IconBorder>
								<MenuButtonText>{block.name}</MenuButtonText>
							</MenuButton>
						)
					})
		
		console.log(blocks.length)
		console.log(props.blockLength)
		if (blocks.length !== props.blockLength) {
			props.dispatch({type: 'setLengthBlocks', filterBlocks: filteredBlockTypes,  payload: blocks.length})
		}

		return blocks
	}
	
		
	return (<Menu ref={ref}>
		<MenuHeader>Insert Blocks</MenuHeader>
			{renderFilterBlocks()}
			{checkScroll(ref, props.hovered)}
		</Menu>
	)
}

/*

{
				filteredBlockTypes.map((block, i) => {
					let backgroundColor = 'white'
					if (i === props.hovered.position) {
						backgroundColor = '#F4F4F6'
					}
					return (
						//onMouseEnter
						<MenuButton  
							onMouseEnter = {() => props.dispatch({type: 'setHovered', payload: {position: i, ui: 'mouse'}})}
							backgroundColor = {backgroundColor} 
							onClick={() => { toggleBlock(editor, props, block.block) }}
						>
							<IconBorder><ion-icon style={{ 'fontSize': '20px !important' }} name={block.icon}></ion-icon></IconBorder>
							<MenuButtonText>{block.name}</MenuButtonText>
						</MenuButton>
					)
				})

			}
			*/

const checkScroll = (ref, hovered) => {
	if (ref.current && hovered.ui === 'key') {
		if (hovered.position * 100 > ref.current.clientHeight) {
			let scr = hovered.position * 100 - ref.current.clientHeight
			ref.current.scrollTop = scr
		} else {
			ref.current.scrollTop = 0
		}
	}
}



export default HoveringMenuExample;

const StyledSlate = styled(Slate)`
  line-height: 1 !important;
  caret-color: rgb(55, 53, 47);
`

const StyledEditable = styled(Editable)`
  line-height: 1.5 !important;
  caret-color: #46474f;
  color: #46474f;
  font-size: 16px;
  margin: 0 auto;
  padding-top: 6rem;
  width: 78%;
  padding-bottom: 2rem;
`

const MenuHeader = styled.div`
color:  black;
opacity: 0.9;
margin-top: 0.3rem;
margin-bottom: 0.3rem;
margin-left: 0.2rem;

`

const MenuButtonText = styled.div`
  margin-left: 1.5rem;
  font-size: 1.55rem;
  color:  black;
  opacity: 0.9;
`

const IconBorder = styled.div`
  
  border-radius: 7px;
  width: 4.5rem;
  height: 4.5rem;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  box-shadow: 0 3px 6px 0 rgba(0,0,0,.1), 0 1px 3px 0 rgba(0,0,0,.08);
`

const StyledIcon = styled.img`
	width: ${props => props.width}rem;
	cursor: ${props => props.cursor};
`


const AboveStyled = styled(Slate)`
  color: green !important;
`

const Button = styled.div`

`

const Icon = styled.div`

`

const Menu = styled.div`
  
  width: 23rem;
  max-height: 31rem;
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
`

const MenuButton = styled.div`
  height: 7rem;
  cursor: pointer;
  display: flex;
  background-color: ${props => props.backgroundColor};
  align-items: center;
  padding: 1rem;
  border-radius: 3px;
`

const Portal = styled.div`
`


const Leaf = ({ attributes, children, leaf }) => {
	//console.log(leaf)
	if (leaf.bold) {
		children = <strong>{children}</strong>
	}

	if (leaf.italic) {
		children = <em>{children}</em>
	}

	if (leaf.underlined) {
		children = <u>{children}</u>
	}
	
	if (leaf.color) {
		children = <ColoredSpan color = {leaf.color}>{children}</ColoredSpan>
	}

	if (leaf.oblique) {
		children = <ObliqueSpan color = {leaf.color}>{children}</ObliqueSpan>
	}
	

	return <span {...attributes}>{children}</span>
}

const ColoredSpan = styled.span`
	color : ${props => props.color};
`

const ObliqueSpan = styled.span`
	font-style: italic;
`




//turn off hovering dropdown if no results

const withShortcuts = (editor, dispatch) => {
	const { deleteBackward, insertText, insertNode, isVoid } = editor
		

	editor.rat = (node, path, rect) => {
		Transforms.insertNodes(
			editor,
			node,
			{ match: n => Editor.isBlock(editor, n), at: path }
		)
		let point = { offset: 0, path: [path.path[0] + 1, 0]}
		Transforms.select(editor, point)
		Transforms.insertText(editor, "/")
		//Transforms.delete(editor)
		dispatch({ type: 'turn_active_on', payload: { rect, anchor: point, focus: point } })
	}

	editor.isVoid = element => {
		return element.type === 'code-reference' ? true : isVoid(element)
	}
	
	editor.insertText = text => {

		const { selection } = editor

		const match = Editor.above(editor, {
			match: n => Editor.isBlock(editor, n),
		})

		let [block, path] = match
		if (text === "/" && block.type !== 'code-line') {
			console.log(block)
			const domSelection = window.getSelection()
			const domRange = domSelection.getRangeAt(0)
			const rect = domRange.getBoundingClientRect()
			//console.log(rect)
			dispatch({ type: 'turn_active_on', payload: { rect, anchor: selection.focus, focus: selection.focus} })
		}


		dispatch({ type: 'update_focus', payload: selection.focus })

		dispatch({ type: 'add_text', payload: text })

		if (text === ' ' && selection && Range.isCollapsed(selection)) {
			const { anchor } = selection
			const block = Editor.above(editor, {
				match: n => Editor.isBlock(editor, n),
			})
			const path = block ? block[1] : []
			const start = Editor.start(editor, path)
			const range = { anchor, focus: start }
			const beforeText = Editor.string(editor, range)
			const type = SHORTCUTS[beforeText]

			if (type) {
				Transforms.select(editor, range)
				Transforms.delete(editor)
				Transforms.setNodes(
					editor,
					{ type },
					{ match: n => Editor.isBlock(editor, n) }
				)

				if (type === 'code-line') {
					const list = { type: 'code-block', children: [] }
					Transforms.wrapNodes(editor, list, {
						match: n => n.type === 'code-line',
					})
				}

				return
			}
		}
		
		insertText(text)
	}



	editor.deleteBackward = (...args) => {
		const { selection } = editor
		console.log("SELECTION", selection)
		console.log("ARGS", args)

		if (selection && Range.isCollapsed(selection)) {
			//acquire node entry at selection
			const match = Editor.above(editor, {
				match: n => Editor.isBlock(editor, n),
			})

			let texts = Node.texts(editor, {from: selection.anchor.path, to: selection.focus.path})
			for (let t of texts){
				if (t[0].text.slice(selection.focus.offset - 1, selection.focus.offset) === "/") {
					dispatch({type: 'turn_active_off'})
				}
			}


			if (match) {
				const [block, path] = match
				const start = Editor.start(editor, path)

				console.log("END PATH", Editor.end(editor, path))
				if (
					block.type !== 'paragraph' &&
					Point.equals(selection.anchor, start) &&
					block.type !== 'code-line'
				) {
					Transforms.setNodes(editor, { type: 'paragraph' })

					if (block.type === 'list-item') {
						Transforms.unwrapNodes(editor, {
							match: n => n.type === 'bulleted-list',
							split: true,
						})
					}

					return
				}
			}

			deleteBackward(...args)
		}
	}

	return editor
}

const CodeReference = () => {
	return (
		<CodeReferenceBox contentEditable = {false}>
			<ReferenceClassName>class</ReferenceClassName>
			<CodeLine2>torch.utils.data.DataLoader<i>(dataset, batch_size=1, shuffle=False, sampler=None, batch_sampler=None, num_workers=0, collate_fn=None, pin_memory=False, drop_last=False, timeout=0, worker_init_fn=None, multiprocessing_context=None)</i></CodeLine2>
			<Source>[SOURCE]</Source>
		</CodeReferenceBox>
	)
}

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
	color: #19E5BE;
	font-size: 1.5rem;
	width: 15rem;
`

const CodeReferenceBox = styled.div`
	margin-top: 2.5rem;
	background-color: #F7F9FB;
	padding: 2rem;
	border-top: 2.25px solid #19E5BE;
	display: flex;
`


const FunctionReference = () => {
	return (
		<CodeReferenceBox2 contentEditable = {false}>
			<ReferenceClassName2>func</ReferenceClassName2>
			<CodeLine3>add_param_group(param_group)</CodeLine3>
			
			<Source2>[SOURCE]</Source2>
		</CodeReferenceBox2>
	)
}

const ReferenceClassName2 = styled.div`
	text-transform: uppercase;
	color: #5534FF;
	font-size: 1.5rem;
	width: 15rem;
`
const CodeLine3 = styled.div`
	font-family: 'Roboto Mono', monospace !important;
	font-size: 1.4rem;
	boxShadow: 0 0 60px rgba(0, 0, 0, 0.08) !important;
	white-space: pre-wrap !important;
	margin-left: 1.2rem;
	width: 170rem;
`

const CodeReferenceBox2 = styled.div`
	margin-top: 2.5rem;
	background-color: #F7F9FB;
	padding: 2rem;
	border-top: 2.25px solid #5534FF;
	display: flex;
`

const Source2 = styled.div`
	font-size: 1rem;
	cursor: pointer;
	opacity: 0.5;
	transition: opacity 0.13s ease-in;
	&:hover {
		color: #5534FF;
		opacity: 1;
	}
	align-self: flex-end;
`



class Element extends React.Component {

	constructor(props){
		super(props)
		this.state = {
			opacity: '0'
		}
	}

	
	renderElement(element, attributes, children) {
		switch (element.type) {
			case 'heading-one':
				return (<Wrapper
							onMouseEnter = {() => this.setState({opacity: 1})}
							onMouseLeave = {() => this.setState({opacity: 0})}
						>
							<LeftNav contentEditable = {false} opacity = {this.state.opacity}>
								<StyledIcon cursor = {'pointer'} width={'1.8'} src={menu_editor} />
							</LeftNav>
							<H1  {...attributes}>{children}</H1>
						</Wrapper>)
			case 'heading-two':
				return (
						<Wrapper
							onMouseEnter = {() => this.setState({opacity: 1})}
							onMouseLeave = {() => this.setState({opacity: 0})}
						>
							<LeftNav contentEditable = {false} opacity = {this.state.opacity}>
								<StyledIcon cursor = {'pointer'} width={'1.8'} src={menu_editor} />
							</LeftNav>
							<H2 {...attributes}>{children}</H2>
						</Wrapper>
				)
			case 'heading-three':
				return (
						<Wrapper
							onMouseEnter = {() => this.setState({opacity: 1})}
							onMouseLeave = {() => this.setState({opacity: 0})}
						>
							<LeftNav contentEditable = {false} opacity = {this.state.opacity}>
								<StyledIcon cursor = {'pointer'} width={'1.8'} src={menu_editor} />
							</LeftNav>
							<H3 onClick = {() => {console.log('CHILDREN', children); console.log('ATTRIBUTES', attributes); console.log("ELEMENT", element)}} {...attributes}>{children}</H3>
						</Wrapper>
						) 
			case 'bulleted-list':
				return (
						<Wrapper
							onMouseEnter = {() => this.setState({opacity: 1})}
							onMouseLeave = {() => this.setState({opacity: 0})}
						>
							<LeftNav contentEditable = {false} opacity = {this.state.opacity}>
							<StyledIcon cursor = {'pointer'} width={'1.8'} src={menu_editor} />
							</LeftNav>
							<UL {...attributes}>{children}</UL>
						</Wrapper>
						)	
			case 'list-item':
				return <li {...attributes}>{children}</li>
			case 'code-block':
				return (
							<Wrapper
								onMouseEnter = {() => this.setState({opacity: 1})}
								onMouseLeave = {() => this.setState({opacity: 0})}
							>
								<LeftNav contentEditable = {false} opacity = {this.state.opacity}>
									<StyledIcon cursor = {'pointer'} width={'1.8'} src={menu_editor} />
								</LeftNav>
								<CodeBlock {...attributes}>{children}</CodeBlock>
							</Wrapper>
						)
				
			case 'code-line':
				return (
							
							<CodeLine {...attributes}>{children}</CodeLine>
						)
			case 'code-reference':
				return (
							<CodeReference {...attributes}>{children}</CodeReference>
						)
			case 'function-reference':
				return (
							<FunctionReference {...attributes}>{children}</FunctionReference>
						)
			default:
				return (
						<Wrapper
								onMouseEnter = {() => this.setState({opacity: 1})}
								onMouseLeave = {() => this.setState({opacity: 0})}
							>
								<LeftNav contentEditable = {false} opacity = {this.state.opacity}>
									<BlockTool element = {element}/>
								</LeftNav>
								<P   {...attributes}>{children}</P>
						</Wrapper>
					)
		}
	}

	checkEditor() {
		let editor = useSlate()
		let {selection} = editor
		console.log(selection)
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

const BlockTool = (props) => {
	let editor = useSlate()
	const toolRef = useRef()
	
	
	
	let checkRect = () => {
		let path = Editor.end(editor, ReactEditor.findPath(editor, props.element))
		let node = { type: 'paragraph', children: [] }
		let toolRect = toolRef.current.getBoundingClientRect()
		toolRect.y += 50
		toolRect.x += 20
		editor.rat(node, path, toolRect)
		//console.log(toolRef.current.getBoundingClientRect())
	}
//console.log("EDITOR", ReactEditor.findPath(editor, props.element)
	return (
			<StyledIcon ref = {toolRef} onClick = {() => {checkRect()}}  cursor = {'pointer'} width={'1.8'} src={menu_editor} />
	)
}




/*
const Element = ({ attributes, children, element }) => {

	switch (element.type) {
		case 'heading-one':
			return (<Wrapper>
						<LeftNav>
							<StyledIcon width={'1.8'} src={menu_editor} />
						</LeftNav>
						<H1  {...attributes}>{children}</H1>
					</Wrapper>)
		case 'heading-two':
			return <H2 onClick={() => console.log(element)} {...attributes}>{children}</H2>
		case 'heading-three':
			return <H3 {...attributes}>{children}</H3>
		case 'bulleted-list':
			return <ul {...attributes}>{children}</ul>
		case 'list-item':
			return <li {...attributes}>{children}</li>
		case 'code-block':
			return <CodeBlock {...attributes}>{children}</CodeBlock>
		case 'code-line':
			return <CodeLine {...attributes}>{children}</CodeLine>
		default:
			return (
				<Wrapper>
				<LeftNav>
					<StyledIcon width={'1.8'} src={menu_editor} />
				</LeftNav>
				<P {...attributes}>{children}</P>
				</Wrapper>)

	}
}

*/

const Wrapper = styled.div`
	position: relative;
	
`
const LeftNav = styled.span`
	position: absolute;
	left: -4rem;
	padding-right: 1.1rem;
	padding-left: 1rem;
	top: -0.2rem;
	opacity: ${props => props.opacity}; 
	transition: all .13s ease-in-out;
`


const initialValue = [
	{
		type: 'heading-one',
		children: [
			{
				text:
					'TORCH.UTILS.DATA',
			},
		],
	},
	{
		type: 'paragraph',
		children: [
			{text: ''}
		],
	},
	{
		type: 'heading-three',
		children: [
			{
				text:
					'Iterable-styled datasets',
			},
		],
	},
	{
		type: 'paragraph',
		children: [
			{
				text:
					'An iterable-style dataset is an instance of a subclass of IterableDataset that implements the __iter__() protocol, and represents an iterable over data samples. This type of datasets is particularly suitable for cases where random reads are expensive or even improbable, and where the batch size depends on the fetched data.',
			},
		],
	},
	{
		type: 'paragraph',
		children: [
			{
				text:
				''
			}
		],
	},
	{
		type: 'function-reference',
		children: [
			{
				type: 'code-line',
				children: [{ text: 'import numpy as np' }]
			},
			{
				type: 'code-line',
				children: [{ text: '       ' }]
			},
			{
				type: 'code-line',
				children: [{ text: '  def pingu(x: int):' }]
			}],
	},
	{
		type: 'code-block',
		children: [
			{
				type: 'code-line',
				children: [{ text: 'import numpy as np' }]
			},
			{
				type: 'code-line',
				children: [{ text: '       ' }]
			},
			{
				type: 'code-line',
				children: [{ text: '  def pingu(x: int):' }]
			}],
	},
	{
		type: 'heading-three',
		children: [
			{
				text:
					'Map-styled datasets',
			},
		],
	},
	{
		type: 'paragraph',
		children: [
			{
				text:
					'An iterable-style dataset is an instance of a subclass of IterableDataset that implements the __iter__() protocol, and represents an iterable over data samples. This type of datasets is particularly suitable for cases where random reads are expensive or even improbable, and where the batch size depends on the fetched data.',
			},
		],
	},
	{
		type: 'code-reference',
		children: [
			{
				type: 'code-line',
				children: [{ text: 'import numpy as np' }]
			},
			{
				type: 'code-line',
				children: [{ text: '       ' }]
			},
			{
				type: 'code-line',
				children: [{ text: '  def pingu(x: int):' }]
			}],
	}
]


//Markup Components

const H1 = styled.div`
  font-size: 3.5rem;
  font-weight: 300;
  letter-spacing: 1.78px;
  line-height: 1;
  margin-top: 3rem;
  color: #262626;
`

const H2 = styled.div`
  font-size: 2.8rem;
  letter-spacing: 1.33px;
  line-height: 1;
  text-transform: none;
  font-weight: 300;
  color: #262626;
  margin-top: 2.5rem;
`

const H3 = styled.div`
  font-size: 2.5rem;
  letter-spacing: -0.25px;
  line-height: 1;
  text-transform: none;
  margin-top: 2rem;
  color: #262626;
  font-weight: 300;
`

const P = styled.div`
  margin-top: 1rem !important;
  font-size: 1.6rem;
  line-height: 1.6;
  color: #262626;
  letter-spacing: 0.1px;
  font-weight: 350;
`

const UL = styled.ul`
	margin-left: 2rem;
`

const CodeBlock = styled.div`
    margin-top: 2.5rem;
    background-color: #F7F9FB;
	padding: 2.5rem;
	tab-size: 4;
`

const CodeLine = styled.div`
	font-family: 'Roboto Mono', monospace !important;
    font-size: 1.35rem;
    padding: 0.1rem !important;
    boxShadow: 0 0 60px rgba(0, 0, 0, 0.08) !important;
    white-space: pre-wrap !important;
`


/*
  for further --
      case 'block-quote':
      return <blockquote {...attributes}>{children}</blockquote>
*/

/*
Desired Behavior:



Dropdown:


Next Line


*/