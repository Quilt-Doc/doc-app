import React from 'react';

//styles 
import styled from "styled-components";
import chroma from 'chroma-js';

//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBold, faTable, faImage,  faRemoveFormat, faLink,  faItalic, faUnderline, faStrikethrough, faListUl, faListOl  } from '@fortawesome/free-solid-svg-icons'

//slate
import {Node, Editor} from 'slate'
import { useSlate, useEditor, useFocused, useSelected, ReactEditor } from 'slate-react';

//menus
import ColorMenu from '../menus/ColorMenu';
import BlockTypeMenu from '../menus/BlockTypeMenu';


const EditorToolbar = (props) => {
    let editor = useSlate()
    let path;
    let type;
    if (editor.selection && editor.selection.anchor) {
        path =  [editor.selection.anchor.path[0]]
        type = Node.get(editor, path).type
    }
    return(
        <ToolbarContainer modal = {props.modal} id = "toolbarcontainer" onMouseDown = {(e) => e.preventDefault()}>
            <IconBlock >
                <BlockTypeMenu toggleBlock = {props.toggleBlock} type = {type}/>
            </IconBlock>
            <IconBlock>
                <IconBorder
                    active={props.isMarkActive(editor, "bold")}
                    onMouseDown={event => {
                        event.preventDefault()
                        props.toggleMark(editor, "bold")
                    }}
                >
                    <FontAwesomeIcon style = {{marginTop: "0rem"}} icon={faBold} />
                </IconBorder>
                <IconBorder
                     active={props.isMarkActive(editor, "italic")}
                     onMouseDown={event => {
                         event.preventDefault()
                         props.toggleMark(editor, "italic")
                     }}
                >
                     <FontAwesomeIcon style = {{marginTop: "0rem"}} icon={faItalic} />
                </IconBorder>
                <IconBorder active={props.isMarkActive(editor, "underlined")}
                     onMouseDown={event => {
                         event.preventDefault()
                         props.toggleMark(editor, "underlined")
                     }}>
                   <FontAwesomeIcon style = {{marginTop: "0.2rem"}} icon={faUnderline} />
                </IconBorder>
                <IconBorder active={props.isMarkActive(editor, "strike")}
                     onMouseDown={event => {
                         event.preventDefault()
                         props.toggleMark(editor, "strike")
                     }}>
                   <FontAwesomeIcon style = {{marginTop: "0rem"}} icon={faStrikethrough} />
                </IconBorder>
                <IconBorder   
                    onMouseDown={event => {
                         event.preventDefault()
                         props.toggleMark(editor, "code")
                    }}
                    active={props.isMarkActive(editor, "code")}
                >
                    <ion-icon style = {{fontSize: "1.4rem"}} name="code-sharp"></ion-icon>
                </IconBorder>
                <IconBorder
                    onMouseDown={event => {
                        event.preventDefault()
                        props.removeMarks()
                   }}
                >
                    <FontAwesomeIcon style = {{marginTop: "0rem"}} icon={faRemoveFormat} />
                </IconBorder>
            </IconBlock>

            <IconBlock>
                <ColorMenu
                    editor = {editor}
                    back = {false}
                />
                <ColorMenu editor = {editor}
                    back = {true}/>
            </IconBlock>
            <IconBlock>
                <IconBorder
                    active = {type ? type === "bulleted-list" : false}
                    onMouseDown = {event => {
                        event.preventDefault()
                        props.toggleBlockActive("bulleted-list")
                    }}
                >
                    <FontAwesomeIcon style = {{fontSize: "1.5rem"}} icon = {faListUl}/>
                </IconBorder>
                <IconBorder
                    active = {type ? type === "numbered-list" : false}
                    onMouseDown = {event => {
                        event.preventDefault()
                        props.toggleBlockActive("numbered-list")
                    }}
                >
                    <FontAwesomeIcon style = {{fontSize: "1.5rem"}} icon = {faListOl}/>
                </IconBorder>
            </IconBlock>
            <IconBlock>
                <IconBorder>
                    <ion-icon  style = {{ fontSize: "1.5rem"}} name="checkbox"></ion-icon>
                </IconBorder> 
                <IconBorder>
                    <FontAwesomeIcon style = {{fontSize: "1.5rem"}} icon = {faLink}/>
                </IconBorder>
                <IconBorder>
                    <FontAwesomeIcon style = {{fontSize: "1.5rem"}} icon = {faTable}/>
                </IconBorder>
                <IconBorder>
                    <FontAwesomeIcon style = {{fontSize: "1.5rem"}} icon = {faImage}/>
                </IconBorder>
            </IconBlock>
        </ToolbarContainer>
    )
}

export default EditorToolbar;



const ToolbarContainer = styled.div`
    height: 6rem;
    align-items: center;
    z-index:2;
    background-color:white;
    display: flex;
    
    align-items: center;
    
    padding-left: ${props => props.modal ? "4rem" : "12rem"};
    padding-right: 4rem;
    box-shadow: ${props => props.modal ? "none" : '0 2px 2px rgba(0,0,0,0.1)'};
    border-top-left-radius:  0.3rem;
    border-top-right-radius: 0.3rem;
    border-bottom: ${props => props.modal ? '1px solid #E0E4E7': ''};
`

const IconBlock = styled.div`
    display: flex;
    padding-left: 1.3rem;
    padding-right: 1.3rem;
    border-right: 1px solid #e7edf3;
    align-items: center;
    height: 2.6rem;

    &:last-of-type {
        border-right:none;
    }
`

const IconBorder = styled.div`
    margin-left: ${props => props.marginLeft};
    margin-right: 0.3rem;
    display: flex;
    font-size: 1.2rem;
    align-items: center;
    justify-content: center;
   
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 0.3rem;
      
    &:hover {
        opacity: 1;
        background-color: ${props => props.active ? chroma("#5B75E6").alpha(0.2) : "#F4F4F6"};
    }
    
    cursor: pointer;
    transition: all 0.1s ease-in;
    background-color: ${props => props.active ? chroma("#5B75E6").alpha(0.2)  : "white"};
    color: #172A4E;
`