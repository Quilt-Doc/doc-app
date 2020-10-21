import React, { useRef, useState, useEffect } from 'react'

//slate
import { ReactEditor, useSlate } from 'slate-react'
import { Editor, Range } from 'slate'

//styles
import styled from 'styled-components';

const HoveringToolbar = () => {
    const menu = useRef();
    const editor = useSlate();
  
    const [open, setOpen] = useState(false);
    const [rect, setRect] = useState({ top: 0, left: 0 });

    const { selection } = editor;

    useEffect(() => {
      
        if (
            !selection ||
            !ReactEditor.isFocused(editor) ||
            Range.isCollapsed(selection) ||
            Editor.string(editor, selection) === ''
        ) {
            setOpen(false);
        } else {
            const domSelection = window.getSelection()
            const domRange = domSelection.getRangeAt(0)
            const rect = domRange.getBoundingClientRect();
            const parentRect = 
                document.getElementById('editorContainer').getBoundingClientRect();

            let newRect = {
                top: rect.top - parentRect.top, 
                left: rect.left - parentRect.left,
            }

            setRect(newRect);
            setOpen(true);
        }

    }, [selection])

    /*
    const calculateRect = (clientRect) => {
        const { top, left, height } = clientRect;
        let rect = { top, left, height };
        
        if (documentModal) {	
            const { scrollTop } = document.getElementById("documentModalBackground");
            rect.top = rect.top + scrollTop;
        } 
       
        if (menu.current) {
            if (rect.top + 385 - 100 > window.innerHeight){
                rect.top = rect.top - 385;
            }
        }

        rect.top = rect.top + rect.height/2;
        return rect;
    }*/
    return (
        open && 
            <Container  
                ref = { menu }
                rect = {rect}
                style = {{
                    left: rect.left
                }}
                onMouseDown = {(e) => e.preventDefault()}
            >

            </Container>
    )
  }


  /*<CSSTransition
in = {true}
unmountOnExit
appear = {true}
timeout = {150}
classNames = "dropmenu"
>
        </CSSTransition>*/

export default HoveringToolbar;

const Container = styled.div`
    height: 4rem;
    width: 8rem;
    background-color:red;
    transform: translateY(${props => props.rect.top}px);
    z-index: 1;
    position: absolute;
`