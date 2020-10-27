import _ from 'lodash';

import { 
	SET_MARKUP_MENU_ACTIVE, SET_SNIPPET_MENU_ACTIVE, SET_WRITE, SET_ATTACHMENT_MENU_ACTIVE
} from './Editor_Types';

const editorReducer = (state, action) => {
	switch (action.type) {
		case SET_MARKUP_MENU_ACTIVE:
			return { ...state, isMarkupMenuActive: action.payload };
		case SET_SNIPPET_MENU_ACTIVE:
			return { ...state, isSnippetMenuActive: action.payload };
		case SET_ATTACHMENT_MENU_ACTIVE:
			return { ...state, isAttachmentMenuActive: action.payload };
		case SET_WRITE:
			return { ...state, write: action.payload };
		default:
			return state
	}
}

export default editorReducer