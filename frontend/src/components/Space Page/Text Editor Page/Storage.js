import React from 'react'

//components
import DocumentEditor from './Editor/DocumentEditor'

//styles 
import styled from "styled-components";

//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAlignLeft, faAlignRight, faAlignCenter, faListUl, faListOl  } from '@fortawesome/free-solid-svg-icons'


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
        this.headerRef = React.createRef()
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
            
            this.props.getParent({workspaceId, documentId}).then((parent) => {
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

    
    onTitleChange(e){
        console.log("BLUR EVENT", e.type)
        console.log("BLUR EVENT TARGET VAL", e.target.value)

        let { workspaceId } = this.props.match.params;
        
        this.setState({title: e.target.value})
        if (e.type === "blur") {
            this.props.renameDocument({workspaceId, documentId: this.props.document._id, title: e.target.value})
        }
        
    }

    render(){
        if (this.state.loaded) {
            return(
                <AllContainer>
                <LeftContainer>
                <BarSpace/>
                <Toolbar>
                    <IconBlock>
                        <IconBorder>
                            <IconBold>B</IconBold>
                        </IconBorder>
                        <IconBorder>
                            <IconItalic>i</IconItalic>
                        </IconBorder>
                        <IconBorder>
                            <IconUnderline>U</IconUnderline>
                        </IconBorder>
                    </IconBlock>
                    <IconBlock>
                        <IconBorder>
                            <FontAwesomeIcon style = {{marginTop: "0.25rem"}} icon={faAlignLeft} />
                        </IconBorder>
                        <IconBorder>
                            <FontAwesomeIcon style = {{marginTop: "0.25rem"}} icon={faAlignCenter} />
                        </IconBorder>
                        <IconBorder>
                            <FontAwesomeIcon style = {{marginTop: "0.25rem"}} icon={faAlignRight} />
                        </IconBorder>
                    </IconBlock>
                    <IconBlock>
                        <IconBorder>
                            <ion-icon style = {{fontSize: "1.7rem", borderBottom: "2px solid #172A4E"}} name="color-palette-outline"></ion-icon>
                        </IconBorder>
                        <IconBorder>
                            <ion-icon style = {{fontSize: "1.7rem"}}  name="color-wand-outline"></ion-icon>
                        </IconBorder>
                    </IconBlock>
                    <IconBlock>
                        <IconBorder>
                            <FontAwesomeIcon style = {{marginTop: "0.25rem"}} icon = {faListUl}/>
                        </IconBorder>
                        <IconBorder>
                            <FontAwesomeIcon style = {{marginTop: "0.25rem"}} icon = {faListOl}/>
                        </IconBorder>
                    </IconBlock>
                    <IconBlock>
                        <IconBorder>
                            <IconBold>H1</IconBold>
                        </IconBorder>
                        <IconBorder>
                            <IconBold>H2</IconBold>
                        </IconBorder>
                        <IconBorder>
                            <IconBold>H3</IconBold>
                        </IconBorder>
                        
                    </IconBlock>
                    <IconBlock>
                        <IconBorder>
                            <ion-icon style = {{marginTop: "0.25rem", fontSize: "1.7rem"}} name="code-slash-sharp"></ion-icon>
                        </IconBorder>
                        <IconBorder>
                            <ion-icon  style = {{marginTop: "0.25rem",  fontSize: "1.7rem"}} name="grid-outline"></ion-icon>  
                        </IconBorder>
                        <IconBorder>
                            <ion-icon  style = {{marginTop: "0.25rem",  fontSize: "1.7rem"}} name="checkbox-outline"></ion-icon>
                        </IconBorder>
                    </IconBlock>
                </Toolbar>
                <Shadow/>
                <BarSpace2/>
                <Container>
                        <SubContainer>
                            <Header ref = {this.headerRef} onBlur = {(e) => this.onTitleChange(e)} onChange = {(e) => this.onTitleChange(e)} placeholder = {"Untitled"} value = {this.state.title} />
                            <DocumentEditor 
                                markup = {this.state.markup} 
                                setValue = {this.setValue}
                                scrollTop = {this.props.scrollTop}
                            />
                        </SubContainer>
                </Container>
                </LeftContainer>
                
                <InfoBar>
                    
                    <InfoBlock >
                        <Settings><ion-icon name="settings-outline"></ion-icon></Settings>
                        <ProfileContent>

                        
                        <ProfileButton>FS</ProfileButton>
                        <ProfileInfo>
                            <div style = {{marginBottom: "0.3rem"}}>Created by <b>Faraz Sanal</b></div>
                            <div>June 8th, 2016</div>
                        </ProfileInfo>
                        </ProfileContent>
                    </InfoBlock>     
                     <InfoBlock>
                        <InfoHeader>< ion-icon name="menu-sharp" style = {{ fontSize: '1.5rem', marginRight: "0.7rem"}}></ion-icon>Shortcuts</InfoHeader>
                        <ReferenceContainer>
                            <Shortcut>+ Iterable-styled datasets</Shortcut>
                            <Shortcut>+ Map-styled datasets</Shortcut>
                        </ReferenceContainer>
                    </InfoBlock>     
                    <InfoBlock>
                        <InfoHeader>< ion-icon name="code-slash-outline" style = {{ fontSize: '1.5rem', marginRight: "0.7rem"}}></ion-icon>References</InfoHeader>
                        <ReferenceContainer>
                            <Reference ><ion-icon style = {{marginRight: "0.4rem"}} name="document-outline"></ion-icon>{"backend.js"}</Reference>
                        </ReferenceContainer>
                    </InfoBlock>
                    <InfoBlock>
                        <InfoHeader>< ion-icon name="pricetag-outline" style = {{ fontSize: '1.5rem', marginRight: "0.7rem"}}></ion-icon>Labels</InfoHeader>
                        <ReferenceContainer>
                            <Tag>utility</Tag>
                        </ReferenceContainer>
                    </InfoBlock>
                    <InfoBlock borderBottom = {"none"}>
                        <InfoHeader>< ion-icon name="chatbubble-ellipses-outline" style = {{ fontSize: '1.5rem', marginRight: "0.7rem"}}></ion-icon>Comments</InfoHeader>
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
}

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
    height: 3.5rem;
    width: 29rem;
    outline: none;
    padding: 1rem;
    border-radius: 0.3rem;
    border: 2px solid #E0E4E7;
    &::placeholder { 
        color: #172A4E;
        opacity: 0.7;
    }
    &:focus {
        border: 2px solid #19E5BE;
    }
`

const Settings = styled.div`
    display: flex;
    height: 3rem;
    font-size: 2rem;
    justify-content: flex-end;
`

const ProfileInfo = styled.div`
    opacity: 0.8;
    font-size: 1.2rem;
`

const Shortcut = styled.div`
    font-size: 300;
    font-size: 1.2rem;
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
    height: 100%;
`

const LeftContainer = styled.div`
    overflow-y: scroll;
    height: 94vh;
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


const IconBold = styled.div`
    font-size: 1.5rem;
`

const IconItalic = styled.div`
    font-style: italic;
    font-size: 1.5rem;
`

const IconUnderline = styled.div`
    text-decoration: underline;
    font-size: 1.5rem;
`

const IconBlock = styled.div`
    display: flex;
    padding-left: 1.3rem;
    padding-right: 1rem;
    border-right: 2px solid #F4F4F6; 
    align-items: center;
    height: 2.3rem;
`

const IconBorder = styled.div`
    margin-left: ${props => props.marginLeft};
    margin-right: 0.3rem;
    display: flex;
    font-size: 1.3rem;
    align-items: center;
    justify-content: center;

    width: 2.8rem;
    height: 2.8rem;
    border-radius: 0.3rem;
      
    &:hover {
        opacity: 1;
        background-color: #F4F4F6; 
    }

    cursor: pointer;
    transition: all 0.1s ease-in;
`

const Shadow = styled.div`
    
    box-shadow: 0px 2px 2px 0px rgb(1, 1, 1, 0.1);
   
    height: 1rem;
    z-index: 1;
    position: -webkit-sticky; /* Safari */
    position: sticky;
    top: 7rem;
`

const Toolbar = styled.div`
    position: -webkit-sticky; /* Safari */
    position: sticky;
    top: 0;
    z-index: 10;
    background-color:white;
    display: flex;
    /*border: 1px solid red;*/
    height: 5rem;
    /*border-bottom: 1px solid #E0E4E7;*/
    /*border-bottom: 1px solid #DFDFDF;*/
    padding: 7rem;
    padding-top: 4rem;
    padding-bottom: 4rem;
    padding-left: 10rem;
    align-items: center;
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
    padding-bottom: 4rem;
    display: flex;
    /*border: 1px solid black;*/
`

const SubContainer = styled.div`
    display: flex;
    flex-direction:column;
    padding-top: 2rem;
    padding-bottom: 2rem;
    width: 80rem;
   
    margin-left: 12rem;
    margin-right: 12rem;
    
`

const EditorContainer = styled.div`
    
`
const InfoBar = styled.div`
    min-width: 35rem;
    margin-top: 3rem;
    z-index: 20;
    /*background-color: #F4F4F6; */
   /* border-left: 1px solid #E0E4E7;*/
    padding-left: 3rem;
    padding-right: 3rem;
    /*box-shadow: -1px 2px 4px rgba(0,0,0,0.1);*/
    /*
    margin-top: 1rem;
    padding-left: 2rem;
    */
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
    font-size: 1.3rem;
    color: #172A4E;
    margin-bottom: 1.5rem;
`

const InfoBlock = styled.div`
    padding-top: 2.2rem;
    padding-bottom: 2.2rem;
    
    border-bottom: 1px solid #E0E4E7;
    display: ${props => props.display};
    border-bottom: ${props => props.borderBottom};
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
    color: #19E5BE;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;*/
    padding: 0.5rem 0.9rem;
    align-items: center;
    display: inline-flex;
    background-color:#262E49;
    color:#D6E0EE;
    border-radius: 0.5rem;
   /* box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;*/
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
    margin-right: 1rem
`

/*#1BE5BE*/