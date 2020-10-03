import React, { useReducer, useMemo, useCallback, useState, useEffect } from 'react'

//slate
import { Slate, Editable, withReact, ReactEditor } from 'slate-react'
import { Node, createEditor } from 'slate'
import { withHistory } from 'slate-history'
import withFunctionality from '../slate/WithFunctionality'

//slate utility
import { updateMarkupType, onKeyDownHelper, decorate, 
	toggleBlock, toggleBlock2, toggleMark, removeMarks, isMarkActive } from '../slate/Utility';

//utility
import scrollIntoView from 'scroll-into-view-if-needed'
import TextareaAutosize from 'react-textarea-autosize'

//components
import Leaf from '../slate/Leaf';
import Element from '../slate/Element';
import Sidebar from '../toolbars/Sidebar';
import MainToolbar from '../toolbars/MainToolbar';
import AttachmentToolbar from '../toolbars/AttachmentToolbar';
import EditorToolbar from '../toolbars/EditorToolbar';
import DocumentInfo from './DocumentInfo';

//reducer
import editorReducer from './EditorReducer';

//lodash
import _ from 'lodash'

//styles
import styled from "styled-components";

//components
import MarkupMenu from '../menus/MarkupMenu';
import { CSSTransition } from 'react-transition-group';

//react dnd
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'


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


const TextEditor = (props) => {

	const [value, setValue] = [props.markup, props.setValue]
	const [write, setWrite] = useState(false)
	const [setOptions, toggleOptions] = useState(false);
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

	const editor = useMemo(() => withFunctionality(withHistory(withReact(createEditor())), dispatch), [])
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
			
				<ToolbarsContainer>
					<CSSTransition
						in={setOptions}
						unmountOnExit
						enter = {true}
						exit = {true}
						timeout={150}
						classNames="editortoolbar"
					>
						<AttachmentToolbar
							document = {props.document}
						/>
					</CSSTransition>
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
				</ToolbarsContainer>
				<MainToolbar 
					document = {props.document}
					write = {write} 
					setWrite = {() => {setWrite(!write)}}
					setOptions = {setOptions}
					toggleOptions = {() => {toggleOptions(!setOptions)}}
					documentModal = {props.documentModal}
				/>
				<Container>
				
					<EditorContainer 
						documentModal = {props.documentModal}
						id = {"#editorContainer"}
					>
							{write && <Sidebar toggleBlock = {(format) => toggleBlock2(editor, format)}/>}
							<EditorContainer2  >
							
									 
									<MarkupMenu dispatch={dispatch} range={range} state={state} />
									<DocumentInfo write  = {write} />
									{write ? 
										<Header autoFocus = {false} paddingLeft = {write ? "3rem" : "10rem"} onBlur={(e) => props.onTitleChange(e)} onChange={(e) => props.onTitleChange(e)} placeholder={"Untitled"} value={props.title} />
										:
										<HeaderDiv active = {props.title} paddingLeft = {"10rem"}>{props.title ? props.title : "Untitled"}</HeaderDiv>
									}
									
									{/*<AuthorNote paddingLeft = {write ? "3rem" : "10rem"}>Faraz Sanal, Apr 25, 2016</AuthorNote>*/}
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
										readOnly = {!write}
										
									/>
									
							</EditorContainer2>
					</EditorContainer>
				</Container>
			</Slate>
		</DndProvider>
	)
}

export default TextEditor


const ToolbarsContainer = styled.div`
	position: sticky; 
	top: 0;
	z-index: 2;
`

const Container = styled.div`
	display: flex;	
	justify-content: center;
`

const EditorContainer2 = styled.div`
	flex-direction: column;
	display: flex;
	width: 100%;
	padding-top:1.5rem;
`

const EditorContainer = styled.div`
	display: flex;
	width: 94rem;
	margin-top: ${props => props.documentModal ? "" : "1.5rem"};
	background-color: white;
	/*box-shadow: ${props => props.documentModal ? "": "0 1px 2px rgba(0, 0, 0, 0.2)"};*/
	border-radius: 0.2rem;

`

const HeaderDiv = styled.div`
	font-size: 3.3rem;
	color: #172A4E;
	margin-bottom: 1rem;
	margin-top: 3.5rem;
	padding-left: ${props => props.paddingLeft};
	padding-right: 10rem;
	font-weight: 500;
	opacity: ${props => props.active ?  1 : 0.4};
	line-height: 4rem;
`

const Header = styled(TextareaAutosize)`
	font-size: 3.3rem;
    color: #172A4E;
    margin-bottom: 1rem;
    &::placeholder {
        color: #172A4E;
        opacity: 0.4;
	}
	resize: none;
    outline: none;
    border: none;
	margin-top: 3.5rem;
	padding-left: ${props => props.paddingLeft};
	padding-right: 10rem;
	font-family: -apple-system,BlinkMacSystemFont, sans-serif;
	line-height: 4rem;
	font-weight: 500;
`

const StyledEditable = styled(Editable)`
  line-height: 1.5 !important;
  caret-color: #172A4E;
  color: #172A4E;
  font-size: 16px;
  resize: none !important;
  padding-bottom: 7rem;
  min-height: 66rem;
  cursor: ${props => props.cursortype ? "text" : "default"};
  padding-left: ${props => props.paddingLeft};
  padding-right: 10rem;
  
`	