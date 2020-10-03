import React from 'react';

//styles 
import styled from "styled-components"
import "react-loader-spinner/dist/loader/css/react-spinner-loader.css"

//components
import DirectoryItem from './DirectoryItem';
import Loader from 'react-loader-spinner'
import ReferenceInfo from '../reference_info/ReferenceInfo';

//actions
import { retrieveReferences } from '../../../../actions/Reference_Actions';
import { retrieveDocuments } from '../../../../actions/Document_Actions';
import { getRepository } from '../../../../actions/Repository_Actions';

//selectors
import { makeFilterCurrentReference, makeGetCurrentReference, makeGetReferenceDocuments } from '../../../../selectors';

//redux
import { connect } from 'react-redux';

//icons
import {GoFileCode} from 'react-icons/go'

// component that is used to navigate through directories in codebase 
// can view (edit) tags, child files/folders, associated documents, path, etc
class DirectoryNavigator extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            loaded: false,
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

    //2 FARAZ TODO: Check whether loaded is all that is needed
    render() {
        const { currentRepository, currentReference, documents, match} = this.props;
        const { referenceId } =match.params;
        const { loaded } = this.state;
        if (!referenceId){
            referenceId = ""
        }
        return (
            <>
                { loaded ?
                        <Background>
                            <ReferenceInfo
                                currentRepository = {currentRepository}
                                currentReference = {currentReference}
                                documents = {documents}
                                directoryNavigator = {true}
                            />
                            <DirectoryContainer>
                                <ListToolBar>
                                    <GoFileCode style= {{fontSize: "1.8rem", marginRight: "0.7rem"}} />
                                    backend.js
                                    <Statistics>
                                        <ListName><b>8</b>&nbsp; documents</ListName>
                                        <ListName><b>15</b>&nbsp; snippets</ListName>
                                    </Statistics>
                                </ListToolBar>
                                {this.renderFolders()}
                                {this.renderFiles()}
                            </DirectoryContainer>
                        </Background>
                            
                    :   <Loader
                            type="ThreeDots"
                            color="#5B75E6"
                            height={50}
                            width={50}
                            style = {{marginLeft: "8rem", marginTop: "5rem"}}
                        />
                }
            </>
        )
    }
}

const makeMapStateToProps = () => {
    // memoize current reference selection, extracting the documents of the current reference
    // and filtering the current reference from all the references
    const getCurrentReference = makeGetCurrentReference();
    const getReferenceDocuments = makeGetReferenceDocuments();
    const filterCurrentReference = makeFilterCurrentReference();
    
    const mapStateToProps = (state, ownProps) => {
        let { repositoryId, referenceId } = ownProps.match.params;
        let { references, documents, repositories } = state;

        let currentReference = getCurrentReference({referenceId, references});
        documents = getReferenceDocuments({documents, currentReference});
        console.log("CURRENT REFERENCE", currentReference);
        console.log("REFERENCES", references)
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

const Background = styled.div`
    min-height: 100%;
    padding-bottom: 5rem;
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
    margin-left: 5rem;
    margin-right: 5rem;
`

const ListToolBar = styled.div`
    font-size: 1.5rem;
    height: 4.5rem;
    display: flex;
    font-weight: 500;
    align-items: center;
    border-bottom: 1px solid #EDEFF1;
    padding: 0rem 3rem;
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