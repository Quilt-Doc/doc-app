import _ from 'lodash';

import { 
	SET_MARKUP_MENU_ACTIVE, 
	SET_SNIPPET_MENU_ACTIVE, 
	SET_ATTACHMENT_MENU_ACTIVE,
	SET_IMAGE_MENU_ACTIVE,
	SET_VIDEO_MENU_ACTIVE,
	SET_WRITE,
} from './Editor_Types';

const editorReducer = (state, action) => {
	switch (action.type) {
		case SET_MARKUP_MENU_ACTIVE:
			return { ...state, isMarkupMenuActive: action.payload };
		case SET_SNIPPET_MENU_ACTIVE:
			return { ...state, isSnippetMenuActive: action.payload };
		case SET_ATTACHMENT_MENU_ACTIVE:
			return { ...state, isAttachmentMenuActive: action.payload };
		case SET_IMAGE_MENU_ACTIVE:
			return { ...state, isImageMenuActive: action.payload };
		case SET_VIDEO_MENU_ACTIVE:
			return { ...state, isVideoMenuActive: action.payload };
		case SET_WRITE:
			return { ...state, write: action.payload };
		default:
			return state
	}
}

export default editorReducer