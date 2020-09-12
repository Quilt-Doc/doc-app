import React from 'react'

//components
import DocumentEditorModal from './Editor/DocumentEditorModal';
import DocumentMenu2 from '../../General/Menus/DocumentMenu2';
import LabelMenu from '../../General/Menus/LabelMenu';
import FileReferenceMenu from '../../General/Menus/FileReferenceMenu';
import { CSSTransition } from 'react-transition-group';

//router
import {withRouter} from 'react-router-dom';


//styles 
import styled from "styled-components";

//history
import history from '../../../history';

//actions
import { getDocument, renameDocument, deleteDocument, editDocument, getParent, attachTag, removeTag } from '../../../actions/Document_Actions';
import { setCreation } from '../../../actions/UI_Actions';

//icons
import { CgArrowsExpandLeft } from 'react-icons/cg'

//redux
import { connect } from 'react-redux';
import RepositoryMenu2 from '../../General/Menus/RepositoryMenu2';

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
        this.loadResources()
    }

    loadResources(){
       // this.props.setLoading(true)
        let search = history.location.search
        let params = new URLSearchParams(search)
        let documentId = params.get('document')
        let { workspaceId } = this.props.match.params;
        console.log('TEXT EDITOR FOUND WorkspaceId: ', workspaceId);

        this.props.getDocument({workspaceId, documentId}).then((document) =>{
            let markup = [{
                type: 'paragraph',
                children: [
                { text: '' },
                ],
            }]
            let title = ""

            if (document.markup){
                markup = JSON.parse(document.markup)
            }

            if (document.title) {
                title = document.title
            }
            this.setState({markup, title})
            
            window.addEventListener('beforeunload', this.saveMarkup, false);
            this.setValue = this.setValue.bind(this)
            this.setState({loaded: true})
            this.props.setLoading(false)
        })
    }

    saveMarkup = () => {
        if (this.props.document) {
            let { workspaceId } = this.props.match.params;
            this.props.editDocument({workspaceId, documentId: this.props.document._id, markup: JSON.stringify(this.state.markup) })
        }
    }

    setValue(value) {
        this.setState({ markup: value })
    }

    componentWillUnmount() {
        if (this.props.creating) {
            if (!this.props.document.title
                && this.state.markup.length === 1
                && this.state.markup[0].children[0].text == '') {
                    let { workspaceId } = this.props.match.params;
                    this.props.deleteDocument({workspaceId, documentId: this.props.document._id})
            } else {
                this.saveMarkup()
            }
            this.props.setCreation(false)
        } else {
            this.saveMarkup()
        }
        window.removeEventListener('beforeunload', this.saveMarkup, false)
    }

    
    onTitleChange = (e) => {
        this.setState({title: e.target.value})
        let { workspaceId } = this.props.match.params;
        if (e.type === "blur") {
            this.props.renameDocument({workspaceId, documentId: this.props.document._id, title: e.target.value})
        }
    }

    
    render() {
        if (this.state.loaded) {
            return (
                    <>
                        <ModalEditor>
                                <DocumentEditorModal
                                    onTitleChange = {this.onTitleChange}
                                    title = {this.state.title}
                                    markup = {this.state.markup} 
                                    setValue = {this.setValue}
                                    scrollTop = {this.props.scrollTop}
                                    link = {`/workspaces/${this.props.document.workspace._id}/document/${this.props.document._id}`}
                                />
                        </ModalEditor>

                    </>
                )
        }
        return null
    }
}

const mapStateToProps = (state) => {
    let search = history.location.search
    let params = new URLSearchParams(search)
    let documentId = params.get('document')
    let parentId = state.parentId
    return {
        scrollTop: state.ui.scrollRightView,
        repositoryItems: Object.values(state.repositoryItems),
        creating: state.ui.creating,
        document: state.documents[documentId],
        parent: state.documents[parentId]
    }
}

export default withRouter(connect(mapStateToProps, { getDocument, editDocument, attachTag, removeTag, deleteDocument, setCreation, getParent, renameDocument })(TextEditorView));


const Placeholder = styled.div`
    border: 1px solid black;
    align-self: center;
    margin-top: 20rem;
    font-size: 2rem;
    height: 5rem;
    cursor: pointer;

`


const NoneMessage = styled.div`
    font-size: 1.3rem;
    opacity: 0.5;
`


const ModalToolbarButton = styled.div`
    display: flex;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    padding: 0.8rem;
    font-size: 1.3rem;
    
    margin-right: 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
    &:hover {
        background-color: #F4F4F6; 
        opacity: 1;
    }
    margin-left: ${props => props.marginLeft};
    opacity: ${props => props.opacity};
`

const ModalToolbar = styled.div`
    height: 4rem;
    padding: 2.7rem 1rem;
    display: flex;
    align-items: center;
`

const ModalEditor = styled.div`
    overflow-y: scroll;
`

const Header = styled.input`
    font-size: 3rem;
    color: #172A4E;
    margin-bottom: 1rem;
    ::placeholder {
        color: #172A4E;
        opacity: 0.4;
    }
    outline: none;
    border: none;
    width: 55vw;
`


const SubContainer = styled.div`
    
`

const EditorContainer = styled.div`
    display: flex;
    
`
const InfoBar = styled.div`
    margin-top: 1rem;
    padding-left: 2rem;
`

const InfoHeader = styled.div`
    font-weight: 400;
    opacity: 0.8;
    font-size: 1.1rem;
    color: #172A4E;
    text-transform: uppercase;
`

const InfoBlock = styled.div`
    margin-bottom: 2.2rem;
`

const ReferenceContainer = styled.div`
    margin-top: 0.8rem;

`

const Repository = styled.div`
    color: #172A4E;
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 1rem;
`

const Reference = styled.div`
    font-size: 1.25rem;
    color: #172A4E;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;*/
    padding: 0.3rem 0.9rem;
    background-color: white;
    display: inline-block;
    border: 1px solid #D7D7D7;
    border-radius: 3rem;
    margin-right: 1rem;
`

const Tag = styled.div`
    font-size: 1.25rem;
    color: #2980b9;
    padding: 0.4rem 0.8rem;
    background-color: rgba(51, 152, 219, 0.1);
    display: inline-block;
    border-radius: 4px;
    margin-right: 1rem;
`

const Author = styled.div`
    font-size: 1.25rem;
    color: #172A4E;
    border: 1px solid #172A4E;
    padding: 0.5rem 0.8rem;
    background-color: white;
    display: inline-block;
    border-radius: 4px;
    margin-right: 1rem;
    margin-bottom: 1rem;
`

const TextContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: scroll;
    min-width: 89rem;
`

const Title = styled.input`
    font-size: 4rem;
    font-weight: 300;
    letter-spacing: 1.78px;
    line-height: 1;
    color: #262626;
    margin-left:14.5rem;
    margin-right: 6rem;
    outline: none;
    border: none;
    &::placeholder {
        color: #262626;
        opacity: 0.3;
    }
`

const ProfileButton = styled.div`
    width: 3rem;
    height: 3rem;
    justify-content: center;
    align-items: center;
    display: flex;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    color: white;
    background-color: #19E5BE;
    cursor: pointer;
    
`

/*#1BE5BE*/