import React from 'react';

//styles 
import styled from "styled-components"

//images
import doc_icon from '../../../images/doc-file.svg';

//components
import DirectoryItem from './DirectoryItem';
import RotateLoader from "react-spinners/RotateLoader";
import TagWrapper from '../../General Components/TagWrapper';

//history
import history from '../../../history';

//actions
import { retrieveReferences, editReference } from '../../../actions/Reference_Actions';
import { retrieveDocuments } from '../../../actions/Document_Actions';


//connect
import { connect } from 'react-redux';
import { tomorrowNightEighties } from 'react-syntax-highlighter/dist/esm/styles/hljs';

class DirectoryView extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            loaded: false,
            tagMenuOpen: false
        }
    }

    loadResources(){
        let { repositoryId, referenceId } = this.props.match.params
        if (referenceId !== null && referenceId !== undefined) {
            this.props.retrieveReferences({repositoryId, referenceId, kinds : ['file', 'dir']}).then(() => {
                let referenceIds = this.props.references.map(ref => ref._id)
                this.props.retrieveDocuments({referenceIds}).then(() => {
                    if (!this.state.loaded) {
                        this.setState({ loaded:true })
                    }
                })
            })
        } else {
            this.props.retrieveReferences({repositoryId, truncated: true, kinds : ['file', 'dir']}).then(() => {
                let referenceIds = this.props.references.map(ref => ref._id)
                this.props.retrieveDocuments({referenceIds}).then(() => {
                    if (!this.state.loaded) {
                        this.setState({ loaded:true })
                    }
                })
            })
        }
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

    renderHeader() {
        
        let name = this.props.currentRepository.fullName.split('/')[1]
        if (this.props.references.length > 0) {
            let splitPath = this.props.references[0].path.split('/')
            let headerItems = [name]
            splitPath.map( item => {
                headerItems.push("/");
                headerItems.push(item);
            })
            headerItems.pop()
            headerItems.pop()
            return headerItems.join(" ")
        } else {
            return name
        }
    }

    renderTags(){
        return this.props.currentReference.tags.map(tag => {
            return <Tag>{tag.label}</Tag>
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

    render() {
        let { referenceId, workspaceId, repositoryId } = this.props.match.params
        if (this.props.currentReference) {
            console.log(this.props.currentReference.tags)
        }
        return (
            <>
                { this.state.loaded ?
                        <Container>
                            <Header>{this.renderHeader()}</Header>
                            <InfoBlock>
                                <InfoHeader>Tags</InfoHeader>
                                { this.state.tagMenuOpen ?  
                                    <TagWrapper 
                                        onChange = {(tags) => this.props.editReference(referenceId, {tags})}
                                        tags = {this.props.currentReference.tags}
                                        onBlur =  {() => this.setState({tagMenuOpen: false})}
                                    /> : 
                                    <ReferenceContainer onClick = {() => this.setState({tagMenuOpen: true})}>
                                        {this.renderTags()}
                                    </ReferenceContainer>}
                            </InfoBlock>
                            <InfoBlock>
                                <InfoHeader>Documents</InfoHeader>
                                <CurrentDocumentationContainer>
                                    {this.renderDocuments()}
                                </CurrentDocumentationContainer>
                            </InfoBlock>
                            
                            <DirectoryContainer>
                                <ListToolBar>
                                    <ListName><b>82</b>&nbsp; references</ListName>
                                    <ListName><b>15</b>&nbsp; snippets</ListName>
                                    <ListName><b>8</b>&nbsp; documents</ListName>
                                    <IconBorder
                                            marginLeft = {"auto"}
                                    >
                                        <ion-icon style={{'color': '#172A4E', 'fontSize': '2.2rem'}} name="search-outline"></ion-icon>
                                    </IconBorder>
                                    <IconBorder marginRight = {"1rem"}>
                                        <ion-icon style={{'color': '#172A4E', 'fontSize': '2.2rem', }} name="filter-outline"></ion-icon>
                                    </IconBorder>
                                </ListToolBar>
                                {this.renderFolders()}
                                {this.renderFiles()}
                            </DirectoryContainer>
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


const mapStateToProps = (state, ownProps) => {
    let { workspaceId, repositoryId, referenceId } = ownProps.match.params
    let documents = Object.values(state.documents).filter(doc => doc.references.includes(referenceId))
    let references = Object.values(state.references).filter(ref => ref._id !== referenceId)
    return {
        currentRepository: state.workspaces[workspaceId].repositories.filter(repo => repo._id === repositoryId)[0],
        documents,
        references,
        currentReference : state.references[referenceId]
    }
}

export default connect(mapStateToProps, { retrieveReferences, editReference, retrieveDocuments } )(DirectoryView);


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
    font-weight: 400;
    font-size: 1.15rem;
    font-weight: 600;
    color: #172A4E;
  
`

const InfoBlock = styled.div`
    margin-bottom: 1.5rem;
`

const ReferenceContainer = styled.div`
    margin-top: 0.25rem;
    padding: 0.75rem;
    cursor: pointer;
    margin-left: -0.75rem;
    display: inline-block;
    min-width: 40rem;
    border-radius: 0.3rem;
    &:hover {
        background-color: #F4F4F6; 
    }
`

const Tag = styled.div`
    font-size: 1.25rem;
    color: #2980b9;
    padding: 0.6rem 0.8rem;
    background-color: rgba(51, 152, 219, 0.1);
    display: inline-block;
    border-radius: 4px;
    margin-right: 1rem;
`

const Header = styled.div`
    font-size: 2rem;
    color: #172A4E;
    margin-bottom: 3rem;
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
    margin-left: 10rem;
    margin-top: 4rem;
    margin-right: 10rem;
    padding-bottom: 4rem;
`

const DirectoryContainer = styled.div`
    display: flex;
    flex-direction: column;
    background-color: white;
    width: 90rem;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;*/
    border: 1px solid #DFDFDF;
    border-radius: 0.5rem;
    margin-top: 4rem;
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