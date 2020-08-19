import React, { useReducer, useMemo, useCallback, useState, useEffect } from 'react'

// slate
import { Slate, Editable, withReact, useEditor, useSlate, ReactEditor
		 } from 'slate-react'
import { Editor, Transforms, Node, createEditor } from 'slate'
import { withHistory } from 'slate-history'
import withFunctionality from '../Slate_Specific/WithFunctionality'
import scrollIntoView from 'scroll-into-view-if-needed'

//components
import Leaf from '../Slate_Specific/Leaf';
import Element from '../Slate_Specific/Element';
import InfoBar from '../InfoBar';
import Sidebar from './Sidebar';
import DocumentInfo from './DocumentInfo';

//reducer
import editorReducer from './EditorReducer';

// lodash
import _ from 'lodash'

//styles
import styled from "styled-components";
import chroma from 'chroma-js';

//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleDoubleRight, faPen, faEllipsisH  } from '@fortawesome/free-solid-svg-icons'
import { RiPencilLine, RiChat2Line, RiMoreLine } from 'react-icons/ri'
import { GrMore, GrChat } from 'react-icons/gr'

//components
import MarkupMenu from '../Menus/MarkupMenu';
import ReferenceMenu from '../Menus/ReferenceMenu';
import { CSSTransition } from 'react-transition-group';

//react dnd
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
//prism
import Prism from 'prismjs'
import EditorToolbar from './EditorToolbar/EditorToolbar';
// eslint-disable-next-line
Prism.languages.python = { comment: { pattern: /(^|[^\\])#.*/, lookbehind: !0 }, "string-interpolation": { pattern: /(?:f|rf|fr)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i, greedy: !0, inside: { interpolation: { pattern: /((?:^|[^{])(?:{{)*){(?!{)(?:[^{}]|{(?!{)(?:[^{}]|{(?!{)(?:[^{}])+})+})+}/, lookbehind: !0, inside: { "format-spec": { pattern: /(:)[^:(){}]+(?=}$)/, lookbehind: !0 }, "conversion-option": { pattern: /![sra](?=[:}]$)/, alias: "punctuation" }, rest: null } }, string: /[\s\S]+/ } }, "triple-quoted-string": { pattern: /(?:[rub]|rb|br)?("""|''')[\s\S]*?\1/i, greedy: !0, alias: "string" }, string: { pattern: /(?:[rub]|rb|br)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i, greedy: !0 }, function: { pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g, lookbehind: !0 }, "class-name": { pattern: /(\bclass\s+)\w+/i, lookbehind: !0 }, decorator: { pattern: /(^\s*)@\w+(?:\.\w+)*/im, lookbehind: !0, alias: ["annotation", "punctuation"], inside: { punctuation: /\./ } }, keyword: /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/, builtin: /\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/, boolean: /\b(?:True|False|None)\b/, number: /(?:\b(?=\d)|\B(?=\.))(?:0[bo])?(?:(?:\d|0x[\da-f])[\da-f]*\.?\d*|\.\d+)(?:e[+-]?\d+)?j?\b/i, operator: /[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/, punctuation: /[{}[\];(),.:]/ }, Prism.languages.python["string-interpolation"].inside.interpolation.inside.rest = Prism.languages.python, Prism.languages.py = Prism.languages.python;


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

const HOTKEYS = {
	'mod+b': 'bold',
	'mod+i': 'italic',
	'mod+u': 'underline',
	'mod+`': 'code',
}

const LIST_TYPES = ['numbered-list', 'bulleted-list']

const DocumentEditor = (props) => {

	const [value, setValue] = [props.markup, props.setValue]
	const [write, setWrite] = useState(false)
	const blocktypes = ["paragraph", "heading-one", "heading-two", 
		"heading-three", "quote", "bulleted-list", "numbered-list",
		 "code-block", "code-reference", "code-snippet", "check-list",
		"link", "table", "image"
		]

	const initialState = {
		markupMenuActive: false,
		text: '',
		rect: null,
		hovered: { position: 0, ui: 'mouse' },
		blocktypes,
		scrollTop: 0
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

	useEffect(() => {
        if (editor.selection) {
            //let path = [selection.anchor.path[0]]
            /*let rect = ReactEditor.toDOMRange(editor, 
                              {anchor: {offset: 0, path}, 
				focus: {offset: 0, path }}).getBoundingClientRect()
			*/
			//changeTop(document.getElementById("rightView").scrollTop + rect.top - 125 + rect.height/2)
			
			try {
				let domNode = ReactEditor.toDOMNode(editor, 
					Node.get(editor, [editor.selection.anchor.path[0]]))
				let buttonTop = domNode.offsetTop
				let buttonH = domNode.clientHeight
				let {clientHeight, scrollTop} = document.getElementById("rightView")
				let toolbarClientH = document.getElementById("toolbarcontainer").clientHeight
				//console.log("TRUTH", scrollTop + toolbarClientH > buttonTop)
				//console.log("SCROLL TOP", scrollTop)
				//console.log("TOOLBARCLIENTH", toolbarClientH)
				//console.log("BUTTONTOP", buttonTop)
				scrollIntoView(domNode, {
					scrollMode: 'if-needed',
					block: 'nearest',
					inline: 'nearest',
				  })
			} catch {

			}
			
			
			//document.getElementById("editorSlate").scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
        }
    }
	, [editor.selection])
	
	updateMarkupType(state, dispatch, range, blocktypes, editor)
	
	return (
		<DndProvider backend={HTML5Backend}>
			<Slate editor={editor} value={value} onChange={value => setValue(value)}>
				<CSSTransition
					in={write}
					unmountOnExit
				
					enter = {true}
					exit = {true}
					timeout={150}
					classNames="editortoolbar"
				>
					
					<EditorToolbar 
						toggleBlock = {(format) => toggleBlock2(editor, format)}
						toggleBlockActive = {(format) => toggleBlock(editor, format)}
						isMarkActive = {isMarkActive} 
						toggleMark = {toggleMark}
						removeMarks = {() => removeMarks(editor)}
					/>
				
				</CSSTransition>
				<Container>
				
					
					<EditorContainer>
							{write && <Sidebar toggleBlock = {(format) => toggleBlock2(editor, format)}/>}
							<EditorContainer2 >
								<KeyToolbar>
									<KeyBorder active = {write} onClick = {() => {setWrite(!write)}}>
										<RiPencilLine/>
									</KeyBorder>
									
									<KeyBorder2>
										<GrMore/>
									</KeyBorder2>
								</KeyToolbar>
									 <DocumentInfo write  = {write} />
									<MarkupMenu dispatch={dispatch} range={range} state={state} scrollTop={props.scrollTop} />
									<Header  paddingLeft = {write ? "3rem" : "10rem"} onBlur={(e) => props.onTitleChange(e)} onChange={(e) => props.onTitleChange(e)} placeholder={"Untitled"} value={props.title} />
									<AuthorNote paddingLeft = {write ? "3rem" : "10rem"}>Faraz Sanal, Apr 25, 2016</AuthorNote>
									<StyledEditable
										onClick={() => {
											if (state.markupMenuActive) {
												dispatch({ 'type': 'markupMenuOff' })
											}
										}}
										id = {"editorSlate"}
										paddingLeft = {write ? "3rem" : "10rem"}
										cursortype = {write}
										onKeyDown={(event) => onKeyDownHelper(event, state, dispatch, editor, range)}
										renderElement={renderElement}
										renderLeaf={renderLeaf}
										spellCheck="false"
										decorate={decorate}
									/>
							</EditorContainer2>
					</EditorContainer>
				</Container>
			</Slate>
		</DndProvider>
	)
	/*readOnly = {!write}*/
}

export default DocumentEditor

/*	<KeyToolbar>
						<KeyBorder active = {write} onClick = {() => {setWrite(!write)}}>
							<FontAwesomeIcon 
								
								style = {{ fontSize: "1.7rem"}} icon={faPen} 
							/>
						</KeyBorder>
						<KeyBorder>
							<ion-icon style = {{ fontSize: "2.1rem"}} name="chatbox-outline"></ion-icon>
						</KeyBorder>
						<KeyBorder>
							<ion-icon style = {{ fontSize: "2.1rem"}} name="ellipsis-horizontal"></ion-icon>
						</KeyBorder>
					</KeyToolbar>*/
// helper functions

const updateMarkupType = (state, dispatch, range, blocktypes, editor) => {
	
	let mapping = {
		"paragraph": "Paragraph",
		"heading-one": "Heading 1",
		"heading-two": "Heading 2",
		"heading-three": "Heading 3",
		"quote": "Quote",
		"bulleted-list": "Bulleted list",
		"numbered-list": "Numbered list",
		"code-block": "Code block",
		"code-reference": "Code reference",
		"code-snippet": "Code snippet",
		"check-list": "Checklist",
		"link": "Link", 
		"table": "Table", 
		"image": "Image"
	}
	if (state.markupMenuActive) {
		blocktypes = blocktypes.filter(type => {
			return mapping[type].toLowerCase().includes(state.text.toLowerCase())
		})
		/*
		for (let t of Node.texts(editor, { from: range.anchor.path, to: range.anchor.path })) {
			//console.log("\n\nANCHOR", range.anchor.offset)
			//console.log("FOCUS", range.focus.offset)
			console.log("TEXT", state.text)
			console.log("TEXT LENGTH", state.text.length)
			let filter = t[0].text.slice(range.anchor.offset + 1, range.focus.offset + 1)
			blocktypes = blocktypes.filter(type => {
				return mapping[type].toLowerCase().includes(filter.toLowerCase())
			})
		}*/
	}
	
	if (blocktypes.length !== state.blocktypes.length) {
		dispatch({ type: "setBlockTypes", payload: blocktypes })
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
			
			if (range.focus.offset !== range.anchor.offset) {
				range = _.cloneDeep(range)
				range.focus.offset += 1
			}

			Transforms.select(editor, range)
			Transforms.delete(editor)

			editor.insertBlock({ type: state.blocktypes[state.hovered.position] }, range)
		} else {
			editor.insertDefaultEnter(event)
		}
	} else if (state.markupMenuActive && event.keyCode === 40) {
		event.preventDefault()
		if (state.hovered.position + 1 < state.blocktypes.length) {
			dispatch({ type: 'setHovered', payload: { position: state.hovered.position + 1, ui: 'key' } })
		}
	} else if (state.markupMenuActive && event.keyCode === 38) {
		event.preventDefault()
		if (state.hovered.position !== 0) {
			dispatch({ type: 'setHovered', payload: { position: state.hovered.position - 1, ui: 'key' } })
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
				'keyword': '#D73A49',
				'boolean': '#56B6C2',
				'function': '#6F42C1',
				'class-name': '#E36208',
				'string': '#032F62',
				'triple-quoted-string': '#032F62',
				'number': '#005DC5',


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

const toggleBlock = (editor, format) => {
	const isActive = isBlockActive(editor, format)
	const isList = LIST_TYPES.includes(format)

	Transforms.unwrapNodes(editor, {
		match: n => LIST_TYPES.includes(n.type),
		split: true,
	})

	Transforms.setNodes(editor, {
		type: isActive ? 'paragraph' : isList ? 'list-item' : format,
	})

	if (!isActive && isList) {
		const block = { type: format, children: [] }
		Transforms.wrapNodes(editor, block)
	}
}

const toggleBlock2 = (editor, format) => {
	const isList = LIST_TYPES.includes(format)

	Transforms.unwrapNodes(editor, {
		match: n => LIST_TYPES.includes(n.type),
		split: true,
	})

	Transforms.setNodes(editor, {
		type: isList ? 'list-item' : format,
	})

	if (isList) {
		const block = { type: format, children: [] }
		Transforms.wrapNodes(editor, block)
	}
}

const toggleMark = (editor, format) => {
	const isActive = isMarkActive(editor, format)

	if (isActive) {
		Editor.removeMark(editor, format)
	} else {
		Editor.addMark(editor, format, true)
	}
}

const removeMarks = (editor) => {
	let formats = ["bold", "italic", 
		"underlined", "strike", "code", "backColor", "color"]
	formats.map(format => Editor.removeMark(editor, format))
}

const isBlockActive = (editor, format) => {
	const [match] = Editor.nodes(editor, {
		match: n => n.type === format,
	})
	return !!match
}

const isMarkActive = (editor, format) => {
	const marks = Editor.marks(editor)
	return marks ? marks[format] === true : false
}




const AuthorNote = styled.div`
	font-size: 1.25rem;
	opacity: 0.5;
	margin-bottom: 1rem;
	padding-left: ${props => props.paddingLeft};
  	padding-right: 10rem;
`



const RepositoryButton = styled.div`
    background-color: ${chroma("#5B75E6").alpha(0.1)}; 
    color: #172A4E;
    font-weight: 500;
    padding: 0.75rem;
    display: inline-flex;
    border-radius: 0.4rem;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;*/
    align-items: center;
    cursor: pointer;
    &: hover {
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    }
    letter-spacing: 1;
    font-size: 1.3rem;
`

const DataContainer = styled.div`
	margin-top: 4rem;
	padding-left: 10rem;
	padding-right: 10rem;
`

const ReferenceContainer = styled.div`
    margin-top: 2rem;
    display: flex;
    flex-wrap: wrap;
   
    align-items: center;
`

const Tag = styled.div`
    font-size: 1.25rem;
    color: ${props => props.color}; 
    padding: 0.4rem 0.8rem;
    background-color: ${props => chroma(props.color).alpha(0.15)};
    display: inline-block;
    border-radius: 4px;
	margin-right: 1rem;
	font-weight: 500;
`

const Reference = styled.div`
    font-size: 1.25rem;
    color: #172A4E;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;*/
    padding: 0.55rem 0.7rem;
	padding-right: 0.9rem;
	padding-left: 0rem;
    align-items: center;
    display: inline-flex;
    /*background-color:#262E49;*/
    /*color:#D6E0EE;*/
	font-weight: 500;
    
    border-radius: 0.3rem;
   /* box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;*/
	margin-right: 1.2rem;
`



const KeyBorder = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 3rem;
	height: 3rem;
	font-size: 2.2rem;
	&:hover {
		background-color: #eeeef1;
	}
	color: ${props => props.active ? '#70EAE1' : ""};
	
	cursor: pointer;
	margin-left: 1.5rem;
	border-radius: 0.3rem;
`

const KeyBorder2 = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 3rem;
	height: 3rem;
	font-size: 1.9rem;
	&:hover {
		background-color: #eeeef1;
	}

	
	cursor: pointer;
	margin-left: 1rem;
	border-radius: 0.3rem;
`

const KeyToolbar = styled.div`
	display: inline-flex;
	align-items: center;
	margin-left: auto;
	background-color: white;
	padding: 1.5rem 1.5rem;
	
`


const Container = styled.div`
	display: flex;	
	justify-content: center;
`

const EditorContainer2 = styled.div`
	flex-direction: column;
	display: flex;
	width: 100%;
`

const EditorContainer = styled.div`
	display: flex;
	
	width: 94rem;
	margin-top: 3rem;
	background-color: white;
	box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
	border-radius: 0.2rem;
`

const Header = styled.input`
    font-size: 3rem;
    color: #172A4E;
    margin-bottom: 2rem;
    ::placeholder {
        color: #172A4E;
        opacity: 0.4;
    }
    outline: none;
    border: none;
	margin-top: 3.5rem;
	padding-left: ${props => props.paddingLeft};
  	padding-right: 10rem;
`


const StyledEditable = styled(Editable)`
  line-height: 1.5 !important;
  caret-color: #172A4E;
  color: #172A4E;
  font-size: 16px;
  resize: none !important;
  padding-bottom: 7rem;
  min-height: 65rem;
  cursor: ${props => props.cursortype ? "text" : "default"};
  padding-left: ${props => props.paddingLeft};
  padding-right: 10rem;
`	