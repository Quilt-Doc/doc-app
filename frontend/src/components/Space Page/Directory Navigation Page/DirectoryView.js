import React from 'react';

//styles 
import styled from "styled-components"
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css"
import chroma from 'chroma-js';

//images and icons
import doc_icon from '../../../images/doc-file.svg';
import { FiFileText } from 'react-icons/fi';

//components
import DirectoryItem from './DirectoryItem';
import RotateLoader from "react-spinners/RotateLoader";
import Loader from 'react-loader-spinner'
import TagWrapper from '../../General/TagWrapper';
import LabelMenu from '../../General/Menus/LabelMenu'
import DocumentMenu from '../../General/Menus/DocumentMenu';
import RepositoryMenu from '../../General/Menus/RepositoryMenu';

//history
import history from '../../../history';

//actions
import { getReferenceFromPath, retrieveReferences, editReference, attachTag, removeTag} from '../../../actions/Reference_Actions';
import { retrieveDocuments } from '../../../actions/Document_Actions';
import { getRepository } from '../../../actions/Repository_Actions';

//connect
import { connect } from 'react-redux';

class DirectoryView extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            loaded: false,
            tagMenuOpen: false,
            focused: false,
            changeRepoOpen: false
        }
    }

    async loadResources(){
        let { repositoryId, referenceId, workspaceId } = this.props.match.params
        console.log('repid', repositoryId)
        console.log('refid', referenceId)
        if (!referenceId) referenceId = ""
        await this.props.getRepository({workspaceId, repositoryId});
        await this.props.retrieveReferences({ workspaceId, repositoryId, referenceId, kinds : ['file', 'dir'] })
        console.log(this.props.references);
        let referenceIds = this.props.references.map(ref => ref._id)
        referenceIds.push(this.props.currentReference._id)
        await this.props.retrieveDocuments({ workspaceId, referenceIds, workspaceId })
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

    async redirectPath(path) {
        let {workspaceId, repositoryId} = this.props.match.params
        let ref = await this.props.getReferenceFromPath({workspaceId, path, repositoryId})
        history.push(`/workspaces/${workspaceId}/repository/${repositoryId}/dir/${ref[0]._id}`)
    }


    renderHeaderPath() {
        if (this.props.currentReference && this.props.currentReference.path !== "") {
            let splitPath = this.props.currentReference.path.split("/")
            return splitPath.map((sp, i) => {
                let reLocate = splitPath.slice(0, i + 1).join("/");
                return(<><Slash>/</Slash><RepositoryPath onClick = {() => {this.redirectPath(reLocate)}}>{sp}</RepositoryPath></>)
            })
        }
    }

    renderTags(){
        let colors = ['#5352ed', 
        '#ff4757', '#20bf6b','#1e90ff', '#ff6348', '#e84393', '#1e3799', '#b71540', '#079992'
        ]

        return this.props.currentReference.tags.map(tag => {
            let color = tag.color < colors.length ? colors[tag.color] : 
                colors[tag.color - Math.floor(tag.color/colors.length) * colors.length];

            return <Tag color = {color} backgroundColor = {chroma(color).alpha(0.15)}>{tag.label}</Tag>
        })
    }



    renderDocuments(){
        return this.props.documents.map(doc => {
            let title = doc.title
            return <DocumentItem onClick = {() => history.push(`?document=${doc._id}`)}>
                        <FiFileText style = {{fontSize: "1.35rem", 'marginRight': '0.55rem'}}/>
                        <Title>{title && title !== "" ? title : "Untitled"}</Title>
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
                { this.state.loaded && this.props.currentReference ?
                        <>
                            <Info>
                                <Header>
                                    <RepositoryMenu 
                                        name = {this.props.currentRepository.fullName.split("/")[1]}
                                    />
                                    {this.renderHeaderPath()}
                                </Header>
                                <ReferenceContainer>
                                    {this.props.currentReference && this.props.currentReference.tags && this.props.currentReference.tags.length > 0 ? 
                                        this.renderTags() : <></>}
                                </ReferenceContainer>
                                <ReferenceContainer>
                                    {this.props.documents && this.props.documents.length > 0 ? this.renderDocuments() : <NoneMessage>None yet</NoneMessage>}
                                    
                                </ReferenceContainer>
                           
                            </Info>
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
                            </>
                            
                    : <>
                            <Loader
                                type="ThreeDots"
                                color="#5B75E6"
                                height={50}
                                width={50}
                                //3 secs
                                style = {{marginLeft: "8rem", marginTop: "5rem"}}
                            />
                        </>
                }
            </>
        )
    }
}
/*
<LabelMenu 
attachTag = {(tagId) => this.props.attachTag(this.props.currentReference._id, tagId)}//this.props.attachTag(requestId, tagId)}
removeTag = {(tagId) => this.props.removeTag(this.props.currentReference._id, tagId)}//this.props.removeTag(requestId, tagId)}
setTags = {this.props.currentReference.tags}//this.props.request.tags}
marginTop = {"1rem"}

/>*/

/* <DocumentMenu
                                            setDocuments = {this.props.documents}
                                            marginTop = {"1rem"}
                                            reference = {this.props.currentReference}
                                        />*/

/* <InfoHeader>
                                    <ion-icon style = {
                                                {color: "#172A4E", marginRight: "0.7rem", fontSize: "1.8rem"}
                                    } name="pricetag-outline"></ion-icon>
                                    Labels
                                </InfoHeader>*/
/* <ListToolBar>
                                        <ListName><b>8</b>&nbsp; documents</ListName>
                                        <ListName><b>15</b>&nbsp; snippets</ListName>
                                    </ListToolBar>
                                    {this.renderFolders()}
                                    {this.renderFiles()}*/


const mapStateToProps = (state, ownProps) => {
    let { workspaceId, repositoryId, referenceId } = ownProps.match.params

    let currentReference;
    if (referenceId) {
        currentReference = state.references[referenceId]
    } else {
        currentReference = Object.values(state.references).filter((ref => ref.path === ""))[0]
    }

    let documents = []
    if (currentReference) {
        documents = Object.values(state.documents).filter(doc => 
            {
                for (let i = 0; i < doc.references.length; i++){
                    if (doc.references[i]._id === currentReference._id) {
                        return true
                    }
                } return false
            }
        )
    }

    let references = Object.values(state.references).filter(ref => ref._id !== referenceId && ref.path !== "")
   

    return {
        currentRepository: state.repositories[repositoryId],
        documents,
        references,
        currentReference
    }
}

export default connect(mapStateToProps, { retrieveReferences, editReference, retrieveDocuments, getRepository, getReferenceFromPath, attachTag, removeTag } )(DirectoryView);


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

const Info = styled.div`
    padding: 3.5rem 8rem;
    padding-bottom: 1.7rem;
    z-index: 1;
`

const DirContainer = styled.div`
    align-items: center;
    padding: 3rem 8rem;
    background-color:  #F7F9FB;
    display: flex;
    flex-direction: column;
    /*border: 1px solid #DFDFDF;*/
    border-top: 1px solid #E0E4E7;
    z-index: 0;
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
    font-size: 1.5rem;
    color: #172A4E;
    margin-bottom: 1.5rem;
`


const ReferenceContainer = styled.div`
    margin-bottom: 2.7rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    &:last-of-type {
        margin-bottom: 1.5rem;
    }
`

const Tag = styled.div`
    font-size: 1.25rem;
    color: ${props => props.color}; 
    padding: 0.45rem 0.8rem;
    background-color: ${props => chroma(props.color).alpha(0.15)};
    display: inline-block;
    border-radius: 0.3rem;
	margin-right: 1.35rem;
	font-weight: 500;
`


const Header = styled.div`
    font-size: 1.5rem;
    color: #172A4E;
    margin-bottom: 2.7rem;
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
    
`

const DocumentItem = styled.div`
    /*width: 15rem;*/
    
    border-radius: 0.4rem;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;*/
    /*border: 0.1px solid #D7D7D7;*/
    /*border: 1px solid #E0E4E7;*/
    font-size: 1.25rem;
    margin-right: 1.8rem;
    display: flex;
    cursor: pointer;
    &:hover {
        color: #1E90FF;
    }
    font-weight: 500;
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
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;*/
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;*/
    min-height: 5rem;
    /*border: 1px solid #DFDFDF;*/
    border-radius: 0.4rem;
    padding-bottom: 0.1rem;
    align-self: stretch;
    

    min-width: 80rem;
`


const ListToolBar = styled.div`
   
    height: 4.5rem;
    display: flex;
   
    align-items: center;
    border-bottom: 1px solid #EDEFF1;
   
`

const ListName = styled.div`
    margin-left: 3rem;
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