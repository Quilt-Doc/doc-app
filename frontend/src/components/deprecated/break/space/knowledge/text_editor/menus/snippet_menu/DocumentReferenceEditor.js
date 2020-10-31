import React, { Component } from 'react';

//slate
import { Node, Transforms } from 'slate'

//actions
import { getRepositoryFile } from '../../../../../../actions/Repository_Actions';
import { createSnippet } from '../../../../../../actions/Snippet_Actions';

//styles
import styled from 'styled-components';

//router
import { withRouter } from 'react-router-dom';

//components
import { CSSTransition } from 'react-transition-group';

//loader
import { Oval } from 'svg-loaders-react';

//react-redux
import { connect } from 'react-redux';

//utility
import Selection from '@simonwep/selection-js';

//prism
import Prism from 'prismjs';

import 'prismjs/components/prism-python';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import { RiAddLine, RiScissorsLine } from 'react-icons/ri';

Prism.languages.python = Prism.languages.extend('python', {})
Prism.languages.javascript = Prism.languages.extend('javascript', {})

class DocumentReferenceEditor extends Component {

    constructor(props){
        super(props);

        this.state = {
            fileContents: null,
            allLinesJSX: null,
            loaded: false
        }

        this.selectionIdentifier = 'selected-code';
    }

    componentDidMount = async () => {
        const { match, openedReference, getRepositoryFile, documents } = this.props;

        const { workspaceId, documentId }  = match.params;

        const currentDocument = documents[documentId];

        const repositoryId = currentDocument.repository._id;
        const referenceId = openedReference._id;

        // fileContents is returned by getRepositoryFile
        const fileContents = await getRepositoryFile({ workspaceId, repositoryId, referenceId });

        // iterate through the lines and syntax highlight
        const allLinesJSX = this.renderLines(fileContents);

        // create selection object for selecting lines and creating snippets
        this.selection = this.createSelection();
       
        // saves all relevant data to local state
        this.setState({fileContents, allLinesJSX, loaded: true});
    }

     // creates the selection object that allows for selecting/creating snippets
     createSelection = () => {
        const selection = new Selection({
            // Class for the selection-area
            class: 'selection',
            // All elements in this container can be selected
            selectables: ['.codeline'],
            // The container is also the boundary in this case
            boundaries: ['.codetext'],

        });

        const selectionIdentifier = this.selectionIdentifier;

        selection.on('start', ({inst, selected, oe, changed}) => {
            // clear the selection before starting a new selection
            
            selected.map(item => item.classList.remove(selectionIdentifier));
            inst.clearSelection();
            //if (!this.state.selectionStart) this.setState({selectionStart: true});
        }).on('move', ({inst, changed: {removed, added}}) => {
           
           
            // on selection change, modify the added/removed appropriately
            /*
            this.selectedItems.map(item => {
                if (removed.includes(item)){
                    console.log("BRUBUA");
                }
            })*/
            //this.selectedItems = [...this.selectedItems, ...added];
            //this.selectedItems = this.selectedItems.filter(item => removed.includes(item));
            removed.map(item => item.classList.remove(selectionIdentifier));
            added.map(item => item.classList.add(selectionIdentifier));

            //inst.keepSelection(); 
        }).on('stop', ({inst}) => {
            inst.keepSelection();
            // The last event can be used to call functions like keepSelection() in case the user wants
            // to select multiple elements.
        });

        return selection;
    }
   

    renderLines = (fileContents) => {

        const grammar = Prism.languages["javascript"];

        // maps the token types to relevant color and text-type
        const identifiers = {
            'keyword':{color: '#D73A49', type: ''},
            'boolean': {color: '#56B6C2', type: ''},
            'function': {color: '#6F42C1', type: ''},
            'class-name': {color: '#DC4A68', type: ''},
            'string': {color: '#032F62', type: ''},
            'triple-quoted-string': {color: '#032F62', type: ''},
            'number': {color: '#FF8563', type: ''},
            'decorator': {color: '#6F42C1',type: ''},
            'builtin': {color:'#6F42C1', type: ''},
            'comment': {color: '#5C6370', type: 'italic'}
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
            let content = this.getContent(token);
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
    getContent = (token) => {
        if (typeof token === 'string') {
            return token
        } else if (typeof token.content === 'string') {
            return token.content
        } else {
            return token.content.map(this.getContent).join('')
        }
    }

    wrapLine = (lineJSX, i) => {

        if (lineJSX.length === 1) {
            if (lineJSX[0] === "") lineJSX = "     ";
        }

        return ( 
            <WrapContainer>
                <Linenumber>{i + 1}</Linenumber>
                <Wrapper 
                    id = {`codeline-${i}`}
                    className = {'codeline'}
                >
                    <CodeLine>
                        {lineJSX}
                    </CodeLine>
                </Wrapper>
            </WrapContainer>
        )
    }

    /*
    deselectLines = () => {
        let selectedLines = this.selection.getSelection()
        selectedLines.map(line => line.classList.remove(this.selectionIdentifier));
        this.selection.clearSelection();
        //this.selection.clearSelection();
    }*/

    createSnippet = async (e) => {
        e.preventDefault();

        const { fileContents } = this.state;
        const { createSnippet, undoModal, match, openedReference, user, editor, range } = this.props;
        const { documentId, workspaceId } = match.params;

        let selectedLines = this.selection.getSelection();
        if (selectedLines.length === 0) return alert("No lines were selected..");
        
        let start = null;
        selectedLines.map(line => {
                let num = parseInt(line.id.split('-')[1]);
                if (start == null || num < start) start = num;
            }
        );

        let length = selectedLines.length;

        // extract the code associated with the selection 
        let code = fileContents.split("\n").slice(start, start + length);

        // create the snippet
        const snippet = await createSnippet({
            start, 
            code,  
            repositoryId: openedReference.repository._id,
            workspaceId, 
            referenceId: openedReference._id, 
            documentId,
            status: "VALID", 
            creatorId: user._id 
        }, true);
        console.log("SELECTION", editor.selection);

        //editor.insertBlock()
        Transforms.select(editor, range);
        editor.insertBlock({type: "reference-snippet", snippetId: snippet._id});

        undoModal();

    }
    
    renderToolbar = () => {
        const { openedReference: { name }} = this.props;
        return (
            <Toolbar>
                <ReferenceName>{name}</ReferenceName>
                <EmbedButton onMouseDown = {this.createSnippet}>
                    <RiScissorsLine style = {{marginRight: "1rem"}} />
                    <EmbedText>Embed Snippet</EmbedText>
                </EmbedButton>
            </Toolbar>
        )
    }

    renderCode = () => {
        const { allLinesJSX } = this.state;
        
        let codeJSX = [];

        // iterates over syntax highlighted code
        allLinesJSX.forEach((lineJSX, i) => {
            lineJSX = this.wrapLine(lineJSX, i);
            codeJSX.push(lineJSX);
        });

        return(
            <>
                {this.renderToolbar()}
                <CodeText 
                    id = {'codeholder'} 
                    className = {'codetext marker-mode'}
                    onMouseDown = {(e) => e.preventDefault()}
                > 
                    {codeJSX} 
                </CodeText>
            </>
        )
    }

    renderLoader = () => {
        return (
            <LoaderContainer>
                <Oval stroke={ '#E0E4E7' }/>
            </LoaderContainer>
        )
    }

    render(){
        const { loaded } = this.state;
        const { undoModal } = this.props;
        return (
            <ModalBackground 
                onMouseDown = {(e) => e.preventDefault()}
                onClick = {(e) => {e.preventDefault(); undoModal()}}>
                < CSSTransition
                    in={true}
                    appear = {true}
                    timeout={300}
                    classNames="modal"
                >   
                    <ModalContent 
                        onMouseDown = {(e) => e.preventDefault()}
                        onClick = {(e) => { e.stopPropagation(); }}>
                        { loaded ? this.renderCode() : this.renderLoader() }
                    </ModalContent>
                </CSSTransition>
            </ModalBackground>
        )
    }
}

const mapStateToProps = (state) => {
    const { documents, auth: {user} } = state;

    return {
        documents,
        user
    }
}
export default withRouter(connect(mapStateToProps, { getRepositoryFile, createSnippet })(DocumentReferenceEditor));


//Styled Components
const Toolbar = styled.div`
    align-items: center;
    background-color:#2e313e;
    color: white;
    border-radius: 0.3rem 0.3rem 0rem 0rem !important;
    font-size: 1.5rem;
    height: 5rem;
    display: flex;
    font-weight: 500;
    align-items: center;
    padding: 0rem 2rem;
    position: sticky; 
    top: 0;
    z-index:2;
`

const ReferenceName = styled.div`
    font-size: 1.6rem;
    font-weight: 500;
`

const EmbedButton = styled.div`
    margin-left: auto;
    height: 3.5rem;
    padding: 0rem 1.5rem;
    font-size: 1.8rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    display: flex;
    align-items: center;
    background-color: #383d4c;
    color: white;
    &:hover {
        border: 1px solid #6762df;
    }
`

const EmbedText = styled.div`
    font-size: 1.4rem;
    font-weight: 500;
`

const ModalBackground = styled.div`
    position: fixed; /* Stay in place */
    z-index: 10000; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: hidden; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
    display: ${props => props.display};
    overflow-y: scroll;
`

const ModalContent = styled.div`
    background-color: white;
    margin: 6vh auto; /* 15% from the top and centered */
    width: 83vw; /* Could be more or less, depending on screen size */
    border-radius: 0.3rem;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 95rem;
    padding-bottom: 3rem;
`

const Linenumber = styled.div`
    width: 3rem;
    font-size: 1.2rem;
    opacity: 0.5;
    margin-top: 0.2rem;
    text-align: right;
`

const WrapContainer = styled.div`
    display: flex;
    position: relative;
`

const CodeLine = styled.div`
    color: #242A2E;
	font-size: 1.3rem;
    margin: 0;
    padding: 0.1rem !important;
    /*background-color: inherit !important;*/
    padding-left: 1.6rem !important;
    white-space: pre-wrap !important;
`

const CodeText = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    padding: 1.5rem;
    padding-right: 3rem;
    font-family: 'Roboto Mono', monospace !important;
`

const Wrapper = styled.div`
    border-left: 2px solid #ffffff;
    background-color: #ffffff;
    position: relative;
    z-index: 0;
    width: 100%;
    margin-left: 1rem;
`

const ColoredSpan = styled.span`
    color : ${props => props.color};
    font-style: ${props => props.type};
`

const LoaderContainer = styled.div`
    height: 20rem;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`