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
import ColorMenu from './ColorMenu';

const EditorToolbar = (props) => {
    let editor = useSlate()
   
    return(
        <ToolbarContainer>
            <IconBlock>
                <BlockType>
                    Normal text
                    <ion-icon 
                        style = {{marginLeft: "0.8rem"}} 
                        name="chevron-down">
                    </ion-icon>
                </BlockType>
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
                <IconBorder>
                    <ion-icon style = {{fontSize: "1.4rem"}} name="code-sharp"></ion-icon>
                </IconBorder>
                <IconBorder>
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
                <IconBorder>
                    <FontAwesomeIcon style = {{fontSize: "1.5rem"}} icon = {faListUl}/>
                </IconBorder>
                <IconBorder>
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
    position: sticky; 
    top: 0;
    height: 6rem;
    align-items: center;
    z-index:1;
    background-color:white;
    display: flex;
    
    align-items: center;
    border-radius: 0.4rem 0.4rem 0rem 0rem !important;
    padding-left: 12rem;
    padding-right: 4rem;
    box-shadow: 0 2px 2px rgba(0,0,0,0.1);
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

const BlockType = styled.div`
    font-size: 1.35rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    margin-right: 0.5rem;
`

const IconColor = styled.div`
    font-size: 1.5rem;
    width: 1.8rem;
    display: flex;
    justify-content: center;
    border-bottom: 3px solid black;
`

const IconColorMenu = styled.div`
    position: absolute;
    margin-top: 9rem;
    border-radius: 0.3rem;
    box-shadow: 0 2px 6px 2px rgba(60,64,67,.15);
    color: #172A4e;
    display: flex;
    padding: 1.5rem;
    z-index: 2;
    background-color: white;
`

const IconColorChoice = styled.div`
    margin-right: 1rem;
    border-radius: 0.4rem;
    background-color: ${props => props.color ? props.color : chroma(props.chromacolor).alpha(0.4)};
    width: 2rem;
    height: 2rem;
    &:last-of-type {
        margin-right: 0rem;
    }
`



const IconBold = styled.div`
    font-size: 1.4rem;
`

const IconItalic = styled.div`
    font-style: italic;
    font-size: 1.4rem;
`

const IconUnderline = styled.div`
    text-decoration: underline;
    font-size: 1.4rem;
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