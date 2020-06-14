import React from 'react';

//styles 
import styled from "styled-components"

//react-router
import { withRouter } from 'react-router';

//components
import DirectoryItem from './DirectoryItem';

//actions
import { refreshRepositoryPathNew } from '../../../actions/Repository_Actions';

//connect
import { connect } from 'react-redux';

class DirectoryView extends React.Component {

    componentDidMount() {
        // acquires the repository path from the url --- may need to change how this is done (hash, github Oauth)
        console.log(window.location.pathname.slice(22))
        this.props.refreshRepositoryPathNew({repositoryPath: window.location.pathname.slice(22)})
    }

    componentDidUpdate(prevProps) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            this.props.refreshRepositoryPathNew({repositoryPath: window.location.pathname.slice(22)})
        }
    }

    renderFolders = () => {
        let directories = this.props.contents.filter(content => content.type === "dir")

        if (directories) {
            directories = directories.sort((a, b) => {if (a.name < b.name) return -1; else if (a.name > b.name) return 1; else return 0})
        }

        return directories.map((directory, i) => {
            let borderBottom = i === this.props.contents.length - 1 ? '1px solid #EDEFF1;' : ''
            return (<DirectoryItem 
                        key = {directory.sha} 
                        item = {directory}
                        type = {'folder'}
                        borderBottom = {borderBottom}
                    />    
                    )
        })
    }

    renderFiles = () => {
        let files = this.props.contents.filter(content => content.type === "file")

        if (files) {
            files = files.sort((a, b) => {if (a.name < b.name) return -1; else if (a.name > b.name) return 1; else return 0})
        }
        return files.map((file, i) => {
            let borderBottom = i === files.length - 1 ? '1px solid #EDEFF1;' : ''
            return (<DirectoryItem 
                        key = {file.sha} 
                        item = {file}
                        type = {'document-outline'} 
                        borderBottom = {borderBottom}
                    />)
        })
    }

    render() {
        if (this.props.contents) {
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
    console.log('STATE.repositories.pathContents: ', state.repositories.pathContents)
    if (typeof state.repositories.pathContents == 'undefined' || state.repositories.pathContents == null){
        return {
            contents: []
        }
    }

    return {
        contents: Object.values(state.repositories.pathContents)
    }
}

export default withRouter(connect(mapStateToProps, { refreshRepositoryPathNew } )(DirectoryView));


const DirectoryContainer = styled.div`
    margin-top: 7rem;
    border-radius: 0.1rem;
    display: flex;
    flex-direction: column;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`