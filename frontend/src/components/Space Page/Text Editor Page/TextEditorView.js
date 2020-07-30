import React from 'react'

//components
import DocumentEditor from './Editor/DocumentEditor'
import LabelMenu from '../../General/Menus/LabelMenu';

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
                this.props.editDocument(prevProps.document._id, {markup: JSON.stringify(this.state.markup)}).then(() => {
                    this.loadResources()
                })
            }
        }
    }

    loadResources(){
        let { documentId } = this.props.match.params

        this.props.getDocument(documentId).then((document) =>{
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
                window.addEventListener('beforeunload', this.saveMarkup, false);
                this.setValue = this.setValue.bind(this)
                console.log(this.state.markup)
                this.setState({loaded: true})
            })
        })
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
        console.log("BLUR EVENT", e.type)
        console.log("BLUR EVENT TARGET VAL", e.target.value)
        
        this.setState({title: e.target.value})
        if (e.type === "blur") {
            this.props.renameDocument({documentId: this.props.document._id, title: e.target.value})
        }
        
    }

    render(){
        if (this.state.loaded) {
            return(
                <AllContainer>
                    
                <LeftContainer>
                    <SubContainer>
                        <DocumentEditor 
                            onTitleChange = {this.onTitleChange}
                            title = {this.state.title}
                            markup = {this.state.markup} 
                            setValue = {this.setValue}
                            scrollTop = {this.props.scrollTop}
                        />
                    </SubContainer>
                </LeftContainer>
                <InfoBar>
                    
                    {/*<InfoBlock >
    
                            <ProfileContent>
    
                            
                            <ProfileButton>FS</ProfileButton>
                            <ProfileInfo>
                                <div style = {{marginBottom: "0.3rem"}}>Created by <span style = {{fontWeight: "600"}}>Faraz Sanal</span></div>
                                <div>June 8th, 2016</div>
                            </ProfileInfo>
                            </ProfileContent>
                    </InfoBlock>  */}   
                         <InfoBlock>
                            <InfoHeader>< ion-icon name="menu-outline"  style = {
                                                {color: "#172A4E",  marginLeft: "-0.4rem", marginRight: "0.7rem", fontSize: "1.8rem"}
                                        }></ion-icon>Shortcuts</InfoHeader>
                            <ShortcutContainer>
                                <Shortcut>+ Iterable-styled datasets</Shortcut>
                                <Shortcut>+ Map-styled datasets</Shortcut>
                            </ShortcutContainer>
                        </InfoBlock>
                        <InfoBlock>
                            <InfoHeader>
                                <ion-icon  style = {
                                                {color: "#172A4E",marginLeft: "-0.4rem", marginRight: "0.7rem", fontSize: "1.65rem"}
                                        } name="git-network-outline"></ion-icon>
                                Repository
                            </InfoHeader>
                            <ReferenceContainer>
                                <RepositoryButton> <ion-icon  style = {
                                                { marginRight: "0.5rem", fontSize: "1.4rem"}
                                        } name="git-network-outline"></ion-icon>
                                        fsanal / FinanceNewsApp</RepositoryButton>
                            </ReferenceContainer>
                        </InfoBlock> 
                        <InfoBlock>
                            <InfoHeader>< ion-icon name="cube-outline"  style = {
                                                {color: "#172A4E",  marginLeft: "-0.4rem", marginRight: "0.7rem", fontSize: "1.65rem"}
                                        }></ion-icon>References</InfoHeader>
                                        
                            <ReferenceContainer2>
                                <Reference>
                                    <ion-icon name="document-outline"
                                    style = {
                                        {color: "#172A4E", marginRight: "0.7rem", fontSize: "1.4rem"}}></ion-icon>
                                    backend.js
                                </Reference>
                                <Reference2>
                                    <ion-icon name="folder"
                                    style = {
                                        {color: "#172A4E", marginRight: "0.7rem", fontSize: "1.4rem"}}></ion-icon>
                                    Semantic
                                </Reference2>
                                {/*<NoneMessage>None yet</NoneMessage>*/}
                                <LabelMenu 
                                    attachTag = {(tagId) => console.log(tagId)}//this.props.attachTag(this.props.currentReference._id, tagId)}//this.props.attachTag(requestId, tagId)}
                                    removeTag = {(tagId) => console.log(tagId)}//this.props.removeTag(this.props.currentReference._id, tagId)}//this.props.removeTag(requestId, tagId)}
                                    setTags = {[]}//{this.props.currentReference.tags}//this.props.request.tags}
                                    marginTop = {"1rem"}
                                />
                            </ReferenceContainer2>
                        </InfoBlock>
                        <InfoBlock>
                            <InfoHeader>
                                <ion-icon  style = {
                                                {color: "#172A4E",  marginLeft: "-0.4rem", marginRight: "0.7rem", fontSize: "1.65rem"}
                                        } name="pricetag-outline"></ion-icon>
                                Labels
                            </InfoHeader>
                            <ReferenceContainer>
                                <NoneMessage>None yet</NoneMessage>
                                {/*this.props.currentReference.tags && this.props.currentReference.tags.length > 0  ? this.renderTags() : */}
                                <LabelMenu 
                                    attachTag = {(tagId) => console.log(tagId)}//this.props.attachTag(this.props.currentReference._id, tagId)}//this.props.attachTag(requestId, tagId)}
                                    removeTag = {(tagId) => console.log(tagId)}//this.props.removeTag(this.props.currentReference._id, tagId)}//this.props.removeTag(requestId, tagId)}
                                    setTags = {[]}//{this.props.currentReference.tags}//this.props.request.tags}
                                    marginTop = {"1rem"}
                                />
                            </ReferenceContainer>
                        </InfoBlock>     
                      
                        <InfoBlock borderBottom = {"none"}>
                            <InfoHeader>< ion-icon name="chatbox-ellipses-outline" style = {{ fontSize: '1.65rem', marginRight: "0.7rem"}}></ion-icon>Comments</InfoHeader>
                            <ReferenceContainer>
                                <CommentInput placeholder = {"Write a comment.."}/>
                            </ReferenceContainer>
                        </InfoBlock>
                     
                    </InfoBar>
                
                </AllContainer>
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
    let parentId = state.parentId

    return {
        scrollTop: state.ui.scrollRightView,
        repositoryItems: Object.values(state.repositoryItems),
        creating: state.ui.creating,
        document: state.documents[documentId],
        parent: state.documents[parentId]
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

const AllContainer = styled.div`
    display: flex;
`

const LeftContainer = styled.div`
    background-color: #F7F9FB; 
    border: 1px solid #DFDFDF;
    margin-top: 5rem;
    margin-left: 4rem;
    margin-right: 1.5rem;
    border-radius:0.4rem;
    padding: 3rem;
    margin-bottom: 3rem;
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

const Container = styled.div`
    padding-bottom: 4rem;
    display: flex;
    /*border: 1px solid black;*/
`

const SubContainer = styled.div`
    display: flex;
    flex-direction:column;
    padding-bottom: 2rem;
    background-color: white;
    
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;
    border-radius:0.2rem;
    
`

const EditorContainer = styled.div`
    
`
const InfoBar = styled.div`
    min-width: 28rem;
    margin-top: 0rem;
    z-index: 20;
    /*background-color: #F4F4F6; */
   /* border-left: 1px solid #E0E4E7;*/
    padding-left: 3rem;
    padding-right: 3rem;
    /*box-shadow: 2px 2px 4px rgba(0,0,0,0.1);*/
    /*
    margin-top: 1rem;
    padding-left: 2rem;
    */
    position: -webkit-sticky; /* for Safari */
    position: sticky;
    top: 9rem;
    width: 30rem;
    align-self: flex-start;
`

const TagHeader = styled.div`
    color: #172A4E;
    font-size: 1.6rem;
    margin-bottom: 1rem;
`

const InfoHeader = styled.div`
    display: flex;
    align-items: center;
    font-weight: 500;
    font-size: 1.4rem;
    color: #172A4E;
    margin-bottom: 1.5rem;
`


const InfoBlock = styled.div`
    padding-top: 1.5rem;
    padding-bottom: 1.5rem;
    display: ${props => props.display};
    border-bottom: ${props => props.borderBottom};
    &:first-of-type {
        /*padding-bottom: 6rem;*/
    }
    &:last-of-type {
        padding-top: 6rem;
        border-bottom: none;
    }
`


const ReferenceContainer = styled.div`
    margin-top: 0.8rem;
    display: flex;
    flex-wrap: wrap;
   
    align-items: center;
`

const ReferenceContainer2 = styled.div`
    margin-top: 0.8rem;
    display: flex;
    flex-wrap: wrap;
    margin: -0.7rem;
    margin-bottom: 0rem;
    align-items: center;
`

const ShortcutContainer = styled.div`
    margin-top: 0.8rem;
    display: flex;
    flex-direction: column;
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


const Reference2 = styled.div`
    font-size: 1.25rem;
    color: #172A4E;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;*/
    padding: 0.55rem 1rem;
    align-items: center;
    display: inline-flex;
    /*background-color:#262E49;*/
    /*color:#D6E0EE;*/
    border-left: 3.5px solid #5B75E6;
    background-color: #F7F9FB;
    border-radius: 0.3rem;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    margin-right: 1rem;
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
    width: 3.3rem;
    height: 3.3rem;
    justify-content: center;
    align-items: center;
    display: flex;
    border-radius: 0.25rem;
    font-size: 1.4rem;
    color: white;
    background-color:#5B75E6;
    cursor: pointer;
    margin-right: 1.25rem;
`


/*#1BE5BE*/