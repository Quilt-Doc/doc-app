import React from 'react';
import PropTypes from 'prop-types';

//components
import TextEditor from './editor/TextEditor';
import { CSSTransition } from 'react-transition-group';

//loader
import { Oval } from 'svg-loaders-react';

//history
import history from '../../../../history';

//styles 
import styled from "styled-components";

//image generation
import html2canvas from 'html2canvas';

//actions
import { getDocument, editDocument, syncEditDocument, renameDocument, testRoute, syncRenameDocument } from '../../../../actions/Document_Actions';
import { setDocumentLoaded } from '../../../../actions/UI_Actions';
import { Node } from 'slate';

//redux
import { connect } from 'react-redux';

//router
import { withRouter } from 'react-router-dom';

//Change type of markup using toolbar and/or delete markup
//listen for onscroll events to update dropdown
//Deal with embeddable deletion and backwards

// wrapper of the document editor that deals with providing data and sending data to database
// on document save
class EditorWrapper extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            initialMarkup: null
        }
    }

    componentDidMount = async () => {
        await this.loadResources();
        //this.saveCanvas(documentId, this.acquireCanvas());
    }

    componentWillUnmount = async () =>  {
        const documentId = this.getDocumentId(this.props);
        this.saveCanvas(documentId, this.acquireCanvas());
        
        const { setDocumentLoaded } = this.props;
        setDocumentLoaded(false);
    }

    getSnapshotBeforeUpdate = (prevProps) => {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            return this.acquireCanvas();
        } else {
            return null
        }
    }

    componentDidUpdate = async (prevProps, prevState, canvasPromise) => {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            this.loadResources();
            const documentId = this.getDocumentId(prevProps);
            if (documentId) this.saveCanvas(documentId, canvasPromise);
        }
    }

    getDocumentId = (props) => {
        const { documentModal, match } = props;
        let { documentId } = match.params;

        // if the editor is a modal, the id is in the params
        if (documentModal) {
            let search = history.location.search;
            let params = new URLSearchParams(search);
            documentId = params.get('document');
        }

        return documentId;
    }

    onTitleChange = async (e) => {
        console.log("E TARGET VALUE", e.target.value);
        /*
        const { syncEditDocument, documents } = this.props;
        const documentId = this.getDocumentId(this.props);

        const document = documents[documentId];
        const uneditedTitle = document.title;
        console.log("UNEDITEDTITLE BEFO", uneditedTitle);
        syncEditDocument({_id: documentId, title: e.target.value});

        const { renameDocument, match } = this.props;
        const { workspaceId } = match.params;

        // on blur of title input, rename the document
        if (e.type === "blur") {
            console.log("ENTERED IN HERE TITLE CHANGE");
            console.log("UNEDITEDTITLE", uneditedTitle);
            console.log("TARGET", e.target.value);
            if (uneditedTitle !== e.target.value) {
                let changed = await renameDocument({workspaceId, documentId, title: e.target.value});
                if (!changed) syncEditDocument({_id: documentId, title: uneditedTitle});
            }
        }*/
    }

    // loads all the data needed for the editor
    loadResources = async () => {
        const { match, getDocument, setDocumentLoaded, syncEditDocument, loaded } = this.props;
        const { workspaceId } = match.params;

        //if (loaded) setDocumentLoaded(false);
        if (loaded)  setDocumentLoaded(false);

        const documentId = this.getDocumentId(this.props);

        // get the document data using the id
        await getDocument({workspaceId, documentId});

        // add the parsed content as a field in the document
        const { documents } = this.props;
        const { markup, title } = documents[documentId];

        let initialMarkup = JSON.parse(markup);
        if (Node.string(initialMarkup[0]) !== title) {
            initialMarkup[0] = { 
                type: 'title',
                children: [
                { text: title },
                ],
            }
        }
        this.setState({ initialMarkup });
        //syncEditDocument({_id: documentId, parsedMarkup: JSON.parse(markup)});

        // DOM is ready to be loaded
        setDocumentLoaded(true);
    }

    acquireCanvas = async () => {
        let canvas;
            
        try {   
            canvas = await html2canvas(document.getElementById("editorSubContainer"), {scale: 0.5, height: 1500});
        } catch (err) {
            console.log("ERROR WITH CANVAS", err);
        } 

        return canvas;
    }

    saveCanvas = async (documentId, canvasPromise) => {
        // the document to save markup is either in props or provided 
        // (if we save on navigation to another doc in componentDidUpdate)
        const { documents } = this.props;
        const doc = documents[documentId];
     
        if (doc) {
            const { editDocument, match } = this.props;
            const { workspaceId } = match.params;

            // if the image was successfully produced, save the image
            if (canvasPromise) {
                const canvas = await canvasPromise;
                if (canvas) {
                    let dataURL = canvas.toDataURL();
                    if (dataURL) editDocument({ workspaceId, documentId, image: dataURL });
                }
            }
        }
    }

    renderLoader = () => {
        return (
            <LoaderContainer>
                <Oval stroke={'#E0E4E7'}/>
            </LoaderContainer>
        )
    }

    renderTextEditor = () => {
        const { documentModal, documents, loaded, match, renameDocument, syncRenameDocument } = this.props;
        const { initialMarkup } = this.state;
        const { workspaceId } = match.params;

        const document = documents[this.getDocumentId(this.props)];

        if (loaded && document) {
            return (
                <CSSTransition
                    in={true}
                    appear = {true}
                    timeout={300}
                    classNames="texteditor"
                >   
                    <div>
                        <TextEditor 
                            syncRenameDocument = {syncRenameDocument}
                            renameDocument = {renameDocument}
                            initialMarkup = {initialMarkup}
                            initialTitle = {document.title}
                            document = {document}
                            documentModal = {documentModal}
                            workspaceId = {workspaceId}
                        />
                    </div>
                </CSSTransition>
            )
        } else {
            this.renderLoader();
        }
    }

    renderWrappedTextEditor = () => {
        return (
                <Container id = {"editorContainer"}>
                    <SubContainer>
                        {this.renderTextEditor()}
                    </SubContainer>
                </Container>
        )
    }

    render(){
        const { documentModal } = this.props; 
        return documentModal ? this.renderTextEditor() : this.renderWrappedTextEditor();
    }
}

const mapStateToProps = (state) => {
    const { ui: { documentLoaded }, documents } = state;
    return {
        documents,
        loaded: documentLoaded
    }
}

EditorWrapper.propTypes = {
    documentModal: PropTypes.bool
}

export default withRouter(connect(mapStateToProps, { syncRenameDocument,
    getDocument, editDocument, renameDocument, syncEditDocument, setDocumentLoaded, testRoute })(EditorWrapper));

const Container = styled.div`
    height: 100vh;
    overflow-y: scroll;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    z-index: 2;
    width: 100%;
    background-color: white;
`

const LoaderContainer = styled.div`
    height: 100vh;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
`

const SubContainer = styled.div`
    display: flex;
    flex-direction:column;
    padding-bottom: 2rem;
    justify-content: center;
`

/*
    // returns the markup in string format
    serializeMarkup = parsedMarkup => {
        return(
            parsedMarkup
            // Return the string content of each paragraph in the value's children.
            .map(n => Node.string(n))
            // Join them all with line breaks denoting paragraphs.
            .join('\n')
        )
    }


saveMarkup = async (documentId, canvas) => {
        // the document to save markup is either in props or provided 
        // (if we save on navigation to another doc in componentDidUpdate)
        const { documents } = this.props;
        const doc = documents[documentId];
     
        if (doc) {
            const { editDocument, match } = this.props;
            const { workspaceId } = match.params;
            
            // retrieve parsed markup from the doc
            
            const { parsedMarkup } = doc;

            // acquire the string content
            let content;
            if (parsedMarkup) {
                content = this.serializeMarkup(parsedMarkup);
            }

            // stringify the markup
            const markup = JSON.stringify(parsedMarkup);

            // save the json markup and the string content (for search)
            let formValues = { workspaceId, documentId, markup };
            if (content) formValues = {...formValues, content};

            //editDocument(formValues);
            
            // if the image was successfully produced, save the image
            if (canvas) {
                let dataURL = canvas.toDataURL();
                if (dataURL) editDocument({ workspaceId, documentId, image: dataURL });
            }
        }
    }


    onMarkupChange = (parsedMarkup) => {
        /*
        const { channel } = this.state;

        if (channel) {
            //console.log("CHANNEL", channel);
            channel.trigger('client-text-edit', parsedMarkup);
        }

        const { syncEditDocument } = this.props;
        let documentId = this.getDocumentId(this.props);
        syncEditDocument({_id: documentId, parsedMarkup });
    }   
*/