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
import html2canvas from 'html2canvas';

//actions
import { getDocument, editDocument, syncEditDocument, renameDocument, testRoute } from '../../../../actions/Document_Actions';
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

    componentDidMount = async () => {
        await this.loadResources();
        window.addEventListener('beforeunload', this.saveMarkupWrapper);
    }

    componentWillUnmount = async () =>  {
        window.removeEventListener('beforeunload', this.saveMarkupWrapper);
        
        const documentId = this.getDocumentId(this.props);
        const canvas = await this.acquireCanvas();
        this.saveMarkup(documentId, canvas);
    }

    saveMarkupWrapper = (e) => {
        const documentId = this.getDocumentId(this.props);
        this.saveMarkup(documentId);
    }

    componentDidUpdate = async (prevProps) => {
        if (prevProps.location.pathname !== this.props.location.pathname) {

            const canvas = await this.acquireCanvas();

            this.loadResources();

            const documentId = this.getDocumentId(prevProps);
            if (documentId) this.saveMarkup(documentId, canvas);
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

    onMarkupChange = (markup) => {
        const { syncEditDocument } = this.props;
        let documentId = this.getDocumentId(this.props);
        syncEditDocument({_id: documentId, markup: JSON.stringify(markup)});
    }   

    onTitleChange = async (e) => {
        const { syncEditDocument, documents } = this.props;
        const documentId = this.getDocumentId(this.props);

        const document = documents[documentId];
        const uneditedTitle = document.title;

        syncEditDocument({_id: documentId, title: e.target.value});

        const { renameDocument, match } = this.props;
        const { workspaceId } = match.params;

        // on blur of title input, rename the document
        if (e.type === "blur") {
            if (uneditedTitle !== e.target.value) {
                let changed = await renameDocument({workspaceId, documentId, title: e.target.value});
                if (!changed) syncEditDocument({_id: documentId, title: uneditedTitle});
            }
        }
    }

    // loads all the data needed for the editor
    loadResources = async () => {
        const { match, getDocument, setDocumentLoaded } = this.props;
        const { workspaceId } = match.params;
        const documentId = this.getDocumentId(this.props);

        // get the document data using the id
        await getDocument({workspaceId, documentId});

        // DOM is ready to be loaded
        setDocumentLoaded(true);
    }

    // returns the markup in string format
    serializeMarkup = markup => {
        markup = JSON.parse(markup);
        return(
            markup
            // Return the string content of each paragraph in the value's children.
            .map(n => Node.string(n))
            // Join them all with line breaks denoting paragraphs.
            .join('\n')
        )
    }

    acquireCanvas = async () => {
        let canvas;
            
        try {   
            canvas = await html2canvas(document.getElementById("editorContainer"), {scale: 0.5, height: 1000});
        } catch (err) {
            console.log("ERROR WITH CANVAS", err);
        } 

        return canvas;
    }

    saveMarkup = async (documentId, canvas) => {
        // the document to save markup is either in props or provided 
        // (if we save on navigation to another doc in componentDidUpdate)
        const { documents } = this.props;
        const doc = documents[documentId];

        if (doc) {
            const { editDocument, match } = this.props;
            const { workspaceId } = match.params;
            
            // retrieve markup from the state
            const { markup } = doc;

            // acquire the string content
            const content = this.serializeMarkup(markup);

            // save the json markup and the string content (for search)
            editDocument({ workspaceId, documentId, markup, content });
            
            // if the image was successfully produced, save the image
            if (canvas) {
                let dataURL = canvas.toDataURL();
                if (dataURL) editDocument({ workspaceId, documentId, image: dataURL });
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
        const { documentModal, documents, loaded } = this.props;
        const document = documents[this.getDocumentId(this.props)];

        let editorJSX = (
            <CSSTransition
                in={true}
                appear = {true}
                timeout={300}
                classNames="texteditor"
            >   
                <div>
                    <TextEditor 
                        onTitleChange = {this.onTitleChange}
                        onMarkupChange = {this.onMarkupChange}
                        document = {document}
                        documentModal = {documentModal}
                    />
                </div>
            </CSSTransition>
        )

        return  (loaded && document)  ? editorJSX : this.renderLoader();

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

export default withRouter(connect(mapStateToProps, { 
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