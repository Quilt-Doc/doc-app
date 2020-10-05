import React from 'react';

//styles 
import styled from "styled-components"
import chroma from 'chroma-js';

//components
import DirectoryItem from './DirectoryItem';
import Loader from 'react-loader-spinner'
import ReferenceInfo from '../reference_info/ReferenceInfo';
import RepositoryMenu from '../../../menus/RepositoryMenu';
//loader
import { Oval } from 'svg-loaders-react';

//actions
import { retrieveReferences } from '../../../../actions/Reference_Actions';
import { retrieveDocuments } from '../../../../actions/Document_Actions';
import { getRepository } from '../../../../actions/Repository_Actions';

//selectors
import { makeFilterCurrentReference, makeGetCurrentReference, makeGetReferenceDocuments } from '../../../../selectors';

//redux
import { connect } from 'react-redux';

//icons
import {RiEdit2Line} from 'react-icons/ri'
import { FiChevronDown } from 'react-icons/fi';


// component that is used to navigate through directories in codebase 
// can view (edit) tags, child files/folders, associated documents, path, etc
class DirectoryNavigator extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            loaded: false,
            edit: false
        }
    }

    // loads the directory viewer with documents and references (child and current) of the 
    // current directory --- also gets the repository just in case
    async loadResources(){
        const { match, retrieveDocuments, retrieveReferences, getRepository } = this.props;
        const { repositoryId, referenceId, workspaceId } = match.params;

        await Promise.all([
            getRepository({workspaceId, repositoryId}),
            retrieveReferences({ workspaceId, repositoryId, referenceId, kinds : ['file', 'dir'] }),
            retrieveDocuments({ workspaceId, referenceId, minimal: true }) //FARAZ TODO: support for root referenceId
        ]);

        const { currentReference } = this.props;
        const { loaded } = this.state;
        if ( currentReference && !loaded ) this.setState({ loaded: true });
    }

    componentDidMount() {
        this.loadResources();
    }

    // checks to see whether the location pathname has changed but
    // the component is the same to reload the directory_navigator's data
    componentDidUpdate(prevProps) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            this.setState({loaded: false});
            this.loadResources();
        }
    }

    renderLoader = () => {
        return(
            <LoaderContainer>
                <Oval
                    stroke="#d9d9e2"
                />
            </LoaderContainer>
        )
    }

    // directory_navigator first renders the child references that are
    // directories (sorted in alphabetical order)
    renderFolders = () => {
        const { references } = this.props;
        
        let directories = references.filter(reference => reference.kind === "dir");
        
        if (directories.length > 0) {
            directories = directories.sort((a, b) => {
                if (a.name < b.name) return -1; else if (a.name > b.name) return 1; else return 0});
        }

        return directories.map((directory, i) => {
            return (
                <DirectoryItem 
                    key = {directory._id} 
                    item = {directory}
                    kind = {'dir'}
                />    
            );
        })
    }

    // directory_navigator secondly renders the child references that are
    // files (sorted in alphabetical order)
    renderFiles = () => {
        const {references} = this.props;
        let files = references.filter(reference => reference.kind === "file");

        if (files.length > 0) {
            files = files.sort((a, b) => {if (a.name < b.name) 
                return -1; else if (a.name > b.name) return 1; else return 0});
        }

        return files.map((file, i) => {
            return (
                <DirectoryItem 
                    key = {file._id} 
                    item = {file}
                    kind = {'file'}
                />
            );
        })
    }

    renderRepoName = () => {
        const { currentRepository: { fullName }} = this.props;
        return fullName.split('/').slice(1).join("/").toUpperCase();
    }

    renderRefName = () => {
        const { currentReference: {name},   currentRepository: { fullName }} = this.props;
        if (name === fullName) return name.split('/').slice(1).join("/")
        return name;
    }

    //2 FARAZ TODO: Check whether loaded is all that is needed
    render() {
        const { currentRepository, currentReference, documents, match} = this.props;
        const { referenceId } = match.params;
        const { loaded, edit } = this.state;
        if (!referenceId){
            referenceId = ""
        }
        return (
            <>
                { (loaded && currentRepository && currentReference && documents) ?
                        <Background>
                            <Top>
                                <RepositoryMenu repoName = {this.renderRepoName()}/>
                                <Toolbar>
                                <Button active = {edit}
                                    onClick = {() => {this.setState({edit: !this.state.edit})}}
                                >
                                    <RiEdit2Line/>
                                </Button>
                                </Toolbar>
                            </Top>
                            <Container>
                                <Content>
                                    <ReferenceInfo
                                        edit = {edit}
                                        currentRepository = {currentRepository}
                                        currentReference = {currentReference}
                                        documents = {documents}
                                        directoryNavigator = {true}
                                    />
                                    <DirectoryContainer>
                                        <ListToolBar>
                                            {this.renderRefName()}
                                        </ListToolBar>
                                        {this.renderFolders()}
                                        {this.renderFiles()}
                                    </DirectoryContainer>
                                </Content>
                            </Container>
                        </Background>
                            
                    :  this.renderLoader()
                }
            </>
        )
    }
}

const makeMapStateToProps = () => {
    // memoize current reference selection, extracting the documents of the current reference
    // and filtering the current reference from all the references
    //const getCurrentReference = makeGetCurrentReference();
    const getReferenceDocuments = makeGetReferenceDocuments();
    const filterCurrentReference = makeFilterCurrentReference();
    
    const mapStateToProps = (state, ownProps) => {
        let { repositoryId, referenceId } = ownProps.match.params;
        let { references, documents, repositories } = state;

        let currentReference = references[referenceId];
        documents = getReferenceDocuments({documents, currentReference});
        references = filterCurrentReference({referenceId, references});

        return {
            currentRepository: repositories[repositoryId],
            documents,
            references,
            currentReference
        }
    }

    return mapStateToProps;
}

export default connect(makeMapStateToProps, { retrieveReferences, 
    retrieveDocuments, getRepository })(DirectoryNavigator);

const Toolbar = styled.div`
    margin-left: auto;
    padding-right: 4rem;
`

const Button = styled.div`
    &:last-of-type {
        margin-right: 0rem;
    }
    margin-right: 1.3rem;
    width: 3rem;
	height: 3rem;
    display: flex;
    font-size: 2.4rem;
    justify-content: center;
    align-items: center;
    position: relative;
    z-index: 0;
    border-radius: 0.3rem;
    &:hover {
        background-color:  ${props => props.active ? chroma("#5B75E6").alpha(0.2) : "#dae3ec;"};
    }
    background-color: ${props => props.active ? chroma("#5B75E6").alpha(0.2)  : ""};
    cursor: pointer;
`

const Content = styled.div`
    width: 80%;
    max-width: 110rem;
    min-width: 80rem;
`

const Container = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-top: 2rem;
    align-items: center;
`

const LoaderContainer = styled.div`
    height: 100%;
    width: 100%;
    margin-left: 0.2rem;
    display: flex;
    justify-content: center;
    align-items: center;
`

const Top = styled.div`
    display: flex;
    align-items: center;
`

const Background = styled.div`
    min-height: 100%;
    padding: 2.1rem;
    padding-bottom: 5rem;
    background-color: #f6f7f9;
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
`

const ListToolBar = styled.div`
    font-size: 1.5rem;
    height: 4.5rem;
    display: flex;
    font-weight: 500;
    align-items: center;
    border-bottom: 1px solid #EDEFF1;
    padding: 0rem 2rem;
`

const Statistics = styled.div`
    margin-left: auto; 
    display: flex;
    align-items: center;
`

const ListName = styled.div`
    margin-left: 3rem;
    font-size: 1.5rem;
    font-weight: 300;
`