import React from 'react'

//styles
import styled from "styled-components";
import chroma from 'chroma-js';

//actions
import { getDocument, editDocument } from '../../../../../actions/Document_Actions';

//components
import FileReferenceMenu from '../../../../menus/FileReferenceMenu';
import RepositoryMenu2 from '../../../../menus/RepositoryMenu2'

//redux
import { connect } from 'react-redux';

//icons
import {RiGitRepositoryLine, RiFileFill, RiAddLine} from 'react-icons/ri'
import {AiFillFolder, AiOutlinePullRequest} from 'react-icons/ai';
import {VscRepo} from 'react-icons/vsc';

//router
import { withRouter } from 'react-router-dom';
import history from '../../../../../history';
import { IoIosHammer } from 'react-icons/io';
import { LIGHT_SHADOW_1 } from '../../../../../styles/shadows';
import { APP_LIGHT_PRIMARY_COLOR } from '../../../../../styles/colors';

class DocumentInfo extends React.Component {
    constructor(props){
        super(props)
    }

    renderFullName(){
        let split = this.props.document.repository.fullName.split("/")
        return `${split[1]}`
    }

    renderFolders = (references, invalid) => {
        //let {references} = this.props.document
        let directories = references.filter(reference => reference.kind === "dir")
        
        if (directories.length > 0) {
            directories = directories.sort((a, b) => {if (a.name < b.name) return -1; else if (a.name > b.name) return 1; else return 0})
        }

        return directories.map((directory, i) => {
            return (    <Reference invalid = {invalid}>
                            <AiFillFolder style = {{marginRight: "0.5rem"}}/>
                            <Title>{directory.name}</Title>
                        </Reference>
                    )
        })
    }

    renderFiles = (references, invalid) => {
        //let {references} = this.props.document
        let files = references.filter(reference => reference.kind === "file")

        if (files) {
            files = files.sort((a, b) => {if (a.name < b.name) return -1; else if (a.name > b.name) return 1; else return 0})
        }

        return files.map((file, i) => {
            return (
                <Reference invalid = {invalid}>
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

    renderFixButton = () => {
        const { document: { references, _id }, editDocument, match } = this.props;
        const { workspaceId } = match.params;

        const validReferenceIds = references.filter(ref => ref.status === 'valid').map(ref => ref._id);

        return (
        <FixButton onClick = {() => 
            editDocument({documentId: _id, referenceIds: validReferenceIds, workspaceId})}>
            <IoIosHammer/>
        </FixButton>
        )
    }

    renderEditData = () => {
        const { document: {references, repository} } = this.props;
        const validReferences = references.filter(ref => ref.status === 'valid');
        const invalidReferences = references.filter(ref => ref.status === 'invalid');

        return (
            <>
                <RepositoryMenu2 darkBorder = {true} document={this.props.document}/>
                <List>
                    {this.renderReferenceMenu()}
                    {   (validReferences && validReferences.length > 0) ? 
                         <InfoList edit = {true}>
                            {this.renderFolders(validReferences, false)}
                            {this.renderFiles(validReferences, false)}
                        </InfoList> :
                         <Message>
                            { repository ? 
                                "Attach References" : 
                                "Select a repository to attach references"
                            }
                        </Message>
                    }
                </List>
                { (invalidReferences && invalidReferences.length > 0) &&
                    <List>
                        {this.renderFixButton()}
                        <InfoList edit = {true}>
                            {this.renderFolders(invalidReferences, true)}
                            {this.renderFiles(invalidReferences, true)}
                        </InfoList>
                    </List>
                }
            </>
        )
    }

    renderStaticData = () => {
        const { document: {references, repository} } = this.props;
        
        const validReferences = references.filter(ref => ref.status === 'valid');
        const invalidReferences = references.filter(ref => ref.status === 'invalid');

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
            { (validReferences && validReferences.length > 0) &&
                <List>
                    <InfoList>
                        {this.renderFolders(validReferences, false)}
                        {this.renderFiles(validReferences, false)}
                    </InfoList>
                </List>
            }
            { (invalidReferences && invalidReferences.length > 0) &&
                <List>
                    <InfoList>
                        {this.renderFolders(invalidReferences, true)}
                        {this.renderFiles(invalidReferences, true)}
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
    getDocument, editDocument })(DocumentInfo));


const PullRequestIcon = styled.div`
    display: flex;
    align-items: center;
    margin-right: 0.35rem;
    font-size: 1.8rem;
    margin-top: -0.1rem;
`

const PullRequest = styled.div`
    display: inline-flex;
    align-items: center;
    background-color: ${APP_LIGHT_PRIMARY_COLOR};
    font-weight: 500;
    font-size: 1.4rem;
    padding: 0.7rem 1rem;
    border-radius: 0.3rem;
    margin-bottom: 1rem;
`

const Recommendation = styled.div`
    margin-top: 1.5rem;
    display: flex;
    align-items: center;
`

const RecDetail = styled.div`
    font-weight: 500;
    font-size: 1.3rem;
    width: 10rem;
`

const PullRequestRecs = styled.div`
    margin-bottom: 2rem;
    width: 100%;
    box-shadow: ${LIGHT_SHADOW_1};
    border-radius: 0.6rem;
    padding: 2rem;
    margin-bottom: 2rem;
`

const FixButton = styled.div`
    height: 3rem;
    width: 3rem;
    border: 1px solid #19e5be;
    border-radius: 50%;
    font-size: 1.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    &:hover {
        background-color: ${chroma('19e5be').alpha(0.2)};
    }
    cursor: pointer;
`

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
    background-color: ${props => props.invalid ? chroma("#ff4757").alpha(0.12) : chroma("#6762df").alpha(0.12)};
    /*color: ${chroma("#6762df").alpha(0.9)};*/
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
