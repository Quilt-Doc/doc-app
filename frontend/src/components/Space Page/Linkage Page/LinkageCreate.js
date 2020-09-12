import React from 'react';

//redux
import { connect } from 'react-redux';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//icons
import { VscDebugDisconnect } from 'react-icons/vsc';
import { AiFillFolder } from 'react-icons/ai';
import {RiFileFill, RiErrorWarningLine, RiAddLine} from 'react-icons/ri';
import { FaJira, FaTrello, FaConfluence, FaGoogleDrive, FaGithub, FaAtlassian } from 'react-icons/fa';
import {FiChevronDown} from 'react-icons/fi';

//components
import TextareaAutosize from 'react-textarea-autosize'
import FileReferenceMenu from '../../General/Menus/FileReferenceMenu'
import LabelMenu from '../../General/Menus/LabelMenu';
import RepositoryMenu2 from '../../General/Menus/RepositoryMenu2';

//router
import {withRouter} from 'react-router-dom';
import history from '../../../history';

//actions
import { createLinkage } from '../../../actions/Linkage_Actions';
import { clearSelected } from '../../../actions/Selected_Actions';

import { CSSTransition } from 'react-transition-group';

class LinkageCreate extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            url: "",
            domain: "None Selected",
            title: "",
    
            tags: [],
            references: [],
            repository: null
        }
    }

    componentDidMount() {
        this.setState({references: this.props.selected, repository: this.props.repository})
    }

    undoModal(){
        history.push(history.location.pathname);
    }

    createLinkage = () => {
        let {workspaceId} = this.props.match.params;
        let {repository, tags, references, url, title, domain } = this.state;
        let repositoryId = repository._id;
        let tagIds = tags.map(tag => tag._id);
        let referenceIds = references.map(ref => ref._id);
        let creatorId = this.props.user._id;

        this.props.createLinkage({creatorId, workspaceId, repositoryId, tagIds, referenceIds, domain, url, title}).then((linkage) => {
            history.push(`${history.location.pathname}?linkage=${linkage._id}`);
        });

    }


    findDomain = (base) => {
        let split = base.split('.');
        let limit = 2;
        if (split.length > 0 && split[0] === "www"){
            limit += 1;
        }

        if (split.length > limit && split[limit - 1] === 'atlassian') {
            return 'Atlassian';
        } else if (split[limit - 2] == 'trello'){
            return 'Trello'
        } else if (split.length > limit && 
                split[limit - 1] === 'google' && split[limit - 2] === 'docs'){
            return 'Google Doc'
        } else if (split[limit - 2] === 'github') {
            return 'Github';
        } else {
            return 'None Selected'
        }
    }


    renderProvider = () => {
        let {domain} = this.state

        let icon = domain === "Github" ? <FaGithub/> :
             domain === "Confluence Doc" ? <FaConfluence style = {{marginTop: "-0.15rem"}}/> 
             : domain === "Atlassian" ? <FaAtlassian style = {{marginTop: "-0.15rem"}}/> 
             : domain === "Trello" ? <FaTrello style = {{marginTop: "-0.15rem"}}/> 
             : domain === "Jira Ticket" ? <FaJira style = {{marginTop: "-0.15rem"}}/> 
             : domain === "Google Doc" ? <FaGoogleDrive style = {{marginTop: "-0.15rem"}}/> 
             : <RiErrorWarningLine style = {{fontSize: "2rem"}}/>

        return (
            <Provider>
                <IconContainer>{icon}</IconContainer>
                {domain}
                <FiChevronDown style = {{ marginLeft: "1rem"}}/>
            </Provider>
        )
    }

    onChangeHandler = (e) => {
        let url = e.target.value;

        let splitURL = url.split('/');

        let domain = "None Selected";
        let title = "";

        if (splitURL.length > 2) {
            let base = splitURL[2];
            domain = this.findDomain(base);
        }

        if (domain === "Atlassian"){
            if (splitURL.length  > 3) {
                if (splitURL[3] === 'wiki') {
                    domain = "Confluence Doc"
                    if (splitURL.length > 8){
                        title =  splitURL[8]
                    }
                } else if (splitURL[3] === 'projects') {
                    domain = "Jira Ticket"
                }
            }
        } else if (domain === "Trello") {
            if (splitURL.length > 5) {
                title =  splitURL[5].split('-').slice(1).join(" ")
            }
        }


        this.setState({title, domain, url})
    }
  

    renderRefs = () => {
        return this.state.references.map((ref) => {
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
        let refs = [...this.state.references];
        refs.push(ref);
        this.setState({references: refs})
    }

    removeLinkageRef = (ref) => {
        let refs = [...this.state.references];
        refs = refs.filter((refer) => {return refer._id !== ref._id})
        this.setState({references: refs})
    }

    renderReferenceMenu = () => {
        return (
            this.state.repository ? < FileReferenceMenu form = {true}
                                        setReferences = {this.state.references}
                                        document = {{repository: this.state.repository}}
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
        ]

        return this.state.tags.map(tag => {
            let color = tag.color < colors.length ? colors[tag.color] : 
                colors[tag.color - Math.floor(tag.color/colors.length) * colors.length];

            return <Tag color = {color} backgroundColor = {chroma(color).alpha(0.15)}>{tag.label}</Tag>
        })
    }


    attachLinkageTag = (tag) => {
        let tags = [...this.state.tags];
        tags.push(tag);
        this.setState({tags})
    }

    removeLinkageTag = (tagNew) => {
        let tags = [...this.state.tags];
        tags = tags.filter((tag) => {return tag._id !== tagNew._id})
        this.setState({tags})
    }

    render(){
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
                            <DarkContainer>
                                <Header>
                                    <VscDebugDisconnect style = {{fontSize: "2.5rem", marginRight: "1rem"}}/>
                                    Connect External Information
                                </Header>
                                <Guide2 color = {"white"}>
                                Information Type
                                </Guide2>
                                <Description color = {"white"}>
                                    Associate and track Jira tickets, 
                                        Confluence docs, Trello cards, Google docs, and Github wiki.
                                </Description >
                                {this.renderProvider()}
                                <Guide2 color = {"white"}>
                                    Source Link
                                </Guide2>
                                <Description color = {"white"}>
                                    Provide the link to your information source to begin tracking
                                </Description>
                            </DarkContainer>
                            <Body>
                                <SourceInput
                                    autoFocus
                                    onChange = {this.onChangeHandler}
                                />
                                <Guide2>
                                    Repository
                                </Guide2>
                                <Description>
                                    Relevant repository that your document targets.
                                </Description>
                                <RepositoryMenu2 
                                    selectRepository = {(repository) => this.setState({repository})}
                                    formRepository = {this.state.repository}
                                    form = {true}
                                />
                                <Guide2>
                                    Code References
                                </Guide2>
                                <Description>
                                    Validate your document automatically when relevant code changes.
                                </Description>
                                <List>
                                    {this.renderReferenceMenu()}
                                    {this.state.references.length > 0 ? <InfoList>{this.renderRefs()}</InfoList> : 
                                        <Message>
                                            {this.state.repository ? 
                                                "No References" : 
                                                "Select a repository to attach references"
                                            }
                                        </Message>
                                    }
                                </List>
                                <Guide2>
                                    Labels
                                </Guide2>
                                <Description>
                                    Attach labels to optimize search.
                                </Description>
                                <List style = {{marginBottom: "3rem"}}>
                                    <LabelMenu
                                        attachTag = {(tag) => this.attachLinkageTag(tag)}
                                        removeTag = {(tag) => this.removeLinkageTag(tag)}
                                        setTags = {this.state.tags}
                                        marginTop = {"1rem"}
                                        form = {true}
                                    />
                                    {this.state.tags.length > 0 ? <InfoList>{this.renderTags()}</InfoList> : 
                                        <Message>
                                            No Labels
                                        </Message>
                                    }
                                </List>
                            </Body>
                            <Bottom>
                                <CreateButton
                                    onClick = {() => {
                                        this.createLinkage()
                                    }}
                                >
                                    Link External Information
                                </CreateButton>
                            </Bottom>
                        </ModalContent>
                    </div>
                </CSSTransition>
            </ModalBackground>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    let {workspaceId} = ownProps.match.params;

    let repositoryId;

    let split = history.location.pathname.split('/');
    if (split.length > 4) {
        if (split[3] === "repository") {
            repositoryId = split[4];
        }
    }

    let workspace, repository;

    if (workspaceId) {
        workspace = state.workspaces[workspaceId];
    }

    if (workspace && repositoryId) {
        repository = workspace.repositories.filter((repo => repo._id === repositoryId))[0];
    }

    return {
        user: state.auth.user,
        selected : Object.values(state.selected),
        workspace,
        repository
    }
}


export default withRouter(connect(mapStateToProps, { clearSelected, createLinkage })(LinkageCreate));


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
