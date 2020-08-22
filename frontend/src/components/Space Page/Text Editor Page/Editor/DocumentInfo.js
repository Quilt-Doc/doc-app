import React from 'react'

//styles
import styled from "styled-components";
import chroma from 'chroma-js';

//actions
import { getDocument, editDocument, 
    renameDocument, getParent, attachTag, removeTag } from '../../../../actions/Document_Actions';

//components
import LabelMenu from '../../../General/Menus/LabelMenu';
import FileReferenceMenu from '../../../General/Menus/FileReferenceMenu';
import RepositoryMenu2 from '../../../General/Menus/RepositoryMenu2'

//redux
import { connect } from 'react-redux';

//icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCube, faTag} from '@fortawesome/free-solid-svg-icons'
import {RiGitRepositoryLine} from 'react-icons/ri'

//router
import { withRouter } from 'react-router-dom';
import history from '../../../../history';

class DocumentInfo extends React.Component {
    constructor(props){
        super(props)
    }

    renderFullName(){
        console.log(this.props.document.repository)
        let split = this.props.document.repository.fullName.split("/")
        return `${split[0]} / ${split[1]}`
       
    }

    renderFolders = () => {
        let {references} = this.props.document
        let directories = references.filter(reference => reference.kind === "dir")
        
        if (directories.length > 0) {
            directories = directories.sort((a, b) => {if (a.name < b.name) return -1; else if (a.name > b.name) return 1; else return 0})
        }

        return directories.map((directory, i) => {
            return ( <Reference>
                            <ion-icon name="folder"
                            style = {
                                {marginRight: "0.55rem", fontSize: "1.4rem"}}></ion-icon>
                            {directory.name}
                    </Reference>
                    )
        })
    }

    renderFiles = () => {
        let {references} = this.props.document
        let files = references.filter(reference => reference.kind === "file")

        if (files) {
            files = files.sort((a, b) => {if (a.name < b.name) return -1; else if (a.name > b.name) return 1; else return 0})
        }
        return files.map((file, i) => {
            return (
                <Reference>
                    <ion-icon name="document-outline"
                    style = {
                        {marginRight: "0.55rem", fontSize: "1.4rem"}}></ion-icon>
                   {file.name}
                </Reference>
            )
        })
    }

    renderTags(){
        let colors = ['#5352ed', 
            '#ff4757', '#20bf6b','#1e90ff', '#ff6348', '#e84393', '#1e3799', '#b71540', '#079992'
        ]
       return this.props.document.tags.map((tag) => {
            let color = tag.color < colors.length ? colors[tag.color] : 
                colors[tag.color - Math.floor(tag.color/colors.length) * colors.length];
            return (<Tag color = {color} >{tag.label}</Tag>)
        })
    }

    render(){
        return(
            <DataContainer 
                paddingLeft = {this.props.write ? "3rem" : "10rem"}>
            {!this.props.write ? 
                <>
                    {this.props.document.repository && 
                    
                        <RepositoryButton> 
                            <RiGitRepositoryLine style = {
                                    { marginRight: "0.5rem", fontSize: "1.4rem"}
                                    }/>
                            {this.renderFullName()}
                        </RepositoryButton>
                    }
                     {(this.props.document.tags && this.props.document.tags.length > 0) &&
                        <ReferenceContainer>
                            {this.renderTags()}
                        </ReferenceContainer>
                    }
                    {(this.props.document.references && this.props.document.references.length > 0) &&
                        <ReferenceContainer>
                            {this.renderFolders()}
                            {this.renderFiles()}
                        </ReferenceContainer>
                    }
                   
                </>
                 :
                    <>
                        <RepositoryMenu2
                            document={this.props.document}
                        />
                        <ReferenceContainer>
                            {this.props.document.tags && this.renderTags()}
                            <LabelMenu
                                emptyButton={!this.props.document.tags || this.props.document.tags.length === 0}
                                attachTag={(tagId) => this.props.attachTag(this.props.document._id, tagId)}//this.props.attachTag(requestId, tagId)}
                                removeTag={(tagId) => this.props.removeTag(this.props.document._id, tagId)}//this.props.removeTag(requestId, tagId)}
                                setTags={this.props.document.tags}//this.props.request.tags}
                                marginTop={"1rem"}
                            />
                        </ReferenceContainer>
                        {   
                            this.props.document.repository &&
                                <ReferenceContainer>
                                    { this.props.document.references &&
                                        <>
                                            {this.renderFolders()}
                                            {this.renderFiles()}
                                        </>
                                    }
                                    <FileReferenceMenu
                                            emptyButton = {!this.props.document.references || this.props.document.references.length === 0}
                                            setReferences={this.props.document.references}//this.props.request.tags}
                                            marginTop={"1rem"}
                                            document={this.props.document}
                                    />
                                </ReferenceContainer>
                        }
                      
                    </>
            }
            </DataContainer>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    let { documentId } = ownProps.match.params
    if (documentId === null || documentId === undefined) {
        let search = history.location.search
        let params = new URLSearchParams(search)
        documentId = params.get('document')
    }
    let parentId = state.parentId

    return {
        document: state.documents[documentId],
        parent: state.documents[parentId]
    }
}

export default withRouter(connect(mapStateToProps, { 
    getDocument, editDocument, renameDocument, getParent, attachTag, removeTag })(DocumentInfo));




const DataContainer = styled.div`
    padding-left: ${props => props.paddingLeft};
    padding-right: 10rem;
`

const RepositoryButton = styled.div`
    background-color: #414758;
    color: white;
    font-weight: 500;
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
    font-size: 1.3rem;
    margin-bottom: 2.2rem;
`

const ReferenceContainer = styled.div`
    margin-bottom: 2rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
`

const Reference = styled.div`
    font-size: 1.25rem;
    color: #172A4E;
 
    align-items: center;
    display: inline-flex;

	font-weight: 500;
	margin-right: 1.5rem;
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
