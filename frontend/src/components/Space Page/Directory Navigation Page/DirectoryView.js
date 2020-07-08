import React from 'react';

//styles 
import styled from "styled-components"

//react-router
import { withRouter } from 'react-router';

//components
import DirectoryItem from './DirectoryItem';

//actions
import { retrieveReferences } from '../../../actions/Reference_Actions';
//connect
import { connect } from 'react-redux';

class DirectoryView extends React.Component {

    constructor(props) {
        super(props) 

    }

    // USE PARAMS
    componentDidMount() {
        let split = window.location.pathname.split('/')
        if (split.length === 7 || split[7] === ""){
            return this.props.retrieveReferences({truncatedPath : true, kinds : ['file', 'dir'], repositoryID: split[5]})
        }
        let currentDirectoryID = split[7]
        this.props.retrieveReferences({currentDirectoryID, kinds : ['file', 'dir'],  repositoryID: split[5]})
    }

    componentDidUpdate(prevProps) {
        if (prevProps.location.pathname !== this.props.location.pathname) {
            let split = window.location.pathname.split('/')
            let currentDirectoryID = split[7]
            this.props.retrieveReferences({currentDirectoryID, kinds : ['file', 'dir']})
        }
    }

    renderFolders = () => {
        let directories = this.props.references.filter(reference => reference.kind === "dir")

        if (directories) {
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

    render() {
        if (this.props.references) {
            return (
                    
                        <DirectoryContainer>
                            <ListToolBar>
                                <ListName>apis</ListName>
                                <IconBorder
                                        marginLeft = {"69rem"}
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
        references: Object.values(state.references)
    }
}

export default withRouter(connect(mapStateToProps, { retrieveReferences } )(DirectoryView));


const Container = styled.div`
    background-color:  #F7F9FB;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
    padding: 3rem;
`

const DirectoryContainer = styled.div`
    display: flex;
    flex-direction: column;
    background-color: white;
    width: 85rem;
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