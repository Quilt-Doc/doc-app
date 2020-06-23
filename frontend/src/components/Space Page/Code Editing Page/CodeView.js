import React from 'react';
import ReactDOM from 'react-dom';


//styles
import styled, { keyframes } from "styled-components"
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
//components
import Annotation from './Annotation';
import Snippet from './Snippet';
import TextareaAutosize from 'react-textarea-autosize';

//utility
import Selection from '@simonwep/selection-js';
import _ from 'lodash';

//actions
import {retrieveSnippets, createSnippet} from '../../../actions/Snippet_Actions'
import { getRepositoryFile } from '../../../actions/Repository_Actions';

//misc
import { connect } from 'react-redux';
import { xonokai, pojoaque } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { hopscotch } from 'react-syntax-highlighter/dist/esm/styles/prism';


//implement on scroll

// IMPORTANT BUG TO FIX -- need to filter the selected items to find the smallest line number, cannot assume


//markers for multiple documentation
class CodeView extends React.Component {
    constructor(props) {
        super(props);


        this.state = {
            //refers to the annotation panes translation in the Y direction (depends on snippet selection)
            'scaleY': 0,

            //refers to selected elements - key is element id, value is element ref
            'selected': {},

            //id pointing to snippet ref that is selected for creation
            'newSnippetId': '',

            //variable to control selection during creation of annotation
            'cannotSelect': false
        }

        // variable to determine whether annotation scale
        this.pullAnnotationUp = false
    }


    componentDidMount() {
        // framework for selecting lines of code in viewer
        this.createSelection()

        // retrieve snippets using url path 
        this.props.retrieveSnippets({location: window.location.pathname.slice(20)})

        // get contents of code file from database
        this.getFileContents()
    }

    // using url path, extract download link... use download link to get file contents from database
    getFileContents() {
        console.log(window.location.pathname.slice(20));
        // .slice(1) because starts with a slash
        
        var pathInRepo = window.location.pathname.slice(20).split('/').slice(1);
        var repositoryId = pathInRepo.shift();
        console.log('repository Id: ', repositoryId);
        let fileName = window.location.pathname.slice(20).split('/').pop();
        this.props.getRepositoryFile({repositoryId, fileName, pathInRepo: pathInRepo.join('/')});
    }

    // translate annotation pane manually if a new snippet is being created 
    componentDidUpdate(){
        if (this.pullAnnotationUp == true) {
            this.pullAnnotationUp = false
            this.updateScaleY()
        }
    }

    // translate annotation pane manually if a new snippet is being created 
    updateScaleY() {
        const item1 = this.refs["newAnnotation"].getBoundingClientRect().top //anno
        const item2 = this.state.selected[this.state.newSnippetId].getBoundingClientRect().top
        const currScale = this.state.scaleY
        const newScale = currScale + (item2 - item1)
        this.setState({scaleY: newScale})
    }

    // selection framework
    createSelection() {
        Selection.create({

			// Class for the selection-area
			class: 'selection',
		
			// All elements in this container can be selected
			selectables: ['.codeline'],
		
			// The container is also the boundary in this case
			boundaries: ['.codetext']
		}).on('start', ({inst, selected, oe}) => {
            if (!(this.state.cannotSelect)) {
                this.setState({selected: {}})
                for (const el of selected) {
                    el.classList.remove('selected_code');
                    inst.removeFromSelection(el);
                }
                inst.clearSelection();
            }
		}).on('move', ({changed: {removed, added}}) => {
            // Add a custom class to the elements that where selected.
            if (!(this.state.cannotSelect)) {
                let selected = this.state.selected
                for (const el of added) {
                    selected[el.id] = el
                    el.classList.add('selected_code');
                }
            
                // Remove the class from elements that were removed
                // since the last selection
                for (const el of removed) {
                    if (el.id in selected) {
                        delete selected[el.id]
                    }
                    el.classList.remove('selected_code');
                }
                
                this.setState({selected})
            }
		}).on('stop', ({inst}) => {
            if (!(this.state.cannotSelect)) {
                inst.keepSelection();
            }
		});
    }


    // render the snippets that are in the database
    renderSnippets() {
        // extract the lines from fileContents
        const lines = this.props.fileContents.split("\n");

        // jsx that will be rendered, store these in an array to render them appropriately later
        let snippetJSX = []
        let annotationJSX = []

        let i = 0

        // iterate over lines, if the line points to a snippet -- create an annotation and snippet,
        // then skip iteration index to the end of the snippet
        while (i < lines.length) {
            if (this.props.snippets && i in this.props.snippets/* && 1 == 2*/) {
                const annotationRef = 'annotation' + i
                const snippetRef = 'snippet' + i
                const annotation  =  <Annotation 
                                    key = {annotationRef} 
                                    ref={annotationRef} 
                                    annotation = {this.props.snippets[i].annotation}
                                    scalePane = {() => this.scalePane(snippetRef, annotationRef)} 
                                    unhoverBoth = {() => this.unhoverBoth(snippetRef, annotationRef)} 
                                    />
                const snippet =   <Snippet 
                                    key = {snippetRef} 
                                    ref={snippetRef} 
                                    codelines = {this.props.snippets[i].code}
                                    scalePane = {() => this.scalePane(snippetRef, annotationRef)} 
                                    unhoverBoth = {() => this.unhoverBoth(snippetRef, annotationRef)}
                                    />
                snippetJSX.push(snippet)
                annotationJSX.push(annotation)
                i += this.props.snippets[i].code.length - 1
            } else {
                // if we are in selection mode, find the line that corresponds to the top of the snippet
                // that will be created
                if (this.state.newSnippetId === `linecode-${i}`) {

                    //create annotation input if code lines are selected and annotation creation is requested
                    const annotation_creation = (<AnnotationCardInput
                                                    key = {'newAnnotation'} 
                                                    ref={'newAnnotation'} 
                                                >
                                                    <StyledTextareaAutosize 
                                                        autoFocus
                                                        minRows = {6}
                                                        placeholder="Add an annotation..."
                                                        key = {'newAnnotationTextarea'} 
                                                        ref={'newAnnotationTextarea'} 
                                                        />
                                                    <ButtonHolder>
                                                        <CreateAnnotation onClick = {() => {this.createAnnotationFunction()}}>Create</CreateAnnotation>
                                                        <CancelAnnotation onClick = {() => {this.resetAnnotationCreation()}}>Cancel</CancelAnnotation>
                                                    </ButtonHolder>
                                                </AnnotationCardInput>)
                    annotationJSX.push(annotation_creation)
                }

                // if the input is a space break, insert space to render a line
                let inputLine = lines[i]
                if (inputLine === ''){
                    inputLine = '    '
                }

                // render lines that are not snippets, note the id is used to differentiate during selection
                let codeline = (<Wrapper id = {`linecode-${i}`} className = {'codeline'}>
                                    <CodeLine  language='python' style="vs">
                                        {inputLine}
                                    </CodeLine>
                                </Wrapper>)
                snippetJSX.push(codeline)
            }
            i += 1
        }

        // all code related objects packaged into one variable
        const allCode = <CodeText className = {'codetext'}>
                            {snippetJSX.map(snippet => {return snippet })}
                         </CodeText>
        
         // all annotation related objects packaged into one variable
        const allAnno = <Overflow_Wrapper><AnnotationBar scaleY = {this.state.scaleY} >{annotationJSX.map(annotation => {return annotation })}</AnnotationBar></Overflow_Wrapper>

        return (<>
                {allCode} 
                {allAnno}
                {this.renderSnippetAdditionButton()}
                </>)
    }


    // reset state to before create annotation mode
    resetAnnotationCreation() {
        this.deselectItems();
        this.setState({
            'scaleY': 0,
            'selected': {},
            'newSnippetId': '',
            'cannotSelect': false
        });
    }

    // function to create a snippet-annotation pair when the create button is clicked 
    createAnnotationFunction() {

        //acquire the startline from the id, find all lines from startline to endline
        let startLine = parseInt(this.state.newSnippetId.split('-').pop())
        let length = _.keys(this.state.selected).length
        let code = this.props.fileContents.split("\n").slice(startLine, startLine + length)
        let annotation = this.refs['newAnnotationTextarea'].value
        let location = window.location.pathname.slice(20)
        this.deselectItems()

        //createSnippet must handle all state reset, acquire beginning/end line data
        //snippet content, etc and send them over to the action

        this.props.createSnippet({startLine, code, annotation, location}).then(() => {
            this.props.retrieveSnippets({location: window.location.pathname.slice(20)})
            this.setState({
                'selected': {},
                'newSnippetId': '',
                'cannotSelect': false
            });
        })
        //start and end line number, text in array format of all lines, annotation
        
    }

    // remove css class showing that an element is selected on screen
    deselectItems() {
        for (const el of _.values(this.state.selected)) {
            el.classList.remove('selected_code');
        }
    }

    // make changes to selection process, pull annotation pane, set id of new snippet 
    renderSelectionChanges(elem_key) {
        this.pullAnnotationUp = true;
        this.setState({'newSnippetId': elem_key, 'cannotSelect': true});
    }


    findSmallestLinecode() {
        let smallestLinecode = null
        let smallestIdentifier = null
        for (let linecode in this.state.selected) {
            if (this.state.selected.hasOwnProperty(linecode)) {

                let identifier = parseInt(linecode.split('-').pop())
                if (smallestIdentifier === null || identifier < smallestIdentifier) {
                    smallestIdentifier = identifier
                    smallestLinecode = linecode
                }
            }
        }
        return smallestLinecode
    }

    // to render the add snippet button when needed
    // need to change to deal with scrolling --- BUG
    renderSnippetAdditionButton() {
        if (!_.isEmpty(this.state.selected) && this.state.newSnippetId === ''){
            let elem_key = this.findSmallestLinecode()
            let elem = this.state.selected[elem_key]
            //console.log(elem.scrollTop)
            let offset = elem.getBoundingClientRect().top - 25 + window.scrollY
            return  <AddButton  onClick = {() =>  {this.renderSelectionChanges(elem_key)}}
                factor = {offset}  >
                        <ion-icon style={{'margin-top': "0.9rem"}} name="add-outline"></ion-icon>
                    </AddButton>
        }
    }

    
    //function to translate annotation pane
    scalePane(snippetRef, annotationRef) {
        if (this.state.newSnippetId === '') {
            const snippet = this.refs[snippetRef]
            const annotation = this.refs[annotationRef] 
            const offset_snip = ReactDOM.findDOMNode(snippet).getBoundingClientRect().top
            const offset_anno = ReactDOM.findDOMNode(annotation).getBoundingClientRect().top
            const offset_difference = offset_anno - offset_snip
            const currScale = this.state.scaleY
            const newScale = currScale - offset_difference
            this.setState({scaleY: newScale})
            snippet.hover()
            annotation.hover()
        }
    }

    // a helper function to render css changes on both the snippet and annotation when they 
    // are hovered no longer 
    unhoverBoth(snippetRef, annotationRef) {
        const snippet = this.refs[snippetRef]
        const annotation = this.refs[annotationRef] 
        snippet.unhover()
        annotation.unhover()
    }

    // render function
    render() {
        if (this.props.fileContents) {
            return (
                <>
                    <Container>
                        {this.renderSnippets()}
                    </Container>
                </>
                
            );
        } else {
            return null;
        }
    }
}


// relevant data here is fileContents, which are the lines of data
const mapStateToProps = (state) => {
    if (typeof state.repositories.fileContents == 'undefined' || state.repositories.fileContents == null){
        return {
            fileContents: ''
        }
    }
    return {
        repositories: state.repositories,
        fileContents: state.repositories.fileContents,
        fileName: state.repositories.fileName,
        filePath: state.repositories.repositoryCurrentPath + '/' + state.repositories.fileName,
        snippets: state.snippets
    }
}

export default connect(mapStateToProps, {retrieveSnippets, createSnippet, getRepositoryFile})(CodeView);



//Styled Components

const Container = styled.div`
    margin: 0 auto;
    margin-top: 5rem;
    width: 120rem;
    background-color: #F7F9FB;
    display: flex;
    box-shadow: 0 0 4px 1px rgba(0,0,0,.05), 2px 2px 2px 1px rgba(0,0,0,.05) !important;
    border-radius: 0.4rem !important;
    margin-bottom: 5rem;
`

const Overflow_Wrapper = styled.div`
    overflow:hidden;
    padding-bottom: 10rem;
`

const CodeText = styled.div`
    width: 80rem;
    padding: 1.5rem;
    border-right: 1px solid #ECECEF;
    display: flex;
    flex-direction: column;
    font-family: 'Roboto Mono', monospace !important;
    padding-bottom: 10rem;
    
`

const AnnotationBar = styled.div`
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 40rem;
    
    transition: transform 0.5s cubic-bezier(0, 0.475, 0.01, 1.035);
    transform: ${props => `translateY(${props.scaleY}px)`};
`

const CodeLine = styled(SyntaxHighlighter)`
    font-size: 1.35rem;
    margin: 0;
    padding: 0.1rem !important;
    background-color: inherit !important;
    padding-left: 1.6rem !important;
    boxShadow: 0 0 60px rgba(0, 0, 0, 0.08) !important;
    cursor: grab;
    white-space: pre-wrap !important;
`


const Wrapper = styled.div`
   
`

const AddButton = styled.div`
    background-color: white;
    border-radius: 50%;
    box-shadow: 0 3px 6px 0 rgba(0,0,0,.1), 0 1px 3px 0 rgba(0,0,0,.08);
    height: 4rem;
    width: 4rem;
    position: absolute;
    z-index: 10;
    font-size: 2rem;
    margin-left: 78rem;
    text-align: center;
    color: #19E5BE;
    border: 1.5px solid #19E5BE;
    top: ${props => props.factor}px !important;
    animation-name: moveInBottom;
    animation-duration: 0.5s;
    animation-timing-function: ease-out;

    @keyframes moveInBottom {
        0% {
          opacity: 0;
          transform: translateY(-10px); }
        100% {
          opacity: 1;
          transform: translate(0); } }
    cursor: pointer;

    &:hover {
        background-color:#F7F9FB;
    }
`   

const AnnotationCardInput = styled.div`
    width: 32rem;
    padding: 1.6rem 2rem;
    border-radius: 0.1rem;
    background-color: white;
    box-shadow: 0 6px 8px rgba(102,119,136,.03), 0 1px 2px rgba(102,119,136,.3);
    text-align: center;
`

const StyledTextareaAutosize = styled(TextareaAutosize)`
    display: inline-block;
    margin-top: 1rem;
    width: 28rem;
    padding: 1rem;
    resize: none;
    border: none;
    line-height: 1.8;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
    font-size: 1.6rem;
    letter-spacing: 0.2px;

    &::placeholder {
        opacity: 0.5; 
    }

    &:focus {
        outline: none !important;
        border: none;
    }
`

const ButtonHolder = styled.div`
    display: flex;
`
const CreateAnnotation = styled.div`
    margin-top: 0.5rem;
    width: 8.5rem;
    padding: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-radius: 0.4rem;
    color: #19E5BE;
    border: 1px solid #19E5BE;
    &:hover {
        color: white;
        background-color: #19E5BE;
    }
    cursor: pointer;
`

const CancelAnnotation = styled.div`
    margin-top: 0.5rem;
    margin-left: 1rem;
    width: 8.5rem;
    padding: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    border-radius: 0.4rem;
    color: #f53b57;
    border: 1px solid #f53b57;
    &:hover {
        color: white;
        background-color: #f53b57;
    }
    cursor: pointer;
`