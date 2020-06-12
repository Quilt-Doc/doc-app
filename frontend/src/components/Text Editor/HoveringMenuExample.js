  
import React, { useReducer,useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Slate, Editable, ReactEditor, withReact, useSlate } from 'slate-react'
import { Node, Editor, Transforms, Text, createEditor } from 'slate'
//import { css } from 'emotion'
import { withHistory } from 'slate-history'
import _ from 'lodash'
import styled from "styled-components";

import { Range, Point } from 'slate'

import header_icon from '../../images/header.svg'

const SHORTCUTS = {
  '*': 'list-item',
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

const editor_reducer = (state, action) => {
  switch (action.type) {
    case 'turn_active_on':
      if (!state.is_active) {
        return { ...state, is_active: true, is_active_count: 1, ...action.payload }
      } else {
        let is_active_count = state.is_active_count + 1
        return { ...state, is_active_count }
      }
    case 'turn_active_off':
        return { ...state, is_active: false, is_active_count: 0 }

    case 'add_text':
      //const active = state.is_active
      const new_text = state.text + action.payload
      return {...state, text: new_text}
    case 'update_focus':
      if (state.is_active) {
        return {...state, focus:action.payload}
      } else {
        return state
      }
    default:
      throw new Error();
  }
}

const HoveringMenuExample = () => {
  const [value, setValue] = useState(initialValue)

  const initial_reducer_state = {is_active: false, start_path: null, end_path: null, text: '', rect: null}

  const [state, dispatch] = useReducer(
    editor_reducer,
    initial_reducer_state
  );

  const renderElement = useCallback(props => <Element {...props} />, [])
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])

 


  const editor = useMemo(() => withShortcuts(withHistory(withReact(createEditor())), dispatch), [])
  
  let range = {anchor: state.anchor, focus: state.focus}


  return (
    <Slate  editor={editor} value={value} onChange={value => setValue(value)}>
      <HoveringToolbar dispatch = {dispatch} range = {range} active = {state.is_active} rect = {state.rect} />
      <StyledEditable
        renderElement = {renderElement}
        renderLeaf={renderLeaf}
        placeholder="Enter some text..."
        spellcheck="false"
      />
    </Slate>
  )
}

const toggleFormat = (editor, format) => {
  const isActive = isFormatActive(editor, format)
  Transforms.setNodes(
    editor,
    { [format]: isActive ? null : true },
    { match: Text.isText, split: true }
  )
}

const isFormatActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: n => n[format] === true,
    mode: 'all',
  })
  return !!match
}


const HoveringToolbar = (props) => {
  const ref = useRef()
  const editor = useSlate()
  //onBlur={() => {
  // editor.lastSelection = editor.selection;
  //}}

  const toggleBlock = useCallback(
    (editor, props) => { /*selection_then, setActive, range, start_path) => {*/
      let range = props.range
      if (props.range.focus.offset !== props.range.anchor.offset) {
        range = _.cloneDeep(props.range)
        range.focus.offset += 1
      }
      console.log(range)
      Transforms.select(editor, range)
      Transforms.delete(editor)

      const node= { type: 'heading-one', children: [] }
      Transforms.insertNodes(
        editor,
        node,
        { match: n => Editor.isBlock(editor, n), at: Editor.end(editor, range.focus.path)}
      )

      Transforms.select(editor, {offset:0, path:[range.focus.path[0] + 1,0]})
      ReactEditor.focus(editor)
      
      //Transforms.liftNodes(editor, {at: next_item.focus})

      props.dispatch({type: 'turn_active_off'})

      
      //Transforms.delete(editor)
      
      
      
      //const tempo = _.cloneDeep(selection_then)
      //tempo['path'][0] += 1
      //console.log(selection_then)
      //console.log(tempo)
      /*
      tempo[1] = tempo[1] + 1
      console.log(tempo)
      selection_then['path'] = tempo
      console.log(editor)
      */
      //Transforms.select(editor, selection_then)
      
      //const nodette = { type: 'heading-one', children: [] }

      /*
      Transforms.insertNodes(
        editor,
        nodette,
        { at: dropdown_options.start_path }
      )
      Transforms.delete(editor)
      //console.log(editor)
      */
     /*
      setDropdownOptions({
        isactive: false, 
        start_path: null,
        end_path: null,
        rect: null
      })
     */
    }, []
  )

  useEffect(() => {
    const el = ref.current
    
    if (!el) {
      return
    }
    //|| !ReactEditor.isFocused(editor) || !Range.isCollapsed(selection)
    if ( !props.active || !props.rect ) {
      el.removeAttribute('style')
      return
    }

    el.style.opacity = 1
    el.style.top = `${props.rect.top + window.pageYOffset + 15 + props.rect.height}px`
    el.style.left = `${props.rect.left + window.pageXOffset + 2.5}px`
  })

  
  
  
  return (<Menu ref={ref}>
                <MenuHeader>Insert Blocks</MenuHeader>
               <MenuButton onClick = {() => {toggleBlock(editor, props)}}>
                  <IconBorder><ion-icon style={{'font-size': '20px !important;'}} name="text-outline"></ion-icon></IconBorder>
                  <MenuButtonText>Text</MenuButtonText>
               </MenuButton>
               <MenuButton onClick = {() => {toggleBlock(editor, props)}}>
                  <IconBorder><ion-icon style={{'font-size': '7rem'}} name="filter-outline"></ion-icon></IconBorder>
                  <MenuButtonText>Heading</MenuButtonText>
               </MenuButton>
               <MenuButton>
                  <IconBorder><ion-icon style={{'font-size': '7rem'}} name="code-slash-outline"></ion-icon></IconBorder>
                  <MenuButtonText>Code Snippet</MenuButtonText>
               </MenuButton>
               <MenuButton>
                  <IconBorder><ion-icon name="document-text-outline"></ion-icon></IconBorder>
                  <MenuButtonText>Template</MenuButtonText>
               </MenuButton>
               <MenuButton>
                  <IconBorder><ion-icon name="document-attach-outline"></ion-icon></IconBorder>
                  <MenuButtonText>Embeddable</MenuButtonText>
               </MenuButton>
               <MenuButton>
                  <IconBorder><ion-icon name="list-outline"></ion-icon></IconBorder>
                  <MenuButtonText>Bulleted List</MenuButtonText>
               </MenuButton>
               <MenuButton>
                  <IconBorder><ion-icon name="list-outline"></ion-icon></IconBorder>
                  <MenuButtonText>Bulleted List</MenuButtonText>
               </MenuButton>
               <MenuButton>
                  <IconBorder><Styled_Icon width = {'3.5'} src = {header_icon}/></IconBorder>
                  <MenuButtonText>Bulleted List</MenuButtonText>
               </MenuButton>
               <MenuButton>
                  <IconBorder><Styled_Icon width = {'3.5'} src = {header_icon}/></IconBorder>
                  <MenuButtonText>Bulleted List</MenuButtonText>
               </MenuButton>
          </Menu>
  )
}
export default HoveringMenuExample;

const StyledSlate = styled(Slate)`
  line-height: 1 !important;
  caret-color: rgb(55, 53, 47);
`

const StyledEditable = styled(Editable)`
  line-height: 1.5 !important;
  caret-color: #46474f;
  color: #46474f;
  font-size: 16px;
  margin: 0 auto;
  padding-top: 7rem;
  width: 78%;

`

const MenuHeader = styled.div`
color:  black;
opacity: 0.9;
margin-top: 0.3rem;
margin-bottom: 0.3rem;
margin-left: 0.2rem;
`

const MenuButtonText = styled.div`
  margin-left: 1.5rem;
  font-size: 1.55rem;
  color:  black;
  opacity: 0.9;
`

const IconBorder = styled.div`
  
  border-radius: 7px;
  width: 4.5rem;
  height: 4.5rem;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  box-shadow: 0 3px 6px 0 rgba(0,0,0,.1), 0 1px 3px 0 rgba(0,0,0,.08);
`

const Styled_Icon = styled.img`
    width: ${props => props.width}rem;
`

const AboveStyled= styled(Slate)`
  color: green !important;
`

const Button = styled.div`

`

const Icon = styled.div`

`

const Menu = styled.div`
  width: 23rem;
  height: 31rem;
  position: absolute;
  z-index: 1;
  top: -10000px;
  left: -10000px;
  margin-top: -6px;
  opacity: 0;
  background-color: white;
  border-radius: 3px;
  transition: opacity 0.75s;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
  overflow-y: scroll;
`

const MenuButton = styled.div`
  height: 7rem;
  background-color: white;
  cursor: pointer;
  display: flex;
  &:hover {
    background-color: #F4F4F6;
    
  }
  align-items: center;
  padding: 1rem;
  border-radius: 3px;
`


const HeadingOne = styled.div`
  font-size: 4rem;
  color: rgb(55, 53, 47);
  font-weight: 700;
`

const Portal = styled.div`
`


const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underlined) {
    children = <u>{children}</u>
  }

  return <span {...attributes}>{children}</span>
}


const Element = ({ attributes, children, element }) => {

  switch (element.type) {
    case 'block-quote':
      return <blockquote {...attributes}>{children}</blockquote>
    case 'bulleted-list':
      return <ul {...attributes}>{children}</ul>
    case 'heading-one':
      return <HeadingOne contenteditable="true" {...attributes}>{children}</HeadingOne >
    case 'heading-two':
      return <H3 onClick = {() => console.log(element)} {...attributes}>{children}</H3>
    case 'heading-three':
      return <h3 {...attributes}>{children}</h3>
    case 'heading-four':
      return <h4 {...attributes}>{children}</h4>
    case 'heading-five':
      return <h5 {...attributes}>{children}</h5>
    case 'heading-six':
      return <h6 {...attributes}>{children}</h6>
    case 'list-item':
      return <li {...attributes}>{children}</li>
    default:
      return <p {...attributes}>{children}</p>
  }
}



const initialValue = [
  {
    type: 'heading-one',
    children: [
      {
        text:
          'Wav2Vec Documentation',
      },
    ],
  },
  {
    type: 'block-quote',
    children: [{ text: 'A wise quote.' }],
  },
  {
    type: 'paragraph',
    children: [
      {
        text:
          'Order when you start a line with "## " you get a level-two heading, like this:',
      },
    ],
  },
  {
    type: 'heading-two',
    children: [{ text: 'Try it out!' }],
  },
  {
    type: 'paragraph',
    children: [
      {
        text:
          'Try it out for yourself! Try starting a new line with ">", "-", or "#"s.',
      },
    ],
  },
]


//turn off hovering dropdown if no results

const withShortcuts = (editor, dispatch) => {
  const { deleteBackward, insertText, insertNode } = editor
 

  editor.insertText = text => {
    const { selection } = editor

    const block = Editor.above(editor, {
      match: n => Editor.isBlock(editor, n),
    })

    if (text === "/") {
      
      const domSelection = window.getSelection()
      const domRange = domSelection.getRangeAt(0)
      const rect = domRange.getBoundingClientRect()
      console.log(rect)
      dispatch({type: 'turn_active_on', payload: {rect, anchor: selection.focus}})
    }


    dispatch({type: 'update_focus', payload: selection.focus})

    dispatch({type: 'add_text', payload: text})
    
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

        if (type === 'list-item') {
          const list = { type: 'bulleted-list', children: [] }
          Transforms.wrapNodes(editor, list, {
            match: n => n.type === 'list-item',
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
      const match = Editor.above(editor, {
        match: n => Editor.isBlock(editor, n),
      })

      if (match) {
        const [block, path] = match
        const start = Editor.start(editor, path)

        if (
          block.type !== 'paragraph' &&
          Point.equals(selection.anchor, start)
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

const H3 = styled.h2`
  padding: 0;
  margin-bottom: 0;
`