import React, { useRef, useState, useEffect } from 'react'

//slate
import { ReactEditor, useSlate } from 'slate-react'
import { Editor, Range } from 'slate'

//styles
import styled from 'styled-components';

//lodash
import _ from 'lodash';

const HoveringToolbar = () => {
    const menu = useRef();
    const editor = useSlate();
  
    const [open, setOpen] = useState(false);
    const [rect, setRect] = useState({ top: 0, left: 0 });
    const [initialAnchor, setAnchor] = useState(null);

    const { selection } = editor;

    /*
    useEffect(() => {
        console.log("RENDERED");
        if (
            !selection ||
            !ReactEditor.isFocused(editor) ||
            Range.isCollapsed(selection) ||
            Editor.string(editor, selection) === ''
        ) {
            
            if (!open) {
                console.log("ENTERED IN HERE");
                setOpen(false);
                setAnchor(null);
            }
        } else if (!_.isEqual(selection.anchor, initialAnchor)) {
            console.log("ENTERED IN HERE 2");
            const domSelection = window.getSelection()
            const domRange = domSelection.getRangeAt(0)
            const rect = domRange.getBoundingClientRect();

            const parentRect = 
                document.getElementById('editorSubContainer').getBoundingClientRect();

            let newRect = {
                top: rect.top - parentRect.top - 30, 
                left: rect.left - parentRect.left - 30,
            }
            
            setAnchor(selection.anchor);
            setRect(newRect);
            setOpen(true);
            
        }

    }, [ selection, initialAnchor, open ])
    
    
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
                rect = { rect }
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