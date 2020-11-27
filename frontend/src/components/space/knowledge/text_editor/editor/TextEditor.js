import React, { useReducer, useMemo, useCallback, useState, useEffect } from 'react'

//slate
import { Slate, Editable, withReact, ReactEditor, useSlate } from 'slate-react'
import { Node, Transforms, createEditor } from 'slate'
import { withHistory } from 'slate-history'
import withFunctionality from '../slate/WithFunctionality'
import withLayout from '../slate/WithLayout';

//slate utility
import {onKeyDownHelper, decorate, 
	toggleBlock } from '../slate/Utility';

//pusher
import Pusher from 'pusher-js';

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
import MarkupMenu from '../menus/MarkupMenu';
import MarkupMenu2 from '../menus/MarkupMenu2';
import HoveringToolbar from '../toolbars/HoveringToolbar';
import SnippetMenuWrapper from '../menus/snippet_menu/SnippetMenuWrapper';
import PullRequestRecs from './PullRequestRecs';
import { CSSTransition } from 'react-transition-group';

//reducer
import editorReducer from './reducer/EditorReducer';

//lodash
import _ from 'lodash'

//styles
import styled from "styled-components";

//react dnd
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import AttachmentMenu from '../menus/AttachmentMenu'
import { editDocument } from '../../../../../actions/Document_Actions'


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

Pusher.Runtime.createXHR = () => {
	const xhr = new XMLHttpRequest()
	xhr.withCredentials = true
	return xhr
}

const TextEditor = (props) => {
	const { workspaceId, initialMarkup, initialTitle, syncRenameDocument, editDocument, renameDocument, document: { _id } } = props;

	const [value, setValue] = useState(initialMarkup);

	const [writerId, setWriterId] = useState(null);

	//const [pusher, setPusher] = useState(null);
	//const [viewingChannel, setViewingChannel] = useState(null);
	const [presenceChannel, setPresenceChannel] = useState(null);

	const [subSuccess, setSubSuccess] = useState(false);
	const [setOptions, toggleOptions] = useState(false);
	const [saveTimeout, setSaveTimeout] = useState(null);
	const [titleTimeout, setTitleTimeout] = useState(null);

	const initialState = {
		isMarkupMenuActive: false, 
		isSnippetMenuActive: false,
		isAttachmentMenuActive: false
	}

	const [state, dispatch] = useReducer(
		editorReducer,
		initialState
	);

	//PUSHER
	const presenceChannelName =  useMemo(() => `presence-${_id}`, []);

	
	const pusher = useMemo(() => new Pusher("8a6c058f2c0eb1d4d237", {
		cluster: "mt1",
		authEndpoint: `http://localhost:3001/api/documents/${workspaceId}/pusher/auth`
	}), []);

	const renderElement = useCallback(props => <Element {...props} />, [])
	const renderLeaf = useCallback(props => <Leaf {...props} />, [])

	const editor = useMemo(() => withLayout(withFunctionality(withHistory(withReact(createEditor())), dispatch)), [])
	
	//updateMarkupType(state, dispatch, range, blocktypes, editor)

	const { isMarkupMenuActive, isSnippetMenuActive, isAttachmentMenuActive } = state;
	
	
	useEffect(() => {
		const presenceChannel = pusher.subscribe(presenceChannelName);

		presenceChannel.bind('pusher:subscription_succeeded', () => {
			setSubSuccess(true);
		});

		presenceChannel.bind('pusher:subscription_error', () => {
			alert("Please reload page, not subscribed to editor properly.");
		});

		setPresenceChannel(presenceChannel);

		return () => {
			pusher.unsubscribe(presenceChannelName);
		}
	}, []);

	useEffect(() => {
		if (presenceChannel) {
			presenceChannel.bind('client-text-edit', (markup) => {
				//setValue(markup);
				const decodedMarkup = JSON.parse(decodeURIComponent(markup));

				setValue(decodedMarkup);
				//onMarkupChange(markup);
			});
		}

		return () => {
			if (presenceChannel) {
				presenceChannel.unbind('client-text-edit');
			}
		}
	}, [presenceChannel]);

	useEffect(() => {
		if (presenceChannel) {
			presenceChannel.bind('client-set-writer', (presenceWriterId) => {
				//setValue(markup);
				if (presenceWriterId === 'clear writer') {
					setWriterId(null)
				} else if (writerId !== presenceWriterId) {
					setWriterId(presenceWriterId);
				}
				//onMarkupChange(markup);
			});
		}
		

		return () => {
			if (presenceChannel) {
				presenceChannel.unbind('client-set-writer');
			}
		}

	}, [presenceChannel, writerId]);

	useEffect(() => {

		if (presenceChannel && subSuccess) {
			presenceChannel.bind('pusher:member_added', () => {
				const presenceId = presenceChannel.members.me.id;
				if (writerId && writerId === presenceId) {
					presenceChannel.trigger('client-set-writer', presenceId);
				}
			})
		}
	
		return () => {
			if (presenceChannel) {
				presenceChannel.unbind('pusher:member_added');
			}
		}

	}, [writerId, presenceChannel, subSuccess]);

	useEffect(() => {
		if (presenceChannel) {
			presenceChannel.bind('pusher:member_removed', (member) => {
				if (member.id === writerId) {
					setWriterId(null);
				}
			});
		}

		return () => {
			if (presenceChannel) {
				presenceChannel.unbind('pusher:member_removed');
			}
		}
	}, [presenceChannel, writerId]);

	useEffect(() => {
		if (presenceChannel) {
			presenceChannel.bind('client-rename-document', (results) => {
				syncRenameDocument(results)
			});
		}
		
		return () => {
			if (presenceChannel) {
				presenceChannel.unbind('client-rename-document');
			}
		}
	}, [presenceChannel, writerId]);

	const makeMarkupChanges = useMemo(() => (markupChanges) => {

		//SHOW SAVING
		setValue(markupChanges);

		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}
		
		const timeout = setTimeout(async () => { 
			if (presenceChannel && subSuccess && writerId === presenceChannel.members.me.id) {
				const stringifiedMarkup = JSON.stringify(markupChanges);

				editDocument({ workspaceId, documentId: _id, markup: stringifiedMarkup});

				const encodedMarkup = encodeURIComponent(stringifiedMarkup);
				presenceChannel.trigger('client-text-edit', encodedMarkup);
				
				const newTitle = Node.string(markupChanges[0]);
				if (initialTitle !== newTitle) {

					if (titleTimeout) {
						clearTimeout(titleTimeout);
					}

					const newTitleTimeout = setTimeout(async () => {
						const results = await renameDocument({workspaceId, documentId: _id, title: newTitle});
						if (results) {
							presenceChannel.trigger('client-rename-document', results);
						} else {
							Transforms.insertText(editor, initialTitle, {at: [0]});
						}
					}, 1000);
					
					setTitleTimeout(newTitleTimeout);
				}
			}
		}, 600);

		setSaveTimeout(timeout);
		//onMarkupChange(markupChanges);
	}, [titleTimeout, saveTimeout, presenceChannel, writerId, subSuccess]);
	
	const setWriteHelper = useMemo(() => () => {
		
		if (!presenceChannel || !subSuccess) return;

		const presenceId = presenceChannel.members.me.id;
		
		if (writerId) {
			if (writerId === presenceId) {
				presenceChannel.trigger('client-set-writer', 'clear writer');
				setWriterId(null);
			} else {
				alert("A user is currently editing this document.");
			}
		} else {
			presenceChannel.trigger('client-set-writer', presenceId);
			setWriterId(presenceId);
		}

	}, [writerId, presenceChannel, subSuccess]);

	const write = useMemo(() => {
		if (!presenceChannel || !subSuccess) return false;

		const presenceId = presenceChannel.members.me.id;
		return presenceId === writerId;

	}, [presenceChannel, writerId, subSuccess]);


	//value={parsedMarkup} onChange={onMarkupChange}>
	// value={value} onChange={makeMarkupChanges}>
	return (
		<DndProvider backend={HTML5Backend}>
			<Slate editor={editor} value={value} onChange={makeMarkupChanges}>
				<MainToolbar 
					document = {props.document}
					write = {write} 
					setWrite = {setWriteHelper}
					setOptions = {setOptions}
					toggleOptions = {() => {toggleOptions(!setOptions)}}
					documentModal = {props.documentModal}
				/>
				{/*<PullRequestRecs/>*/}
				<Container id = {"fullEditorContainer"}>
					<EditorContainer 
						documentModal = {props.documentModal}
						id = {"editorSubContainer"}
					>		
							{write && <Sidebar documentModal = {props.documentModal} toggleBlock = {(format) => toggleBlock(editor, format)}/>}
							{write && <HoveringToolbar/>}
							<EditorContainer2>
									{isSnippetMenuActive &&
										<SnippetMenuWrapper
											documentModal = {props.documentModal} 
											dispatch = {dispatch} 
											document = {props.document}
										/>
									}
									{isMarkupMenuActive &&
										<MarkupMenu2 
											documentModal = {props.documentModal} 
											dispatch={dispatch} 
											doc = {props.document}
										/>
									}
									{isAttachmentMenuActive &&
										<AttachmentMenu
											documentModal = {props.documentModal} 
											dispatch={dispatch} 
										/>
									}
									<DocumentInfo write  = {write} />
									{/*
									{ write ? 
										<Header 
											autoFocus = {true} 
											paddingLeft = {write ? "3rem" : "10rem"} 
											onChange = {makeTitleChanges} 
											onKeyDown = {checkTitleEnter}
											onBlur = {tryTitleSave} 
											placeholder={"Untitled"} 
											value={title} 
										/>
										:
										<HeaderDiv active = {title} paddingLeft = {"10rem"}>{title ? title : "Untitled"}</HeaderDiv>
									}*/}
									{/*<AuthorNote paddingLeft = {write ? "3rem" : "10rem"}>Faraz Sanal, Apr 25, 2016</AuthorNote>*/}
									<StyledEditable
										id = {"editorSlate"}
										placeholder={"Today we will see progress"}
										paddingLeft = {write ? 3 : 10}
										cursortype = {write}
										onKeyDown={(event) => onKeyDownHelper(event, state, editor)}
										renderElement={renderElement}
										renderLeaf={renderLeaf}
										spellCheck="false"
										decorate= {decorate}
										readOnly = {!write}
										autoFocus = {true}
										
									/>
							</EditorContainer2>
					</EditorContainer>
				</Container>
			</Slate>
		</DndProvider>
	)
}

export default TextEditor

/*

	const makeTitleChanges = useMemo(() => (e) => {	
		console.log("E", e.key);
		if (e.key === "Enter") {
			console.log("TARGET", e.target.value);
		} else {
			setTitle(e.target.value);
		}
	}, []);

	const checkTitleEnter =  useMemo(() => (e) => {	
		if (e.key === "Enter") {
			e.preventDefault();
			console.log("SELECTION START", e.target.selectionStart);
			console.log("TARGET", e.target.value.split('\n'));
		}
	}, []);

	const tryTitleSave = useMemo(() => async (e) => {	
		console.log("TARGET", e.target.value);
		console.log("INITAL", initialTitle);
		if (e.target.value !== initialTitle) {
			const tempTitle = initialTitle;
			console.log("ENTERED IN HERE");
			let changed = await renameDocument({workspaceId, documentId: _id, title: e.target.value});
			console.log("WEVE CHANGED", changed);
			if (!changed) setTitle(tempTitle);
		}	
	}, [initialTitle]);

	/*
		const ops = editor.operations;
		
		let groundTruth = true;

		for (let i = 0; i < ops.length; i++){
			if (ops[i].id) {
				groundTruth = false;
				break;
			}
		}

		const taggedOps = ops.map(op => {
			return {id: presenceChannel.members.me.id, ...op} 
		});

		if (groundTruth) {
			presenceChannel.trigger('client-transform-editor',	taggedOps);
			//console.log("TAGGED OPS", taggedOps);
		}
		useEffect(() => {
		if (presenceChannel) {
			presenceChannel.bind('client-transform-editor', (ops) => {
				//setValue(markup);

				//console.log("OPS", ops);

				//console.log("BEFORE MARKUP", value)
				ops.map(op => {
					if (op.type !== "set_selection") {
						console.log("APPLYIING: ", op);
						editor.apply(op);
					}
				});
				
				//console.log("AFTER MARKUP", value);
				//const decodedMarkup = JSON.parse(decodeURIComponent(markup));

				//setValue(decodedMarkup);
				//onMarkupChange(markup);
				
			});
		}

		return () => {
			if (presenceChannel) {
				presenceChannel.unbind('client-transform-editor');
			}
		}
	}, [presenceChannel]);
*/



const ToolbarsContainer = styled.div`
	position: sticky; 
	top: 0;
	z-index: 2;
`

const Container = styled.div`
	display: flex;	
	justify-content: center;
	min-width: 65rem;
`

const EditorContainer2 = styled.div`
	flex-direction: column;
	display: flex;
	width: 100%;
	padding-top: 1.5rem;
`

const EditorContainer = styled.div`
	display: flex;
	width: 94rem;

	margin-top: ${props => props.documentModal ? "" : "1.5rem"};
	/*box-shadow: ${props => props.documentModal ? "": "0 1px 2px rgba(0, 0, 0, 0.2)"};*/
	border-radius: 0.2rem;
	position: relative;
`

const HeaderDiv = styled.div`
	font-size: 3.7rem;
	color: #172A4E;
	margin-bottom: 1rem;
	margin-top: 3.5rem;
	padding-left: ${props => props.paddingLeft};
	padding-right: 10rem;
	font-weight: 500;
	opacity: ${props => props.active ?  1 : 0.4};
	line-height: 4rem;
	overflow-wrap: break-word;
	hyphens: auto;
`

const Header = styled(TextareaAutosize)`
	font-size: 3.7rem;
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
	padding-bottom: 15rem;
	min-height: 75rem;
	cursor: ${props => props.cursortype ? "text" : "default"};
	padding-left: ${props => `${props.paddingLeft}rem`};
	padding-right: 10rem;

	&::placeholder {
		font-size: 16px;
		color: #172A4E;
		opacity: 0.5;
	}
`	

/*
useEffect(() => {
	if (editor.selection) {
		//let path = [selection.anchor.path[0]]
		let rect = ReactEditor.toDOMRange(editor, 
						  {anchor: {offset: 0, path}, 
			focus: {offset: 0, path }}).getBoundingClientRect()
		
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
, [editor.selection])*/