import React from 'react';

//styles 
import styled from "styled-components"
import SyntaxHighlighter from 'react-syntax-highlighter';

class Snippet extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            'backgroundColor': 'white',
            'boxShadow': ''
        }
    }


    renderCodeLines() {
        return this.props.codelines.map(codeline => {
            if (codeline === ''){
                codeline = '    '
            }
            return (
                <CodeLine language='python' style='vs'>
                    {codeline}
                </CodeLine>
            )
        })
    }

    hover() {
        this.setState({'backgroundColor': 'white', 'boxShadow': '0 6px 8px rgba(102,119,136,.03), 0 1px 2px rgba(102,119,136,.3)'})
        //this.setState({'backgroundColor': 'white', 'boxShadow': '0 0 60px rgba(0, 0, 0, 0.08)'})
    }

    unhover() {
        this.setState({'backgroundColor': 'white', 'boxShadow': ''})
    }

    render() {
            return (
                <SnippetWrapper 
                    backgroundColor = {this.state.backgroundColor} 
                    boxShadow = {this.state.boxShadow}
                    border = {this.state.border}
                    onMouseEnter = {this.props.scalePane} 
                    onMouseLeave = {this.props.unhoverBoth}
                >
                   {this.renderCodeLines()}
                </SnippetWrapper>
            );
    }
}

export default Snippet;

//Styled Components

const SnippetWrapper = styled.div`
    cursor: pointer;
    padding: 1rem 1.5rem;
    background-color: ${props => props.backgroundColor};
    box-shadow: ${props => props.boxShadow};
    margin-bottom: 1.5rem;
    margin-top: 1.5rem;
    border-left: 1.5px solid #5534FF;
`

const CodeLine = styled(SyntaxHighlighter)`
    font-size: 1.35rem;
    margin: 0;
    padding: 0.1rem !important;
    background-color: inherit !important;
    
`