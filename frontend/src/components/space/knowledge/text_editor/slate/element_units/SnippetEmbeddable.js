import React, { useEffect, useState } from 'react';

//slate
import { Transforms } from 'slate';
import { useSlate, ReactEditor } from 'slate-react';

//redux
import { connect } from 'react-redux';

//actions
import { getSnippet } from '../../../../../../actions/Snippet_Actions';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//loader
import { Oval } from 'svg-loaders-react';
import { AiOutlineExclamation } from 'react-icons/ai';
import { RiCloseFill, RiCheckFill, RiFileFill } from 'react-icons/ri';

//router
import { withRouter, Link } from 'react-router-dom';

//prism

//prism
import Prism from 'prismjs';

import 'prismjs/components/prism-python';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-haskell';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-scala';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-lua';
import 'prismjs/components/prism-objectivec';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-perl';
import 'prismjs/components/prism-dart';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-matlab';
import 'prismjs/components/prism-r';
import 'prismjs/components/prism-bash';
import { BiLink } from 'react-icons/bi';
import { editReference } from '../../../../../../actions/Reference_Actions';

Prism.languages.python = Prism.languages.extend('python', {});
Prism.languages.php = Prism.languages.extend('php', {});
Prism.languages.sql = Prism.languages.extend('sql', {});
Prism.languages.java = Prism.languages.extend('java', {});
Prism.languages.javascript = Prism.languages.extend('javascript', {});
Prism.languages.c = Prism.languages.extend('c', {});
Prism.languages.cpp = Prism.languages.extend('cpp', {});
Prism.languages.csharp = Prism.languages.extend('csharp', {});
Prism.languages.haskell = Prism.languages.extend('haskell', {});
Prism.languages.ruby = Prism.languages.extend('ruby', {});
Prism.languages.scala = Prism.languages.extend('scala', {});
Prism.languages.swift = Prism.languages.extend('swift', {});
Prism.languages.typescript = Prism.languages.extend('typescript', {});
Prism.languages.lua = Prism.languages.extend('lua', {});
Prism.languages.objectivec = Prism.languages.extend('objectivec', {});
Prism.languages.go = Prism.languages.extend('go', {});
Prism.languages.perl = Prism.languages.extend('perl', {});
Prism.languages.dart = Prism.languages.extend('dart', {});
Prism.languages.kotlin = Prism.languages.extend('kotlin', {});
Prism.languages.rust = Prism.languages.extend('rust', {});
Prism.languages.matlab = Prism.languages.extend('matlab', {});
Prism.languages.r = Prism.languages.extend('r', {});
Prism.languages.bash = Prism.languages.extend('bash', {});

const SnippetEmbeddable = props => {
    
    const { attributes, children, element, getSnippet, snippet, match } = props;
    const { snippetId } = element;

    const [ embeddableJSX, setEmbeddableJSX ] = useState(null);
    const [ isSelected, setIsSelected ] = useState(false);

    const editor = useSlate();

    useEffect(() => {
        const { workspaceId, documentId } = match.params;

        if (!snippet) {
            const asyncGetSnippet = async () => {
                await getSnippet({workspaceId, snippetId});
            }
            
            asyncGetSnippet();
        }

        if (snippet && snippet.reference) renderSnippet();

    }, [snippet]);

    /*
    useEffect(() => {
        return () => { 
            if (isSelected) {
                window.removeEventListener("keydown", handleKeyDown) 
            }
        }
    }, [isSelected])
    */

    //this shits prob slowing it
    useEffect(() => {
        if (editor.selection) {
            const elementPath =  ReactEditor.findPath(editor, element);
            const elementLocation = elementPath[0];

            if (ReactEditor.isFocused(editor) && elementLocation === editor.selection.anchor.path[0]) {
                if (!isSelected) {
                    setIsSelected(true);
                }
            } else if (isSelected) {
                setIsSelected(false);
            }
        } else {
            if (isSelected) setIsSelected(false);
        }
    }, [editor.selection])

    const renderStatus = (status) => {
        status = status.toLowerCase();
        const statusAttributes = status === "valid" 
            ? { color: "#19e5be", icon: <StatusIcon><RiCheckFill/></StatusIcon>, text: "Valid"}
            : status === "resolve"
            ? { color: "#6762df", icon: <StatusIcon><AiOutlineExclamation/></StatusIcon>, text: "Resolve"}
            : status === "invalid"
            ? { color: "#ff4757", icon: <StatusIcon><RiCloseFill/></StatusIcon>, text: "Invalid"}
            : null;
        
        if (statusAttributes) {
            const { color, icon, text } = statusAttributes;
            return (
                <Status color = {color}>
                    {text}
                </Status>
            );
        }
    }

    const renderLines = (code, extension) => {
        const fileContents = code.join('\n');

        const grammar = Prism.languages[extension];

        // maps the token types to relevant color and text-type
        const identifiers = {
            'keyword':{color: '#D73A49', type: ''},
            'boolean': {color: '#56B6C2', type: ''},
            'function': {color: '#6F42C1', type: ''},
            'class-name': {color: '#E36208', type: ''},
            'string': {color: '#032F62', type: ''},
            'triple-quoted-string': {color: '#032F62', type: ''},
            'number': {color: '#FF8563', type: ''},
            'decorator': {color: '#6F42C1',type: ''},
            'builtin': {color:'#6F42C1', type: ''},
            'comment': {color: '#5C6370', type: 'italic'},
            'operator': {color: "#005DC5", type: ''}
        }
        
        // tokenize
        const tokens = Prism.tokenize(fileContents, grammar);

        // push new line at end so last line is pushed always
        tokens.push("\n");

        // holds all the lines of JSX
        let allLinesJSX = [];
        // holds the current line of JSX
        let currLineJSX = [];
        
        //token may be more than one line
        tokens.forEach((token, j) => {
            // acquire the content of the token
            let content = getContent(token);
            // split the content of the token by new line
            let splitContent = content.split("\n");

            // for each line in the tokens content...
            splitContent.forEach((contentToken, i) => {
                // if token is not a string token and the type belongs in obj above
                // create a colored span with the content and color it appropriately
                if (typeof token !== "string" && token.type in identifiers) {
                    currLineJSX.push(
                        <ColoredSpan 
                            type =  {identifiers[token.type].type} 
                            color = {identifiers[token.type].color}
                        >
                            {contentToken}
                        </ColoredSpan>);
                } else {
                    // otherwise just push the content (unhighlighted)
                    currLineJSX.push(contentToken);
                }

                // we only want to push a line once its completed... aka don't push the last
                // because we haven't seen a new line yet //FARAZ TODO: TEST CASES WITH TOKEN END AND STRING END
                // however, there's an edge case for the last line so push when the last token (a forced newline added earlier) is iterated over
                if (i !== splitContent.length - 1 || j === tokens.length) {
                    allLinesJSX.push(currLineJSX);
                    currLineJSX = [];
                }
            });
        })
        
        return allLinesJSX
    }

    // get the string content of each prism token
    const getContent = (token) => {
        if (typeof token === 'string') {
            return token
        } else if (typeof token.content === 'string') {
            return token.content
        } else {
            return token.content.map(getContent).join('')
        }
    }

    const extractExtension = (miniExt) => {
        switch (miniExt) {
            case "py":
                return "python"
            case "js":
                return "javascript"
            case "java":
                return "java"
            case "php":
                return "php"
            case "c":
                return "c"
            case "cpp":
                return "cpp"
            case "cs":
                return "csharp"
            case "hs":
                return "haskell"
            case "rb":
                return "ruby"
            case "rs":
                return "rust"
            case "sc":
                return "scala"
            case "scala":
                return "scala"
            case "swift":
                return "swift"
            case "ts":
                return "typescript"
            case "lua":
                return "lua"
            case "h":
                return "objectivec"
            case "m":
                return "objectivec"
            case "go":
                return "go"
            case "pl":
                return "perl"
            case "dart":
                return "dart"
            case "kt":
                return "kotlin"
            case "sh":
                return "bash"
            default:
                return "python"
        }
    }


    const renderSnippet = () => {
        const { workspaceId } = match.params;
        const { reference, status, code, start, repository } = snippet;
        const { name, _id } = reference;

        const extension = extractExtension(name.split('.').slice(-1)[0]);
        const allLinesJSX = renderLines(code, extension);
        
        const codeLinesJSX =  allLinesJSX.map((line, i) => {
            return (
                <Wrapper>
                    <LineNumber>{i + start + 1}</LineNumber>
                    <CodeLine>
                        {line}
                    </CodeLine>
                </Wrapper>
            )
        });

        const url = `/workspaces/${workspaceId}/repository/${reference.repository}/code/${_id}?line=${start}`;
        const linkJSX = <ReferenceLink to = {url}>Source</ReferenceLink>


        setEmbeddableJSX(
            <>
                <ReferenceHeader>
                    <RiFileFill style = {{width: "2.5rem", fontSize: "1.3rem"}}/>
                    {name}
                    {renderStatus(status)}
                    {linkJSX}
                </ReferenceHeader>
                <SnippetBody>
                    {codeLinesJSX}
                </SnippetBody>
            </>
        );
    }

    const renderLoader = () => {
        return (
            <LoaderContainer>
                <Oval stroke="#d9d9e2"/>
            </LoaderContainer>
        );
    }
    
    
    const handleClick = (e) => {
        e.preventDefault();
        /*
        if (!isSelected) {
            const path = ReactEditor.findPath(editor, element);
            Transforms.setNodes(
                editor,
                { isSelected: true },
                { at: path }
            );
        }*/
    }

    return (
        <Container isSelected = {isSelected} onClick = {handleClick} contentEditable={false} {...attributes}>
            { (embeddableJSX) ? embeddableJSX : renderLoader()}
            { children }
        </Container>
    );
}


const mapStateToProps = (state, ownProps) => {
    const { element: { snippetId } } = ownProps;
    const { snippets } = state;
    const foundSnippet = snippets[snippetId];
    console.log("SNIPPETID", snippetId);
    console.log("SNIPPETS", snippets);
    console.log("ACTUAL SNIPPET",  foundSnippet);
    return {
        snippet: foundSnippet
    }
}

export default withRouter(connect(mapStateToProps, { getSnippet })(SnippetEmbeddable));

const ReferenceLink = styled(Link)`
    &:hover {
        opacity: 1
    }
    margin-left: 2rem;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    color: #172A4E;
    opacity: 0.4;
    text-transform: uppercase;
    text-decoration: none;
    margin-top: 0.1rem;
`

const Container = styled.div`
    border: 1px solid ${props => props.isSelected ? chroma('#6762df').alpha(0.5) : 'none'};
    margin-top: 2.5rem;
    background-color: #F7F9FB;
    tab-size: 4;
    cursor: pointer;
    padding-top: 0.6rem;
`

const LoaderContainer = styled.div`
    height: 30rem;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`

const ReferenceHeader = styled.div`
    display: flex;
    align-items: center;
    font-weight: 500;
    font-size: 1.55rem;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
    height: 4rem;
    padding: 0rem 2.5rem;
    padding-left: 1.5rem;
    border-top-left-radius: 0.4rem;
    border-top-right-radius: 0.4rem;
`

const Status = styled.div`
    display: inline-flex;
    background-color: ${props => chroma(props.color).alpha(0.13)};
    color: ${props => props.color};
    border: 1px solid ${props => props.color};
    font-weight: 500;
    border-radius: 0.3rem;
    font-size: 1.2rem;
    padding: 0rem 1rem;
    padding-top: 0.1rem;
    justify-content: center;
    align-items: center;
    margin-left: auto;
    width: 7rem;
    height: 2.5rem;
    text-transform: uppercase;
`

const SnippetBody = styled.div`
    font-family: 'Roboto Mono', monospace !important;
    font-size: 1.35rem;
    color: #242A2E;
    padding: 1.5rem 2.5rem;
    padding-left: 0.5rem;
    padding-top: 0.5rem;
   /* width: ${props => props.width}px;*/
   /* overflow-x: scroll;*/
    overflow-x: auto;
    width: calc(100vw - 6rem - 25rem - 20rem);
    max-width: 74rem;
    white-space: nowrap;
`

const Wrapper = styled.div`
    display: flex;
`

const CodeLine = styled.div`
    white-space: pre !important;
    padding: 0.1rem !important;
    margin-left: 1.6rem;
`

const LineNumber = styled.div`
    min-width: 3rem;
    max-width: 3rem;
    font-size: 1.2rem;
    opacity: 0.5;
    margin-top: 0.2rem;
    text-align: right;
`

const StatusIcon = styled.div`
    margin-right: 0.3rem;
    font-size: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
`

const ColoredSpan = styled.div`
    color : ${props => props.color};
    font-style: ${props => props.type};
    display: inline-block;
`
/*
<UrlInput
            url={url}
            onChange={val => {
              const path = ReactEditor.findPath(editor, element)
              Transforms.setNodes(editor, { url: val }, { at: path })
            }}
          />*/