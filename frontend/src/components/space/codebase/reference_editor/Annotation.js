import React from 'react';
import PropTypes from 'prop-types';

//styles 
import styled from "styled-components"
import chroma from 'chroma-js';

const Annotation = ({ snippet, activateSnippet, active }) => {
    // need to set css depending on if active
    const { start, annotation, code } = snippet;
    return (
        <AnnotationCard 
            active = {active}
            onClick= {() => activateSnippet()}   
        >
            <Header><Creator>F</Creator> 
                <Length>{`Lines ${start + 1} - ${start + code.length}`}</Length>
            </Header>
            <Note>
                {annotation}
            </Note>
        </AnnotationCard>
    );
}

Annotation.propTypes = {
    snippet : PropTypes.object.isRequired,
    activateSnippet : PropTypes.func.isRequired,
    active : PropTypes.bool,
    annotation : PropTypes.string.isRequired
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
    border-radius: 0.5rem;
    /* font-family: 'Source Sans Pro', sans-serif; */
    opacity: .4;
    cursor: text;
    transition: opacity .1s ease-in;
    margin-bottom: 1.5rem;
    font-weight: 400;
    background-color: ${props => props.active ? 'white' : ''};
    box-shadow: ${props => props.active ? 
        '0 6px 8px rgba(102,119,136,.03), 0 1px 2px rgba(102,119,136,.3)' : ''};
    opacity: ${props => props.active ? 1 : 0.4};
    word-wrap: break-word;
    cursor: pointer;
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


const Creator = styled.div`
    height: 2.5rem;
    width: 2.5rem;
    background-color: ${chroma('#1e90ff').alpha(0.2)};
    color:#1e90ff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    border-radius: 0.3rem;
    font-weight: 500;
`

const Length = styled.div`
    margin-left: auto;
`