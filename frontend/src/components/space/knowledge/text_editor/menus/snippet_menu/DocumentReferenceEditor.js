import React, { Component } from 'react';

//actions
import { getRepositoryFile } from '../../../../../../actions/Repository_Actions';

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

//prism
import Prism from 'prismjs';

import 'prismjs/components/prism-python';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import { RiAddLine } from 'react-icons/ri';

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
        //this.selection = this.createSelection();
       
        // saves all relevant data to local state
        this.setState({fileContents, allLinesJSX, loaded: true});
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
    
    renderToolbar = () => {
        const { openedReference: { name }} = this.props;
        return (
            <Toolbar>
                <ReferenceName>{name}</ReferenceName>
                <EmbedButton>
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
            <ModalBackground onClick = {() => {undoModal()}}>
                <CSSTransition
                    in={true}
                    appear = {true}
                    timeout={300}
                    classNames="modal"
                >   
                    <ModalContent onClick = {(e) => {e.stopPropagation()}}>
                        { loaded ? this.renderCode() : this.renderLoader() }
                    </ModalContent>
                </CSSTransition>
            </ModalBackground>
        )
    }
}

const mapStateToProps = (state) => {
    const { documents } = state;

    return {
        documents
    }
}
export default withRouter(connect(mapStateToProps, { getRepositoryFile })(DocumentReferenceEditor));


//Styled Components
const Toolbar = styled.div`
    align-items: center;
    background-color: white;
    border-radius: 0.4rem 0.4rem 0rem 0rem !important;
    font-size: 1.5rem;
    height: 5rem;
    display: flex;
    font-weight: 500;
    align-items: center;
    border-bottom: 1px solid #EDEFF1;
    padding: 0rem 2rem;
    position: sticky; 
    top: 0;
    z-index:2;
`

const ReferenceName = styled.div`
    font-size: 1.6rem;
    color: #172A4E;
    font-weight: 500;
`

const EmbedButton = styled.div`
    margin-left: auto;
    height: 3.5rem;
    padding: 0rem 1.5rem;
    font-size: 1.8rem;
    border-radius: 0.5rem;
    border: 1px solid #E0E4E7;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    display: flex;
    align-items: center;
`

const EmbedText = styled.div`
    font-size: 1.5rem;
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
    background-color: inherit !important;
    padding-left: 1.6rem !important;
    white-space: pre-wrap !important;
`

const CodeText = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
    padding: 1.5rem;
    font-family: 'Roboto Mono', monospace !important;
`

const Wrapper = styled.div`
    border-left: 2px solid #ffffff;
    background-color: #ffffff;
    position: relative;
    z-index: 0;
    width: 100%;
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