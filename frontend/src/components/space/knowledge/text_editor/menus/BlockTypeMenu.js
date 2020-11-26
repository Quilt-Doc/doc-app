import React from 'react';

//styles 
import styled from "styled-components";
import chroma from 'chroma-js';

//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {faCode, faQuoteLeft, faListUl, faListOl  } from '@fortawesome/free-solid-svg-icons'
import { BiParagraph } from 'react-icons/bi';
import { CSSTransition } from 'react-transition-group';
import { FiChevronDown } from 'react-icons/fi';


class BlockTypeMenu extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            open: false
        }
    }

    openMenu(e) {
        e.preventDefault()
        if (this.props.type) {
            document.addEventListener('mousedown', this.handleClickOutside, false);
            this.setState({open: true})
        }
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

    renderType(){
        let {type} = this.props
        switch(type){
            case "heading-one":
                return <Type>{"Heading 1"}</Type>
            case "heading-two":
                return <Type>{"Heading 2"}</Type>
            case "heading-three":
                return <Type>{"Heading 3"}</Type>
            case "bulleted-list":
                return <Type>{"Bulleted List"}</Type>
            case "numbered-list":
                return <Type>{"Numbered List"}</Type>
            case "quote":
                return <Type>{"Quote"}</Type>
            case "code-block":
                return <Type>{"Code Block"}</Type>
            default:
                return  <Type>{"Paragraph"}</Type>
        }
    }

    toggleBlock(e, type){
        e.preventDefault()
        e.stopPropagation()
        this.props.toggleBlock(type);
        this.closeMenu()
        /*
        let selection = this.props.editor.selection
        if (selection) {
            let path = selection.anchor.path
            setTimeout(() => {this.props.changeRect(ReactEditor.toDOMRange(this.props.editor, 
                {anchor: {offset: 0, path}, 
                focus: {offset: 0, path }}).getBoundingClientRect())}, 10)
        }*/
    }

    render(){
        let {open} = this.state;
        const { type }  = this.props;
        return(
            <BlockType open = {open} onMouseDown = {(e) => this.openMenu(e)} active = {type ? true : false}>
                {this.renderType()}
                <FiChevronDown 
                        style = {{
                            marginLeft: "0.5rem",
                            marginTop: "0.3rem",
                            fontSize: "1.45rem"
                        }}
                    />
                <CSSTransition
                    in = {open}
                    unmountOnExit
                    enter = {true}
                    exit = {true}
                    timeout = {150}
                    classNames = "dropmenu"
                >
                    <BlockMenu  ref = {node => this.node = node}>
                        <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "paragraph")}}>
                            <IntoIcon>
                                <BiParagraph/>
                            </IntoIcon>
                            <IntoText>
                                Paragraph
                            </IntoText>
                        </IntoOption>
                        <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "heading-one")}}>
                            <IntoIcon>
                                H1
                            </IntoIcon>
                            <IntoText>
                                Heading 1
                            </IntoText>
                        </IntoOption>
                        <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "heading-two")}}>
                        <IntoIcon>
                            H2
                        </IntoIcon>
                        <IntoText>
                            Heading 2
                        </IntoText>
                    </IntoOption>
                    <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "heading-three")}}>
                        <IntoIcon>
                            H3
                        </IntoIcon>
                        <IntoText>
                            Heading 3
                        </IntoText>
                    </IntoOption>
                    <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "quote")}}>
                        <IntoIcon>
                            <FontAwesomeIcon icon={faQuoteLeft}/>
                        </IntoIcon>
                        <IntoText>
                            Quote
                        </IntoText>
                    </IntoOption>
                    <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "bulleted-list")}}>
                        <IntoIcon>
                            <FontAwesomeIcon icon={faListUl}/>
                        </IntoIcon>
                        <IntoText>
                            Bullet List
                        </IntoText>
                    </IntoOption>
                    <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "numbered-list")}}>
                        <IntoIcon>
                            <FontAwesomeIcon icon={faListOl}/>
                        </IntoIcon>
                        <IntoText>
                            Numbered List
                        </IntoText>
                    </IntoOption>
                    <IntoOption onMouseDown = {(e) => {this.toggleBlock(e, "code-block")}}>
                        <IntoIcon>
                            <FontAwesomeIcon icon={faCode}/>
                        </IntoIcon>
                        <IntoText>
                            Code Block
                        </IntoText>
                    </IntoOption>
                    </BlockMenu>
                </CSSTransition>
            </BlockType>
        )
    }
}

export default BlockTypeMenu

const Type = styled.div`
    width: 10rem;
`

const BlockType = styled.div`
    font-size: 1.35rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    &:hover {
        background-color: ${props => props.open ? chroma("#6762df").alpha(0.2) : props.active ? '#F4F4F6' : ''};
    }
    opacity:  ${props => props.active ? 1 : 0.5};
    cursor: pointer;
    padding: 0.7rem;
    padding-left: 1rem;
    height: 4rem;
    border-top-left-radius: 0.3rem;
    border-bottom-left-radius: 0.3rem;
    /*
    border-radius: 0.3rem;
    border: ${props => !props.open ?  "1px solid #DFDFDF" : `1px solid ${chroma("#6762df").alpha(0.2)}`};
    */
    background-color: ${props => props.open ? chroma("#6762df").alpha(0.2) : ""}
`


const IntoOption = styled.div`
    display: flex;
    font-size: 1.2rem;
    padding: 0.8rem 1rem;
    color: #172A4E;
    &:hover {
        background-color: #F4F4F6;
    }
`

const IntoIcon = styled.div`
    width: 2.5rem;
    font-weight: 600;
`


const IntoText = styled.div`

`


const BlockMenu = styled.div`
    width: 18rem;
    height: 26rem;
    display: flex;
    flex-direction: column;
    position: absolute;
    background-color: white;

    z-index: 2;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px, rgba(9, 30, 66, 0.25) 0px 4px 8px -2px;
    margin-top: 30rem;
    margin-left: -1rem;
    border-radius: 0.2rem;
    overflow-y: scroll;
    padding-bottom: 1rem;
`