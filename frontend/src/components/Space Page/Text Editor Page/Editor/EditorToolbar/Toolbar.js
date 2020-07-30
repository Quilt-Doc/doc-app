import React from 'react';

//styles 
import styled from "styled-components";
import chroma from 'chroma-js';

//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAlignLeft, faAlignRight, faAlignCenter, faListUl, faListOl  } from '@fortawesome/free-solid-svg-icons'

//slate
import { useSlate } from 'slate-react';

//menus
import ColorMenu from './ColorMenu';

const EditorToolbar = (props) => {
    let editor = useSlate()
    console.log(props.isMarkActive(editor, "bold"))
    return(
        <ToolbarContainer>
            <IconBlock>
                <IconBorder
                    active={props.isMarkActive(editor, "bold")}
                    onMouseDown={event => {
                        event.preventDefault()
                        props.toggleMark(editor, "bold")
                    }}
                >
                    <IconBold>B</IconBold>
                </IconBorder>
                <IconBorder
                     active={props.isMarkActive(editor, "italic")}
                     onMouseDown={event => {
                         event.preventDefault()
                         props.toggleMark(editor, "italic")
                     }}
                >
                    <IconItalic>i</IconItalic>
                </IconBorder>
                <IconBorder active={props.isMarkActive(editor, "underlined")}
                     onMouseDown={event => {
                         event.preventDefault()
                         props.toggleMark(editor, "underlined")
                     }}>
                    <IconUnderline>U</IconUnderline>
                </IconBorder>
            </IconBlock>
            <IconBlock>
                <IconBorder>
                    <FontAwesomeIcon style = {{marginTop: "0rem"}} icon={faAlignLeft} />
                </IconBorder>
                <IconBorder>
                    <FontAwesomeIcon style = {{marginTop: "0rem"}} icon={faAlignCenter} />
                </IconBorder>
                <IconBorder>
                    <FontAwesomeIcon style = {{marginTop: "0rem"}} icon={faAlignRight} />
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
                    <FontAwesomeIcon style = {{marginTop: "0.25rem"}} icon = {faListUl}/>
                </IconBorder>
                <IconBorder>
                    <FontAwesomeIcon style = {{marginTop: "0.25rem"}} icon = {faListOl}/>
                </IconBorder>
            </IconBlock>
            <IconBlock>
                <IconBorder>
                    <IconBold>H1</IconBold>
                </IconBorder>
                <IconBorder>
                    <IconBold>H2</IconBold>
                </IconBorder>
                <IconBorder>
                    <IconBold>H3</IconBold>
                </IconBorder>
            </IconBlock>
            <IconBlock>
                <IconBorder>
                    <ion-icon style = {{marginTop: "0.25rem", fontSize: "1.7rem"}} name="code-slash-sharp"></ion-icon>
                </IconBorder>
                <IconBorder>
                    <ion-icon  style = {{marginTop: "0.25rem",  fontSize: "1.7rem"}} name="grid-outline"></ion-icon>  
                </IconBorder>
                <IconBorder>
                    <ion-icon  style = {{marginTop: "0.25rem",  fontSize: "1.7rem"}} name="checkbox-outline"></ion-icon>
                </IconBorder>
            </IconBlock>
        </ToolbarContainer>
    )
}

export default EditorToolbar;



const ToolbarContainer = styled.div`
    position: sticky; 
    top: 0;
    height: 4.5rem;
    align-items: center;
    z-index:1;
    background-color:white;
    display: flex;
    border-bottom: 1px solid #EDEFF1;
    align-items: center;
    border-radius: 0.4rem 0.4rem 0rem 0rem !important;
    padding-left: 1rem;
    padding-right: 1rem;
`

const IconBlock = styled.div`
    display: flex;
    padding-left: 1.3rem;
    padding-right: 1rem;
    border-right: 2px solid #F4F4F6; 
    align-items: center;
    height: 2.3rem;
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
    font-size: 1.5rem;
`

const IconItalic = styled.div`
    font-style: italic;
    font-size: 1.5rem;
`

const IconUnderline = styled.div`
    text-decoration: underline;
    font-size: 1.5rem;
`

const IconBorder = styled.div`
    margin-left: ${props => props.marginLeft};
    margin-right: 0.3rem;
    display: flex;
    font-size: 1.3rem;
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