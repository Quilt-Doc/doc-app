import React from 'react';

//styles 
import styled from "styled-components"

//react-router
import { withRouter } from 'react-router';

//components
import DirectoryItem from './DirectoryItem';

//actions
import { repoRefreshPathNew } from '../../actions/Repo_Actions';

//connect
import { connect } from 'react-redux';

class DirectoryViewer extends React.Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        console.log(window.location.pathname)
        console.log({repo_path: window.location.pathname.slice(20)})
        this.props.repoRefreshPathNew({repo_path: window.location.pathname.slice(20)})
    }

    componentDidUpdate(prevProps) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            this.props.repoRefreshPathNew({repo_path: window.location.pathname.slice(20)})
        }
    }

    renderFolders = () => {
        let directories = this.props.contents.filter(content => content.type === "dir")

        if (directories) {
            directories = directories.sort((a, b) => {if (a.name < b.name) return -1; else if (a.name > b.name) return 1; else return 0})
        }

        return directories.map((directory, i) => {
            let border_bottom = i === this.props.contents.length - 1 ? '1px solid #EDEFF1;' : ''
            return (<DirectoryItem 
                        key = {directory.sha} 
                        item = {directory}
                        type = {'folder'}
                        border_bottom = {border_bottom}
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
            let border_bottom = i === files.length - 1 ? '1px solid #EDEFF1;' : ''
            return (<DirectoryItem 
                        key = {file.sha} 
                        item = {file}
                        type = {'document-outline'} 
                        border_bottom = {border_bottom}
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
    console.log('STATE.REPOS.PATH_CONTENTS: ', state.repos.path_contents)
    if (typeof state.repos.path_contents == 'undefined' || state.repos.path_contents == null){
        return {
            contents: []
        }
    }

    return {
        contents: Object.values(state.repos.path_contents)
    }
}

export default withRouter(connect(mapStateToProps, { repoRefreshPathNew } )(DirectoryViewer));


const DirectoryContainer = styled.div`
    
    margin-top: 7rem;
    border-radius: 0.1rem;
    display: flex;
    flex-direction: column;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`

/*

 <DirectoryItem 
                            key = {'1'} 
                            item = {{name: 'wav2vec.py', type: 'file', download_url: 'rat.com/three'}}
                            type = {'document-outline'}
                            border_bottom = {''}
                        />    
                        <DirectoryItem 
                            key = {'2'} 
                            item = {{name: 'features', type: 'dir', download_url: 'rat.com/three'}}
                            type = {'folder'}
                            border_bottom = {''}
                        />    
                        <DirectoryItem 
                            key = {'3'} 
                            item = {{name: 'BERT', type: 'dir', download_url: 'rat.com/three'}}
                            type = {'folder'}
                            border_bottom = {'1px solid #EDEFF1;'}
                        />    

                        */