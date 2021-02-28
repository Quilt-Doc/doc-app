import React from 'react';
import PropTypes from 'prop-types';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//history
import history from '../../../../history';

//redux
import { connect } from 'react-redux';

//router
import {withRouter} from 'react-router-dom';

//components
import RepositoryMenu from '../../../menus/RepositoryMenu';
import ReferenceDocument from './ReferenceDocument';
import LabelMenu from '../../../menus/LabelMenu'
import DocumentMenu from '../../../menus/DocumentMenu';
import { CSSTransition } from 'react-transition-group';

//actions
import { attachReferenceTag, removeReferenceTag, retrieveReferences } from '../../../../actions/Reference_Actions';

//icons
import { RiStackLine } from 'react-icons/ri';
import {BiHighlight} from 'react-icons/bi';
import { CgOptions } from 'react-icons/cg';

// information that is presented above reference in directory_navigator and code_editor
class ReferenceInfo extends React.Component {

    constructor(props){
        super(props);
        this.state = {
            // turns on the toolbar
            setOptions:false
        }
    }

    renderLabelMenu = () => {
        const { currentReference, attachReferenceTag, removeReferenceTag, directoryNavigator, match } = this.props;
        const { workspaceId, repositoryId } = match.params;
        const { _id, tags} = currentReference;
        return(
            <LabelMenu 
                attachTag = {(tag) => attachReferenceTag({referenceId: _id, workspaceId, tagId: tag._id, repositoryId})}
                removeTag = {(tag) => removeReferenceTag({referenceId: _id, workspaceId, tagId: tag._id, repositoryId})}
                setTags = {tags}
            />
        )
    }

    renderDocumentMenu = () => {
        const { documents, currentReference } = this.props;
        return(
            <DocumentMenu
                setDocuments = { documents }
                reference = { currentReference }
                mLeft = {"auto"}
            />
        )
    }

    renderDocuments = () => {
        const { documents, workspace: {memberUsers} } = this.props;
        return documents.map((doc, i) => {
            const { author } = doc;
            let color = 0;
            memberUsers.map((user, i) => {
                if (user._id === author._id) {
                    color = i;
                }
            })
            return <ReferenceDocument color = {color} key = {i} index = {i} doc = {doc} />
        });
    }

    // selects the color for the tagss depending on the tag color field (a number)
    selectColor = (tag) => {
        let colors = ['#5352ed', '#ff4757', '#20bf6b','#1e90ff', '#ff6348', 
            '#e84393', '#1e3799', '#b71540', '#079992'];

        return tag.color < colors.length ? colors[tag.color] : 
            colors[tag.color - Math.floor(tag.color/colors.length) * colors.length];
    }

    renderTags(){
        const { currentReference } = this.props;
        const { tags } = currentReference;

        return tags.map(tag => 
            {
                const color = this.selectColor(tag);
                return (
                    <Tag 
                        color = {color} 
                        backgroundColor = {chroma(color).alpha(0.15)}
                    >
                        {tag.label}
                    </Tag>
                )
            }
        )
    }

    // renders the path to the reference as a clickable header
    // each segment of the header redirects to the correct reference
    renderHeaderPath() {
        const { currentReference } = this.props;
        const { path } = currentReference;

        if (currentReference && path !== "") {
            let splitPath = path.split("/");
            return splitPath.map((sp, i) => {
                let relocation = splitPath.slice(0, i + 1).join("/");
                return( 
                    <>
                        <Slash>/</Slash>
                        <RepositoryPath 
                            onClick = {() => {this.redirectPath(relocation)}}
                        >
                            {sp}
                        </RepositoryPath>
                    </>
                );
            })
        }
        return "";
    }

    redirectPath = async (path) => {
        const { match, retrieveReferences } = this.props;
        const { workspaceId, repositoryId } = match.params;
       
        const returnedValue = await retrieveReferences({workspaceId, repositoryId, path, minimal: true}, true);
        const {_id} = returnedValue[0];
        history.push(`/workspaces/${workspaceId}/repository/${repositoryId}/dir/${_id}`);
    }

    // if you click the repository name, it redirects to the root reference
    renderRepositoryName(){
        const { currentRepository } = this.props;
        const { fullName } = currentRepository;

        return  <RepositoryPath 
                    onClick = {() => {this.redirectPath("")}}
                >
                    { fullName.split("/")[1] }
                </RepositoryPath>
    }

    // render the button to toggle selection for snippets
    renderHighlightButton = () => {
        const { canSelect, toggleSelection } = this.props;

        return(
            <PageIcon 
                active = { canSelect } 
                onClick = { () => toggleSelection() } 
                ref = { hiButton => this.hiButton = hiButton }>
                <BiHighlight style = {{ marginRight: "0.5rem" }}/>
                <Title>Create Snippet</Title>
            </PageIcon>
        )
    }
    
    renderToolbar = () => {
        const { setOptions } = this.state;
        const { currentRepository, referenceEditor } = this.props;
        const { fullName } = currentRepository;

        return (
            <CSSTransition
                    in={ setOptions }
                    unmountOnExit
                    enter = {true}
                    exit = {true}
                    timeout={150}
                    classNames="editortoolbar"
            >
                <PageToolbar>
                    <RepositoryMenu repoName = {fullName.split("/")[1]}/>
                    { referenceEditor && this.renderHighlightButton() }
                    { this.renderDocumentMenu() }
                    { this.renderLabelMenu() }
                </PageToolbar>
            </CSSTransition>
        );
    }

    renderStaticView = () => {
        const { currentReference, currentRepository, documents } = this.props;
        const { tags } = currentReference;
        
        const small = currentReference.name === currentRepository.fullName;

        return (
            <>
                {tags.length > 0 && 
                    <List style = {{marginBottom: "2rem"}}>
                        <InfoList>
                            {this.renderTags()}
                        </InfoList>
                    </List>
                }
                { documents.length > 0 &&
                    <List style = {{marginBottom: "2rem"}}>
                        <InfoList2 small = {small}>
                            {this.renderDocuments()}
                        </InfoList2>
                    </List>
                }
            </>
        )
    }

    renderEditView = () => {
        const { currentReference, currentRepository, documents } = this.props;
        const { tags } = currentReference;

        const small = currentReference.name === currentRepository.fullName;

        return (
            <>
                <List style = {{marginBottom: "2rem"}}>
                    {this.renderLabelMenu()}
                    {tags.length > 0 ? <InfoList edit = {true}>{this.renderTags()}</InfoList> : 
                        <Message>
                            Attach Labels
                        </Message>
                    }  
                </List>
                <List style = {{marginBottom: "2rem"}}>
                    {this.renderDocumentMenu()}
                    {documents.length  > 0 ? <InfoList2  small = {small} edit = {true}>{this.renderDocuments()}</InfoList2> : 
                        <Message>
                            Add Documentation
                        </Message>
                    }
                </List>
            </>
        )
    }

    render(){
        const { setOptions } = this.state;
        const { currentReference, documents, edit } = this.props;
        const { tags } = currentReference;

        return(
            <>
                {this.renderToolbar()}
                <Container>
                    <Header>
                        {this.renderRepositoryName()}
                        {this.renderHeaderPath()}
                    </Header>
                    {edit ? this.renderEditView() : this.renderStaticView()}
                </Container>
            </>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    const { workspaceId } = ownProps.match.params;
    const { workspaces } = state;
    return { 
        workspace: workspaces[workspaceId]
    }
}


ReferenceInfo.propTypes = {
    currentReference : PropTypes.object,
    documents : PropTypes.arrayOf(PropTypes.object),
    directoryNavigator : PropTypes.bool,
    referenceEditor : PropTypes.bool,
}

export default withRouter(connect(mapStateToProps, { attachReferenceTag, removeReferenceTag, retrieveReferences })(ReferenceInfo));



const DocList = styled.div`
    display: flex;
    align-items: center;
    background-color: #f7f9fb;
    padding: 2rem;
    border-radius: 0.7rem;
    border: 1px solid #E0E4E7;
`

const List = styled.div`
    display: flex;
    align-items: center;
    position: relative;
`



const InfoList = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin-left: ${props => props.edit ? "1.5rem" : ""};
    margin-bottom: -1rem;
    margin-top: ${props => props.edit ? "" : "-1rem"};
`

const Gradient = styled.div`
    position:absolute;
    z-index:2;
    width: 20rem;
    height: calc(100% - 2rem);
    top: 0;
    right:0; 
    background-image: linear-gradient(to bottom, 
        rgba(255,255,255, 0), 
        rgba(255,255,255, 1) 90%);
`

const InfoList2 = styled.div`
    display: flex;
    align-items: center;
    margin-left: ${props => props.edit ? "2rem" : ""};
    max-width: ${props => props.small ? props.edit ? "70rem" : "75rem" : "100%"};
    overflow-x: scroll;
    padding: 1rem;
    margin-left: ${props => props.edit  ? "0.5rem" : "-1rem"}; 
`


const Container = styled.div`

`

const MainToolbar = styled.div`
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
    align-items: center;
    display: flex;
    padding-top: 2rem;
    padding-left: 5rem;
    padding-right: 5rem;
`

const Button = styled.div`
    width: 3rem;
	height: 3rem;
    display: flex;
    font-size: 2.4rem;
    justify-content: center;
    align-items: center;
    opacity: 0.8;
    margin-left: auto;
    position: relative;
    z-index: 0;
    border-radius: 0.3rem;
    &:hover {
        background-color:  ${props => props.active ? chroma("#6762df").alpha(0.2) : "#dae3ec;"};
    }
    background-color: ${props => props.active ? chroma("#6762df").alpha(0.2)  : ""};
    cursor: pointer;
`


const PageToolbar = styled.div`
    height: 5rem;
    display: flex;
    align-items: center;
    
    background-color:white;  
    /*background-color: white;*/
    padding-left: 2rem;
    padding-right: 2rem;
    opacity: 1;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    position: sticky;
    top: 0;
    z-index: 2;
`


const PageIcon = styled.div`
    margin-right: 1.5rem;
    margin-left: auto;
    display: flex;
    align-items: center;
    font-size: 1.5rem;
   
   /*color: white;*/
    /*background-color: #4c5367;*/
   /* opacity: 0.8;*/
   padding: 0.5rem 1rem;
    &:hover {
        background-color:  ${props => props.active ? chroma('#6762df').alpha(0.2) : "#F4F4F6;"};
        
    }
    background-color: ${props => props.active ? chroma('#6762df').alpha(0.2) : ""};
    
    cursor: pointer;
    border-radius: 0.3rem;
`


const Message = styled.div`
    opacity: 0.5;
    font-size: 1.4rem;
    font-weight: 500;
    margin-left: 1.5rem;
`

const EmptyMessage = styled.div`
    font-size: 1.5rem;
    opacity: 0.7;
    font-style: italic;
    height: 5rem;
    padding-left: 3rem;
    padding-right: 3rem;
    display: flex;
    align-items: center;
`

const Tags = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    margin-top: -0.8rem;
`

const ListView = styled.div`
    display: flex;
    flex-direction: column;
    max-height: 17rem;
    overflow-y: scroll;

`

const Toolbar = styled.div`
    min-height: 4.5rem;
    max-height: 4.5rem;
    display: flex;
    align-items: center;
    border-bottom: 1px solid #EDEFF1;
    padding: 0rem 3rem;
    font-size: 1.5rem;
    font-weight: 500;
`

const Slash = styled.div`
    margin-left: 1rem;
    margin-right: 1rem;
`

const RepositoryPath = styled.div`
/*
    padding: 0.6rem;
    &: hover {
        background-color: #F4F4F6; 
        opacity: 1;
    }
*/
    &: hover {
        text-decoration: underline;
    }
    cursor: pointer;
`

const Info = styled.div`
    display: flex;
    margin-bottom: 2.4rem;
    z-index: 0;
    background-color: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    border-radius: 0.2rem;
    width: 100%;
    display: flex;
    flex-direction: column;
    min-width: 80rem;
`

const Tag = styled.div`
    font-size: 1.25rem;
    color: ${props => props.color};
    height: 2.1rem;
    padding: 0rem 0.7rem;
    background-color: ${props => chroma(props.color).alpha(0.13)};
    border: 1px solid ${props => props.color};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
	margin-right: 1.3rem;
    font-weight: 500;
    margin-bottom:1rem;

`

const Header = styled.div`
    font-size: 1.7rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    padding-top: 2rem;
    margin-bottom: 2.3rem;

`

const Title = styled.div`
    font-size: 1.3rem;
    margin-right: 0.3rem;
    font-weight: 500;
`