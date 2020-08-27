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
                       'opacity': '1',
                       'active': true
                        })
    }

    unhover() {
        this.setState({ 'backgroundColor': '',
                        'boxShadow': '',
                        'opacity': '.4',
                        active: false
                        })
    }

    render() {
        let snippet = this.props.snippet;
        return (
            <AnnotationCard 
                backgroundColor = {this.state.backgroundColor}
                boxShadow = {this.state.boxShadow}
                opacity = {this.state.opacity}
                active = {this.state.active}
                onClick= {() => {
                    this.props.focusSnippet()
                }}
                
            >
                <Header><Block>FS</Block> {`Lines ${snippet.start} - ${snippet.start + snippet.code.length - 1}`}
                    {this.state.active && <IconBorder></IconBorder>}
                </Header>
                <Note>
                    {this.props.annotation}
                </Note>
            </AnnotationCard>
        );
    }
}

export default Annotation;

//Styled Components
const IconBorder = styled.div`
    height: 3rem;
    width: 3rem;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
`

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
    font-weight: 400;
    background-color: ${props => props.backgroundColor};
    box-shadow: ${props => props.boxShadow};
    opacity: ${props => props.opacity};
    word-wrap: break-word;
    cursor: pointer;
    border-top: ${props => props.active ? "0.25rem solid #70EAE1" : "0.25rem solid transparent"};
`

const Header = styled.div`
    margin-bottom: 1rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    height: 2rem;
    font-size: 1.3rem;
`

const Note = styled.p`
    margin-bottom: 0px !important;
`

const Block = styled.div`
    background-color: #5A75E6;
    color: white;
    height: 2rem;
    width: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    border-radius: 0.2rem;
    margin-right: 1rem;
`