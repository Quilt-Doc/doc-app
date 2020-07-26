import React from 'react'

//components
import DocumentEditorModal  from './Editor/DocumentEditorModal';
import DocumentMenu2 from '../../General/Menus/DocumentMenu2';
import LabelMenu from '../../General/Menus/LabelMenu';
import FileReferenceMenu from '../../General/Menus/FileReferenceMenu';

//styles 
import styled from "styled-components";

//history
import history from '../../../history';

//actions
import { retrieveRepositoryItems } from '../../../actions/RepositoryItem_Actions'
import { getDocument, renameDocument, deleteDocument, editDocument, getParent, removeChild, attachTag, removeTag   } from '../../../actions/Document_Actions';
import { setCreation } from '../../../actions/UI_Actions';

//redux
import { connect } from 'react-redux';

//Change type of markup using toolbar and/or delete markup
//listen for onscroll events to update dropdown
//Force layout of Document Title rather than an input
//Deal with embeddable deletion and backwards

class TextEditorView extends React.Component {

    constructor(props) {
        super(props)
        this.state = {}
    }


    componentDidMount(){

        let search = history.location.search
        let params = new URLSearchParams(search)
        let documentId = params.get('document') 
       
        this.props.getDocument(documentId).then((document) =>{
            console.log(document)
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
            
            this.props.getParent(documentId).then((parent) => {
                if (parent) {
                    this.setState({parentId: parent._id})
                }
                
            })
        })

        window.addEventListener('beforeunload', this.saveMarkup, false);
        
        this.setValue = this.setValue.bind(this)
    }

    saveMarkup = () =>{
        
        if (this.props.document){
            
            this.props.editDocument(this.props.document._id, {markup: JSON.stringify(this.state.markup)})
        }
    }

    setValue(value) {
        this.setState({markup: value})
    }   

    componentWillUnmount() {
        if (this.props.creating){
            if (!this.props.document.title
                && this.state.markup.length === 1 
                && this.state.markup[0].children[0].text == ''){    
                    this.props.deleteDocument(this.props.document._id)
            } else {
                this.saveMarkup()
            }
            this.props.setCreation(false)
        } else {
            this.saveMarkup()
        }
        window.removeEventListener('beforeunload', this.saveMarkup, false)
    }
   
    renderReferences(){
        return this.props.document.references.map((ref) => {
            return <Reference>{ref.name}</Reference>
        })
    }

    renderTags(){
        return <Tag>utility</Tag>
    }

    renderRepository(){
        return <Repository>{this.props.document.repository.fullName}</Repository>
    }

    onTitleChange(e){
        this.setState({title: e.target.value})
        if (e.type === 'blur'){
            this.props.renameDocument({documentId: this.props.document._id, title: e.target.value})
        }
    }

    render(){
        if (!this.props.document || !this.state.markup){
            return null
        }

        return(
            <>
                <ModalToolbar>
                    <ModalToolbarButton onClick = {() => {history.push(`/workspaces/${this.props.document.workspace._id}/document/${this.props.document._id}`)}}>
                        <ion-icon name="open-outline" style = {{ color: "#172A4E", 'marginRight': '0.7rem', fontSize: "2.3rem"}}></ion-icon>
                        Open Document
                    </ModalToolbarButton>
                    <DocumentMenu2
                        marginTop = {"1rem"}
                        parent = {this.props.document.parent} document = {this.props.document}
                    />
                    <FileReferenceMenu
                         modalButton = {true}
                         setReferences = {this.props.document.references }//this.props.request.tags}
                         marginTop = {"1rem"}
                         document = {this.props.document}
                    />
                 
                    <LabelMenu
                        modalButton = {true}
                        attachTag = {(tagId) => this.props.attachTag(this.props.document._id, tagId)}//this.props.attachTag(requestId, tagId)}
                        removeTag = {(tagId) => this.props.removeTag(this.props.document._id, tagId)}//this.props.removeTag(requestId, tagId)}
                        setTags = {this.props.document.tags  }//this.props.request.tags}
                        marginTop = {"1rem"}
                        marginLeft = {"-22rem"}
                        
                    />
                    {/*
                    <FileReferenceMenu
                         modalButton = {true}
                         setReferences = {this.props.document.references}
                         marginTop = {"1rem"}
                         document = {this.props.document}
                    />*/
                    }
                    <ModalToolbarButton marginLeft= "2rem" opacity = {"1"}>
                        <ion-icon name="ellipsis-horizontal-outline" style={{'fontSize': '3rem', 'color': "#172A4E"}}></ion-icon>
                    </ModalToolbarButton>
                </ModalToolbar>
                <ModalEditor>
                    <Container>
                        <Header onBlur = {(e) => this.onTitleChange(e)} onChange = {(e) => this.onTitleChange(e)} placeholder = {"Untitled"} value = {this.state.title} />
                        <DocumentEditorModal  
                            markup = {this.state.markup} 
                            setValue = {this.setValue}
                            scrollTop = {this.props.scrollTop}
                        />
                    </Container>
                </ModalEditor>
            </>
           
        )
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

export default connect(mapStateToProps, { getDocument, editDocument, attachTag, removeTag, retrieveRepositoryItems,  deleteDocument, setCreation, getParent, removeChild, renameDocument})(TextEditorView);


const ModalToolbarButton = styled.div`
    display: flex;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    padding: 0.8rem;
    font-size: 1.4rem;
    
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
    padding-top: 6rem;
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

const Container = styled.div`
    margin: 0rem auto;
    padding-bottom: 4rem;
    padding-left: 9rem;
    padding-right: 9rem;
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