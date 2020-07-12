import React from 'react'

//components
import DocumentEditor from './Editor/DocumentEditor'

//styles 
import styled from "styled-components";

//actions
import { retrieveRepositoryItems } from '../../../actions/RepositoryItem_Actions'
import { getDocument, editDocument } from '../../../actions/Document_Actions';

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
        
        let initialValue = [
            {
                type: 'paragraph',
                children: [
                    {
                        text: 'Click here to start writing'
                    }
                ]
            }
        ]

        initialValue = [
            {
                type: 'heading-two',
                children: [
                    {
                        text:
                            'Iterable-styled datasets',
                    },
                ],
            },
            {
                type: 'paragraph',
                children: [
                    {
                        text:
                            'An iterable-style dataset is an instance of a subclass of IterableDataset that implements the __iter__() protocol, and represents an iterable over data samples. This type of datasets is particularly suitable for cases where random reads are expensive or even improbable, and where the batch size depends on the fetched data.',
                    },
                ],
            },
            {
                type: 'paragraph',
                children: [
                    {
                        text:
                        ''
                    }
                ],
            },
            {
                type: 'code-block',
                children: [
                    {
                        type: 'code-line',
                        children: [{ text: 'import numpy as np' }]
                    },
                    {
                        type: 'code-line',
                        children: [{ text: '       ' }]
                    },
                    {
                        type: 'code-line',
                        children: [{ text: '  def pingu(x: int):' }]
                    }],
            },
            {
                type: 'heading-two',
                children: [
                    {
                        text:
                            'Map-styled datasets',
                    },
                ],
            },
            {
                type: 'paragraph',
                children: [
                    {
                        text:
                            'An iterable-style dataset is an instance of a subclass of IterableDataset that implements the __iter__() protocol, and represents an iterable over data samples. This type of datasets is particularly suitable for cases where random reads are expensive or even improbable, and where the batch size depends on the fetched data.',
                    },
                ],
            }
        ]
        
        let urlItems = window.location.pathname.split('/')
        if (urlItems.slice(urlItems.length - 1) === '') {
            urlItems.pop()
        }
        let documentID = urlItems.slice(urlItems.length - 1)[0]

        this.props.retrieveRepositoryItems({documentIDs:[documentID]})

        this.props.getDocument(documentID).then((document) =>{
            if (!document.markup){
                document.markup = initialValue
            } else {
                document.markup = JSON.parse(document.markup)
            }
            this.setState({document})
        })

        window.addEventListener('beforeunload', this.saveMarkup, false);
        
        this.setValue = this.setValue.bind(this)
    }

    saveMarkup = () =>{
        
        if (this.state.document){
            this.props.editDocument(this.state.document._id, {markup: JSON.stringify(this.state.document.markup)})
        }
    }

    setValue(value) {
        let document = this.state.document
        document.markup = value
        this.setState({document})
    }   

    componentWillUnmount() {
        this.saveMarkup()
        window.removeEventListener('beforeunload', this.saveMarkup, false)
    }
   
    renderReferences(){
        console.log(this.state.document.references)
        return this.state.document.references.map((ref) => {
            return <Reference>{ref.name}</Reference>
        })
    }

    renderTags(){
        return <Tag>utility</Tag>
    }

    renderRepository(){
        return <Repository>{this.state.document.repository.fullName}</Repository>
    }

    onTitleChange(e){
        this.props.editDocument(this.state.document._id, {title: e.target.value}).then(() => {
            this.props.retrieveRepositoryItems({documentIDs:[this.state.document._id]})
        })
    }

    render(){
        if (!this.state.document){
            return null
        }
        return(
            <Container>
                <EditorContainer>
                    <SubContainer>
                        <Header>Starting the server</Header>
                        <DocumentEditor 
                            markup = {this.state.document.markup} 
                            setValue = {this.setValue}
                            scrollTop = {this.props.scrollTop}
                        />
                    </SubContainer>
                   
                    
                    
                </EditorContainer>
            </Container>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        scrollTop: state.ui.scrollRightView,
        repositoryItems: Object.values(state.repositoryItems)
    }
}

export default connect(mapStateToProps, { getDocument, retrieveRepositoryItems, editDocument })(TextEditorView);

const Header = styled.div`
    font-size: 3rem;
    color: #172A4E;
    margin-bottom: 1rem;
`

const Container = styled.div`
    margin: 0rem auto;
    padding-bottom: 4rem;
    padding-left: 12.5rem;
    padding-right: 12.5rem;
`

const SubContainer = styled.div`
    display: flex;
    flex-direction:column;
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