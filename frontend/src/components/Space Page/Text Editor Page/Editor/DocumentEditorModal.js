import React, { useReducer, useMemo, useCallback } from 'react'

// slate
import { Slate, Editable, withReact } from 'slate-react'
import { Node, createEditor } from 'slate'
import { withHistory } from 'slate-history'
import withFunctionality from '../Slate_Specific/WithFunctionality'

//components
import Leaf from '../Slate_Specific/Leaf';
import Element from '../Slate_Specific/Element';

//reducer
import editorReducer from './EditorReducer';

// lodash
import _ from 'lodash'

//styles
import styled from "styled-components";

//components
import MarkupMenu from '../Menus/MarkupMenu';
import ReferenceMenu from '../Menus/ReferenceMenu';

//react dnd
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

//prism
import Prism from 'prismjs'
// eslint-disable-next-line
Prism.languages.python={comment:{pattern:/(^|[^\\])#.*/,lookbehind:!0},"string-interpolation":{pattern:/(?:f|rf|fr)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,greedy:!0,inside:{interpolation:{pattern:/((?:^|[^{])(?:{{)*){(?!{)(?:[^{}]|{(?!{)(?:[^{}]|{(?!{)(?:[^{}])+})+})+}/,lookbehind:!0,inside:{"format-spec":{pattern:/(:)[^:(){}]+(?=}$)/,lookbehind:!0},"conversion-option":{pattern:/![sra](?=[:}]$)/,alias:"punctuation"},rest:null}},string:/[\s\S]+/}},"triple-quoted-string":{pattern:/(?:[rub]|rb|br)?("""|''')[\s\S]*?\1/i,greedy:!0,alias:"string"},string:{pattern:/(?:[rub]|rb|br)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,greedy:!0},function:{pattern:/((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,lookbehind:!0},"class-name":{pattern:/(\bclass\s+)\w+/i,lookbehind:!0},decorator:{pattern:/(^\s*)@\w+(?:\.\w+)*/im,lookbehind:!0,alias:["annotation","punctuation"],inside:{punctuation:/\./}},keyword:/\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,builtin:/\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,boolean:/\b(?:True|False|None)\b/,number:/(?:\b(?=\d)|\B(?=\.))(?:0[bo])?(?:(?:\d|0x[\da-f])[\da-f]*\.?\d*|\.\d+)(?:e[+-]?\d+)?j?\b/i,operator:/[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,punctuation:/[{}[\];(),.:]/},Prism.languages.python["string-interpolation"].inside.interpolation.inside.rest=Prism.languages.python,Prism.languages.py=Prism.languages.python;


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
// ACCOUNT FOR NEW LINES IN NONSTRING TOKENS IN DECORATE

//EXTENSIONS/MAYBE
// INSERT P NODE BELOW CODE OR LIST IF CREATED

// Priorities
// FIX EMBEDDABLE BACKWARDS 
// FIX TOOLBAR
// REFERENCES

const DocumentEditorModal = (props) => {

	const [value, setValue] = [props.markup, props.setValue]
	const blocktypes = ["paragraph", "heading-one", "heading-two", "heading-three", "list-item", "code-line", "code-reference"]

	const initialState = { 
		markupMenuActive: false, 
		text: '', 
		rect: null, 
		hovered: {position: 0, ui: 'mouse'}, 
		blocktypes,
		scrollTop:0
	}

	const [state, dispatch] = useReducer(
		editorReducer,
		initialState
	);
	/*
	if (props.scrollTop !== state.scrollTop) {
		dispatch({type: 'set_Scroll', payload: props.scrollTop})
	}*/


	const renderElement = useCallback(props => <Element {...props} />, [])
	const renderLeaf = useCallback(props => <Leaf {...props} />, [])

	const editor = useMemo(() => withFunctionality(withHistory(withReact(createEditor())), dispatch, props.scrollTop), [])
/*<ReferenceMenu dispatch={dispatch} editor = {editor} editorState = {state}/>*/
	
	let range = { anchor: state.anchor, focus: state.focus }

	updateMarkupType(state, dispatch, range, blocktypes, editor)

	return (
		<DndProvider backend={HTML5Backend}>
			<Slate editor={editor} value={value} onChange={value => setValue(value)}>
				<MarkupMenu dispatch = {dispatch} range = {range} state = {state} scrollTop = {props.scrollTop}/>
				
				<StyledEditable
					onClick = {() => {
						if (state.markupMenuActive){
							dispatch({'type': 'markupMenuOff'})
						}
					}}
					autoFocus
					onKeyDown={(event) => onKeyDownHelper(event, state, dispatch, editor, range)}
					renderElement={renderElement}
					renderLeaf={renderLeaf}
					spellCheck="false"
					decorate={decorate}
					
				/>
			</Slate>
		</DndProvider>
	)
}

export default DocumentEditorModal


// helper functions

const updateMarkupType = (state, dispatch, range, blocktypes, editor) => {
	let mapping = {
						"paragraph": "Text", 
						"heading-one": "Heading 1", 
						"heading-two": "Heading 2", 
						"heading-three": "Heading 3", 
						"list-item": "Bullet list", 
						"code-line":  "Code snippet", 
						"code-reference":  "Code reference"
					}
	if (state.markupMenuActive) {
		for (let t of Node.texts(editor, {from: range.anchor.path, to: range.anchor.path})){
			let filter = t[0].text.slice(range.anchor.offset + 1, range.focus.offset + 1)
			blocktypes = blocktypes.filter(type => {
				return mapping[type].toLowerCase().includes(filter.toLowerCase())
			})
		}
	}
	if (blocktypes.length !== state.blocktypes.length) {
		dispatch({type: "setBlockTypes", payload: blocktypes})
	}
	if (blocktypes.length === 0) {
		dispatch({ type: 'markupMenuOff' })
	}
}

const onKeyDownHelper = (event, state, dispatch, editor, range) => {
	if (event.key === "Tab") {
		event.preventDefault()
		editor.insertText("\t")
	} else if (event.key === "Enter") {
		if (state.markupMenuActive) {
			event.preventDefault()
			editor.insertBlock({type: state.blocktypes[state.hovered.position]}, range)
		} else {
			editor.insertDefaultEnter(event)
		}
	} else if (state.markupMenuActive && event.keyCode === 40) {
		event.preventDefault()
		if (state.hovered.position + 1 < state.blocktypes.length) {
			dispatch({type: 'setHovered', payload: {position: state.hovered.position + 1, ui: 'key'}})
		}
	} else if (state.markupMenuActive && event.keyCode === 38) {
		event.preventDefault()
		if (state.hovered.position !== 0) {
			dispatch({type: 'setHovered', payload: {position: state.hovered.position - 1, ui: 'key'}})
		}
	}
}

const getContent = (token) => {
	if (typeof token === 'string') {
		return token
	} else if (typeof token.content === 'string') {
		return token.content
	} else {
		return token.content.map(getContent).join('')
	}
}

const decorate = ([node, path]) => {
	const ranges = []
	if (node.type == 'code-block') {
		let childTexts = []
		for (let child of Node.texts(node)) { 
			childTexts.push(child[0].text)
		}
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
									'number': '#D19966',
									

								 }
			let start = 0
			let index = 0

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
}


/*
const StyledEditable = styled(Editable)`
  line-height: 1.5 !important;
  caret-color: #46474f;
  color: #46474f;
  font-size: 16px;
  padding-top: 6rem;
  width: 80rem;
  padding-top: 0.5rem;
  padding-right: 6rem;
  padding-bottom: 4rem;
  resize: none !important;
`	*/

const StyledEditable = styled(Editable)`
  line-height: 1.5 !important;
  caret-color: #46474f;
  color: #46474f;
  font-size: 16px;
  resize: none !important;
  padding-bottom: 20vh;
`