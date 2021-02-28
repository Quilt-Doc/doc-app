// slate
import { Node, Editor, Transforms, Range, Point } from 'slate'
import { ReactEditor } from 'slate-react';


const withLayout = editor => {
    const { normalizeNode } = editor
  
    editor.normalizeNode = ([node, path]) => {
        if (path.length === 0) {
            if (editor.children.length < 1) {
                const title = { type: 'title', children: [{ text: '' }] }
                Transforms.insertNodes(editor, title, { at: path.concat(0) })
            } else {
                const firstChild = editor.children[0];
                if (firstChild.type !== 'title') {
                    Transforms.setNodes(editor, { type: 'title' }, { at: path.concat(0) })
                }
            }
  
            if (editor.children.length < 2) {
                const paragraph = { type: 'paragraph', children: [{ text: '' }] }
                Transforms.insertNodes(editor, paragraph, { at: path.concat(1) })
            }
    
            const lastChild = editor.children[editor.children.length - 1];

            if (lastChild.type !== 'paragraph') {
                const paragraph = { type: 'paragraph', children: [{ text: '' }] }
                Transforms.insertNodes(editor, paragraph, { at: path.concat(editor.children.length) });
            }
        }
      return normalizeNode([node, path])
    }
  
    return editor
}

export default withLayout;