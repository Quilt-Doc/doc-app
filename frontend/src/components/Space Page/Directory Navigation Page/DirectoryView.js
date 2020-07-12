import React from 'react';

//styles 
import styled from "styled-components"

//components
import DirectoryItem from './DirectoryItem';

//actions
import { retrieveReferences } from '../../../actions/Reference_Actions';
//connect
import { connect } from 'react-redux';
import { tomorrowNightEighties } from 'react-syntax-highlighter/dist/esm/styles/hljs';

class DirectoryView extends React.Component {

    // USE PARAMS
    componentDidMount() {
        let { repositoryID, referenceID } = this.props.match.params
        if (referenceID !== null && referenceID !== undefined) {
            this.props.retrieveReferences({repositoryID, referenceID, kinds : ['file', 'dir']})
        } else {
            this.props.retrieveReferences({repositoryID, truncated: true, kinds : ['file', 'dir']})
        }
    }

    componentDidUpdate(prevProps) {
        /*
        if (prevProps.location.pathname !== this.props.location.pathname) {
            let { repositoryID, referenceID } = this.props.match.params
            if (referenceID !== null && referenceID !== undefined) {
                this.props.retrieveReferences({repositoryID, referenceID, kinds : ['file', 'dir']})
            } else {
                console.log("TRUNCATED BOY")
                this.props.retrieveReferences({repositoryID, truncated: true, kinds : ['file', 'dir']})
            }
           
        }*/
    }

    renderFolders = () => {
        //let currID = this.props.currentReference._id
        //let {referenceID} = this.props.match.params
        let directories = this.props.references.filter(reference => reference.kind === "dir" && reference._id !== this.props.match.params.referenceID )//&& reference._id !== currID)
        
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

    renderHeader(){
        let name = this.props.currentRepository.fullName.split('/')[1]
        if (this.props.references.length > 0){
            console.log(this.props.references)
            let splitPath = this.props.references[0].path.split('/')
            let headerItems = [name]
            splitPath.map(item => {
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

    render() {
        //console.log("CURRENT REFERENCE", this.props.currentReference)
        if (this.props.references.length > 0) {
            return (
                <Container>
                    <Header>{this.renderHeader()}</Header>
                    <DirectoryContainer>
                        <ListToolBar>
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
                    
            );
        } return null
    }
}

const mapStateToProps = (state, ownProps) => {
    let { workspaceID, repositoryID, referenceID} = ownProps.match.params
    console.log(referenceID)
    //console.log("WORKSPACE ID", workspaceID)
    //console.log(state.workspaces)
    //console.log("REPO ID", repositoryID)
    //console.log("REPOS", state.workspaces[workspaceID].repositories)
    return {
        currentRepository: state.workspaces[workspaceID].repositories.filter(repo => repo._id === repositoryID)[0],
       
        references: Object.values(state.references)
    }
}

export default connect(mapStateToProps, { retrieveReferences } )(DirectoryView);


const Header = styled.div`
    font-size: 2rem;
    color: #172A4E;
    margin-bottom: 5rem;
`

const Container = styled.div`
    margin-left: 10rem;
    margin-top: 2rem;
    margin-right: 10rem;
    padding-bottom: 4rem;
`

const DirectoryContainer = styled.div`
    display: flex;
    flex-direction: column;
    background-color: white;
    width: 85rem;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;*/
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