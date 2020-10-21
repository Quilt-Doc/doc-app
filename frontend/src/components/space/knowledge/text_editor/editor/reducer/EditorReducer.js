import _ from 'lodash';

import { 
	SET_MARKUP_MENU_ACTIVE
} from './Editor_Types';

const editorReducer = (state, action) => {
	switch (action.type) {
		case SET_MARKUP_MENU_ACTIVE:
			return { ...state, isMarkupMenuActive: action.payload };
		case 'snippetMenuOn':
			if (!state.snippetMenuActive) return { ...state, snippetMenuActive: true, ...action.payload }
		case 'snippetMenuOff':
			return { ...state, snippetMenuActive: false }
		default:
			return state
	}
}

export default editorReducer