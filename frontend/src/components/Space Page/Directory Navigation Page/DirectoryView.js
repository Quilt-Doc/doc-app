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

    constructor(props) {
        super(props) 
        this.state = {
            items: [
                {_id: "1", name: "java.js", kind: "file"},
                {_id: "2", name: "backend", kind: "dir"},
                {_id: "3", name: "apis", kind: "dir"},
                {_id: "4", name: "models", kind: "dir"},
                {_id: "5", name: "controllers", kind: "dir"},
                {_id: "1", name: "index.js", kind: "file"}
            ]
        }
    }

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
        let directories = this.state.items.filter(repositoryItem => repositoryItem.kind === "dir")

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
        let files = this.state.items.filter(repositoryItem => repositoryItem.kind === "file")

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
        if (true) {
            return (
                    
                        
                        <DirectoryContainer>
                            <ListToolBar>
                                <ListName>apis</ListName>
                                <IconBorder
                                        marginLeft = {"100rem"}
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


const Container = styled.div`
    background-color:  white;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
`

const DirectoryContainer = styled.div`
    display: flex;
    flex-direction: column;
    background-color: white;
    width: 115rem;
    margin: 0 auto;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;*/
    padding-bottom: 0.3rem;
    border: 1px solid #DFDFDF;
    border-radius: 0.3rem;
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
    font-size: 2rem;
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