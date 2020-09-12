import React from 'react'

//components
import DocumentEditor from './Editor/DocumentEditor'

//history
import history from '../../../history';

//styles 
import styled from "styled-components";
import chroma from 'chroma-js';
import html2canvas from 'html2canvas';

//actions
import { getDocument, editDocument, getParent, renameDocument } from '../../../actions/Document_Actions';
import { Node } from 'slate'

//redux
import { connect } from 'react-redux';

//router
import { withRouter } from 'react-router-dom';

//Change type of markup using toolbar and/or delete markup
//listen for onscroll events to update dropdown
//Force layout of Document Title rather than an input
//Deal with embeddable deletion and backwards

class TextEditorView extends React.Component {

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
            if (prevProps.document){
                this.saveMarkup(prevProps.document)
                this.loadResources();
            }
        }
    }

    loadResources(){
        let documentId;
        if (this.props.documentModal){
            let search = history.location.search;
            let params = new URLSearchParams(search);
            documentId = params.get('document');
        } else {
            documentId = this.props.match.params.documentId;
        }

        this.props.getDocument(documentId).then((document) =>{
            let markup = [{
                type: 'paragraph',
                children: [
                { text: '' },
                ],
            }];
            let title = "";

            if (document.markup){
                markup = JSON.parse(document.markup);
            }

            if (document.title) {
                title = document.title;
            }

            this.setState({markup, title});
            window.addEventListener('beforeunload', this.saveMarkup, false);
            this.setValue = this.setValue.bind(this);
            this.setState({loaded: true});
        })
    }

    serializeMarkup = markup => {
        return(
            markup
            // Return the string content of each paragraph in the value's children.
            .map(n => Node.string(n))
            // Join them all with line breaks denoting paragraphs.
            .join('\n')
        )
    }

   saveMarkup = (doc) => {
        doc = doc ? doc : this.props.document;
        if (doc){

            html2canvas(document.getElementById("#editorContainer"), {scale: 0.5, height: 1000}).then(canvas => {
                let {markup} = this.state;
                let content = this.serializeMarkup(markup)
                this.props.editDocument(doc._id, {markup: JSON.stringify(markup), content});
                if (canvas && canvas.toDataURL()){
                    this.props.editDocument(doc._id, {image: canvas.toDataURL()});
                }
            });
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
        this.setState({title: e.target.value});
        if (e.type === "blur") {
            console.log("WORKSPACEID", this.props.match.params.workspaceId);
            this.props.renameDocument({workspaceId: this.props.match.params.workspaceId, documentId: this.props.document._id, title: e.target.value});
        }
    }

    renderDocumentEditor(){
        let {document, documentModal, scrollTop} = this.props;
        let {title, markup} = this.state;
        return(
            <DocumentEditor 
                onTitleChange = {this.onTitleChange}
                title = {title}
                markup = {markup} 
                setValue = {this.setValue}
                scrollTop = {scrollTop}
                document = {document}
                documentModal = {documentModal}
            />
        )
    }


    render(){
        if (this.state.loaded) {
            return(
                this.props.documentModal ? 
                        this.renderDocumentEditor()
                        :
                        <SubContainer>
                            {this.renderDocumentEditor()}
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
        scrollTop: state.ui.scrollRightView,
        document: state.documents[documentId],
    }
}
export default withRouter(connect(mapStateToProps, { getDocument, editDocument, renameDocument})(TextEditorView));

const SubContainer = styled.div`
    display: flex;
    flex-direction:column;
    padding-bottom: 2rem;
    background-color: hsla(210, 33%, 97.5%, 1);
    justify-content: center;
`