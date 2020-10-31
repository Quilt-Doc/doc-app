import React, { Component } from 'react';
import ReactDOM from 'react-dom';

//styles
import styled from "styled-components";
import chroma from 'chroma-js';

//components
import Annotation from './Annotation';
import TextareaAutosize from 'react-textarea-autosize';
import ReferenceInfo from '../reference_info/ReferenceInfo';
import { CSSTransition } from 'react-transition-group';
import RepositoryMenu from '../../../menus/RepositoryMenu';

//history
import history from '../../../../history';

//loader
import { Oval } from 'svg-loaders-react';

//actions
import { retrieveSnippets, createSnippet, editSnippet, deleteSnippet } from '../../../../actions/Snippet_Actions'
import { retrieveDocuments } from '../../../../actions/Document_Actions';
import { retrieveReferences } from '../../../../actions/Reference_Actions';
import { getRepositoryFile, getRepository } from '../../../../actions/Repository_Actions';

//selectors
import { getSortedSnippets, makeGetReferenceDocuments } from '../../../../selectors';

//router
import { withRouter } from 'react-router-dom';

//redux
import { connect } from 'react-redux';

//utility
import Selection from '@simonwep/selection-js';
import scrollIntoView from 'scroll-into-view-if-needed'
import _ from 'lodash';

//icons
import { RiCheckFill, RiCloseFill, RiEdit2Line, RiScissorsLine } from 'react-icons/ri';

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

Prism.languages.python = Prism.languages.extend('python', {})
Prism.languages.javascript = Prism.languages.extend('javascript', {})


//FARAZ TODO: implement on scroll
//markers for multiple documentation

// component that allows you to view, maintain, and create snippets as well as see
// relevant info about the current reference (file)
class ReferenceEditor extends Component {
    constructor(props) {
        super(props);

        this.state = {
            //refers to the annotation panes translation in the Y direction (depends on snippet selection)
            translateY: 0,
            //syntax highlighted file contents in the form of JSX
            allLinesJSX: [],
            //whether or not lines can be selected
            canSelect: false,
            //whether or not a snippet is in the process of being created
            creating: false,
            //the snippet that is currently focused (either through hover or activation by click/key)
            activatedSnippet: {},
            //checks whether the component is ready to render properly 
            loaded: false,
            //checks whether the component is being edited in terms of attachments
            edit: false
        }

        // contains all the lines that are linked to a snippet (maps from line number to the line)
        // contains snippetIds that are held in the line, the line's node in the DOM -> linenumber: {snippetIds, node}
        this.lines = {};
        // contains references to all annotation cards (maps from snippetId to the annotation)
        // -> snippetId: {annotation_node}
        this.annotations = {};
        // css class identifier that caused selected lines to be green
        this.selectionIdentifier = 'selected-code';

        this.selectedItems = [];
    }


    async componentDidMount() {
        const { match, getRepository, getRepositoryFile, 
            retrieveReferences, retrieveSnippets, retrieveDocuments } = this.props;

        const { referenceId, repositoryId, workspaceId}  = match.params;

        // retrieve all necessary data
        const results = await Promise.all([
            getRepository({workspaceId, repositoryId}),
            getRepositoryFile({ workspaceId, repositoryId, referenceId }),
            retrieveReferences({ workspaceId, repositoryId, referenceId }),
            retrieveSnippets({referenceId, workspaceId, repositoryId, minimal: true}),
            retrieveDocuments({ workspaceId, referenceIds: [referenceId], workspaceId, minimal: true})
        ])

        // fileContents is returned by getRepositoryFile
        const fileContents = results[1];

        // iterate through the lines and syntax highlight
        const allLinesJSX = this.renderLines(fileContents);

        // create selection object for selecting lines and creating snippets
        this.selection = this.createSelection();

        // selection is disabled on mount
        this.selection.disable();
        
        // store all lines that belong to snippets with the associated snippet in this.lines
        this.storeSnippetLines();
        
        // adds an event listener for when the down key is pressed
        // so that a snippet can be activated
        //window.addEventListener('keydown', this.handleKeyDown, false);
       
        // saves all relevant data to local state
        this.setState({fileContents, allLinesJSX, loaded: true});

        const lineNum = this.checkParam("line");
        if (lineNum) {
            const line = document.getElementById(`codeline-${lineNum}`);
            scrollIntoView(line, {
                block: 'center',
                inline: 'center',
                behavior: 'smooth'
            })
        }
       
    }

    checkParam = (param) => {
        let { search } = history.location;
        let params = new URLSearchParams(search)
        let check = params.get(param);
        if ( check !== null && check !== undefined ){
            return check
        }
        return null;
    }

    // translate annotation pane when a different snippet is activated
    componentDidUpdate(_prevProps, prevState){
        const { activatedSnippet } = this.state;

        if (!_.isEmpty(activatedSnippet) && activatedSnippet.snippetId !== prevState.activatedSnippet.snippetId) {
            this.translateAnnotation();
        } 
    }

    // remove keydown listener
    componentWillUnmount(){
        window.removeEventListener('keydown', this.handleKeyDown, false);
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
        }).on('move', ({inst, selected, changed: {removed, added}}) => {
           
           
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
            inst.keepSelection();
            if (added.length === selected.length) this.setState({first: added});
        }).on('stop', ({inst}) => {
            inst.keepSelection();
            // The last event can be used to call functions like keepSelection() in case the user wants
            // to select multiple elements.
        });

        return selection;
    }
   
    // translates the annotation pane so that you can see the activated annotation + snippet pair
    translateAnnotation = () => {
        // extract relevant data from the activated snippet
        console.log("ENTERED HEREE");
        const { activatedSnippet: {snippetId, line, throughKey} } = this.state;
        const annotation = this.annotations[snippetId];
        // get the offset of the codetext (contains the syntax highlighted lines)
        const offset_codetext = document.getElementById('codeholder').offsetTop;
        // get the offset of the snippet from the codetext -- offset of snippet from top - offset of codetext
        const offset_snippet = ReactDOM.findDOMNode(line.node).offsetTop - offset_codetext;

        // get the annotations offset from the top of the pane
        const offset_annotation = ReactDOM.findDOMNode(annotation).offsetTop;

        // take the difference in the offsets 
        const offset_difference = -1 * (offset_annotation - offset_snippet);

        // save the translation
        //depends on the translation of the pane currently
        this.setState({ translateY: offset_difference})

        // if the translation occurred through keydown -- scroll both the annotation and snippet into view
        
        if (snippetId === -1 && this.creationTextArea) {
            setTimeout(() => this.creationTextArea.focus(), 500);
        }

        if (throughKey) {
            scrollIntoView(ReactDOM.findDOMNode(annotation).parentNode, {
                scrollMode: 'if-needed',
                block: 'nearest',
                inline: 'nearest',
                behavior: 'smooth'
            })
        }
    }
    
    // handles the key down to select the next snippet without mouse
    handleKeyDown = (e) => {/*
        const { activatedSnippet: { snippetId }, canSelect } = this.state;
        const { snippets } = this.props;

        e.preventDefault();
        e.stopPropagation();

        if (!canSelect && snippets.length > 0) {
            const snippet = e.keyCode === 40 ? snippetId ? this.chooseNextSnippet(snippetId, true) : snippets[0] 
                : e.keyCode === 38 ? snippetId ? this.chooseNextSnippet(snippetId, false) : snippets[snippets.length - 1] 
                : null;

            if (snippet) {
                this.activateSnippet(this.lines[snippet.start], snippet._id, false, false, true);
                window.addEventListener('mousedown', this.deactivateSnippetListener, false);
            }
        }*/
    }

    // returns correct, next snippet in accordance to the previous snippet and which direction (down or up)
    chooseNextSnippet = (snippetId, down) => {

        const { snippets } = this.props;

        for (let i = 0; i < snippets.length; i++){
            let snippet = snippets[i];
            if (snippet._id === snippetId) {
                if (down) {
                    if (i !== snippets.length - 1) {
                        return snippets[i + 1];
                    } else {
                        return snippets[0];
                    }
                } else {
                    if (i !== 0) {
                        return snippets[i - 1];
                    } else {
                        return snippets[snippets.length - 1];
                    }
                }
            }
        }
    }

    // deeactivates the snippet if there is an active snippet and person clicks outside of snippet (like a dropdown)
    deactivateSnippetListener = () => {
        this.deactivateSnippet(false, false);
        window.removeEventListener('mousedown', this.deactivateSnippetListener, false);
    }

    // toggles selection mode
    toggleSelection = () => {
        const {canSelect} = this.state;
        
        if (canSelect) {
            // if selection mode is on, deselect the lines and disable selection
            this.deselectLines();
            this.selection.disable();
        } else {
            this.selection.enable();
        }

        // activated snippet is always cleared on toggle
        this.setState({canSelect: !canSelect, activatedSnippet: {}});
    }

    // clear the selection and clear the css of the selection
    deselectLines = () => {
        let selectedLines = this.selection.getSelection()
        selectedLines.map(line => line.classList.remove(this.selectionIdentifier));
        this.selection.clearSelection();
        //this.selection.clearSelection();
    }

    
    // tokenize the fileContents using prism and create highlighted spans
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


    // associate the snippets with the lines that are contained in them
    storeSnippetLines = () => {
        const { snippets } = this.props;
        let lines = {};
        snippets.map(snippet => {
            for (let i = snippet.start; i < snippet.start + snippet.code.length; i++) {
                if (i in lines) {
                    lines[i].snippetIds.push(snippet._id);
                } else {
                    lines[i] = {snippetIds: [snippet._id]};
                }
            }
        })
        this.lines = lines
        this.setState({storing: true});
    }

    // begin the creation process by disabling selection and activating the creation annotation
    startCreation(e) {
        e.preventDefault();
        e.stopPropagation();
        this.selection.disable();
        const selectedLine =  this.selection.getSelection()[0];
        this.activateSnippet({node: selectedLine.parentNode}, -1, false, true, false);
    }

    // render the addition button near the first line of selection
    renderAddButton = () => {
        // first element that is selected
        const firstLine = this.selection.getSelection()[0];
        
        // use a pointer to the first line to allocate the creation button appropirately
        const firstLineTop = firstLine.getBoundingClientRect().top;
        const codeTextOffsetTop = document.getElementById('codeholder').offsetTop;
        let { scrollTop } = document.getElementById("rightView");

        return(
            <AddButton
                onMouseDown = {(e) =>  {this.startCreation(e)}}
                top = {firstLineTop + scrollTop - codeTextOffsetTop - 20}
            >
                <RiScissorsLine  /> {/*style={{'margin-top': "0.9rem"}}*/}
            </AddButton>
        )
    }

    // activates the snippet so it becomes focused
    activateSnippet = (line, snippetId, hover, creating, throughKey) => {
        const { activatedSnippet, canSelect } = this.state;
        const isActivated = activatedSnippet.isActivated;
        const activatedSnippetId = activatedSnippet.snippetId;
        // if selection mode is on, snippets can only activated during 
        // creation (aka the creation snippet/annotation itself)
        if (!canSelect || creating) {
            let state = {};
            // hovered snippets are only activated when the current snippet is not activated through click/key
            if (hover && !isActivated) {
                state = {activatedSnippet: { line, snippetId, isActivated: false}};
            } else if (!hover) {
            // add a through key in the activated snippet object so we know to scroll it into view 
                state = {activatedSnippet: { line, snippetId, isActivated: true, throughKey }};
            }

            // if we're creating set creating on the state to true so the creation annotation renders
            if (creating) state.creating = true;

            this.setState(state);
        }
    }

    // deactivates any focused snippet
    deactivateSnippet = (hover, creating) => {
        const { activatedSnippet: { isActivated }, canSelect } = this.state;

        // if selection mode is on, snippets can only be deactivated during 
        // creation (aka the creation snippet/annotation itself)
        if (!canSelect || creating) {
            let state = {};
            // if the snippet is currently a hovered one and the deactivation is of type hover - empty activated snippet
            // or if the deactivation is of not type hover, always empty activated snippet
            if ((hover && !isActivated) || !hover)  state = {activatedSnippet: {}};
            // if the snippet is currently being created, we want to turn creating off and set the translation on the
            // annotation pane to 0
            if (creating) {
                state.creating = false; 
                this.selection.enable();
            }
            this.setState(state);
        }
    }

    // renders the code in the code text portion 
    renderCode = () => {
        const { allLinesJSX, canSelect, activatedSnippet: { snippetId }, creating } = this.state;
        const { snippetsObject } = this.props;

        // checks whether there is a snippet and extracts snippet
        let snippet = snippetId ? snippetsObject[snippetId] : null;
        
        let codeJSX = [];
        let snippetJSX = [];

        // iterates over syntax highlighted code
        allLinesJSX.forEach((lineJSX, i) => {
            const isSnippet = snippet && i >= snippet.start && i < snippet.start + snippet.code.length;
            lineJSX = this.wrapLine(lineJSX, i, isSnippet);
            isSnippet ? snippetJSX.push(lineJSX) : codeJSX.push(lineJSX);

            if (isSnippet && i == snippet.start + snippet.code.length - 1){
                codeJSX.push(this.renderSnippet(snippetJSX, snippet));
            }
        });

        let classString = `codetext${canSelect && !creating ? ' marker-mode' : ''}`

        return(<CodeText id = {'codeholder'} className = {classString}> {codeJSX} </CodeText>)
    }


    // wraps each code line with a functional wrapper
    wrapLine = (lineJSX, i, isSnippet) => {
        const { snippetsObject } = this.props;
        const { canSelect } = this.state;
        if (lineJSX.length === 1) {
            if (lineJSX[0] === "") lineJSX = "     ";
        }

        return ( 
            < WrapContainer
                // hover activates snippet on mouse enter
                onMouseEnter = {() =>  {
                    if (this.lines[i]) {
                        const snippetStart = snippetsObject[this.lines[i].snippetIds[0]].start;
                        const startLine = this.lines[snippetStart];
                        this.activateSnippet(startLine, this.lines[i].snippetIds[0], true, false, false);
                    }
                }}
                key = {i}
                // adds the line node to the this.lines declaration if the line is included in a snippet
                ref = {node => {if (this.lines[i]) this.lines[i].node = node; }}
            >
                <Linenumber>{i + 1}</Linenumber>
                <Wrapper 
                    id = {`codeline-${i}`}
                    // renders color and border dependent on whether the line is a snippet and currently activated
                    color = {this.lines[i] ? chroma("#6762df").alpha(isSnippet ? 0.07 : 0.04) : "#ffffff"}   
                    border = {this.lines[i] ?  `2px solid #6762df` : "2px solid #ffffff"}
                    className = {'codeline'}
                    cursorType = {(!canSelect && this.lines[i])  ? "pointer" : ""}
                >
                    <CodeLine>
                        {lineJSX}
                    </CodeLine>
                </Wrapper>
            </WrapContainer>
        )
    }

    // renders the snippet which contains the snippet code content
    renderSnippet = (snippetJSX, snippet) => {
        return (
            <Snippet 
                // click activates the snippet on mouse click
                /*
                onClick = {() => {
                    this.activateSnippet(this.lines[snippet.start], snippet._id, false, false, false);
                    window.addEventListener('mousedown', this.deactivateSnippetListener, false);
                }}*/
                // hover deactivates snippet on mouse leave
                onMouseLeave = {() =>  {this.deactivateSnippet(true, false)}} 
            >
                {snippetJSX}
            </Snippet>
        )
    }

    // renders the annotation cards in the pane
    renderAnnotations = () => {
        const { snippets } = this.props;
        const { creating, translateY, activatedSnippet } = this.state;

        let annotationsJSX = [];
        // acquire the top line of selection if currently creating
        let selectedLine = creating ? this.selection.getSelection()[0] : null;
        
        // if a snippet is being created, push a creating annotation text area in the annotion pane
        const pushCreation = (creationAnnotation) => (annotationsJSX.push(creationAnnotation), null);

        snippets.map(snippet => {
            // add the create annotation before the first snippet annotatiion that starts after 
            // the new about-to-be snippet
            if ( selectedLine && parseInt(selectedLine.id.split('-')[1]) < snippet.start) {
                selectedLine = pushCreation(this.renderCreateAnnotation());
            }
            annotationsJSX.push(
                this.renderAnnotation(snippet, activatedSnippet.snippetId === snippet._id, activatedSnippet)
            );
        });
        
        // edge case where the selectedLine of an about-to-be snippet is after all snippets
        if (selectedLine) {
            selectedLine = pushCreation(this.renderCreateAnnotation());
        }

        // sets and returns the annotations with the pane translated
        return (
            <Overflow_Wrapper>
                <AnnotationBar translateY = {translateY} >
                    {annotationsJSX}
                </AnnotationBar>
            </Overflow_Wrapper>
        )
    }

    // renders a single annotation card
    renderAnnotation = (snippet, active, activatedSnippet) => {
        const  { isActivated } = activatedSnippet;
        const { deleteSnippet } = this.props;
        return (
            <div
                ref = {(node) => {this.annotations[snippet._id] = node}}
            >
                <Annotation 
                    key = {snippet._id}
                    active = {active}
                    isActivated = {isActivated}
                    snippet = {snippet}
                    activateSnippet = {() => {
                        this.activateSnippet(this.lines[snippet.start], snippet._id, false, false, false);
                        window.addEventListener('mousedown', this.deactivateSnippetListener, false);
                    }}
                    deactivateSnippet = {this.deactivateSnippet}
                    deleteSnippet = {deleteSnippet}
                />
            </div>
        )
    }

    // renders the annotation card with the text area for creation
    renderCreateAnnotation = () => {
        return (
            < AnnotationCardInput
                key = {-1} 
                // sets the annotation card to the key -1 in the annotations list
                ref={(node) => { this.annotations[-1] = node }}
            >
                <StyledTextareaAutosize 
                    minRows = {6}
                    placeholder="Add an annotation..."
                    ref={node => this.creationTextArea = node} 
                />
                <ButtonHolder>
                    <CreateAnnotation onClick = {() => {this.createSnippet()}}>
                        <RiCheckFill/>
                    </CreateAnnotation>
                    <CancelAnnotation onClick = {() => {
                        this.deselectLines();
                        this.deactivateSnippet(false, true);
                    }}>
                        <RiCloseFill
                            style = 
                            {{
                                fontSize: "1.7rem"
                            }}
                        />
                    </CancelAnnotation>
                </ButtonHolder>
            </AnnotationCardInput>
        )
    }

    renderContent() {
        const { creating } = this.state;

        const code = this.renderCode();
        
        const annotations = this.renderAnnotations();
    

        const isSelecting = this.selection.getSelection().length > 0;

        return (
                <>
                    {code} 
                    {(isSelecting && !creating) &&
                        <MiddleContainer>
                            {this.renderAddButton()}
                        </MiddleContainer>
                    }
                    {annotations}
                </>
        )

    }

    // function to create a snippet-annotation pair when the create button is clicked 
    createSnippet = async () => {
        const { match, user, createSnippet } = this.props;
        const { fileContents } = this.state;
        let {referenceId, workspaceId} = match.params

        // extract the annotation typed by the user
        let annotation = this.creationTextArea.value;
        if (annotation === "") return alert("Please provide an annotation");

        //acquire the start from the selection, find all lines from start to endline
        let selectedLines = this.selection.getSelection();
        let start = null;
        selectedLines.map(line => {
                let num = parseInt(line.id.split('-')[1]);
                if (start == null || num < start) start = num;
            }
        );

        let length = selectedLines.length;

        // extract the code associated with the selection 
        let code = fileContents.split("\n").slice(start, start + length);

        // deselect all lines css wise and clear selection object
        this.deselectLines();

        // deactivate the old create snippet
        this.deactivateSnippet(false, true);

        // create the snippet
        await createSnippet({start, code, annotation, 
            workspaceId, referenceId, status: "VALID", creatorId: user._id });

        // restore the snippet lines
        this.storeSnippetLines();
    }

    renderRepoName = () => {
        const { currentRepository: { fullName }} = this.props;
        return fullName.split('/').slice(1).join("/").toUpperCase();
    }

    renderRefName = () => {
        const { currentReference: {name} } = this.props;
        return name;
    }


    renderLoader = () => {
        return(
            <LoaderContainer>
                <Oval
                    stroke="#d9d9e2"
                />
            </LoaderContainer>
        )
    }


    render() {
        const { loaded, canSelect, edit } = this.state;
        const { currentRepository, currentReference, documents } = this.props;
        /*toggleSelection = {this.toggleSelection}
                                        canSelect = {canSelect}*/
        if (loaded && currentRepository && currentReference && documents) {
            return (
                <Background>
                    <Top>
                        <RepositoryMenu repoName = {this.renderRepoName()}/>
                        <Toolbar>
                            <Button active = {edit}
                                onClick = {() => {this.setState({edit: !this.state.edit})}}
                            >
                                <RiEdit2Line/>
                            </Button>
                            <Button 
                                active = {canSelect}
                                onClick = {() => {this.toggleSelection()}}
                            >
                                <RiScissorsLine/>
                            </Button>
                        </Toolbar>
                    </Top>
                    <Container>
                        <Content>
                            <ReferenceInfo
                                edit = {edit}
                                currentRepository = {currentRepository}
                                currentReference = {currentReference}
                                documents = {documents}  
                            />
                            <EditorContainer>
                                <ListToolbar> 
                                    {this.renderRefName()}
                                    <Button 
                                        style = {{marginLeft: "auto"}}
                                        active = {canSelect}
                                        onClick = {() => {this.toggleSelection()}}
                                    >
                                        <RiScissorsLine/>
                                    </Button>
                                </ListToolbar>
                                <CodeContainer>
                                    {this.renderContent()}
                                </CodeContainer>
                            </EditorContainer>
                        </Content>
                    </Container>
                </Background>
            );
        } else {
            return this.renderLoader();
        }
    }
}

// relevant data here is fileContents, which are the lines of data
const makeMapStateToProps = () => { 
    const getReferenceDocuments = makeGetReferenceDocuments();

    const mapStateToProps = (state, ownProps) => {
        let { repositoryId, referenceId } = ownProps.match.params;
        let { documents, references, snippets, repositories } = state; 

        let currentReference;
        if (referenceId) currentReference = references[referenceId];

        // acquire documents that belong to the reference
        documents = getReferenceDocuments({documents, currentReference});

        // sort the snippets by their start line
        snippets = getSortedSnippets({snippets});

        return {
            documents, 
            snippets,
            snippetsObject: state.snippets,
            currentReference,
            currentRepository: repositories[repositoryId],
            user: state.auth.user
        }
    }

    return mapStateToProps;
}

export default withRouter(connect(makeMapStateToProps, {retrieveSnippets, createSnippet, editSnippet, 
    deleteSnippet, getRepositoryFile, retrieveDocuments,
    retrieveReferences, getRepository })(ReferenceEditor));



//Styled Components
const MiddleContainer = styled.div`
    position: relative;
`

const LoaderContainer = styled.div`
    height: 100%;
    width: 100%;
    margin-left: 0.2rem;
    display: flex;
    justify-content: center;
    align-items: center;
`

const Content = styled.div`
    width:85%;
    max-width: 130rem;
    min-width: 80rem;
`

const Button = styled.div`
    &:last-of-type {
        margin-right: 0rem;
    }
    margin-right: 1.3rem;
    width: 3rem;
	height: 3rem;
    display: flex;
    font-size: 2.4rem;
    justify-content: center;
    align-items: center;
    position: relative;
    z-index: 0;
    border-radius: 0.3rem;
    &:hover {
        background-color:  ${props => props.active ? chroma("#6762df").alpha(0.2) : "#dae3ec;"};
    }
    background-color: ${props => props.active ? chroma("#6762df").alpha(0.2)  : ""};
    cursor: pointer;
`


const Linenumber = styled.div`
    width: 3rem;
    font-size: 1.2rem;
    opacity: 0.5;
    margin-top: 0.2rem;
`

const WrapContainer = styled.div`
    display: flex;
    position: relative;
`

const Snippet = styled.div` 
  /*  box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.31) 0px 1px 1px 0px;*/
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.3) 0px 4px 16px -6px;*/
    z-index: 1;
    cursor: pointer;

`

const ListName = styled.div`
    margin-left: 3rem;
    color: #172A4E;
    font-size: 1.5rem;
    font-weight: 300;
`

const Background = styled.div`
    min-height: 100%;
    padding: 2.1rem;
    padding-bottom: 5rem;
`

const Top = styled.div`
    display: flex;
    align-items: center;
`

const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-top: 2rem;
    align-items: center;
`

const EditorContainer = styled.div`
    display: flex;
    flex-direction: column;
    /*border: 1px solid #DFDFDF;*/
    border-radius:0.4rem;
    min-width: 80rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`

const CodeContainer = styled.div`
    background-color: /*#F7F9FB;*/ white;
    display: flex;
    border-radius: 0rem 0rem 0.4rem 0.4rem !important;
`

const ListToolbar = styled.div`
    align-items: center;
    background-color: white;
    border-radius: 0.4rem 0.4rem 0rem 0rem !important;
    font-size: 1.5rem;
    height: 4.5rem;
    display: flex;
    font-weight: 500;
    align-items: center;
    border-bottom: 1px solid #EDEFF1;
    padding: 0rem 2rem;
`

const Toolbar = styled.div`
    margin-left: auto;
    padding-right: 4rem;
    display: flex;
`

const Overflow_Wrapper = styled.div`
    overflow:hidden;
    padding-bottom: 10rem;
    flex: 0 0 33rem;
    background-color: #F7F9FB;
`

const CodeText = styled.div`
    display: flex;
    flex: 1 1 77rem;
    flex-direction: column;
    padding: 1.5rem;
    border-right: 1px solid #EDEFF1;
    font-family: 'Roboto Mono', monospace !important;
    overflow-x: scroll;
`

const AnnotationBar = styled.div`
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 33rem;
    transition: transform 0.5s cubic-bezier(0, 0.475, 0.01, 1.035);
    transform: ${props => `translateY(${props.translateY}px)`};
    z-index:3;
`

const CodeLine = styled.div`
    color: #242A2E;
	font-size: 1.3rem;
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
    background-color: ${props => props.color};
    position: relative;
    z-index: 0;
    width: 100%;
    cursor: ${props => props.cursorType};
`

const AddButton = styled.div`
    background-color: white;
    border-radius: 50%;
    box-shadow: 0 3px 6px 0 rgba(0,0,0,.1), 0 1px 3px 0 rgba(0,0,0,.08);
    height: 4rem;
    width: 4rem;
    position: absolute;
    z-index: 1;
    font-size: 2rem;
    text-align: center;
    color: #19e5be;
    border: 1.5px solid #19e5be;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    &:hover {
        background-color:#F7F9FB;
    }
    transition: transform 0.4s cubic-bezier(0, 0.475, 0.01, 1.035), background-color 0.1s ease-in-out;
    transform: translateY(${props => props.top}px);
    margin-left: -2rem;
`   

const AnnotationCardInput = styled.div`
    width: 31rem;
    padding: 1.6rem 2rem;
    border-radius: 0.5rem;
    background-color: white;
    box-shadow: 0 6px 8px rgba(102,119,136,.03), 0 1px 2px rgba(102,119,136,.3);
    text-align: center;
    margin-bottom: 1.5rem;
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
    width: 3.3rem;
    height: 3.3rem;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #19e5be;
    background-color: white;
    border: 1px solid  #19e5be;
    &:hover {
        color: white;
        background-color: #19e5be;
    }
    cursor: pointer;
    border-radius: 50%;
    font-size: 1.9rem;
`

const CancelAnnotation = styled.div`
    margin-top: 0.5rem;
    margin-left: 1rem;
    width: 3.3rem;
    height: 3.3rem;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid #f53b57;
    color:#f53b57;
    &:hover {
        color: white;
        background-color: #f53b57;
    }
    cursor: pointer;
    border-radius: 50%;
    font-size: 2.2rem;
`

const ColoredSpan = styled.span`
    color : ${props => props.color};
    font-style: ${props => props.type};
`