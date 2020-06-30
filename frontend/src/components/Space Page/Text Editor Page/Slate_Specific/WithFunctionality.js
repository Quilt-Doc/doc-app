
// slate
import { Node, Editor, Transforms, Range, Point } from 'slate'
import { ReactEditor } from 'slate-react';
		
const withFunctionality = (editor, dispatch, scrollTop) => {
	
	const { deleteBackward, insertText, isVoid } = editor
	

	editor.isVoid = element => {
		return element.type === 'code-reference' ? true : isVoid(element)
	}

	editor.insertBlock = (attributes, range) => {
		let text = Array.from(Node.texts(editor, {from: range.anchor.path, to: range.anchor.path}))[0][0].text.trim()
		if (text !== '') {
			let node = { ...attributes, children: [] }
			Transforms.insertNodes(
				editor,
				node,
				{ match: n => Editor.isBlock(editor, n), at: Editor.end(editor, range.focus.path) }
			)
			Transforms.select(editor, { offset: 0, path: [range.focus.path[0] + 1, 0] })
		} else {
			Transforms.setNodes(
				editor,
				attributes,
				{ match: n => Editor.isBlock(editor, n) }
			)
		}

		if (attributes.type === 'code-line') {
			const block = { type: 'code-block', children: [] }
			Transforms.wrapNodes(editor, block, {
				match: n => n.type === 'code-line',
			})
		}

		if (attributes.type === 'list-item') {
			const list = { type: 'bulleted-list', children: [] }
			Transforms.wrapNodes(editor, list, {
				match: n => n.type === 'list-item',
			})
		}

		dispatch({type: 'markupMenuOff'})
		dispatch({type: "clearMenuFilter"})
	}

	editor.insertDefaultEnter = (event) => { 
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

	editor.insertText = text => {

		const { selection } = editor

		const match = Editor.above(editor, {
			match: n => Editor.isBlock(editor, n),
		})

		let [block, path] = match

		dispatch({ type: 'update_focus', payload: selection.focus })

		dispatch({ type: 'addText', payload: text })

		if (text === "*" && block.type !== 'code-line') {
			const domSelection = window.getSelection()
			const domRange = domSelection.getRangeAt(0)
			const rect = domRange.getBoundingClientRect()
			dispatch({type: 'referenceMenuOn', payload: { rect, anchor: selection.focus, focus: selection.focus, text: ''}})
		}

		if (text === "/" && block.type !== 'code-line') {
			console.log(scrollTop)
			let range = ReactEditor.toDOMRange(editor, {anchor: selection.focus, focus: selection.focus})
			let rect = range.getBoundingClientRect()
			dispatch({ type: 'markupMenuOn', payload: { rect, anchor: selection.focus, focus: selection.focus, text:''} })
		}

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

		if (selection && Range.isCollapsed(selection)) {
			//acquire node entry at selection
			const match = Editor.above(editor, {
				match: n => Editor.isBlock(editor, n),
			})

			dispatch({type: 'deleteText'})
			let texts = Node.texts(editor, {from: selection.anchor.path, to: selection.focus.path})
			for (let t of texts){
				let lastSeen = t[0].text.slice(selection.focus.offset - 1, selection.focus.offset)
				if (lastSeen === "/") {
					dispatch({type: 'markupMenuOff'})
				}  else if  (lastSeen === "*") {
					console.log("ENTERED *")
					dispatch({type: 'referenceMenuOff'})
				}
			}


			if (match) {
				const [block, path] = match
				const start = Editor.start(editor, path)
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

export default withFunctionality;

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
