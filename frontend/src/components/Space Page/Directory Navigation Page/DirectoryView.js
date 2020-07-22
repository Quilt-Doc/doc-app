import React from 'react';

//styles 
import styled from "styled-components"

import chroma from 'chroma-js';
//images
import doc_icon from '../../../images/doc-file.svg';

//components
import DirectoryItem from './DirectoryItem';
import RotateLoader from "react-spinners/RotateLoader";
import TagWrapper from '../../General/TagWrapper';
import LabelMenu from '../../General/Menus/LabelMenu'

//history
import history from '../../../history';

//actions
import { retrieveReferences, editReference, attachTag, removeTag} from '../../../actions/Reference_Actions';
import { retrieveDocuments } from '../../../actions/Document_Actions';
import { getRepository } from '../../../actions/Repository_Actions';

//connect
import { connect } from 'react-redux';

class DirectoryView extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            loaded: false,
            tagMenuOpen: false
        }
    }

    async loadResources(){
        let { repositoryId, referenceId } = this.props.match.params
        if (!referenceId) referenceId = ""
        await this.props.getRepository(repositoryId)
        await this.props.retrieveReferences({ repositoryId, referenceId, kinds : ['file', 'dir'] })
        let referenceIds = this.props.references.map(ref => ref._id)
        await this.props.retrieveDocuments({ referenceIds })
        if (!this.state.loaded) {
            this.setState({ loaded:true })
        }
        /*
        else {
            this.props.retrieveReferences({repositoryId, truncated: true, kinds : ['file', 'dir']}).then(() => {
                let referenceIds = this.props.references.map(ref => ref._id)
                this.props.retrieveDocuments({referenceIds}).then(() => {
                    if (!this.state.loaded) {
                        this.setState({ loaded:true })
                    }
                })
            })
        }*/
    }
    // USE PARAMS
    componentDidMount() {
        this.loadResources()
    }

    componentDidUpdate(prevProps) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            this.setState({loaded: false})
            this.loadResources()
        }
    }

    renderFolders = () => {
        //let currId = this.props.currentReference._id
        let directories = this.props.references.filter(reference => reference.kind === "dir")
        
        if (directories.length > 0) {
            directories = directories.sort((a, b) => {if (a.name < b.name) return -1; else if (a.name > b.name) return 1; else return 0})
        }

        return directories.map((directory, i) => {
            let borderBottom = i === this.props.references.length - 1 ? '1px solid #EDEFF1;' : ''
            return (<DirectoryItem 
                        key = {directory._id} 
                        item = {directory}
                        type = {'folder-sharp'}
                        borderBottom = {borderBottom}
                    />    
                    )
        })
    }

    renderFiles = () => {
        let files = this.props.references.filter(reference => reference.kind === "file")

        if (files) {
            files = files.sort((a, b) => {if (a.name < b.name) return -1; else if (a.name > b.name) return 1; else return 0})
        }
        return files.map((file, i) => {
            let borderBottom = i === files.length - 1 ? '1px solid #EDEFF1;' : ''
            return (<DirectoryItem 
                        key = {file._id} 
                        item = {file}
                        type = {'document-outline'} 
                        borderBottom = {borderBottom}
                    />)
        })
    }

    renderHeaderPath() {
        if (this.props.currentReference && this.props.currentReference.path !== "") {
            let splitPath = this.props.currentReference.path.split("/")
            return splitPath.map((sp) => {
                return(<><Slash>/</Slash><RepositoryPath>{sp}</RepositoryPath></>)
            })
        }
    }

    renderTags(){
        let colors = ['#5352ed', 
        '#ff4757', '#20bf6b','#1e90ff', '#ff6348', '#e84393', '#1e3799', '#b71540', '#079992'
        ]

        return this.props.currentReference.tags.map(tag => {
            let color = tag.color < colors.length ? colors[tag.color] : colors[colors.length % tag.color];
            return <Tag color = {color} backgroundColor = {chroma(color).alpha(0.2)}>{tag.label}</Tag>
        })
    }



    renderDocuments(){
        return this.props.documents.map(doc => {
            let title = doc.title
            if (title && title.length > 14) {
                let title = `${title.slice(0, 14)}..`
            }
            return <DocumentItem onClick = {() => history.push(`?document=${doc._id}`)}>
                        <ion-icon name="document-text-outline" style = {{fontSize: "1.5rem", 'marginRight': '0.8rem'}}></ion-icon>
                        <Title>{title ? title : "Untitled"}</Title>
                    </DocumentItem>
        })
    }
//{this.renderHeader()}
    render() {
        let { referenceId, workspaceId, repositoryId } = this.props.match.params
        if (!referenceId){
            referenceId = ""
        }
        return (
            <>
                { this.state.loaded ?
                        <Container>
                            <Header><RepositoryButton >
                                <ion-icon name="git-network-outline" style = {{marginRight: "0.7rem"}}></ion-icon>
                                {this.props.currentRepository.fullName.split("/")[1]}
                                <ion-icon name="chevron-down-sharp" style = {{marginLeft: "0.7rem", fontSize: "1.5rem"}}></ion-icon>
                            </RepositoryButton>
                            {this.renderHeaderPath()}
                            </Header>
                            <InfoBlock>
                                <InfoHeader>
                                    <ion-icon style = {
                                                {color: "#172A4E",  marginLeft: "-0.4rem", marginRight: "0.7rem", fontSize: "1.8rem"}
                                    } name="pricetag-outline"></ion-icon>
                                    Labels
                                </InfoHeader>
                                <ReferenceContainer>
                                    {this.props.currentReference.tags && this.props.currentReference.tags.length > 0 ? 
                                        this.renderTags() : 
                                        <NoneMessage>None yet</NoneMessage>}
                                    <LabelMenu 
                                        attachTag = {(tagId) => this.props.attachTag(this.props.currentReference._id, tagId)}//this.props.attachTag(requestId, tagId)}
                                        removeTag = {(tagId) => this.props.removeTag(this.props.currentReference._id, tagId)}//this.props.removeTag(requestId, tagId)}
                                        setTags = {this.props.currentReference.tags}//this.props.request.tags}
                                        marginTop = {"1rem"}
                                    />
                                </ReferenceContainer>
                            </InfoBlock>
                            <InfoBlock>
                                <InfoHeader>
                                    <ion-icon style = {
                                                {color: "#172A4E",  marginLeft: "-0.4rem", marginRight: "0.7rem", fontSize: "1.8rem"}
                                        } name="document-text-outline"></ion-icon>
                                    Documents
                                </InfoHeader>
                                <ReferenceContainer>
                                    {this.props.documents && this.props.documents.length > 0 ? this.renderDocuments() : <NoneMessage>None yet</NoneMessage>}
                                    <LabelMenu 
                                        attachTag = {(tagId) => console.log(tagId)}//this.props.attachTag(requestId, tagId)}
                                        removeTag = {(tagId) => console.log(tagId)}//this.props.removeTag(requestId, tagId)}
                                        setTags = {[]}//this.props.request.tags}
                                    />
                                </ReferenceContainer>
                            </InfoBlock>
                            
                                <DirContainer>

                             
                                <DirectoryContainer>
                                    <ListToolBar>
                                        <ListName><b>8</b>&nbsp; documents</ListName>
                                        <ListName><b>15</b>&nbsp; snippets</ListName>
                                    </ListToolBar>
                                    {this.renderFolders()}
                                    {this.renderFiles()}
                                </DirectoryContainer>
                                </DirContainer>
                        </Container> 
                            
                    : <Container>
                            <LoaderContainer>
                                <RotateLoader color = {"#19E5BE"} size = {15} margin={2} />
                            </LoaderContainer>
                        </Container>
                }
            </>
        )
    }
}

/* <ListToolBar>
                                        <ListName><b>8</b>&nbsp; documents</ListName>
                                        <ListName><b>15</b>&nbsp; snippets</ListName>
                                    </ListToolBar>
                                    {this.renderFolders()}
                                    {this.renderFiles()}*/


const mapStateToProps = (state, ownProps) => {
    let { workspaceId, repositoryId, referenceId } = ownProps.match.params
    let documents = Object.values(state.documents).filter(doc => doc.references.includes(referenceId))
    let references = Object.values(state.references).filter(ref => ref._id !== referenceId && ref.path !== "")
    let currentReference;
    if (referenceId) {
        currentReference = state.references[referenceId]
    } else {
        currentReference = Object.values(state.references).filter((ref => ref.path === ""))[0]
    }
    console.log("REPOSITORIES", state.repositories)
    return {
        currentRepository: state.repositories[repositoryId],
        documents,
        references,
        currentReference
    }
}

export default connect(mapStateToProps, { retrieveReferences, editReference, retrieveDocuments, getRepository, attachTag, removeTag } )(DirectoryView);

const Slash = styled.div`
    margin-left: 1rem;
    margin-right: 1rem;
`

const RepositoryPath = styled.div`
    padding: 0.6rem;
    &: hover {
        background-color: #F4F4F6; 
        opacity: 1;
    }
    cursor: pointer;
    border-radius: 0.3rem;
`

const RepositoryButton = styled.div`
    background-color: ${chroma("#5B75E6").alpha(0.15)}; 
    color: #5B75E6;
    font-weight: 400;
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
`

const DirContainer = styled.div`
    align-items: center;
    padding: 3rem;
    background-color:  #F7F9FB;
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    border: 1px solid #DFDFDF;
    border-radius:0.4rem;
`

const NoneMessage = styled.div`
    font-size: 1.3rem;
    margin-right: 1rem;
    opacity: 0.5;
`

const LoaderContainer = styled.div`
    display: flex;
    width: 100%;
    height:100%;
    margin-top: 20rem;
    margin-left: -5rem;
    align-items: center;
    justify-content: center;
`


const InfoHeader = styled.div`
    display: flex;
    align-items: center;
    font-weight: 500;
    font-size: 1.6rem;
    color: #172A4E;
    margin-bottom: 1.5rem;
`

const InfoBlock = styled.div`
    padding-top: 2rem;
    padding-bottom: 2rem;
    display: ${props => props.display};
    border-bottom: ${props => props.borderBottom};
`



const ReferenceContainer = styled.div`
    margin-top: 0.8rem;
    display: flex;
    align-items: center;

`


const Tag = styled.div`
    font-size: 1.25rem;
    color: ${props => props.color}; 
    padding: 0.4rem 0.8rem;
    background-color: ${props => props.backgroundColor}; 
    display: inline-block;
    border-radius: 4px;
    margin-right: 1rem;
`

const Header = styled.div`
    font-size: 1.8rem;
    color: #172A4E;
    margin-bottom: 3rem;
    display: flex;
    align-items: center;
`

const CurrentDocumentationContainer = styled.div`
    display: flex;
    align-items: center;
    margin-top: 1rem;
    border-radius: 0.5rem;
`


const StyledIcon = styled.img`
    width: 5rem;
    align-self: center;
    margin-top: 1.5rem;
`

const Title = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`

const DocumentItem = styled.div`
    height: 3rem;
    width: 15rem;
    padding: 1rem;
    background-color: white;
    border-radius: 0.5rem;
    /*border: 1px solid #DFDFDF;*/
    border: 1px solid #D7D7D7;
    font-size: 1.2rem;
    margin-right: 2rem;
    display: flex;
    align-items: center;
    cursor: pointer;
    &:hover {
        background-color: #F4F4F6; 
    }
`

const DocumentItemText = styled.div`
    font-size: 1rem;
    display: flex;
`

const Container = styled.div`
    padding-bottom: 4rem;
    margin-top: 5rem;
    margin-left: 8rem;
    margin-right: 8rem;
    margin-bottom: 5rem;
`

const DirectoryContainer = styled.div`
    display: flex;
    flex-direction: column;
    background-color: white;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;*/
    min-height: 5rem;
    /*border: 1px solid #DFDFDF;*/
    border-radius: 0.4rem;
    padding-bottom: 0.1rem;
    align-self: stretch;
    
    /*border: 1px solid #E0E4E7;*/
    min-width: 80rem;
`


const ListToolBar = styled.div`
   
    height: 4.5rem;
    display: flex;
    border-bottom: 1px solid #EDEFF1;
    align-items: center;
   
`

const ListName = styled.div`
    margin-left: 3rem;
    color: #172A4E;
    font-size: 1.5rem;
    font-weight: 300;
`


const IconBorder = styled.div`
    margin-left: ${props => props.marginLeft};
    margin-right: 0.2rem;
    display: flex;
    align-items: center;
    opacity: 0.7;
    width: 3.5rem;
    height: 3.5rem;
    &: hover {
        opacity: 1;
        background-color: #F4F4F6; 
    }
    cursor: pointer;
    justify-content: center;
    transition: all 0.1s ease-in;
    border-radius: 0.3rem;
    margin-right: ${props => props.marginRight};
`