import React, { useState, useMemo, useRef } from 'react';

//styles
import styled from 'styled-components';
import { MENU_SHADOW } from '../../../../../../../styles/shadows'

//slate
import { Transforms } from 'slate';
import { useReadOnly, ReactEditor, useEditor } from 'slate-react';

//components
import LanguageMenu from './LanguageMenu';

const CodeBlock = (props) => {
    const { attributes, children, element } = props;

    const [menuVisible, setMenuVisibility] = useState(false);
    const [optionsOpen, setOptionsOpen] = useState(false);

    const readOnly = useReadOnly()
    const editor = useEditor();

    const changeLanguage = useMemo(() => (language) => {
        if (language === element.language) return;
        const path = ReactEditor.findPath(editor, element);
        
        const node = { type: 'code-block', children: [], language: language }
        Transforms.wrapNodes(editor, node, {
            at: path
        });

        Transforms.unwrapNodes(editor, {
            match: n => (n.type === 'code-block' && n.language !== language),
            at: path
        });

    }, []);

   
    return (
        <Container 
            {...attributes}
            onMouseOver = {() => setMenuVisibility(true)} 
            onMouseLeave = {() => {if (!optionsOpen) setMenuVisibility(false) }} 
        >
            {(!readOnly && menuVisible) && 
                <MenuContainer contentEditable={false} >
                    <LanguageMenu 
                        language = {element.language}
                        optionsOpen = {optionsOpen}
                        setOptionsOpen = {setOptionsOpen}
                        setMenuVisibility = {setMenuVisibility}
                        changeLanguage = {changeLanguage}
                        container = {attributes['ref'].current}
                    />
                </MenuContainer>
            }
            <CodeContainer>
                {children}
            </CodeContainer>
        </Container>
    )
}

export default CodeBlock;

const CodeContainer = styled.div`
    margin-top: 2.5rem;
    background-color: #f7f9fb;
    tab-size: 4;
    border-top: 2px solid transparent;
    border-radius: 0.4rem;
    overflow-x: auto;
    width: calc(100vw - 6rem - 25rem - 20rem);
    max-width: 74rem;
`

const Container = styled.div`
    position: relative;
`

const MenuContainer = styled.div`
    position: absolute;
    top: -5rem;
    right: 0rem;
    z-index: 3;
`