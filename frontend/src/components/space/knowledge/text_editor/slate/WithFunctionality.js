
// slate
import { Node, Editor, Transforms, Range, Point } from 'slate'
import { ReactEditor } from 'slate-react';
	
import { SET_MARKUP_MENU_ACTIVE } from '../editor/reducer/Editor_Types';

const LIST_TYPES = ['numbered-list', 'bulleted-list']
const CODE_TYPES = ['code-block']
const SNIPPET_TYPES = ['reference-snippet'];

const withFunctionality = (editor, dispatch) => {
	
	const { deleteBackward, insertText, isVoid } = editor
	

	editor.isVoid = element => {
		const voidCheck = ( element.type === 'code-reference' || element.type === 'reference-snippet' );
		return voidCheck ? true : isVoid(element)
	}

	editor.insertBlock = (attributes) => {

		const range = editor.selection;
		const slateNode = Node.get(editor, [range.anchor.path[0]]);
		
		const text = Node.string(slateNode);

		const isList = LIST_TYPES.includes(attributes.type);
		const isCode = CODE_TYPES.includes(attributes.type);
		const isSnippet = SNIPPET_TYPES.includes(attributes.type);
		const isAttachment = attributes.type === 'attachment';

		if (text !== '') {

			let node = { ...attributes, children: [] }

			node.type = isList ? "list-item" : isCode ? "code-line" : node.type

			Transforms.insertNodes(
				editor,
				node,
				{ match: n => Editor.isBlock(editor, n), at: Editor.end(editor, range.focus.path) }
			)

			Transforms.select(editor, { offset: 0, path: [range.focus.path[0] + 1, 0] })

		} else {
			Transforms.setNodes(
				editor,
				{...attributes, type: isList ? "list-item" : isCode ? "code-line" : attributes.type},
				{ match: n => Editor.isBlock(editor, n) }
			)
		}

		if (isList) {
			const block = { type: attributes.type, children: [] }
			Transforms.wrapNodes(editor, block)
		}

		if (isCode) {
			const block = { type: attributes.type, children: [] };
			Transforms.wrapNodes(editor, block);

			let prelimAnchor = range.anchor;
			if (range.anchor.offset > 0) {
				prelimAnchor = {offset: 0, path: [range.anchor.path[0] + 1]};
			}

			if (Point.compare(prelimAnchor, Editor.end(editor, [])) === 0) {
				try {
					const paraNode = { type: 'paragraph', children: [] };
	
					let paraAnchor = { offset: 0, path: [prelimAnchor.path[0], 1] };
					let paraRange = { anchor: paraAnchor, focus: paraAnchor};

					Transforms.insertNodes(editor, paraNode, {at: Editor.end(editor, [])});
					Transforms.unwrapNodes(editor, {
						match: n => n.type === 'code-block',
						at: paraRange,
						split: true,
					});
				} catch (err) {
					console.log("ERROR", err);
				}
			}
		}

		if (isSnippet || isAttachment) {
			let prelimAnchor = range.anchor;
			if (range.anchor.offset > 0) {
				prelimAnchor = {offset: 0, path: [range.anchor.path[0] + 1]};
			}

			if (Point.compare(prelimAnchor, Editor.end(editor, [])) === 0) {
				const paraNode = { type: 'paragraph', children: [] };
				Transforms.insertNodes(editor, paraNode, {at: Editor.end(editor, [])});
			}
		}

	}

	editor.insertDefaultEnter = (event) => { 
		const { selection } = editor

		const match = Editor.above(editor, {
			match: n => Editor.isBlock(editor, n),
		})

		const [block, path] = match

		if (block.type !== 'check-list' && block.type !== 'code-line' && block.type !== 'list-item' && Range.isCollapsed(selection)) {
			
			event.preventDefault()

			const end = Editor.end(editor, path)
			const start = Editor.start(editor, path)
			if (Point.equals(selection.anchor, end)) {
				const node = { type: "paragraph", children: [] }
				Transforms.insertNodes(editor, node, {at: end})
				Transforms.select(editor, [end.path[0] + 1, 0])
			} else if (Point.equals(selection.anchor, start))  { 
				const node = { type: "paragraph", children: [{text: ""}] }
				Transforms.insertNodes(editor, node, {at: start})
			} else {
				Transforms.splitNodes(editor)
				Transforms.setNodes(
					editor, 
					{type: 'paragraph'},
					{ match: n => Editor.isBlock(editor, n)}
				)
			}
		} else if (block.type === 'list-item') {
			if (Node.string(block) === ""){
				event.preventDefault()
				Transforms.unwrapNodes(editor, {
					match: n => n.type === 'bulleted-list',
					split: true,
				})
				Transforms.setNodes(editor, { type: 'paragraph' })
			}
		} else if (block.type === 'check-list') {
			event.preventDefault();
			if (Node.string(block) === ""){
				Transforms.setNodes(editor, { type: 'paragraph' })
			} else {
				const end = Editor.end(editor, path)
				Transforms.insertNodes(editor, { type: 'check-list', isSelected: false, children: [] }, {at: end});

				Transforms.select(editor, { offset: 0, path: [editor.selection.focus.path[0] + 1, 0] })
			}
		}
	}

	editor.insertText = text => {

		const { selection } = editor


		if (selection && text === "/") {

			const match = Editor.above(editor, {
				match: n => Editor.isBlock(editor, n),
			})

			let [block, path] = match;

			if (block.type !== 'code-line') dispatch({ type: SET_MARKUP_MENU_ACTIVE, payload: true });
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
				} else if ( block.type == 'paragraph' 
					&& Point.equals(selection.anchor, start)
					&& Point.compare(selection.anchor, Editor.end(editor, [])) === 0
				) {
					let path = selection.anchor.path;
					if (path && path[0] !== 0) {
						let prevNode = Node.get(editor, [path[0] - 1]);
						if (prevNode.type === "reference-snippet" 
							|| prevNode.type === "code-block"
							|| prevNode.type === "attachment"
						) {
							Transforms.select(editor, Editor.end(editor, [path[0] - 1]));
							return
						}
					}
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
	'>': 'quote',
	'#': 'heading-one',
	'##': 'heading-two',
	'###': 'heading-three',
}
