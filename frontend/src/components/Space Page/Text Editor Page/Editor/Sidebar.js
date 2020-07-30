import React from 'react';
import {Node, Editor} from 'slate'
import { useSlate, useEditor, useFocused, useSelected, ReactEditor } from 'slate-react';
//styles
import styled from "styled-components";
import chroma from 'chroma-js';


const Sidebar = () => {
    /*
    let editor = useSlate()
	let rect;
    console.log("EDITOR", editor.selection);
    if (editor.selection) {
        let range = ReactEditor.toDOMRange(editor, editor.selection)
        console.log(range)
        rect = range.getBoundingClientRect()
        console.log("RECT", rect)
	}
    if (rect) {
        console.log("TOP", rect.top)
    }*/
    
    return (
        null
        /*
        <SidebarContainer>
            <BlockTool top = {rect ? rect.top - 100 : 0}>
                <ion-icon name="add" style = {{fontSize: "2rem", marginRight: "1rem"}}></ion-icon>
                H1
            </BlockTool>
        </SidebarContainer>*/
    )
}

export default Sidebar


const SidebarContainer = styled.div`
	display: flex;
	flex-direction: column;
	width: 7rem;
	align-items: center;
	margin-left: -7rem;
`



const BlockTool = styled.div`
	font-size: 1.7rem;
	display: flex;
	align-items: center;
	border-right: 2px solid ${chroma("#19E5BE").alpha(0.5)};
	padding: 0.5rem 1rem;
	transform: translateY(${props => props.top}px);
`