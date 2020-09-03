import React from 'react'

//components
import DocumentEditor from './Editor/DocumentEditor'


//styles 
import styled from "styled-components";
import chroma from 'chroma-js';


//actions
import { getDocument, editDocument, getParent, renameDocument } from '../../../actions/Document_Actions';

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
        //this.headerRef = React.createRef()
    }


    componentDidMount() {
        this.loadResources()
    }

    
    componentDidUpdate(prevProps) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            this.setState({loaded: false})
            if (prevProps.document){
                let { workspaceId } = this.props.match.params;
                this.props.editDocument({workspaceId, documentId: prevProps.document._id, markup: JSON.stringify(this.state.markup)}).then(() => {
                    this.loadResources()
                })
            }
        }
    }

    loadResources(){
        let { workspaceId, documentId } = this.props.match.params

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
        })
    }


    saveMarkup = () =>{
        if (this.props.document){
            let { workspaceId } = this.props.match.params;
            this.props.editDocument({workspaceId, documentId: this.props.document._id, markup: JSON.stringify(this.state.markup)})
        }
    }

    setValue(value) {
        this.setState({markup: value})
    }   

    componentWillUnmount() {
        this.saveMarkup()
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
        return <Repository>{this.state.document.repository.fullName}</Repository>
    }

    
    onTitleChange = (e) => {
        this.setState({title: e.target.value})
        let { workspaceId } = this.props.match.params;
        if (e.type === "blur") {
            this.props.renameDocument({workspaceId, documentId: this.props.document._id, title: e.target.value})
        }
    }

    render(){
        if (this.state.loaded) {
            return(
                    <SubContainer>
                        <DocumentEditor 
                            onTitleChange = {this.onTitleChange}
                            title = {this.state.title}
                            markup = {this.state.markup} 
                            setValue = {this.setValue}
                            scrollTop = {this.props.scrollTop}
                        />
                    </SubContainer>
            )
        } 
        return null
    }
}/*   <InfoBlock borderBottom = {"none"}>
                        <InfoHeader>< ion-icon name="chatbox-ellipses-outline" style = {{ fontSize: '1.8rem', marginRight: "0.7rem"}}></ion-icon>Comments</InfoHeader>
                        <ReferenceContainer>
                            <CommentInput placeholder = {"Write a comment.."}/>
                        </ReferenceContainer>
                    </InfoBlock>*/

/*<InfoBlock>
                        <InfoHeader>Creator</InfoHeader>
                        <ReferenceContainer>
                            <ProfileButton>
                                FS
                            </ProfileButton>
                        </ReferenceContainer>
                    </InfoBlock>*/
/*

{true && 
                                <InfoBar>
                                
                                <InfoBlock><
                                    <InfoHeader>Author</InfoHeader>
                                    <ReferenceContainer>
                                        <ProfileButton>
                                            FS
                                        </ProfileButton>
                                    </ReferenceContainer>
                                </InfoBlock>
                                    <InfoBlock>
                                        <InfoHeader>Repository</InfoHeader>
                                        <ReferenceContainer>
                                            <Repository>{"FinanceNewsApp"}</Repository>
                                        </ReferenceContainer>
                                    </InfoBlock>  
                                <InfoBlock>
                                    <InfoHeader>References</InfoHeader>
                                    <ReferenceContainer>
                                        <Reference>{"backend.js"}</Reference>
                                    </ReferenceContainer>
                                </InfoBlock>
                                <InfoBlock>
                                    <InfoHeader>Tags</InfoHeader>
                                    <ReferenceContainer>
                                        <Tag>utility</Tag>
                                    </ReferenceContainer>
                                </InfoBlock>
                                
                            </InfoBar>
                        }
                        */


const mapStateToProps = (state, ownProps) => {
    let { documentId } = ownProps.match.params

    return {
        scrollTop: state.ui.scrollRightView,
        repositoryItems: Object.values(state.repositoryItems),
        creating: state.ui.creating,
        document: state.documents[documentId],
    }
}
export default withRouter(connect(mapStateToProps, { getDocument, editDocument, renameDocument, getParent })(TextEditorView));


/*
{this.props.showInfoBar == true && 
                                <InfoBar>
                                
                                <InfoBlock>
                                    <InfoHeader>Author</InfoHeader>
                                    <ReferenceContainer>
                                        <ProfileButton>
                                            FS
                                        </ProfileButton>
                                    </ReferenceContainer>
                                </InfoBlock>
                                {this.state.document.repository && 
                                    <InfoBlock>
                                        <InfoHeader>Repository</InfoHeader>
                                        <ReferenceContainer>
                                            {this.renderRepository()}
                                        </ReferenceContainer>
                                    </InfoBlock>
                                }
                                { this.state.document.references && this.state.document.references.length > 0 &&
                                    <InfoBlock>
                                        <InfoHeader>References</InfoHeader>
                                        <ReferenceContainer>
                                            {this.renderReferences()}
                                        </ReferenceContainer>
                                    </InfoBlock>
                                }
                                <InfoBlock>
                                    <InfoHeader>Tags</InfoHeader>
                                    <ReferenceContainer>
                                        {this.renderTags()}
                                    </ReferenceContainer>
                                </InfoBlock>
                                
                            </InfoBar>
                        }*/

//color <ion-icon name="color-palette-outline"></ion-icon>
//highlight <ion-icon name="color-wand-outline"></ion-icon>
//table <ion-icon name="grid-outline"></ion-icon>
//checklist <ion-icon name="checkbox-outline"></ion-icon>
//code <ion-icon name="code-slash"></ion-icon>


const RepositoryButton = styled.div`
    background-color: ${chroma("#5B75E6").alpha(0.1)}; 
    color: #5B75E6;
    font-weight: 500;
    padding: 0.75rem;
    display: inline-flex;
    border-radius: 0.4rem;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;*/
    align-items: center;
    cursor: pointer;
    &: hover {
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    }
    letter-spacing: 1;
    font-size: 1.3rem;
`

const BarSpace = styled.div`
    height: 3rem;
    z-index: 40;
    position: relative;
`

const BarSpace2 = styled.div`
    height: 2rem;
    margin-top: -1rem;
    background-color: white;
    position: relative;
    z-index: 3;
`


const CommentInput = styled.input`
    width: 26rem;
    height: 3.5rem;
    border: 1px solid  #E0E4E7;
    background-color: #F7F9FB;
    border-radius: 0.4rem;
    padding: 1.5rem;
    &:focus {
        background-color: white;
        border: 2px solid #2684FF;

    }
    &::placeholder {
        color: #172A4E;
        opacity: 0.4;
    }
    outline: none;
    font-size: 1.4rem;
    color: #172A4E;
    
`


const NoneMessage = styled.div`
    font-size: 1.3rem;
    margin-right: 1rem;
    opacity: 0.5;
`


const Settings = styled.div`
    display: flex;
    height: 3rem;
    font-size: 2rem;
    justify-content: flex-end;
`

const ProfileInfo = styled.div`
    opacity: 1;
    font-size: 1.4rem;
    font-weight: 400;
`

const Shortcut = styled.div`
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
    &:last-of-type {
        margin-bottom: 0rem;
        
    }
`

const InfoBarTitle = styled.div`
    height: 5.8rem;
    border-bottom: 2px solid #D5D9E0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.7rem;
    color: #172A4E;
    margin-bottom: 2rem;
`

const Container = styled.div`
    background-color:green;
    border-radius:0.4rem;
    display: flex;
    flex-direction: column;
`


const RightContainer = styled.div`

`



const H2IconBorder = styled.div`
    margin-left: ${props => props.marginLeft};
    margin-right: 0.5rem;
    display: flex;
    font-size: 1.3rem;
    align-items: center;
    justify-content: center;          
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 0.3rem;

    &:hover {
        opacity: 1;
        background-color: #F4F4F6; 
    }
    margin-top: 0.35rem;
    cursor: pointer;
    transition: all 0.1s ease-in;
`

const H3IconBorder = styled.div`
    margin-left: ${props => props.marginLeft};
    margin-right: 0.3rem;
    margin-top: 0.4rem;
    display: flex;
    font-size: 1.3rem;
    align-items: center;
    justify-content: center;         
    width: 3rem;
    height: 3rem;
    border-radius: 0.3rem;
    &:hover {
        opacity: 1;
        background-color: #F4F4F6; 
    }

    cursor: pointer;
    transition: all 0.1s ease-in;
`


const H1IconBorder = styled.div`
    margin-left: ${props => props.marginLeft};
    margin-right: 0.8rem;
    display: flex;
    font-size: 1.3rem;
    align-items: center;
    justify-content: center;
    
    width: 4.2rem;
    height: 4.2rem;
    border-radius: 0.3rem;
    
    &:hover {
        opacity: 1;
        background-color: #F4F4F6; 
    }

    cursor: pointer;
    transition: all 0.1s ease-in;
`

const H1 = styled.div`
  font-size: 1.5rem;
  color: #172A4E;
`

const H2 = styled.div`
    font-size: 1.5rem;
`
/*
const H2 = styled.div`
  font-size: 2.2rem;
  color: #172A4E;
`*/
const ProfileContent = styled.div`
    display: flex;
    align-items: center;
`

const H3 = styled.div`
  font-size: 1.5rem;
  color: #172A4E;
`





const Shadow = styled.div`
    
    box-shadow: 0px 2px 2px 0px rgb(1, 1, 1, 0.1);
   
    height: 1rem;
    z-index: 1;
    position: -webkit-sticky; /* Safari */
    position: sticky;
    top: 7rem;
`


const ListToolbar = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    background-color: white;
    border-radius: 0.4rem 0.4rem 0rem 0rem !important;
    position: sticky; 
    top: 0;
    border-bottom: 1px solid #EDEFF1;
    z-index: 1;
`

const Header = styled.input`
    font-size: 3rem;
    color: #172A4E;
    margin-bottom: 2rem;
    ::placeholder {
        color: #172A4E;
        opacity: 0.4;
    }
    outline: none;
    border: none;
    padding-left: 8.5rem;
    padding-right: 8.5rem;
    margin-top: 5rem;
`


const SubContainer = styled.div`
    display: flex;
    flex-direction:column;
    padding-bottom: 2rem;
    background-color: hsla(210, 33%, 97.5%, 1);
    
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;*/
    border-radius:0.2rem;
    justify-content: center;
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
    padding: 0.55rem 0.7rem;
    padding-right: 0.9rem;
    align-items: center;
    display: inline-flex;
    /*background-color:#262E49;*/
    /*color:#D6E0EE;*/
    border-left: 3.5px solid #19E5BE;
    background-color: #F7F9FB;
    border-radius: 0.3rem;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
   
    margin: 0.7rem;
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
