import React from 'react';

//styles 
import styled from "styled-components"
import SyntaxHighlighter from 'react-syntax-highlighter';
import chroma from 'chroma-js';

class Snippet extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            'backgroundColor': 'white',
            'boxShadow': '',
            'menuOpen': false,
            'menuStyle': {top: "-10000px", left: "-10000px", opacity: "0"}
        }
    }


    renderCodeLines() {
        return this.props.codelines.map(codeline => {
            return (
                <CodeLine>
                    {codeline}
                </CodeLine>
            )
        })
    }

    hover() {
        this.setState({'backgroundColor': 'white', 'boxShadow': 'rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px'})

        if (this.props.codeViewState.reselectingSnippet === null && !this.props.codeViewState.selectionMode ){
            this.setState({'menuStyle': {top: "", left: "71rem", opacity: "1"}})
        } else {
            this.setState({'menuStyle': {top: "-10000px", left: "-10000px", opacity: "0"}})
        }
        //this.setState({'backgroundColor': 'white', 'boxShadow': '0 0 60px rgba(0, 0, 0, 0.08)'})
    }

    unhover() {
        this.setState({
            'backgroundColor': 'white', 
            'boxShadow': '',
            'menuStyle': {top: "-10000px", left: "-10000px", opacity: "0"}
        })
    }


    render() {
            return (
                <SnippetWrapper 
                    backgroundColor = {this.state.backgroundColor} 
                    boxShadow = {this.state.boxShadow}
                    border = {this.props.status === "INVALId" ?  "1.5px solid #eb3b5a" :  "1.5px solid #5B75E6"}
                    onMouseEnter = {this.props.scalePane} 
                    onMouseLeave = {this.props.unhoverBoth}
                >
                    {/*
                    <MenuContainer 
                        opacity = {this.state.menuStyle.opacity}
                        top = {this.state.menuStyle.top}
                        left = {this.state.menuStyle.left}
                    >
                        <Menu onClick = {() => this.setState(prevState => ({menuOpen: !prevState.menuOpen}))}>
                                <ion-icon 
                                        name="ellipsis-horizontal-outline"
                                        style = {{'fontSize': '2rem'}}
                                        >
                                        
                                </ion-icon>
                        </Menu>
                        <MenuDropdown 
                            opacity = {this.state.menuOpen ? "1" : "0"}
                            top = {this.state.menuOpen ? "" : "-10000px"}
                            left = {this.state.menuOpen ? "" : "-10000px"}
                        >
                            <DropdownButton>
                            <ion-icon style = {{"fontSize":"1.5rem", "width": "2.35rem"}} name="pencil-outline"></ion-icon>
                                Edit
                            </DropdownButton>
                            <DropdownButton onClick = {() => this.props.reselectSnippet(this.props.index)}>
                                <ion-icon style = {{"fontSize":"1.5rem", "width": "2.35rem"}} name="color-wand-outline"></ion-icon>
                                Reselect
                            </DropdownButton>
                            <DropdownButton onClick = {() => this.props.deleteSnippet(this.props.index)}>
                                <ion-icon style = {{"fontSize":"1.5rem",  "width": "2.35rem"}} name="trash-outline"></ion-icon>
                                Delete
                            </DropdownButton>
                        </MenuDropdown>
                    </MenuContainer>*/}
                   {this.props.status === "INVALId" ? <Status>Deprecated Snippet</Status> : <></>}
                   {this.renderCodeLines()}
                </SnippetWrapper>
            );
    }
}

export default Snippet;

//Styled Components

const SnippetWrapper = styled.div`
    cursor: pointer;
   
    /*background-color: ${props => props.backgroundColor};*/
    background-color:  ${chroma("#5B75E6").alpha(0.04)};
    box-shadow: ${props => props.boxShadow}; 
    margin-bottom: 1.5rem;
    margin-top: 1.5rem;
    border-left: ${props => props.border};
    position: relative;
    transform: translateX(0);
`

const Menu = styled.div`
    
    height: 2.4rem;
    width: 2.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    opacity: 0.5;
    &:hover {
        background-color: #F7F9FB;
        opacity: 1;
    }
`

const MenuContainer = styled.div`
    position: absolute;
    left: ${props => props.left};
    top: ${props => props.top};
    opacity: ${props => props.opacity};
    transition: all 0.05s ease-in;
    margin-top: -0.7rem;
    display: flex;
    flex-direction: column;
`

const MenuDropdown = styled.div`
    box-shadow: 0 2px 6px 2px rgba(60,64,67,.15);
    width: 10rem;
    margin-top: 0.5rem;
    background-color: white;
    margin-left: -8rem;
    border-radius: 0.5rem;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
    color: #172A4E;
    padding: 0.25rem 0;
    z-index: 10;
    transition: all 0.1s ease-in;
    opacity : ${props => props.opacity};
   
    top: ${props => props.top};
    left: ${props => props.left};
`

const DropdownButton = styled.div`
    padding: 0.5rem;
    height: 2.7rem;
    &:hover {
        background-color: #F7F9FB;
    }
    display: flex;
    align-items: center;
    cursor: pointer;
`

const CodeLine = styled.div`
    font-size: 1.27rem;
    margin: 0;
    padding: 0.1rem !important;
    background-color: inherit !important;
    padding-left: 1.6rem !important;
    boxShadow: 0 0 60px rgba(0, 0, 0, 0.08) !important;
    white-space: pre-wrap !important;
`

const Status = styled.div`
    font-size: 1.5rem;
    font-style: italic;
    font-family:  -apple-system,BlinkMacSystemFont, sans-serif;
    margin-bottom: 0.5rem;
    margin-top: -0.3rem;
    color: #eb3b5a;
    padding: 0.1rem !important;
    background-color: inherit !important;
    padding-left: 1.6rem !important;
    boxShadow: 0 0 60px rgba(0, 0, 0, 0.08) !important;
    white-space: pre-wrap !important;
`

