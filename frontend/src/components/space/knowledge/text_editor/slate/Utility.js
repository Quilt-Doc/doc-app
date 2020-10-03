// slate
import { Editor, Transforms, Node } from 'slate'

// lodash
import _ from 'lodash'

//prism
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

Prism.languages.python = Prism.languages.extend('python', {});
Prism.languages.javascript = Prism.languages.extend('javascript', {});

const HOTKEYS = {
	'mod+b': 'bold',
	'mod+i': 'italic',
	'mod+u': 'underline',
	'mod+`': 'code',
}

const LIST_TYPES = ['numbered-list', 'bulleted-list']


export const updateMarkupType = (state, dispatch, range, blocktypes, editor) => {
	
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
	}

	if (blocktypes.length !== state.blocktypes.length) {
		dispatch({ type: "setBlockTypes", payload: blocktypes })
	}

	if (blocktypes.length === 0) {
		dispatch({ type: 'markupMenuOff' })
	}
}

export const onKeyDownHelper = (event, state, dispatch, editor, range) => {
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

export const getContent = (token) => {
	if (typeof token === 'string') {
		return token
	} else if (typeof token.content === 'string') {
		return token.content
	} else {
		return token.content.map(getContent).join('')
	}
}


export const decorate = ([node, path]) => {
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

export const toggleBlock = (editor, format) => {
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

export const toggleBlock2 = (editor, format) => {
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

export const toggleMark = (editor, format) => {
	const isActive = isMarkActive(editor, format)

	if (isActive) {
		Editor.removeMark(editor, format)
	} else {
		Editor.addMark(editor, format, true)
	}
}

export const removeMarks = (editor) => {
	let formats = ["bold", "italic", 
		"underlined", "strike", "code", "backColor", "color"]
	formats.map(format => Editor.removeMark(editor, format))
}

export const isBlockActive = (editor, format) => {
	const [match] = Editor.nodes(editor, {
		match: n => n.type === format,
	})
	return !!match
}

export const isMarkActive = (editor, format) => {
	const marks = Editor.marks(editor)
	return marks ? marks[format] === true : false
}