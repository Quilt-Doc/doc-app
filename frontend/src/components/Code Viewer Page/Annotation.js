import React from 'react';

//styles 
import styled from "styled-components"

class Annotation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'background_color': '',
            'box_shadow': '',
            'opacity': '.4'
        }
    }

    hover() {
        this.setState({'background_color': 'white', 
                       'box_shadow': '0 6px 8px rgba(102,119,136,.03), 0 1px 2px rgba(102,119,136,.3)', 
                       'opacity': '1'})
    }

    unhover() {
        this.setState({ 'background_color': '',
                        'box_shadow': '',
                        'opacity': '.4'})
    }

    /*
    onMouseEnter = {this.props.scalePane} 
                onMouseLeave = {this.props.unhoverBoth}
    */
    render() {
        return (
            <Annotation_Card 
                background_color = {this.state.background_color}
                box_shadow = {this.state.box_shadow}
                opacity = {this.state.opacity}
                
            >
                <Note>
                    {this.props.annotation}
                </Note>
            </Annotation_Card>
        );
    }
}

export default Annotation;

//Styled Components

const Annotation_Card = styled.div`
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
    width: 32rem;
    font-size: 1.6rem;
    line-height: 1.8;
    letter-spacing: 0.2px;
    padding: 1.6rem 2rem;
    border-radius: 0.2rem;
    /* font-family: 'Source Sans Pro', sans-serif; */
    opacity: .4;
    cursor: text;
    transition: opacity .1s ease;
    margin-bottom: 1rem;
    background-color: ${props => props.background_color};
    box-shadow: ${props => props.box_shadow};
    opacity: ${props => props.opacity};
`

const Note = styled.p`
    margin-bottom: 0px !important;
`