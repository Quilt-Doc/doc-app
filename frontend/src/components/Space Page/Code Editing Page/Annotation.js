import React from 'react';

//styles 
import styled from "styled-components"

class Annotation extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            'backgroundColor': '',
            'boxShadow': '',
            'opacity': '.4'
        }
    }

    hover() {
        this.setState({'backgroundColor': 'white', 
                       'boxShadow': '0 6px 8px rgba(102,119,136,.03), 0 1px 2px rgba(102,119,136,.3)', 
                       'opacity': '1'})
    }

    unhover() {
        this.setState({ 'backgroundColor': '',
                        'boxShadow': '',
                        'opacity': '.4'})
    }


    render() {
        return (
            <AnnotationCard 
                backgroundColor = {this.state.backgroundColor}
                boxShadow = {this.state.boxShadow}
                opacity = {this.state.opacity}
            >
                <Note>
                    {this.props.annotation}
                </Note>
            </AnnotationCard>
        );
    }
}

export default Annotation;

//Styled Components

const AnnotationCard = styled.div`
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
    width: 31rem;
    font-size: 1.4rem;
    line-height: 1.8;
    letter-spacing: 0.2px;
    padding: 1.6rem 2rem;
    border-radius: 0.2rem;
    /* font-family: 'Source Sans Pro', sans-serif; */
    opacity: .4;
    cursor: text;
    transition: opacity .1s ease;
    margin-bottom: 1rem;
    background-color: ${props => props.backgroundColor};
    box-shadow: ${props => props.boxShadow};
    opacity: ${props => props.opacity};
`

const Note = styled.p`
    margin-bottom: 0px !important;
`