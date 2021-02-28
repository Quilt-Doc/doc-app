import React, {useMemo} from 'react';

//styles
import styled from 'styled-components';

//slate
import { Node } from 'slate';
import { ReactEditor, useSlate, useReadOnly } from 'slate-react';

const CodeLine = (props) => {
    const { children, attributes, element } = props;

    const editor = useSlate();
    const readOnly = useReadOnly()
    const path = ReactEditor.findPath(editor, element);

    

    const lineNumber = useMemo(() => {
        if (path) return path[path.length - 1] + 1;
    }, [path])

    const childrenLength = Node.parent(editor, path).children.length;

    const lineNumberString = useMemo(() => {
        const lengthStr = `${childrenLength}`.length;
        const lengthLine = `${lineNumber}`.length

        let additional = "";
        let diff = lengthStr - lengthLine;
        while (diff > 0) {
            additional += "0"
            diff -= 1;
        }

        return <><Invis>{additional}</Invis>{lineNumber}</>

    }, [lineNumber, childrenLength]);
    
    return (
        <Container {...attributes}>
            <LineNumber  contentEditable={false}  top = {lineNumber === 1} bottom = {lineNumber === childrenLength}>{lineNumberString}</LineNumber>
            <CodeLineContainer 
                top = {lineNumber === 1}
                bottom = {lineNumber === childrenLength}
                contentEditable={!readOnly}
                suppressContentEditableWarning
            >
                {children}
            </CodeLineContainer>
        </Container>
    )
    
    
}

export default CodeLine

const Invis = styled.span`
    opacity: 0;
`

const LineNumber = styled.div`
    background-color: #EFF3F7;
    padding: 0.11rem 1rem;
    padding-top: ${props => props.top ? "0.7" : "0.11"}rem !important;
    padding-bottom: ${props => props.bottom ? "0.7" : "0.11"}rem !important;
    border-top-left-radius: ${props => props.top ? "0.4" : "0"}rem;
    border-bottom-left-radius: ${props => props.bottom ? "0.4" : "0"}rem;
    margin-right: 1.2rem;
    color: #656A6E;
    -webkit-user-select: none; /* Safari */        
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
    user-select: none;
    font-size: 1.4rem;
    position: sticky;
    left: 0;
    font-weight: 500;
    z-index: 1;
`

const Container = styled.div`
    display: flex;
    align-items: center;
    font-family: 'Roboto Mono', monospace !important;
    font-size: 1.35rem;
    color: #242A2E;
`

const CodeLineContainer = styled.div`
    /*
	font-family: 'Roboto Mono', monospace !important;
    font-size: 1.4rem;
    */
    /*padding: 0.1rem !important;*/
    /*boxShadow: 0 0 60px rgba(0, 0, 0, 0.08) !important;*/
    padding-top: ${props => props.top ? "0.7" : "0"}rem !important;
    padding-bottom: ${props => props.bottom ? "0.7" : "0"}rem !important;
    white-space: pre !important;
    width: 100%;
    position: relative;
`
