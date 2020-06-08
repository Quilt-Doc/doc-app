import React, { useState, useMemo } from 'react'
import { Transforms, createEditor } from 'slate'
import {
  Slate,
  Editable,
  useEditor,
  useSelected,
  useFocused,
  withReact,
} from 'slate-react'
import { withHistory } from 'slate-history'

import { Button, Icon } from 'antd';
import InlineReference from './InlineReference';


const DocumentContentEditor = () => {
  const [value, setValue] = useState(initialValue)
  const editor = useMemo(
    () => withReferences(withHistory(withReact(createEditor()))),
    []
  )

  return (
    <Slate editor={editor} value={value} onChange={value => setValue(value)}>
        <InsertReferenceButton />
      <Editable
        renderElement={props => <Element {...props} />}
        placeholder="Enter some text..."
      />
    </Slate>
  )
}

const withReferences= editor => {
  const { insertData, isVoid } = editor

  editor.isVoid = element => {
    return element.type === 'reference' ? true : isVoid(element)
  }

  const { deleteBackward, insertText } = editor

  return editor
}

const insertReference = (editor, url) => {
  const text = { text: '' }
  const reference = { type: 'reference', url, children: [text] }
  Transforms.insertNodes(editor, reference)
}

const Element = props => {
  const { attributes, children, element } = props

  switch (element.type) {
    case 'reference':
      return <ReferenceElement {...props} />
    default:
      return <p {...attributes}>{children}</p>
  }
}

const ReferenceElement = ({ attributes, children, element }) => {
  const selected = useSelected()
  const focused = useFocused()
  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <InlineReference name='Test' kind='class' file='test.py' lineNum='58'/>
      </div>
      {children}
    </div>
  )
}

const InsertReferenceButton = () => {
  const editor = useEditor()
  return (
    <Button
      onMouseDown={event => {
        event.preventDefault()
        const url = window.prompt('Enter the reference: ')
        if (!url) return
        insertReference(editor, url)
      }}
    >
      <Icon type='left'></Icon>
    </Button>
  )
}

const isReferenceUrl = url => {
  if(url.includes('www.')) {
      return true;
  }
  return false;
}

const initialValue = [
  {
    type: 'paragraph',
    children: [
      {
        text:
          'In addition to nodes that contain editable text, you can also create other types of nodes, like images or videos.',
      },
    ],
  },
  {
    type: 'reference',
    url: 'https://www.source.unsplash.com/kFrdX5IeQzI',
    children: [{ text: '' }],
  },
  {
    type: 'paragraph',
    children: [
      {
        text:
          'This example shows images in action. It features two ways to add images. You can either add an image via the toolbar icon above, or if you want in on a little secret, copy an image URL to your keyboard and paste it anywhere in the editor!',
      },
    ],
  },
]

export default DocumentContentEditor