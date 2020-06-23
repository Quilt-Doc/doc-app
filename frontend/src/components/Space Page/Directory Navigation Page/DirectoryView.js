import React from 'react';

//styles 
import styled from "styled-components"

//react-router
import { withRouter } from 'react-router';

//components
import DirectoryItem from './DirectoryItem';

//actions
import { refreshRepositoryPathNew, getRepositoryRefs } from '../../../actions/Repository_Actions';
import { retrieveRepositoryItems } from '../../../actions/RepositoryItem_Actions'
//connect
import { connect } from 'react-redux';

class DirectoryView extends React.Component {

    componentDidMount() {
        // acquires the repository path from the url --- may need to change how this is done (hash, github Oauth)
        
        let urlSplit = window.location.pathname.split('/').slice(3)
        if (urlSplit.slice(urlSplit.length - 1)[0] === '') {
            urlSplit.pop()
        }
        let path = urlSplit.length > 1 ? urlSplit.slice(1).join('/') : ''
        this.props.retrieveRepositoryItems({path, repositoryID: urlSplit.slice(0, 1)[0]})
        /*
        this.props.refreshRepositoryPathNew({repositoryPath: window.location.pathname.slice(22)}).then(() => {
            this.props.getRepositoryRefs({
                repoLink: window.location.pathname.slice(22)
            });
        })
        */
    }

    componentDidUpdate(prevProps) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            let urlSplit = window.location.pathname.split('/').slice(3)
            console.log('urlSplit: ', urlSplit);
            if (urlSplit.slice(urlSplit.length - 1)[0] === '') {
                urlSplit.pop()
            }
            console.log('urlSplit: ', urlSplit);
            let path = urlSplit.length > 1 ? urlSplit.slice(1).join('/') : ''
            console.log('path: ', path);
            console.log('Calling Retrieve 2');
            this.props.retrieveRepositoryItems({path, repositoryID: urlSplit.slice(0, 1)[0]})
        }
    }

    renderFolders = () => {
        let directories = this.props.repositoryItems.filter(repositoryItem => repositoryItem.kind === "dir")

        if (directories) {
            directories = directories.sort((a, b) => {if (a.name < b.name) return -1; else if (a.name > b.name) return 1; else return 0})
        }

        return directories.map((directory, i) => {
            let borderBottom = i === this.props.repositoryItems.length - 1 ? '1px solid #EDEFF1;' : ''
            return (<DirectoryItem 
                        key = {directory._id} 
                        item = {directory}
                        type = {'folder'}
                        borderBottom = {borderBottom}
                    />    
                    )
        })
    }

    renderFiles = () => {
        let files = this.props.repositoryItems.filter(repositoryItem => repositoryItem.kind === "file")

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

    render() {
        if (this.props.repositoryItems) {
            return (
                    <DirectoryContainer>
                        {this.renderFolders()}
                        {this.renderFiles()}
                    </DirectoryContainer>
            );
        }
    }
}

const mapStateToProps = (state) => {
    return {
        repositoryItems: Object.values(state.repositoryItems),
    }
}

export default withRouter(connect(mapStateToProps, { refreshRepositoryPathNew, getRepositoryRefs, retrieveRepositoryItems } )(DirectoryView));


const DirectoryContainer = styled.div`
    margin-top: 7rem;
    border-radius: 0.1rem;
    display: flex;
    flex-direction: column;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`