import React from 'react';

//styles 
import styled from "styled-components"
import SyntaxHighlighter from 'react-syntax-highlighter';

class Snippet extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            'background_color': 'white',
            'box_shadow': ''
        }
    }


    renderCodeLines() {
        return this.props.code_lines.map(code_line => {
            if (code_line === ''){
                code_line = '    '
            }
            return (
                <CodeLine language='python' style='vs'>
                    {code_line}
                </CodeLine>
            )
        })
    }

    hover() {
        this.setState({'background_color': 'white', 'box_shadow': '0 6px 8px rgba(102,119,136,.03), 0 1px 2px rgba(102,119,136,.3)'})
        //this.setState({'background_color': 'white', 'box_shadow': '0 0 60px rgba(0, 0, 0, 0.08)'})
    }

    unhover() {
        this.setState({'background_color': 'white', 'box_shadow': ''})
    }

    render() {
            return (
                <Snippet_Wrapper 
                    background_color = {this.state.background_color} 
                    box_shadow = {this.state.box_shadow}
                    border = {this.state.border}
                    onMouseEnter = {this.props.scalePane} 
                    onMouseLeave = {this.props.unhoverBoth}
                >
                   {this.renderCodeLines()}
                </Snippet_Wrapper>
            );
    }
}

export default Snippet;

//Styled Components

const Snippet_Wrapper = styled.div`
    cursor: pointer;
    padding: 1rem 1.5rem;
    background-color: ${props => props.background_color};
    box-shadow: ${props => props.box_shadow};
    margin-bottom: 1.5rem;
    margin-top: 1.5rem;
    border-left: 1.5px solid #5534FF;
`

/*
margin-bottom: 1rem;
    margin-top: 1rem;
*/
const CodeLine = styled(SyntaxHighlighter)`
    font-size: 1.35rem;
    margin: 0;
    padding: 0.1rem !important;
    background-color: inherit !important;
    
`