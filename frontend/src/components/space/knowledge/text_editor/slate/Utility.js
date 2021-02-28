// slate
import { Text, Editor, Transforms, Node } from 'slate'

//hotkeys
import isHotkey from 'is-hotkey'

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
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-haskell';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-lua';
import 'prismjs/components/prism-objectivec';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-perl';
import 'prismjs/components/prism-dart';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-matlab';
import 'prismjs/components/prism-r';
import 'prismjs/components/prism-bash';

Prism.languages.python = Prism.languages.extend('python', {});
Prism.languages.php = Prism.languages.extend('php', {});
Prism.languages.sql = Prism.languages.extend('sql', {});
Prism.languages.java = Prism.languages.extend('java', {});
Prism.languages.javascript = Prism.languages.extend('javascript', {});
Prism.languages.c = Prism.languages.extend('c', {});
Prism.languages.cpp = Prism.languages.extend('cpp', {});
Prism.languages.csharp = Prism.languages.extend('csharp', {});
Prism.languages.haskell = Prism.languages.extend('haskell', {});
Prism.languages.ruby = Prism.languages.extend('ruby', {});
Prism.languages.scala = Prism.languages.extend('scala', {});
Prism.languages.swift = Prism.languages.extend('swift', {});
Prism.languages.typescript = Prism.languages.extend('typescript', {});
Prism.languages.lua = Prism.languages.extend('lua', {});
Prism.languages.objectivec = Prism.languages.extend('objectivec', {});
Prism.languages.go = Prism.languages.extend('go', {});
Prism.languages.perl = Prism.languages.extend('perl', {});
Prism.languages.dart = Prism.languages.extend('dart', {});
Prism.languages.kotlin = Prism.languages.extend('kotlin', {});
Prism.languages.rust = Prism.languages.extend('rust', {});
Prism.languages.matlab = Prism.languages.extend('matlab', {});
Prism.languages.r = Prism.languages.extend('r', {});
Prism.languages.bash = Prism.languages.extend('bash', {});

const HOTKEYS = {
	'mod+b': 'bold',
	'mod+i': 'italic',
	'mod+u': 'underlined',
	'mod+e': 'code',
	'mod+shift+s': 'strike'
}

const SHIFTTAB = 'shift+tab';

const LIST_TYPES = ['numbered-list', 'bulleted-list']


export const onKeyDownHelper = (event, state, editor) => {
	
	const { isMarkupMenuActive } = state;

	for (const hotkey in HOTKEYS) {
		if (isHotkey(hotkey, event)) {
		  event.preventDefault()
		  const mark = HOTKEYS[hotkey]
		  toggleMark(editor, mark)
		}
	}

	if (isHotkey(SHIFTTAB, event)) {
		event.preventDefault();
		const match = Editor.above(editor, {
			match: n => (n.type === 'bulleted-list' || n.type === 'numbered-list')
		});

		if (match) {
			Transforms.unwrapNodes(editor, {
				match: n => (n.type === 'bulleted-list' || n.type === 'numbered-list'),
				split: true,
			});
		}
		
	} else if (event.key === "Tab") {
		event.preventDefault();
		const match = Editor.above(editor, {
			match: n => (n.type === 'bulleted-list' || n.type === 'numbered-list')
		});
		if (match) {
			const [block, path] = match;

			const format = block.type;
			
			const newBlock = { type: format, children: [] }
			
			Transforms.wrapNodes(editor, newBlock);
		} else {
			editor.insertText("\t");
		}
	} else if ( event.key === "Enter" && !isMarkupMenuActive ) {
		editor.insertDefaultEnter(event);
	} else if (event.keyCode === 8) {
		const match = Editor.above(editor, {
			match: n => Editor.isBlock(editor, n),
		});

		if (match) {
			const [block, path] = match;
			if (block.type === 'reference-snippet') {
				event.preventDefault();
				Transforms.removeNodes(editor, {at: path});
			}
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

const languageDict = {
	"Python": "python",
	"Javascript": "javascript",
	"Java": "java", 
	"PHP": "php",
	"C": "c", 
	"C++": "cpp", 
	"C#": "csharp", 
	"Haskell": "haskell", 
	"Ruby": "ruby", 
	"Rust": "rust", 
	"Scala": "scala",
	"Swift": "swift", 
	"Typescript": "typescript", 
	"Lua": "lua", 
	"Objective-C": "objectivec", 
	"Go": "go", 
	"Perl": "perl",
	"Dart": "dart", 
	"Kotlin": "kotlin", 
	"Shell": "bash",
	"R": "r",
	"Matlab": "matlab"
}

const getLength = token => {
	if (typeof token === 'string') {
	  return token.length
	} else if (typeof token.content === 'string') {
	  return token.content.length
	} else {
	  return token.content.reduce((l, t) => l + getLength(t), 0)
	}
}

/*
export const decorate = ([node, path]) => {
	const ranges = [];
	if (!Text.isText(node) && node.type !== 'code-block') {
		return ranges
	}

	console.log("STRING", Node.string(node));
	console.log("NODE", node);
	const language = node.language ? languageDict[node.language] : "python";

	let childTexts = [];
	for (let child of Node.texts(node)) {
		childTexts.push(child[0].text);
	}

	const text = childTexts.join('\n');

	const tokens = Prism.tokenize(text, Prism.languages[language]);
	console.log("TOKENS", tokens);
	let start = 0
	
	for (const token of tokens) {
        const length = getLength(token)
        const end = start + length

		const identifiers = {
			'keyword': '#D73A49',
			'boolean': '#56B6C2',
			'function': '#6F42C1',
			'class-name': '#E36208',
			'string': '#032F62',
			'triple-quoted-string': '#032F62',
			'number': '#005DC5',
			'comment': '#5C6370'
		}
		
        if (typeof token !== 'string') {
			const color = identifiers[token.type] ? identifiers[token.type] : "";
			const oblique = token.type === "comment";
			ranges.push({
				color,
				anchor: { path, offset: start },
				focus: { path, offset: end },
				oblique
			})
        }

        start = end
	}
	
	return ranges;
}
*/



export const decorate = ([node, path]) => {
	const ranges = []
	if (node.type == 'code-block') {
		
		let childTexts = []
		for (let child of Node.texts(node)) {
			childTexts.push(child[0].text)
		}

		if (childTexts !== []) {
			const string = childTexts.join('\n')

			let language = "python";

			if (node.language && languageDict[node.language]) {
				language = languageDict[node.language];
			}
			
			const grammar = Prism.languages[language];
			const tokens = Prism.tokenize(string, grammar).reverse()

			//console.log("TOKENS", tokens);
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

export const toggleBlockActive = (editor, format) => {
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

export const toggleBlock = (editor, format) => {
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
	formats.map(format => {
		Editor.removeMark(editor, format);
	})
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