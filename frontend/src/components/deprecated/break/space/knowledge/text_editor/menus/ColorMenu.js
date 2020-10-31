import React from 'react';

//styles 
import styled from "styled-components";
import chroma from 'chroma-js';

import { Editor } from 'slate';
//icons
import { faTintSlash, faHighlighter  } from '@fortawesome/free-solid-svg-icons'
import { ImTextColor } from 'react-icons/im';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { RiCheckFill } from 'react-icons/ri';
import { AiOutlineFormatPainter } from 'react-icons/ai';

class ColorMenu extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            open: false,
            onOpen: false
        }
    }

    openMenu(e){
        e.preventDefault();
        this.setState({open: true})
        document.addEventListener('mousedown', this.handleClickOutside, false);
    }

    closeMenu(){
        document.removeEventListener('mousedown', this.handleClickOutside, false);
        this.setState({ open: false})
    }

    handleClickOutside = (event) => {
        if (this.node && !this.node.contains(event.target)) {
            this.closeMenu()
        }
    }

    isColorActive = (color) => {
        const marks = Editor.marks(this.props.editor)
        if (this.props.back) {
            return marks ? marks["backColor"] === chroma(color).alpha(0.4).hex() : false
        }
        return marks ? marks["color"] === color : false
    }

    findActiveColor = () => {
        const marks = Editor.marks(this.props.editor)
        if (marks){
            if (this.props.back) {
                return marks["backColor"] 
                    && typeof marks["backColor"] === "string" ? marks["backColor"] : "#ffffff" 
            }
            return marks["color"] && 
                typeof marks["color"] === "string" ? marks["color"] : "#172A4E"
        } else {
            if (this.props.back) {
                return "#ffffff" 
            } else {
                return  "#172A4E"
            }
        }
        
    }

    toggleColor = (color) => {
        if (this.props.back) {
            if (color !== "#ffffff") {
                Editor.addMark(this.props.editor, "backColor", chroma(color).alpha(0.4).hex())
            } else {
                Editor.removeMark(this.props.editor, "backColor")
            }
        } else {
            if (color !== "#172A4E") {
                Editor.addMark(this.props.editor, "color", color)
            } else {
                Editor.removeMark(this.props.editor, "color")
            }
        }	
        this.closeMenu()
    }

    renderIconColors(){
        
        let arr = ["#ff4757", "#ff7f50", "#ffa502", "#19e5be", "#1e90ff", "#5352ed"]
        if (!this.props.back) {
            arr.push("#172A4E")
        }
        arr.reverse()
        return arr.map((color, i) => {
            return (
                <IconColorChoice color = {!this.props.back ? color : chroma(color).alpha(0.4).hex()} onClick = {() => this.toggleColor(color)}>
                        {this.isColorActive(color) &&  <RiCheckFill
                                name="checkmark"
                                style = {{
                                    fontSize: "1.6rem",
                                    color: "white"
                                }}
                            />}
                </IconColorChoice>
            )
        })

        
    }

    render(){
        return (
            <IconBorder active = {this.state.open} onMouseDown = {(e) => {this.openMenu(e)}} > 
                {this.props.back ? 
                    <IconColor color = {this.findActiveColor()}>
                        <AiOutlineFormatPainter/>
                    </IconColor> : 
                    <IconColor color = {this.findActiveColor()}><ImTextColor/></IconColor>}
                {this.state.open && 
                    <IconColorMenu ref = {node => this.node = node}>
                         {this.props.back && 
                                <IconColorChoice 
                                    onClick = {(e) => {this.toggleColor("#ffffff")}}
                                    hoverColor = {"#F4F4F6"}
                                    color = {"#ffffff"}>
                                     <FontAwesomeIcon  icon={faTintSlash} />
                                </IconColorChoice>
                          }
                        {this.renderIconColors()}
                    </IconColorMenu>
                }
            </IconBorder>
        )
    }
}


export default ColorMenu;

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
        background-color: ${props => props.active ? chroma("#6762df").alpha(0.2) : "#F4F4F6"};
    }
    
    cursor: pointer;
    transition: all 0.1s ease-in;
    background-color: ${props => props.active ? chroma("#6762df").alpha(0.2)  : "white"};
    color: #172A4E;
`

const IconColor = styled.div`
    font-size: 1.7rem;
    width: 1.8rem;
    display: flex;
    justify-content: center;
    color: ${props => props.color !== '#ffffff' ? props.color : ""};
    /*border-bottom: 3px solid ${props => props.color};*/
`

const IconColorMenu = styled.div`
    position: absolute;
    margin-top: 9rem;
    border-radius: 0.3rem;
    /*
    box-shadow: 0 2px 6px 2px rgba(60,64,67,.15);*/
    box-shadow: 0 2px 2px 2px rgba(60,64,67,.15);
    color: #172A4e;
    display: flex;
    padding: 1.5rem;
    z-index: 2;
    background-color: white;
    cursor: default;
`

const IconColorChoice = styled.div`
    margin-right: 1rem;
    border-radius: 0.3rem;
    background-color: ${props => props.color ? props.color : chroma(props.chromacolor).alpha(0.4)};
    min-width: 1.7rem;
    min-height: 1.7rem;
    &:last-of-type {
        margin-right: 0rem;
    }

    &:hover {
        background-color: ${props => props.hoverColor};
    }
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`