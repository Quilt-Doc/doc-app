import React, { useState, useMemo } from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//components
import NoteColorMenu from './NoteColorMenu';

//slate
import { Transforms } from 'slate';
import { useReadOnly, ReactEditor, useEditor } from 'slate-react';

const Note = ({attributes, children, element}) => {

    const [menuVisible, setMenuVisibility] = useState(false);

    const readOnly = useReadOnly()
    const editor = useEditor();

    const changeColor = useMemo(() => (color) => {
        const path = ReactEditor.findPath(editor, element);
        Transforms.setNodes(
            editor,
            { color },
            { at: path }
        )
    }, []);


    return (
        <Container 
            {...attributes}
            onMouseOver = {() => setMenuVisibility(true)} 
            onMouseLeave = {() => setMenuVisibility(false)} 
        >
            {(!readOnly && menuVisible) && 
                <MenuContainer contentEditable={false} >
                    <NoteColorMenu 
                        elementColor = {element.color}
                        changeColor = {changeColor}
                    />
                </MenuContainer>
            }
            <NoteContainer
                color = {element.color ? element.color : "#6762df"}
                changeColor = {changeColor}
                contentEditable={!readOnly}
                suppressContentEditableWarning
            >
                {children}
            </NoteContainer>
        </Container>
    )
}

//BiNote

export default Note;

const Container = styled.div`
    position: relative;
`

const NoteContainer = styled.div`
    background-color: ${props => chroma(props.color).alpha(0.15)};
    font-size: 1.6rem;
    line-height: 1.73;
    padding: 1rem 1.7rem;
    display: flex;
    align-items: center;
    color: #172A4e;
    margin-top: 2rem !important;
    border-radius: 0.3rem;
    border-left: 1rem solid ${props => chroma(props.color).alpha(0.3)};
    font-weight: 500;
    position: relative;
`

const MenuContainer = styled.div`
    position: absolute;
    top: -4rem;
    right: 0rem;
    z-index: 3;
`