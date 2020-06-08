import React from 'react';
import ReactDOM from 'react-dom';


//styles
import styled, { keyframes } from "styled-components"
import SyntaxHighlighter from 'react-syntax-highlighter';

//components
import Annotation from './Annotation';
import Snippet from './Snippet';
import TextareaAutosize from 'react-textarea-autosize';

//utility
import Selection from '@simonwep/selection-js';
import _ from 'lodash';

//actions
import {retrieveSnippets, createSnippet} from '../../actions/Snippet_Actions'
import { repoGetFile } from '../../actions/Repo_Actions';

//misc
import { connect } from 'react-redux';


//implement on scroll



//markers for multiple documentation
class CodeView extends React.Component {
    constructor(props) {
        super(props);


        this.state = {
            'snips': [
                {code: ['from typing import Iterator, List, Dict'], annotation: `The only parameter our DatasetReader needs is a dict of TokenIndexers that specify how to convert tokens into indices. By default we'll just generate a single index for each token (which we'll call "tokens") that's just a unique id for each distinct token. (This is just the standard "word to index" mapping you'd use in most NLP tasks.)`},
                {code: ['import torch', 'import torch.optim as optim', 'import numpy as np'], annotation: 'We included an accuracy metric that gets updated each forward pass. That means we need to override a get_metrics method that pulls the data out of it. Behind the scenes, the CategoricalAccuracy metric is storing the number of predictions and the number of correct predictions, updating those counts during each call to forward. Each call to get_metric returns the calculated accuracy and (optionally) resets the counts, which is what allows us to track accuracy anew for each epoch.'}   
            ],
            'scaleY': 0,
            'ref': null,
            'els': [],
            'selected': {},
            'new_snippet_top': '',
            'cannot_select': false
        }

        this.add_scaleY = 0
        this.pulling = false
        this.need_retrieve = false

    }

    componentDidMount() {
        this.createSelection()
        this.props.retrieveSnippets({location: window.location.pathname.slice(9)})
        this.getFileContents()

       
    }

    getFileContents() {
        let download_link = "https://raw.githubusercontent.com" + window.location.pathname.slice(9)
        let file_name = window.location.pathname.slice(9).split('/').pop()
        this.props.repoGetFile({download_link, file_name});
    }

    componentDidUpdate(){
        console.log(window.screenTop)
        console.log(window.scrollY)
        /*
        if (this.need_retrieve = true) {
            this.need_retrieve = false
            this.props.retrieveSnippets({location: window.location.pathname.slice(9)})
        }
        */
        if (this.pulling == true) {
            this.pulling = false
            this.updateScaleY()
        }
    }

    // want
    updateScaleY() {
        const item1 = this.refs["new_anno"].getBoundingClientRect().top //anno
        const item2 = this.state.selected[this.state.new_snippet_top].getBoundingClientRect().top
        const curr_scale = this.state.scaleY
        const new_scale = curr_scale + (item2 - item1)
        this.setState({scaleY: new_scale})
    }

    createSelection() {
        Selection.create({

			// Class for the selection-area
			class: 'selection',
		
			// All elements in this container can be selected
			selectables: ['.codeline'],
		
			// The container is also the boundary in this case
			boundaries: ['.codetext']
		}).on('start', ({inst, selected, oe}) => {
            //console.log("Selection start");
            if (!(this.state.cannot_select)) {
                this.setState({selected: {}})
                for (const el of selected) {
                    el.classList.remove('selected_code');
                    inst.removeFromSelection(el);
                }

                inst.clearSelection();
                /*
                
                // Remove class if the user isn't pressing the control key or ⌘ key
                if (!oe.ctrlKey && !oe.metaKey) {
            
                    // Unselect all elements
                    for (const el of selected) {
                        el.classList.remove('selected');
                        inst.removeFromSelection(el);
                    }
            
                    // Clear previous selection
                    inst.clearSelection();
                }
                */
            }
            
		
		}).on('move', ({changed: {removed, added}}) => {
			//console.log("Selection move");
            // Add a custom class to the elements that where selected.
            if (!(this.state.cannot_select)) {
                let selected = this.state.selected

                for (const el of added) {
                    //console.log(el.getBoundingClientRect().top)
                    selected[el.id] = el
                    el.classList.add('selected_code');
                }
            
                
                
                // Remove the class from elements that where removed
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
            if (!(this.state.cannot_select)) {
                inst.keepSelection();
            }
            //console.log("Selection stop");
            
			// Remember selection in case the user wants to add smth in the next one
			
		});
    }


    renderSnippets() {
        
        
        const lines = this.props.file_contents.split("\n");
        //this.state.snippets, dictionary --keys with start line
        
        

        let snippets_jsx = []
        let annotations_jsx = []
        /*
        this.state.snips.map((snip, i) => {
            const anno_ref = 'annotation' + i
            const snippet_ref = 'snippet' + i
            const annotation  =  <Annotation 
                                  key = {anno_ref} 
                                  ref={anno_ref} 
                                  annotation = {snip.annotation}
                                  scalePane = {() => this.scalePane(snippet_ref, anno_ref)} 
                                  unhoverBoth = {() => this.unhoverBoth(snippet_ref, anno_ref)} 
                                  />
            const snippet =   <Snippet 
                                key = {snippet_ref} 
                                ref={snippet_ref} 
                                code_lines = {snip.code}
                                scalePane = {() => this.scalePane(snippet_ref, anno_ref)} 
                                unhoverBoth = {() => this.unhoverBoth(snippet_ref, anno_ref)} 
                                />                    
            snippets.push(snippet)
            annotations.push(annotation)
        })    
        */
        
        
        let i = 0
        //console.log(this.props.snippets)
        let arrs_i = []
        while (i < lines.length) {
            arrs_i.push(i)
            if (this.props.snippets && i in this.props.snippets) {
                let snip = this.props.snippets[i]
                const anno_ref = 'annotation' + i
                const snippet_ref = 'snippet' + i
                const annotation  =  <Annotation 
                                    key = {anno_ref} 
                                    ref={anno_ref} 
                                    annotation = {snip.annotation}
                                    scalePane = {() => this.scalePane(snippet_ref, anno_ref)} 
                                    unhoverBoth = {() => this.unhoverBoth(snippet_ref, anno_ref)} 
                                    />
                const snippet =   <Snippet 
                                    key = {snippet_ref} 
                                    ref={snippet_ref} 
                                    code_lines = {snip.code}
                                    scalePane = {() => this.scalePane(snippet_ref, anno_ref)} 
                                    unhoverBoth = {() => this.unhoverBoth(snippet_ref, anno_ref)}
                                    />
                snippets_jsx.push(snippet)
                annotations_jsx.push(annotation)
                i += this.props.snippets[i].code.length - 1
            } else {
                if (this.state.new_snippet_top === `line_code-${i}`) {

                    //set scaleY -- offset of new annotation input - top element in new snippet 
                    const annotation_creation = (<Annotation_Card_Input
                                                    key = {'new_anno'} 
                                                    ref={'new_anno'} 
                                                >
                                                    <StyledTextareaAutosize 
                                                        autoFocus
                                                        minRows = {6}
                                                        placeholder="Add an annotation..."
                                                        key = {'new_anno_textarea'} 
                                                        ref={'new_anno_textarea'} 
                                                        />
                                                    <ButtonHolder>
                                                        <CreateAnnotation onClick = {() => {this.createAnnotationF()}}>Create</CreateAnnotation>
                                                        <CancelAnnotation onClick = {() => {this.resetAnnotationCreation()}}>Cancel</CancelAnnotation>
                                                    </ButtonHolder>
                                                </Annotation_Card_Input>)
                    annotations_jsx.push(annotation_creation)
                }
                //createSnippet must handle all state reset, acquire beginning/end line data
                //snippet content, etc and send them over to the action
                let input_line = lines[i]
                if (input_line === ''){
                    input_line = '    '
                }
                let code_snip = (<Wrapper id = {`line_code-${i}`} className = {'codeline'}>
                                <CodeLine  language='python' style='vs'>
                                    {input_line}
                                </CodeLine>
                            </Wrapper>)
                snippets_jsx.push(code_snip)
            }
            i += 1
        }
        console.log(arrs_i)
        
        /*
        let line_codes = ['import numpy as np', 
                        'train_dataset = reader.read(cached_path)',
                        'iterator.index_with(vocab)'
                        ]
        */
                        //{snippets.map(snippet => {return snippet })}
        //let el_refs = []
        
        //let line_jsx = []
        //let line_i = 0
        /*
        while (line_i < line_codes.length) {
            
            if (`line_code${line_i}` in this.state.selected) {
                let poss_snippet_lines = []
                let temp = line_i
                while (line_i - temp < Object.keys(this.state.selected).length) {
                    poss_snippet_lines.push(
                        <CodeLine 
                            id = {`line_code${line_i}`}
                            className = {'codeline'}>
                            {line_codes[line_i]}
                        </CodeLine>
                    )
                    line_i += 1
                }
                let poss_snippet = <Snippet_Wrapper>
                                    {poss_snippet_lines.map(poss_snip => {return poss_snip})}
                                   </Snippet_Wrapper>
                line_jsx.push(poss_snippet)
            } else {
                line_jsx.push(
                    <CodeLine 
                        id = {`line_code${line_i}`}
                        className = {'codeline'}>
                        {line_codes[line_i]}
                    </CodeLine>
                )
                line_i += 1
                }
        }
        */
/*
       {line_codes.map((line_code, line_i) => {
        return (<CodeLine 
                id = {`line_code${line_i}`}
                className = {'codeline'}>
                {line_codes[line_i]}
                </CodeLine>)
    })}
    
    */  

   /*
   if (!(this.state.new_snippet_top === '')) {
            console.log("ENTERED ANNOTATION")
            const annotation_creation = (<Annotation_Card_Input
                key = {'new_anno'} 
                ref={'new_anno'} 
            >
                <StyledTextareaAutosize 
                    autoFocus
                    minRows = {6}
                    placeholder="Add an annotation..."
                    
                    />
                <ButtonHolder>
                    <CreateAnnotation>Create</CreateAnnotation>
                    <CancelAnnotation onClick = {() => {this.resetAnnotationCreation()}}>Cancel</CancelAnnotation>
                </ButtonHolder>
            </Annotation_Card_Input>)
            annotations.push(annotation_creation)
        }
    */
        

        
        
        /*
         {line_codes.map((line_code, line_i) => {
                            return (
                                <Wrapper id = {`line_code${line_i}`} className = {'codeline'}>
                                <CodeLine 
                                    
                                    >
                                    {line_codes[line_i]}
                                    </CodeLine>
                                    </Wrapper>)
                            })}*/

        const all_code = <CodeText className = {'codetext'}>
                            {snippets_jsx.map(snippet => {return snippet })}
                         </CodeText>
        
        const all_anno = <Overflow_Wrapper><AnnotationBar scaleY = {this.state.scaleY} >{annotations_jsx.map(annotation => {return annotation })}</AnnotationBar></Overflow_Wrapper>

        return (<>
                {all_code} 
                {all_anno}
                {this.renderSnippetAddition()}
                </>)
    }

    resetAnnotationCreation() {
        this.deselectItems();
        this.setState({
            'scaleY': 0,
            'selected': {},
            'new_snippet_top': '',
            'cannot_select': false
        });
    }

    createAnnotationF() {
        
        let start_line = parseInt(this.state.new_snippet_top.split('-').pop())
        let length = _.keys(this.state.selected).length
        let code = this.props.file_contents.split("\n").slice(start_line, start_line + length)
        let annotation = this.refs['new_anno_textarea'].value
        let location = window.location.pathname.slice(9)
        
        this.deselectItems()


        this.props.createSnippet({start_line, code, annotation, location}).then(() => {
            this.props.retrieveSnippets({location: window.location.pathname.slice(9)})
            this.setState({
                'selected': {},
                'new_snippet_top': '',
                'cannot_select': false
            });
        })
        //start and end line number, text in array format of all lines, annotation
        
    }

    deselectItems() {
        for (const el of _.values(this.state.selected)) {
            el.classList.remove('selected_code');
        }
    }

    renderFewChanges(elem_key) {
        
        this.pulling = true;
        this.setState({'new_snippet_top': elem_key, 'cannot_select': true});
    }

    renderSnippetAddition() {
        if (!_.isEmpty(this.state.selected) && this.state.new_snippet_top === ''){
            let elem_key = _.findKey(this.state.selected)
            
            let elem = this.state.selected[elem_key]
            let offset = elem.getBoundingClientRect().top - 25 + window.scrollY
            //let prev_offset = this.add_scaleY
            //let change = prev_offset - offset
            //this.add_scaleY = offset
            //let key_frame = translationBuilder(offset - 80)
            //
            
            return  <AddButton  onClick = {() =>  {this.renderFewChanges(elem_key)}}
                factor = {offset}  >
                        <ion-icon style={{'margin-top': "0.9rem"}} name="add-outline"></ion-icon>
                    </AddButton>
        }
    }

    /*
    translationBuilder(offset) {
        console.log("ENTERED")
        console.log(offset)
        const translation= keyframes`
            0% {
            transform: translateY(-20px);
            }
           
            100% {
            transform: translateY(${offset}px);
            }
        `;
        return translation;
    }
*/

    scalePane(snippet_ref, anno_ref) {
        if (this.state.new_snippet_top === '') {
            const snippet = this.refs[snippet_ref]
            const annotation = this.refs[anno_ref] 
            const offset_snip = ReactDOM.findDOMNode(snippet).getBoundingClientRect().top
            const offset_anno = ReactDOM.findDOMNode(annotation).getBoundingClientRect().top
            const offset_difference = offset_anno - offset_snip
            const curr_scale = this.state.scaleY
            const new_scale = curr_scale - offset_difference
            this.setState({scaleY: new_scale})
            snippet.hover()
            annotation.hover()
        }
    }

    unhoverBoth(snippet_ref, anno_ref) {
        const snippet = this.refs[snippet_ref]
        const annotation = this.refs[anno_ref] 
        snippet.unhover()
        annotation.unhover()

    }

    

    render() {
        if (this.props.file_contents) {
            return (
                <>
                    <Container>
                        {this.renderSnippets()}
                        
                    </Container>
                </>
                
            );
        } else {
            return (
                <>
                <Container>
                    {this.renderSnippets()}
                 </Container>
                </>
            );
        }
    }
}


const mapStateToProps = (state) => {
    console.log('STATE.REPOS.PATH_CONTENTS: ', state.repos.path_contents)
    if (typeof state.repos.file_contents == 'undefined' || state.repos.file_contents == null){
        return {
            file_contents: ''
        }
    }
    return {
        file_contents: state.repos.file_contents,
        file_name: state.repos.file_name,
        file_path: state.repos.repo_current_path + '/' + state.repos.file_name,
        snippets: state.snippets
    }
}

export default connect(mapStateToProps, {retrieveSnippets, createSnippet, repoGetFile})(CodeView);



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
    box_shadow: 0 0 60px rgba(0, 0, 0, 0.08) !important;
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

/*

transform: ${props => `translateY(${props.factor}px)`};
    animation-name: moveInBottom;
    animation-duration: 1s;
    animation-timing-function: ease-out;

    @keyframes moveInBottom {
        0% {
          opacity: 0;
          transform: translateY(-10rem); }
        100% {
          opacity: 1;
          transform: translateY(${props => props.factor}px); } }
    
          */

/*
animation: ${props => props.key_frame} 1s cubic-bezier(0, 0.475, 0.01, 1.035);
*/


//transition: transform 0.5s cubic-bezier(0, 0.475, 0.01, 1.035);

const fadeIn = keyframes`
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
`


const Annotation_Card_Input = styled.div`
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