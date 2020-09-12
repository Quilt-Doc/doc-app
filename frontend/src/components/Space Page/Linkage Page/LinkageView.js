import React from 'react';

//redux
import { connect } from 'react-redux';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//icons
import { VscDebugDisconnect } from 'react-icons/vsc';
import { AiFillFolder } from 'react-icons/ai';
import {RiFileFill,  RiAddLine} from 'react-icons/ri';
import { FaJira, FaTrello, FaConfluence, FaGoogleDrive, FaGithub, FaAtlassian } from 'react-icons/fa';

//components
import TextareaAutosize from 'react-textarea-autosize'
import FileReferenceMenu from '../../General/Menus/FileReferenceMenu'
import LabelMenu from '../../General/Menus/LabelMenu';
import RepositoryMenu2 from '../../General/Menus/RepositoryMenu2';

//router
import {withRouter} from 'react-router-dom';
import history from '../../../history';

//actions
import { editLinkage, attachLinkageTag, 
        removeLinkageTag, attachLinkageReference, removeLinkageReference, deleteLinkage } from '../../../actions/Linkage_Actions';
import { clearSelected } from '../../../actions/Selected_Actions';

import { CSSTransition } from 'react-transition-group';

class LinkageView extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            loaded: false,
            edit: false
        }
    }

    async componentDidMount() {
        let search = history.location.search;
        let params = new URLSearchParams(search);
        let linkageId = params.get('linkage');
        await this.props.getLinkage(linkageId);
        if (this.props.linkage) {
            this.setState({loaded: true});
        }
    }

    undoModal(){
        history.push(history.location.pathname);
    }


    renderIcon = () => {
        let {domain} = this.props.linkage

        let icon = domain === "Github" ? <FaGithub/> :
        domain === "Confluence Doc" ? <FaConfluence style = {{marginTop: "-0.15rem"}}/> 
        : domain === "Atlassian" ? <FaAtlassian style = {{marginTop: "-0.15rem"}}/> 
        : domain === "Trello" ? <FaTrello style = {{marginTop: "-0.15rem"}}/> 
        : domain === "Jira Ticket" ? <FaJira style = {{marginTop: "-0.15rem"}}/> 
        : domain === "Google Doc" ? <FaGoogleDrive style = {{marginTop: "-0.15rem"}}/> 
        : <VscDebugDisconnect/>

        return (
            <IconContainer>{icon}</IconContainer>
        )
    }

  

    renderRefs = () => {
        let {references} = this.props.linkage;
        return references.map((ref) => {
            return(
                <Reference>
                    {ref.kind === "dir" ?  <AiFillFolder style = {{marginRight: "0.5rem"}}/> :
                         <RiFileFill style = {{fontSize: "1.1rem" ,marginRight: "0.5rem"}}/>
                    }
                    <Title>{ref.name}</Title>
                </Reference>
            )
        }) 
    }


    attachLinkageRef = (ref) => {
        let {linkage, attachLinkageReference} = this.props;
        
        attachLinkageReference(linkage._id, ref._id);
    }

    removeLinkageRef = (ref) => {
        let {linkage, removeLinkageReference} = this.props;
        
        removeLinkageReference(linkage._id, ref._id);
    }

    renderReferenceMenu = () => {
        let {repository, references} = this.props.linkage;
        return (
            repository ? 
                <FileReferenceMenu 
                    form = {true}
                    setReferences = {references}
                    document = {{repository}}
                    formAttachReference = {(ref) => this.attachLinkageRef(ref)}
                    formRemoveReference = {(ref) => this.removeLinkageRef(ref)}
                /> :
                <AddButton>
                    <RiAddLine />
                </AddButton>
        )
    }


    renderTags(){
        let colors = ['#5352ed', 
            '#ff4757', '#20bf6b','#1e90ff', '#ff6348', '#e84393', '#1e3799', '#b71540', '#079992'
        ];

        let { tags } = this.props.linkage;

        return tags.map(tag => {
            let color = tag.color < colors.length ? colors[tag.color] : 
                colors[tag.color - Math.floor(tag.color/colors.length) * colors.length];

            return <Tag color = {color} backgroundColor = {chroma(color).alpha(0.15)}>{tag.label}</Tag>
        })
    }


    attachLinkageTag = (tag) => {
        let {linkage, attachLinkageTag} = this.props;
        
        attachLinkageTag(linkage._id, tag._id);
    }

    removeLinkageTag = (tag) => {
        let {linkage, removeLinkageTag} = this.props;
        
        removeLinkageTag(linkage._id, tag._id);
    }

    renderModalContent = () => {
        let {title, tags, references, repository, _id} = this.props.linkage;
        return (
            <>
                <DarkContainer>
                    <Header>
                        {this.renderIcon()}
                        {title ? title : "Untitled"}
                    </Header>
                </DarkContainer>
                <Body>
                    <Guide2>
                        Repository
                    </Guide2>
                    <RepositoryMenu2 
                        selectRepository = {(repo) => this.props.editLinkage(_id, {repositoryId: repo._id})}
                        formRepository = {repository}
                        form = {true}
                    />
                    <Guide2>
                        Code References
                    </Guide2>
                    <List>
                        {this.state.edit ? this.renderReferenceMenu() : null}
                        {references.length > 0 ? <InfoList>{this.renderRefs()}</InfoList> : 
                            <Message>
                                {repository ? 
                                    "No References" : 
                                    "Select a repository to attach references"
                                }
                            </Message>
                        }
                    </List>
                    <Guide2>
                        Labels
                    </Guide2>
                    <List style = {{marginBottom: "3rem"}}>
                        <LabelMenu
                            attachTag = {(tag) => this.attachLinkageTag(tag)}
                            removeTag = {(tag) => this.removeLinkageTag(tag)}
                            setTags = {tags}
                            marginTop = {"1rem"}
                            form = {true}
                        />
                        {tags.length > 0 ? <InfoList>{this.renderTags()}</InfoList> : 
                            <Message>
                                No Labels
                            </Message>
                        }
                    </List>
                </Body>
            </>
        )
    }

    render(){
        let {loading} = this.state;

        return(
            <ModalBackground onClick = {() => {this.undoModal()}}>
                <CSSTransition
                    in={true}
                    appear = {true}
                    timeout={300}
                    classNames="modal"
                >   
                    <div>
                        <ModalContent onClick = {(e) => {e.stopPropagation()}}>
                            {
                                loading ?
                                    null :
                                    this.renderModalContent()
                            }   
                        </ModalContent>
                    </div>
                </CSSTransition>
            </ModalBackground>
        ) 
    }
}

const mapStateToProps = (state, ownProps) => {

    let search = history.location.search;
    let params = new URLSearchParams(search);
    let linkageId = params.get('linkage');

    return {
        user: state.auth.user,
        selected : Object.values(state.selected),
        linkage: state.linkages[linkageId],
    }
}


export default withRouter(connect(mapStateToProps, { clearSelected, 
    editLinkage, attachLinkageTag, 
    removeLinkageTag, attachLinkageReference, 
    removeLinkageReference, deleteLinkage })(LinkageView));


const CreateButton = styled.div`
    background-color: white;
    margin-left: auto;
    border: 1px solid  #E0E4e7;
    display: inline-flex;
    font-size: 1.5rem;
    justify-content: center;
    align-items: center;
    padding: 1rem 2rem;
    border-radius: 0.4rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    font-weight: 500;
    cursor: pointer;
`

const Bottom = styled.div`
    background-color:#f7f9fb;
    min-height: 7.5rem;
    max-height: 7.5rem;
    padding-left: 4rem;
    padding-right: 4rem;
    align-items: center;
    margin-top: auto;
    display: flex;
    width: 100%;
    border-top: 1px solid #E0E4e7;
    border-bottom-left-radius: 0.3rem;
    border-bottom-right-radius: 0.3rem;
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
    margin-left: 1.5rem;
    margin-bottom: -1rem;
`

const List = styled.div`
    display: flex;
    align-items: center;
`

const Description = styled.div`
    color: 172a4e;
    font-size: 1.5rem;
    font-weight: 400;
    margin-bottom: 1.3rem;
    height: 2rem;
    opacity: 0.5;
    color: ${props => props.color};
`

const Guide2 = styled.div`
    color: 172a4e;
    font-size: 1.6rem;
    font-weight: 600;
    margin-bottom: 0.6rem;
    display: flex;
    align-items: center;
    height: 2rem;
    margin-top: 4.5rem;
    &:first-of-type {
        margin-top: 0rem;
    }
    color: ${props => props.color};
`


const IconContainer = styled.div`
    font-size: 2.5rem;
    margin-right: 1rem;
    display: flex;
    align-items: center;

`

const Provider = styled.div`
    background-color: #363b49;
    padding: 1.5rem 2rem;
    border-radius: 0.3rem;
    font-weight: 500;
    font-size: 1.7rem;
    color: white;
    display: inline-flex;
    align-items: center;

`

const Body = styled.div`
    padding: 0 4rem;
    margin-top: -2rem;
`

const Title = styled.div`
    color: #172A4e;
    font-weight: 500;
`

const SourceInput = styled(TextareaAutosize)`
    border: 1px solid #5B75E6;
    background-color: #ACB9F4;
    border-radius: 0.3rem;
    padding-left: 1rem;
    padding-right: 1rem;
    padding-top: 0.7rem;
    padding-bottom: 0.7rem;
    width: 100%;
    margin-bottom: 4rem;
    color:#2e4fe0;
    font-size: 1.6rem;
    &::placeholder{
        color:#2e4fe0;
    }
    color: #172A4e;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
    font-weight: 500;
    outline: none;
    resize: none;
    line-height: 1.5;
`   

const DarkContainer = styled.div`
    padding: 0 4rem;
    background-color:#2B2F3A;
    padding-bottom: 2rem;
`

const Header = styled.div`
    font-size: 5rem;
    font-weight: 500;
    font-size: 2rem;
    font-weight: 500;
    padding-top: 3rem;
    padding-bottom: 1rem;
    display: flex;
    align-items: center;
    color: white;
    
`

const ModalContent = styled.div`
    background-color: #fefefe;
    margin: 7vh auto; /* 15% from the top and centered */
    
    width: 85vw; /* Could be more or less, depending on screen size */
    border-radius: 0.2rem;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 80rem;
    border-radius: 0.3rem;
    background-color: white;
    color: #172A4e;
    background-color: white;
    overflow-y: scroll;
`


const ModalBackground = styled.div`
    position: fixed; /* Stay in place */
    z-index: 10000; /* Sit on top */
    left: 0;
    top: 0;
    width: 100%; /* Full width */
    height: 100%; /* Full height */
    overflow: hidden; /* Enable scroll if needed */
    background-color: rgb(0,0,0); /* Fallback color */
    background-color: rgba(0, 0, 0, 0.4); /* Black w/ opacity */
    display: ${props => props.display};
    overflow: scroll;
`
