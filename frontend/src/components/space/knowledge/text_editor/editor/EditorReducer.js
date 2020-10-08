import _ from 'lodash';

const editorReducer = (state, action) => {
	switch (action.type) {
		case 'markupMenuOn':
			if (!state.markupMenuActive) {
				return { ...state, markupMenuActive: true, ...action.payload }
			}
		case 'markupMenuOff':
			return { ...state, 
						markupMenuActive: false,
						rect: null,
						hovered: {position: 0, ui: 'mouse'},  
						blocktypes: ["paragraph", "heading-one", "heading-two", "heading-three", "list-item", "code-line", "code-reference"]
					}
		case 'snippetMenuOn':
			if (!state.snippetMenuActive) return { ...state, snippetMenuActive: true, ...action.payload }
		case 'snippetMenuOff':
			return { ...state, snippetMenuActive: false }
		case 'referenceMenuOn':
			return {...state, referenceDropdownActive: true, ...action.payload}
		case 'referenceMenuOff':
			return {...state, referenceDropdownActive: false}
		case 'addText':
			const new_text = state.text + action.payload
			return { ...state, text: new_text }
		case 'deleteText':
			if (state.markupMenuActive || state.snippetMenuActive) {
				let text = state.text
				return {...state, text: text.slice(0, text.length - 1)}
			}
		case 'update_focus':
			if (state.markupMenuActive || state.snippetMenuActive) {
				return { ...state, focus: action.payload }
			} else {
				return state
			}
		case 'setHovered':
			return {...state, hovered: action.payload}
		case 'setBlockTypes':
			return {...state, hovered: {position: 0, ui: state.hovered.ui}, blocktypes: action.payload}
		case 'clearMenuFilter':
				return {...state, text: ''}
		default:
			return state
	}
}

export default editorReducer