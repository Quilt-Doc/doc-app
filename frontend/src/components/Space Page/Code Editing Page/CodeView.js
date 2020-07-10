import React from 'react';
import ReactDOM from 'react-dom';


//styles
import styled, { keyframes } from "styled-components"
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';

//components
import Annotation from './Annotation';
import Snippet from './Snippet';
import TextareaAutosize from 'react-textarea-autosize';

//utility
import Selection from '@simonwep/selection-js';
import _ from 'lodash';

//actions
import {retrieveSnippets, createSnippet, editSnippet, deleteSnippet} from '../../../actions/Snippet_Actions'
import { getContents, retrieveCodeReferences } from '../../../actions/Reference_Actions';
import { getRepositoryFile } from '../../../actions/Repository_Actions';
import { retrieveCallbacks } from '../../../actions/Semantic_Actions';

//router
import { withRouter } from 'react-router-dom';

//misc
import { connect } from 'react-redux';

//prism
import Prism from 'prismjs'
// eslint-disable-next-line
Prism.languages.python={comment:{pattern:/(^|[^\\])#.*/,lookbehind:!0},"string-interpolation":{pattern:/(?:f|rf|fr)(?:("""|''')[\s\S]*?\1|("|')(?:\\.|(?!\2)[^\\\r\n])*\2)/i,greedy:!0,inside:{interpolation:{pattern:/((?:^|[^{])(?:{{)*){(?!{)(?:[^{}]|{(?!{)(?:[^{}]|{(?!{)(?:[^{}])+})+})+}/,lookbehind:!0,inside:{"format-spec":{pattern:/(:)[^:(){}]+(?=}$)/,lookbehind:!0},"conversion-option":{pattern:/![sra](?=[:}]$)/,alias:"punctuation"},rest:null}},string:/[\s\S]+/}},"triple-quoted-string":{pattern:/(?:[rub]|rb|br)?("""|''')[\s\S]*?\1/i,greedy:!0,alias:"string"},string:{pattern:/(?:[rub]|rb|br)?("|')(?:\\.|(?!\1)[^\\\r\n])*\1/i,greedy:!0},function:{pattern:/((?:^|\s)def[ \t]+)[a-zA-Z_]\w*(?=\s*\()/g,lookbehind:!0},"class-name":{pattern:/(\bclass\s+)\w+/i,lookbehind:!0},decorator:{pattern:/(^\s*)@\w+(?:\.\w+)*/im,lookbehind:!0,alias:["annotation","punctuation"],inside:{punctuation:/\./}},keyword:/\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|print|raise|return|try|while|with|yield)\b/,builtin:/\b(?:__import__|abs|all|any|apply|ascii|basestring|bin|bool|buffer|bytearray|bytes|callable|chr|classmethod|cmp|coerce|compile|complex|delattr|dict|dir|divmod|enumerate|eval|execfile|file|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|intern|isinstance|issubclass|iter|len|list|locals|long|map|max|memoryview|min|next|object|oct|open|ord|pow|property|range|raw_input|reduce|reload|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|unichr|unicode|vars|xrange|zip)\b/,boolean:/\b(?:True|False|None)\b/,number:/(?:\b(?=\d)|\B(?=\.))(?:0[bo])?(?:(?:\d|0x[\da-f])[\da-f]*\.?\d*|\.\d+)(?:e[+-]?\d+)?j?\b/i,operator:/[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]/,punctuation:/[{}[\];(),.:]/},Prism.languages.python["string-interpolation"].inside.interpolation.inside.rest=Prism.languages.python,Prism.languages.py=Prism.languages.python;



//implement on scroll



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
            'cannotSelect': false,

            'allLinesJSX': [],

            'selectionMode': false,

            'reselectingSnippet': null
        }

        // variable to determine whether annotation scale
        this.pullAnnotationUp = false
    }


    componentDidMount() {
        // framework for selecting lines of code in viewer
        this.createSelection();

        // retrieve snippets using url path 
        //this.props.retrieveSnippets({location: window.location.pathname.slice(20)})

        
        // get contents of code file from database
        let { referenceID }  = this.props.match.params;

        this.props.getContents({referenceID}).then((fileContents) => {
            this.setState({fileContents});
            this.props.retrieveCodeReferences({ referenceID }).then(() => {
                const allLinesJSX = this.renderLines(fileContents);
                this.setState({allLinesJSX});
            });
        });

        //this.props.retrieveCodeReferences({ referenceID })

        //this.getFileContents()

        // get callback references -- temporary
        
        /*
        this.props.retrieveCallbacks().then(() =>{
            console.log("CALLBACKS", this.props.callbacks)
        })*/
       
    }


    // using url path, extract download link... use download link to get file contents from database
    getFileContents() {
        //console.log(window.location.pathname.slice(20));
        // .slice(1) because starts with a slash
        
        var pathInRepo = window.location.pathname.slice(20).split('/').slice(1);
        var repositoryId = pathInRepo.shift();
        //console.log('repository Id: ', repositoryId);
        let fileName = window.location.pathname.slice(20).split('/').pop();
        //console.log('filename:', fileName)
        this.props.getRepositoryFile({repositoryId, fileName, pathInRepo: pathInRepo.join('/')}).then(() => {
            this.props.retrieveCallbacks({repositoryId, fileName, pathInRepo: pathInRepo.join('/')}).then(() => {
                const allLinesJSX = this.colorLines()
                this.setState({allLinesJSX})
            })
        })
        
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
            if ((!(this.state.cannotSelect) && this.state.selectionMode) ||
                this.state.reselectingSnippet) {
                let addedClass = 'selected_code'
                console.log(addedClass)
                this.setState({selected: {}})
                for (const el of selected) {
                    el.classList.remove(addedClass);
                    inst.removeFromSelection(el);
                }
                inst.clearSelection();
            }
		}).on('move', ({changed: {removed, added}}) => {
            // Add a custom class to the elements that where selected.
            if ((!(this.state.cannotSelect) && this.state.selectionMode) ||
                this.state.reselectingSnippet) {
                
                let addedClass = 'selected_code'
                console.log("ADDED CLASS", addedClass)
                let selected = this.state.selected
                for (const el of added) {
                    selected[el.id] = el
                    el.classList.add(addedClass);
                }
            
                // Remove the class from elements that were removed
                // since the last selection
                for (const el of removed) {
                    if (el.id in selected) {
                        delete selected[el.id]
                    }
                    el.classList.remove(addedClass);
                }
                
                this.setState({selected})
            }
		}).on('stop', ({inst}) => {
            if ((!(this.state.cannotSelect) && this.state.selectionMode) ||
            this.state.reselectingSnippet) {
                inst.keepSelection();
            }
		});
    }

    renderCallbacks(line, callbacks, offset, lineNumber, currLineJSX) {
        console.log("ITEM", callbacks.slice(-1)[0]);
        const { position, name } =  callbacks.slice(-1)[0];
        let symbol = name;
        const { start, end } = position;

        if (lineNumber === start.line && start.column >= offset && start.column < offset + line.length) {
            let last = end.line === lineNumber ? start.column - offset - 1 + symbol.length : line.length

            currLineJSX.push(<>{line.slice(0, start.column - offset - 1)}</>)
            currLineJSX.push(<ColoredSpan 
                                color = {'#61AEEE'}>
                                {line.slice(start.column - offset - 1, last)}
                             </ColoredSpan>)
            currLineJSX.push(<>{line.slice(last)}</>)
            callbacks.pop()
        } else {
            currLineJSX.push(<>{line}</>)
        }
    } 

    toggleSelection = () => {

        if (this.state.selectionMode) {
            this.deselectItems();
            this.setState({
                'scaleY': 0,
                'selected': {},
                'newSnippetId': '',
                'cannotSelect': false,
                'selectionMode': false
            });
        } else {
            this.deselectItems();
            this.setState({
                'scaleY': 0,
                'selected': {},
                'newSnippetId': '',
                'cannotSelect': false,
                'selectionMode': true,
                'reselectingSnippet': null
            })
        }
    }
    
    renderLines(fileContents) {
        const grammar = Prism.languages["python"]
        const identifiers = {
            'keyword':{color: '#C679DD', type: ''},
            'boolean': {color: '#56B6C2', type: ''},
            'function': {color: '#61AEEE', type: ''},
            'class-name': {color: '#E6C07A', type: ''},
            'string': {color: '#98C379', type: ''},
            'triple-quoted-string': {color: '#98C379', type: ''},
            'number': {color: '#D19966', type: ''},
            'decorator': {color: '#61AEEE',type: ''},
            'builtin': {color:'#61AEEE', type: ''},
            'comment': {color: '#5C6370', type: 'italic'}
        }
        const tokens = Prism.tokenize(fileContents, grammar)
        
        let allLinesJSX = []
        let currLineJSX = [] 

        let callbacks = this.props.references.filter(ref => 
            {return ref.parseProvider === 'semantic'}).map(ref => {ref.position = 
                JSON.parse(ref.position); return ref}).sort((a, b) => {
                    a = a.position.start;
                    b = b.position.start;
                    if (a.line > b.line) {
                        return -1
                    } else if (a.line < b.line) {
                        return 1
                    } else if (a.column > b.column) {
                        return -1
                    } else {
                        return 1
                    }
                })
        
    
        /*[...this.props.callbacks].reverse()*/
        let lineNumber = 1
        let offset = 0
        
        tokens.forEach(token => {
            let content = this.getContent(token)
            let splitContent = content.split("\n")
            if (typeof token !== "string" && token.type in identifiers) {
                for (let i = 0; i < splitContent.length - 1; i++){
                    if (splitContent[i] !== '') {
                        if (false){//callbacks.length > 0) {
                            this.renderCallbacks(splitContent[i], callbacks, offset, lineNumber, currLineJSX)   
                        } else {
                            currLineJSX.push(<ColoredSpan 
                                                type =  {identifiers[token.type].type} 
                                                color = {identifiers[token.type].color}>
                                                {splitContent[i]}
                                            </ColoredSpan>)
                        }
                    }
                    
                    if (currLineJSX.length > 0) {
                        //console.log("PUSHED")
                        allLinesJSX.push(currLineJSX)
                    } else {
                        allLinesJSX.push([<>{"\n"}</>])
                    }

                    offset = 0
                    lineNumber += 1
                    currLineJSX = []   
                }
                //console.log("SPLIT CONTENT", splitContent.slice(-1)[0])
                if (splitContent.slice(-1)[0] !== '') {
                    currLineJSX.push(<ColoredSpan 
                                        type =  {identifiers[token.type].type} 
                                        color = {identifiers[token.type].color}>
                                        {splitContent.slice(-1)[0]}
                                    </ColoredSpan>)
                }
                offset += splitContent.slice(-1)[0].length
                
                if (callbacks.length > 0 && 
                    (lineNumber > callbacks.slice(-1)[0].position.end.line || 
                    (lineNumber === callbacks.slice(-1)[0].position.end.line && offset + 1 > callbacks.slice(-1)[0].position.start.column))) {
                    callbacks.pop()
                }
            } else {
                for (let i = 0; i < splitContent.length - 1; i++){
                    if (splitContent[i] !== '') {
                        if (callbacks.length > 0) {
                            this.renderCallbacks(splitContent[i], callbacks, offset, lineNumber, currLineJSX)   
                        } else {
                            currLineJSX.push(<>{splitContent[i]}</>)
                        }
                    }

                    if (currLineJSX.length > 0) {
                        allLinesJSX.push(currLineJSX)
                    } else {
                        allLinesJSX.push([<>{"\n"}</>])
                    }
                    
                    offset = 0
                    lineNumber += 1
                    currLineJSX = []
                    
                    // MAY BE DEPRECATED
                    if (callbacks.length > 0 && lineNumber > callbacks.slice(-1)[0].position.end.line) {
                        callbacks.pop()
                    }
                }
                //console.log("SPLIT CONTENT", splitContent.slice(-1)[0])
                if (splitContent.slice(-1)[0] !== '') {
                    if (callbacks.length > 0) {
                        this.renderCallbacks(splitContent.slice(-1)[0], callbacks, offset, lineNumber, currLineJSX)
                    } else {
                        currLineJSX.push(<>{splitContent.slice(-1)[0]}</>)
                    }
                }
                offset += splitContent.slice(-1)[0].length
            }
        })


        if (currLineJSX.length !== 0) {
            allLinesJSX.push(currLineJSX)
        }

        return allLinesJSX
    }


    getContent = (token) => {
        if (typeof token === 'string') {
            return token
        } else if (typeof token.content === 'string') {
            return token.content
        } else {
            return token.content.map(this.getContent).join('')
        }
    }

    reselectSnippet(startLine) {
        this.setState({reselectingSnippet: startLine})
    }

    deleteSnippet(index) {
        this.props.deleteSnippet(this.props.snippets[index]._id).then(() => {
            this.props.retrieveSnippets({location: window.location.pathname.slice(20)})
        })
    }
    // render the snippets that are in the database
    renderSnippets() {
        // extract the lines from fileContents
        //const lines = this.state.fileContents.split("\n");
        const lines = this.state.allLinesJSX;
        // jsx that will be rendered, store these in an array to render them appropriately later
        let snippetJSX = []
        let annotationJSX = []

        let i = 0

        // iterate over lines, if the line points to a snippet -- create an annotation and snippet,
        // then skip iteration index to the end of the snippet
        let deprecatedSeen = false;
        while (i < lines.length) {
            if (this.props.snippets 
                && i in this.props.snippets 
                && (this.state.reselectingSnippet !== i || this.props.snippets[i].status === "INVALID")
                && !deprecatedSeen ) {
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
                                    status = {this.props.snippets[i].status}
                                    key = {snippetRef} 
                                    ref={snippetRef} 
                                    index = {i}
                                    codeViewState = {this.state}
                                    reselectSnippet = {(index) => this.reselectSnippet(index)}
                                    deleteSnippet = {(index) => this.deleteSnippet(index)}
                                    codelines = {lines.slice(i, i + this.props.snippets[i].code.length)}
                                    scalePane = {() => this.scalePane(snippetRef, annotationRef)} 
                                    unhoverBoth = {() => this.unhoverBoth(snippetRef, annotationRef)}
                                    />
                snippetJSX.push(snippet)
                annotationJSX.push(annotation)
                if (this.props.snippets[i].status !== "INVALID") {
                    i += this.props.snippets[i].code.length - 1;
                } else {
                    deprecatedSeen = true
                    i -= 1;
                }
            } else {
                deprecatedSeen = false
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
                //if (inputLine === ''){
                //    inputLine = '    '
                //}
                //
                // render lines that are not snippets, note the id is used to differentiate during selection
                let border = "1.5px solid transparent"
                let backgroundColor = ""
                
                if (this.state.reselectingSnippet && 
                    i >= this.state.reselectingSnippet &&
                    i < this.state.reselectingSnippet + this.props.snippets[this.state.reselectingSnippet].code.length
                    ) {
                        
                        border = "1.5px solid #a29bfe"
                        backgroundColor = "#F1F8FF"
                    }
                let codeline = (<Wrapper backgroundColor = {backgroundColor} border = {border} id = {`linecode-${i}`} className = {'codeline'}>
                                    <CodeLine  >
                                        {inputLine}
                                    </CodeLine>
                                </Wrapper>)
                snippetJSX.push(codeline)
            }
            i += 1
        }

        // all code related objects packaged into one variable
        const allCode = <CodeText 
                            cursor = {this.state.selectionMode || this.state.reselectingSnippet !== null ? "grab" : ""}
                            className = {'codetext'}>
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

    /*{this.renderSnippetChangeButton()}
                {this.renderSnippetCancelButton()}*/

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
        let code = this.state.fileContents.split("\n").slice(startLine, startLine + length)
        let annotation = this.refs['newAnnotationTextarea'].value
        let location = window.location.pathname.slice(20)
        this.deselectItems()

        //createSnippet must handle all state reset, acquire beginning/end line data
        //snippet content, etc and send them over to the action

        this.props.createSnippet({startLine, code, annotation, location, status: "INVALID"}).then(() => {
            this.props.retrieveSnippets({location: window.location.pathname.slice(20)})
            this.setState({
                'selected': {},
                'newSnippetId': '',
                'cannotSelect': false
            });
        })
        //start and end line number, text in array format of all lines, annotation
    }

    reselectSnippetFunction(elem_key) {
        let startLine = parseInt(elem_key.split('-').pop())
        let length = _.keys(this.state.selected).length
        let code = this.state.fileContents.split("\n").slice(startLine, startLine + length)
        this.deselectItems()
        this.props.editSnippet(this.props.snippets[this.state.reselectingSnippet]._id, {startLine, code, status: "VALID"}).then(() => {
            this.props.retrieveSnippets({location: window.location.pathname.slice(20)})
            this.setState({
                'selected': {},
                'reselectingSnippet': null
            });
        })
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
            if (this.state.selectionMode) {
                return  <AddButton  onClick = {() =>  {this.renderSelectionChanges(elem_key)}}
                factor = {offset}  >
                        <ion-icon style={{'margin-top': "0.9rem"}} name="add-outline"></ion-icon>
                    </AddButton>
            } else {
                return  <AddButton  onClick = {() =>  {this.reselectSnippetFunction(elem_key)}}
                factor = {offset}  >
                        <ion-icon style={{'margin-top': "0.9rem"}} name="checkmark-outline"></ion-icon>
                    </AddButton>
            }
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
        //console.log("CALLBACKS PREV", this.props.callbacks)
        if (this.state.fileContents) {
            return (
                <>
                    <Container>
                        <Toolbar>
                            <IconBorder 
                                color = {this.state.selectionMode ? '#19E5BE;' : '#262626'}
                                opacity = {this.state.selectionMode ? '1' : '0.5'}
                                onClick = {this.toggleSelection}>
                                <ion-icon 
                                    style = {{'fontSize': '1.4rem'}} 
                                    name="color-wand-outline">
                                </ion-icon>
                            </IconBorder>
                            <IconBorder>
                                <ion-icon 
                                    name="hammer-outline"
                                    style = {{'fontSize': '1.3rem'}} >
                                </ion-icon>
                            </IconBorder>
                        </Toolbar>
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
    return {
        repositories: state.repositories,
        fileContents: state.repositories.fileContents,
        fileName: state.repositories.fileName,
        filePath: state.repositories.repositoryCurrentPath + '/' + state.repositories.fileName,
        snippets: state.snippets,
        callbacks: state.callbacks,
        references: Object.values(state.references)
    }
}

export default withRouter(connect(mapStateToProps, {retrieveSnippets, createSnippet, editSnippet, deleteSnippet, getRepositoryFile, retrieveCallbacks, getContents, retrieveCodeReferences})(CodeView));



//Styled Components
const Container = styled.div`
    width: 110rem;
    background-color: #F7F9FB;
    display: flex;
    box-shadow: 0 0 4px 1px rgba(0,0,0,.05), 2px 2px 2px 1px rgba(0,0,0,.05) !important;
    border-radius: 0.4rem !important;
    margin-bottom: 5rem;
`

const Toolbar = styled.div`
    position: absolute;
    height: 6rem;
    width: 3.3rem;
    top: 29.15rem;
    left: 30.25rem;
    background-color: black;
    z-index: 5;
    box-shadow: 0 0 4px 1px rgba(0,0,0,.05), 2px 2px 2px 1px rgba(0,0,0,.05) !important;
    background-color: #F7F9FB;
    border-radius: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center; 
`

const IconBorder = styled.div`
    width: 2.3rem;
    height: 2.3rem;
    border: 1px solid #262626;
    color: #262626;
    margin-top: 0.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.5;
    cursor: pointer;
    transition: all 0.1s ease-out;
    &:hover {
        opacity: 1;
    }
    color: ${props => props.color};
    border: 1px solid ${props => props.color};
    opacity: ${props => props.opacity};
`

const Overflow_Wrapper = styled.div`
    overflow:hidden;
    padding-bottom: 10rem;
`

const CodeText = styled.div`
    width: 77rem;
    padding: 1.5rem;
    border-right: 1px solid #ECECEF;
    display: flex;
    flex-direction: column;
    font-family: 'Roboto Mono', monospace !important;
    cursor: ${props => props.cursor};
    
`

const AnnotationBar = styled.div`
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 33rem;
    transition: transform 0.5s cubic-bezier(0, 0.475, 0.01, 1.035);
    transform: ${props => `translateY(${props.scaleY}px)`};
`

const CodeLine = styled.div`
    font-size: 1.27rem;
    margin: 0;
    padding: 0.1rem !important;
    background-color: inherit !important;
    padding-left: 1.6rem !important;
    boxShadow: 0 0 60px rgba(0, 0, 0, 0.08) !important;
    cursor: drag;
    white-space: pre-wrap !important;
`

const Wrapper = styled.div`
    border-left: ${props => props.border};
    background-color : ${props => props.backgroundColor};
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
    margin-left: 74.95rem;
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
    width: 31rem;
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
    font-size: 1.4rem;
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


const ColoredSpan = styled.span`
    color : ${props => props.color};
    font-style: ${props => props.type};
`

const ObliqueSpan = styled.span`
	font-style: italic;
`