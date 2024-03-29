import React from 'react';

//redux
import { connect } from 'react-redux';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';
import history from '../../../history';

//icons
import {AiFillFolder } from 'react-icons/ai';
import {RiFileFill, RiPencilLine, RiAddLine} from 'react-icons/ri';

//router
import {withRouter} from 'react-router-dom';

//components
import DocumentMenu2 from '../../menus/DocumentMenu2';
import RepositoryMenu2 from '../../menus/RepositoryMenu2';
import FileReferenceMenu from '../../menus/FileReferenceMenu';
import LabelMenu from '../../menus/LabelMenu';
import { CSSTransition } from 'react-transition-group';

//actions
import { createDocument } from '../../../actions/Document_Actions';
import { clearSelected } from '../../../actions/Selected_Actions';

class DocumentCreationModal extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            tags: [],
            references: [],
            parent: null,
            repository: null,
            loading: false,
            title: ""
        }
    }

    checkParam = (param) => {
        let { search } = history.location;
        let params = new URLSearchParams(search)
        let check = params.get(param);
        if ( check !== null && check !== undefined ){
            return true
        }
        return false
    }


    async componentDidMount(){
        const { selected, repository, documents } = this.props;

        let { search } = history.location;
        let params = new URLSearchParams(search)
        let parentId = params.get("parent_id");

        let state = { references: selected, repository };

        if (parentId && documents[parentId]) state.parent = documents[parentId];

        this.setState(state);
    }

    //TODO: NEED TO FORCE TITLE
    //TODO: NEED TO DEAL WITH PARENTID
    //TODO: NEED TO DEAL WITH CREATION RESULT
    createDocument = async (e) =>  {
        e.stopPropagation()
        e.preventDefault()

        this.setState({loading: true})

        const { tags, references, parent, repository } = this.state;
        const { match, user, createDocument, clearSelected, history } = this.props;
        let { workspaceId } = match.params

        const markup = JSON.stringify(
            [{
                type: 'paragraph',
                children: [
                { text: '' },
                ],
            }]
        )

        let affectedDocuments =  await createDocument({
            authorId: user._id,
            workspaceId,
            title: this.titleInput.value,
            tagIds: tags.map(tag => tag._id), 
            parentPath: (parent && parent.path) ? parent.path : "",
            repositoryId: repository ? repository._id : null,
            referenceIds: references.map(item => item._id), 
            markup
        })

        if (affectedDocuments) {
            const { documents } = this.props;

            let doc = documents[affectedDocuments[0]._id];
                
            history.push(`?document=${doc._id}&edit=${true}`);
            clearSelected();
        }
    }


    attachDocRef = (ref) => {
        let refs = [...this.state.references];
        refs.push(ref);
        this.setState({references: refs})
    }

    removeDocRef = (ref) => {
        let refs = [...this.state.references];
        refs = refs.filter((refer) => {return refer._id !== ref._id})
        this.setState({references: refs})
    }

    attachDocTag = (tag) => {
        let tags = [...this.state.tags];
        tags.push(tag);
        this.setState({tags})
    }

    removeDocTag = (tagNew) => {
        let tags = [...this.state.tags];
        tags = tags.filter((tag) => {return tag._id !== tagNew._id})
        this.setState({tags})
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

    undoModal(){
        history.push(history.location.pathname)
    }

    renderReferenceMenu = () => {
        return (
            this.state.repository ? < FileReferenceMenu form = {true}
                                        setReferences = {this.state.references}
                                        document = {{repository: this.state.repository}}
                                        formAttachReference = {(ref) => this.attachDocRef(ref)}
                                        formRemoveReference = {(ref) => this.removeDocRef(ref)}
                                    /> :
                                    <AddButton>
                                        <RiAddLine />
                                    </AddButton>
        )
    }

    render(){
        let {loading, titleFocused} = this.state;
        return(
            <ModalBackground onClick = {() => {this.undoModal()}}>
                <CSSTransition
                    in={true}
                    appear = {true}
                    timeout={300}
                    classNames="modal"
                >   
                <ModalContent 
                    loading = {loading} 
                    onClick = {(e) => {e.stopPropagation()}}
                >
                <Header>
                    Create New Document
                </Header>
                <Content>
                    <Body>
                        <Guide>
                            Title
                        </Guide>
                        <Description>
                            Provide your document with a unique title in this workspace.
                        </Description>
                        <TitleInput 
                            ref = {node => this.titleInput = node} 
                            onFocus = {() => {this.setState({titleFocused: true})}}
                            onBlur = {() => {this.setState({titleFocused: false})}}
                            active = {titleFocused}
                            placeholder = {"Document Title"}
                        />
                        <Guide>
                            Location
                        </Guide>
                        <Description>
                            Parent to your new document.
                        </Description>
                        <DocumentMenu2
                            form = {true}
                            selectParent = {(parent) => {this.setState({parent})}}
                            parent = {this.state.parent}
                        />  
                        <Guide>
                            Repository
                        </Guide>
                        <Description>
                            Relevant repository that your document targets.
                        </Description>
                        <RepositoryMenu2 
                            selectRepository = {(repository) => this.setState({repository})}
                            formRepository = {this.state.repository}
                            form = {true}
                            emptyReferences = {() => this.setState({references: []})}
                        />
                        <Guide>
                            Code References
                        </Guide>
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
                        <Guide>
                            Labels
                        </Guide>
                        <Description>
                            Attach labels to optimize search.
                        </Description>
                        <List style = {{marginBottom: "3rem"}}>
                            <LabelMenu
                                attachTag = {(tag) => this.attachDocTag(tag)}
                                removeTag = {(tag) => this.removeDocTag(tag)}
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
                </Content>
                <Bottom>
                    <CreateButton onClick = {(e) => {this.createDocument(e)}}>
                        Create document
                    </CreateButton>
                </Bottom>
                </ModalContent>
                </CSSTransition>
            </ModalBackground>
        )
    }
}


const mapStateToProps = (state, ownProps) => {
    const { documents, selected, workspaces, auth: { user } } = state;
    let { repositoryId, workspaceId } = ownProps.match.params
    
    return {
        user,
        selected: Object.values(selected),
        documents,
        repository: repositoryId ? 
            workspaces[workspaceId].repositories.filter(repo => {return repo._id === repositoryId})[0] : 
            undefined
    }   
}

export default withRouter(connect(mapStateToProps, 
    {clearSelected, createDocument})(DocumentCreationModal));

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


const ModalContent = styled.div`
    background-color: #fefefe;
    margin: 7vh auto; /* 15% from the top and centered */

    width: 85vw; /* Could be more or less, depending on screen size */
    border-radius: 0.2rem;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 75rem;
    border-radius: 0.3rem;
    background-color: white;
    color: #172A4e;
    background-color: white;
`

const Bottom = styled.div`
    background-color:#f7f9fb;
    min-height: 7.5rem;
    max-height: 7.5rem;
    padding-left: 4rem;
    padding-right: 4rem;
    align-items: center;
    display: flex;
    width: 100%;
    border-top: 1px solid #E0E4e7;
    border-bottom-left-radius: 0.3rem;
    border-bottom-right-radius: 0.3rem;
`

const Body = styled.div`
    width: 65rem;
    padding-bottom: 3rem;
`

const Message = styled.div`
    opacity: 0.5;
    font-size: 1.4rem;
    font-weight: 500;
    margin-left: 1.5rem;
`

const List = styled.div`
    display: flex;
    align-items: center;
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

const IconBorder = styled.div`
   /* background-color: ${props => chroma('#19e5be').alpha(0.15)};*/
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    color: white;
    border: 1px solid #19e5be;
    font-size: 2rem;
    margin-right: 1.5rem;
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

const InfoList = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin-left: 1.5rem;
    margin-bottom: -1rem;
`

const TitleInput = styled.input`
    height: 3.5rem;
    padding: 0rem 1.5rem;
    width: 100%;
    border: 1px solid #E0E4E7;
    border-radius: 0.4rem;
    &:hover {
        background-color: ${props => props.active ? "" : "#F4F4F6"};
    }
    font-size: 1.4rem;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif;
    font-weight: 500;
    &::placeholder {
        color: #172A4e;
        opacity: 0.5;
    }
`

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
    &:hover {
        background-color: #f4f4f6;
    }
`

const Description = styled.div`
    color: 172a4e;
    font-size: 1.5rem;
    font-weight: 400;
    margin-bottom: 1.3rem;
    height: 2rem;
    opacity: 0.5;
`

const Guide = styled.div`
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
`

const Title = styled.div`
    font-weight: 500;
`

const Reference = styled.div`
    background-color: ${chroma("#6762df").alpha(0.12)};
    /*color: ${chroma("#6762df").alpha(0.9)};*/
    border-radius: 0.2rem;
    font-size: 1.3rem;
    padding: 0.3rem 0.55rem;
    margin-right: 1.5rem;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
`

const Header = styled.div`
    font-weight: 500;
    font-size: 1.9rem;
    font-weight: 500;
    padding: 2.2rem 4rem;
    display: flex;
    align-items: center;
    color: white;
    background-color: #2B2F3A;
    border-top-left-radius: 0.3rem;
    border-top-right-radius: 0.3rem;
`

/*
const Header = styled.div`
    font-weight: 500;
    font-size: 1.75rem;
    font-weight: 500;
    min-height: 7.5rem;
    max-height: 7.5rem;
    padding-left: 4rem;
    padding-right: 4rem;
    display: flex;
    align-items: center;
    background-color:#2B2F3A;
    color: white;
    border-top-right-radius:0.3rem;
    border-top-left-radius:0.3rem;
`*/

const Content = styled.div`
    padding-top: 5rem;
    padding-bottom: 0rem;
    overflow-y: scroll;
    background-color: white;
    align-items: center;
    display: flex;
    flex-direction: column;
`