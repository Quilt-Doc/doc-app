import React, { useState, useMemo, useCallback } from 'react';
import {
  Slate,
  Editable,
  withReact,
  useEditor,
  useReadOnly,
  ReactEditor,
} from 'slate-react';

import chroma from 'chroma-js';

import styled from 'styled-components';

import { Node, Editor, Transforms, Range, Point, createEditor } from 'slate';

import { withHistory } from 'slate-history';
import { RiCheckFill } from 'react-icons/ri';

const CheckListItemElement = ({ attributes, children, element }) => {
    const editor = useEditor()
    const readOnly = useReadOnly()
    const { isSelected } = element

    const turnCheckOn = (e) => {
        e.preventDefault();
        const path = ReactEditor.findPath(editor, element)
        Transforms.setNodes(
            editor,
            { isSelected: !isSelected },
            { at: path }
        )
    }

    const renderCheck = () => {
        let display = isSelected ? ''  : 'none';
        return { fontSize: "2rem", color: 'white', display};
    }

  
    return (
        <Container { ...attributes}>
            <CheckBoxBorder  
                contentEditable={false} 
                onMouseDown = {turnCheckOn}
            >
                <CheckBox 
                    borderColor = {isSelected ? '#19e5be'  : '#D7D7D7'}
                    backgroundColor =  {isSelected ? '#19e5be'  : 'white'}
                >
                    <RiCheckFill style={renderCheck()} />
                </CheckBox>
            </CheckBoxBorder>
            <CheckItemText
                contentEditable={!readOnly}
                suppressContentEditableWarning
                isSelected = {isSelected}
            >
                {children}
            </CheckItemText>
        </Container>
    )
}

export default CheckListItemElement;

const Container = styled.div`
    display: flex;
    align-items: center;
    margin-top: 0.5rem;
`

const CheckItemText = styled.div`
    font-size: 1.64rem;
    opacity: ${props => props.isSelected ? 0.3 : 1};
    text-decoration: ${props => props.isSelected ? "line-through" : ""};
    padding-bottom: 1px;
`

const CheckBoxBorder = styled.div`
    min-width: 3rem;
    min-height: 3rem;
    margin-right: 0.5rem;
    &:hover {
        background-color: ${chroma("#6762df").alpha(0.1)};
    }
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 50%;
`

const CheckBox = styled.div`
    height: 1.6rem;
    width: 1.6rem;
    background-color: ${props => props.backgroundColor};
    border: 2px solid ${props => props.borderColor};
    border-radius: 0.2rem;
    display: flex;
    justify-content: center;
    align-items: center;
`