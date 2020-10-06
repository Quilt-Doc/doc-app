import React from 'react'

//styles
import styled from "styled-components";
import chroma from 'chroma-js';

//actions
import { getDocument, editDocument, attachDocumentTag, removeDocumentTag } from '../../../../../actions/Document_Actions';

//components
import LabelMenu from '../../../../menus/LabelMenu';
import FileReferenceMenu from '../../../../menus/FileReferenceMenu';
import RepositoryMenu2 from '../../../../menus/RepositoryMenu2'

//redux
import { connect } from 'react-redux';

//icons
import {RiGitRepositoryLine, RiFileFill, RiAddLine} from 'react-icons/ri'
import {AiFillFolder} from 'react-icons/ai';
import {VscRepo} from 'react-icons/vsc';

//router
import { withRouter } from 'react-router-dom';
import history from '../../../../../history';

class DocumentInfo extends React.Component {
    constructor(props){
        super(props)
    }

    renderFullName(){
        let split = this.props.document.repository.fullName.split("/")
        return `${split[1]}`
    }

    renderFolders = () => {
        let {references} = this.props.document
        let directories = references.filter(reference => reference.kind === "dir")
        
        if (directories.length > 0) {
            directories = directories.sort((a, b) => {if (a.name < b.name) return -1; else if (a.name > b.name) return 1; else return 0})
        }

        return directories.map((directory, i) => {
            return (    <Reference>
                            <AiFillFolder style = {{marginRight: "0.5rem"}}/>
                            <Title>{directory.name}</Title>
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
                    <RiFileFill style = {{width: "1rem", fontSize: "1.1rem" ,marginRight: "0.5rem"}}/>
                    <Title>{file.name}</Title>
                </Reference>
            )
        })
    }

    renderReferenceMenu = () => {
        const { document } = this.props;
        const {repository, references} = document;
        return (
            repository ? < FileReferenceMenu 
                            setReferences = {references}
                            document = { document }
                        /> :
                            <AddButton>
                                <RiAddLine/>
                            </AddButton>
        )
    }

    renderTags(){
        let colors = ['#5352ed', 
            '#ff4757', '#20bf6b','#1e90ff', '#ff6348', '#e84393', '#1e3799', '#b71540', '#079992'
        ]
        //this.props.document.
        let tags = [{color: 2, label: "backend"}, {color: 1, label: "worker"}, {color: 4, label: "lambdas"}]
        return tags.map((tag) => {
            let color = tag.color < colors.length ? colors[tag.color] : 
                colors[tag.color - Math.floor(tag.color/colors.length) * colors.length];
            return (<Tag color = {color} >{tag.label}</Tag>)
        })
    }

    renderEditData = () => {
        const { document: {references, repository} } = this.props;
        return (
            <>
                <RepositoryMenu2 document={this.props.document}/>
                <List>
                    {this.renderReferenceMenu()}
                    {   (references && references.length > 0) ? 
                         <InfoList edit = {true}>
                            {this.renderFolders()}
                            {this.renderFiles()}
                        </InfoList> :
                         <Message>
                            { repository ? 
                                "Attach References" : 
                                "Select a repository to attach references"
                            }
                        </Message>
                    }
                   
                </List>
            </>
        )
    }

    renderStaticData = () => {
        const { document: {references, repository} } = this.props;
        return (
            <>
            { repository &&
                <RepositoryButton> 
                    <IconBorder>    
                        <VscRepo/>
                    </IconBorder>
                    {this.renderFullName()}
                </RepositoryButton>
            }
            { (references && references.length > 0) &&
                <List>
                    <InfoList>
                        {this.renderFolders()}
                        {this.renderFiles()}
                    </InfoList>
                </List>
                
            }
            </>
        )
    }

    render(){
        const { write, document: { repository} } = this.props;
        return(
            <>
            {(repository || write) && 
                <DataContainer paddingLeft = {write ? "3rem" : "10rem"} >
                    { write ? this.renderEditData() : this.renderStaticData() }
                </DataContainer>
            }
            </>
        )
    }
}

/*
:
                    <>
                        <RepositoryMenu2
                            document={this.props.document}
                        />
                      
                        {   
                            this.props.document.repository &&
                                <InfoList2>
                                    { this.props.document.references &&
                                        <>
                                            {this.renderFolders()}
                                            {this.renderFiles()}
                                        </>
                                    }
                                    <FileReferenceMenu
                                            emptyButton = {!this.props.document.references || this.props.document.references.length === 0}
                                            setReferences={this.props.document.references}//this.props.request.tags}
                                            marginTop={"-1rem"}
                                            
                                            document={this.props.document}
                                    />
                                </InfoList2>
                        }
                        <InfoList>
                            {this.props.document.tags && this.renderTags()}
                            <LabelMenu
                                emptyButton={!this.props.document.tags || this.props.document.tags.length === 0}
                                attachTag={(tagId) => this.props.attachTag(this.props.document._id, tagId)}//this.props.attachTag(requestId, tagId)}
                                removeTag={(tagId) => this.props.removeTag(this.props.document._id, tagId)}//this.props.removeTag(requestId, tagId)}
                                setTags={this.props.document.tags}//this.props.request.tags}
                                marginTop={"1rem"}
                            />
                        </InfoList>
                    </>
            }*/

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
    getDocument, editDocument, attachDocumentTag, removeDocumentTag })(DocumentInfo));

const Message = styled.div`
    opacity: 0.5;
    font-size: 1.4rem;
    font-weight: 500;
    margin-left: 1.5rem;
`

const InfoList = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: -1rem;
    margin-left: ${props => props.edit ? "1.5rem" : "0rem"};
`

const List = styled.div`
    display: flex;
    align-items: center;
    margin-top: 2rem;
`

const AddButton = styled.div`
    height: 3rem;
    width: 3rem;
    border: 1px solid #E0E4e7;
    border-radius: 50%;
    font-size: 1.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.5;
   /* box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);*/
`

const Reference = styled.div`
    background-color: ${chroma("#5B75E6").alpha(0.12)};
    /*color: ${chroma("#5B75E6").alpha(0.9)};*/
    border-radius: 0.2rem;
    font-size: 1.3rem;
    padding: 0.3rem 0.55rem;
    margin-right: 1.5rem;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
`

const Title = styled.div`
    color: #172A4e;
    font-weight: 500;
`

const DataContainer = styled.div`
    padding-left: ${props => props.paddingLeft};
    padding-right: 10rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
`
/*
const RepositoryButton = styled.div`
    display: inline-flex;
    align-items: center;
    font-size: 1.3rem;
    padding: 0rem 1rem;
    border-radius: 0.4rem;
    height: 3rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid #E0E4e7;
    margin-bottom: 1rem;
`*/

const RepositoryButton = styled.div`
    display: flex;
    align-items: center;
    font-size: 1.4rem;
    padding: 0rem 1.5rem;
    border-radius: 0.4rem;
    height: 3.5rem;
    font-weight: 500;
    display: inline-flex;
    cursor: pointer;
    border: 1px solid #172A4e;
`

const IconBorder = styled.div`
    font-size: 1.8rem;
    margin-right: 0.7rem;
    width: 2rem;
    display: flex;
    align-items: center;
    margin-top: 0.1rem;
`

/*

const RepositoryButton = styled.div`
    font-size: 1.5rem;
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    margin-bottom: 2rem;
    background-color: #f7f9fb;
    padding: 0.6rem 1rem;
    border-radius: 0.3rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`*/

const ReferenceContainer = styled.div`
    margin-bottom: 2rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
`

/*
const Reference = styled.div`
    font-size: 1.25rem;
    color: #172A4E;
 
    align-items: center;
    display: inline-flex;

	font-weight: 500;
	margin-right: 1.5rem;
`
*/

const Tag = styled.div`
    font-size: 1.2rem;
    color: ${props => props.color};
    padding: 0.1rem 0.7rem;
    background-color: ${props => chroma(props.color).alpha(0.13)};
    border: 1px solid ${props => props.color};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.2rem;
	margin-right: 1.5rem;
    font-weight: 500;
    min-width: 3rem;
    min-height: 0.5rem;
    margin-bottom:1rem;

`