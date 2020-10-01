import React from 'react';
import PropTypes from 'prop-types';

//components
import TextEditor from './editor/TextEditor';

//history
import history from '../../../history';

//styles 
import styled from "styled-components";
import html2canvas from 'html2canvas';

//actions
import { getDocument, editDocument, renameDocument } from '../../../actions/Document_Actions';
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

    constructor(props) {
        super(props)
        this.state = {
            loaded: false
        }
    }

    componentDidMount() {
        this.loadResources();
    }

    componentDidUpdate(prevProps) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            this.setState({loaded: false});
            if (prevProps.document) {
                this.saveMarkup(prevProps.document)
                this.loadResources();
            }
        }
    }

    // loads all the data needed for the editor
    loadResources = async () => {
        const { documentModal, match, getDocument } = this.props;
        let { workspaceId, documentId } = match.params;
        console.log("LOADING");
        // if the editor is a modal, the id is in the params
        if (documentModal){
            let search = history.location.search;
            let params = new URLSearchParams(search);
            documentId = params.get('document');
        }
        
        console.log("CALLING");
        // get the document data using the id
        const doc = await getDocument({workspaceId, documentId});
        console.log("BROKEN");
        // placeholder markup if the doc has no markup
        let markup = [{
            type: 'paragraph',
            children: [
            { text: '' },
            ],
        }];

        let title = "";
        
        if (doc.markup) markup = JSON.parse(doc.markup);

        if (doc.title) title = doc.title;
        
        // add an event listener to make sure content is saved on unload
        window.addEventListener('beforeunload', this.saveMarkup, false);
        this.setValue = this.setValue.bind(this);
        console.log("UP TO HERE");
        this.setState({markup, title, loaded: true});
    }

    // returns the markup in string format
    serializeMarkup = markup => {
        return(
            markup
            // Return the string content of each paragraph in the value's children.
            .map(n => Node.string(n))
            // Join them all with line breaks denoting paragraphs.
            .join('\n')
        )
    }

   saveMarkup = async (doc) => {
        
        // the document to save markup is either in props or provided 
        // (if we save on navigation to another doc in componentDidUpdate)
        doc = doc ? doc : this.props.document;

        if (doc) {
            const { editDocument, match } = this.props;
            const { workspaceId } = match.params;

            // acquire a picture canvas for preview with html2canvas
            const canvas = await html2canvas(document.getElementById("#editorContainer"), {scale: 0.5, height: 1000});
            
            // retrieve markup from the state
            const { markup } = this.state;

            // acquire the string content
            let content = this.serializeMarkup(markup)

            // save the json markup and the string content (for search)
            editDocument({workspaceId, documentId: doc._id, markup: JSON.stringify(markup), content});

            // if the image was successfully produced, save the image
            if (canvas && canvas.toDataURL()){
                editDocument({workspaceId, documentId: doc._id, image: canvas.toDataURL()});
            }
        }
   }

    setValue(value) {
        this.setState({markup: value});
    }   

    componentWillUnmount() {
        this.saveMarkup();
        window.removeEventListener('beforeunload', this.saveMarkup, false);
    }
   
    onTitleChange = (e) => {
        const { renameDocument, match, document: {_id} } = this.props;
        const { workspaceId } = match.params;

        // if the title is changed through typing, set the title state
        this.setState({title: e.target.value});
        // on blur of title input, rename the document
        if (e.type === "blur") renameDocument({workspaceId, documentId: _id, title: e.target.value});
    }

    renderTextEditor(){
        let { document, documentModal } = this.props;
        let {title, markup} = this.state;
        console.log("PROPS", { document, documentModal });
        console.log( {title, markup} );
        return(
            <TextEditor 
                onTitleChange = {this.onTitleChange}
                title = {title}
                markup = {markup} 
                setValue = {this.setValue}
                document = {document}
                documentModal = {documentModal}
            />
        )
    }

    render(){
        const {loaded} = this.state;
        const {documentModal} = this.props;
        console.log("ENTERED HERE");
        console.log("LOADED", loaded);
        if (loaded) {
            return(
                documentModal ? this.renderTextEditor()
                    :   <SubContainer>
                            {this.renderTextEditor()}
                        </SubContainer>
            )
        } 
        return null
    }
}

const mapStateToProps = (state, ownProps) => {
    let documentId;
    if (ownProps.documentModal) {
        let search = history.location.search
        let params = new URLSearchParams(search)
        documentId = params.get('document')
    } else {
        documentId = ownProps.match.params.documentId
    }

    return {
        document: state.documents[documentId],
    }
}

EditorWrapper.propTypes = {
    documentModal: PropTypes.bool
}

export default withRouter(connect(mapStateToProps, { getDocument, editDocument, renameDocument})(EditorWrapper));

const SubContainer = styled.div`
    display: flex;
    flex-direction:column;
    padding-bottom: 2rem;
    background-color: hsla(210, 33%, 97.5%, 1);
    justify-content: center;
`