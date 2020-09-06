import React from 'react';

//redux
import { connect } from 'react-redux';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//icons
import { VscDebugDisconnect } from 'react-icons/vsc';
import {AiFillFolder } from 'react-icons/ai';
import {RiFileFill, RiAddFill, RiPencilLine, RiGitRepositoryLine, RiFileTextLine} from 'react-icons/ri';
import {FaJira} from 'react-icons/fa';
import {FiChevronDown} from 'react-icons/fi';
import { BiPurchaseTag, BiCube } from 'react-icons/bi';

//spinner
import MoonLoader from "react-spinners/MoonLoader";

//router
import {withRouter} from 'react-router-dom';
import history from '../../history';

//components
import DocumentMenu2 from '../General/Menus/DocumentMenu2';
import RepositoryMenu2 from '../General/Menus/RepositoryMenu2';
/*
import LabelMenu from '../../Gene
*/

//actions
import { createDocument } from '../../actions/Document_Actions';
import { setCreation } from '../../actions/UI_Actions';
import { clearSelected } from '../../actions/Selected_Actions';
import { CSSTransition } from 'react-transition-group';
import FileReferenceMenu from '../General/Menus/FileReferenceMenu';
import LabelMenu from '../General/Menus/LabelMenu';

class CreationModal extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            tags: [],
            references: [],
            parent: "",
            repository: null
        }
    }

    componentDidUpdate(prevProps){
        if (prevProps.open === false && this.props.open === true){
            console.log("REPOSITORY IN MODAL", this.props.repository);
            console.log(this.props.selected);
            this.setState({references: this.props.selected, repository: this.props.repository})
        }
    }

    attachRef = (ref) => {
        let refs = [...this.state.references];
        refs.push(ref);
        this.setState({references: refs})
    }

    removeRef = (ref) => {
        let refs = [...this.state.references];
        refs.filter((refer) => {return refer._id === ref._id})
        this.setState({references: refs})
    }

    attachTag = (tag) => {
        let tags = [...this.state.tags];
        tags.push(tag);
        this.setState({tags})
    }

    removeTag = (tagNew) => {
        let tags = [...this.state.tags];
        tags.filter((tag) => {return tag._id === tagNew._id})
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

    render(){
        let open = this.props.open;
        return(
            <>
                {open &&
                <ModalBackground onClick = {() => {this.props.closeModal()}}>
                    <CSSTransition
                        in={true}
                        appear = {true}
                        timeout={300}
                        classNames="modal"
                    >   
                        <div>
                            <ModalContent onClick = {(e) => {e.stopPropagation()}}>
                                {this.props.loading ?
                                    <Center><MoonLoader color = {"white"}/></Center>
                                :
                                    <>
                                        <Header>
                                            <RiPencilLine  style = {{fontSize: "2.5rem", marginRight: "1rem"}}/>
                                            Create New Document
                                        </Header>
                                        <Guide>
                                            <Circle color = {"#19e5be"}/>
                                            Choose a location
                                        </Guide>
                                        <div>
                                            <DocumentMenu2
                                                form = {true}
                                                selectParent = {(parent) => {console.log(parent); this.setState({parent})}}
                                                parent = {this.state.parent}
                                            />  
                                        </div>
                                        <Guide>
                                            <Circle color = {"#fa8231"}/>
                                            Select a repository
                                        </Guide>
                                        <div>
                                            
                                            <RepositoryMenu2 
                                                selectRepository = {(repository) => this.setState({repository})}
                                                formRepository = {this.state.repository}
                                                form = {true}
                                            />
                                        </div>
                                    
                                        <Guide light = {true}>
                                            <Circle color = {"#45aaf2"}/>
                                            Attach code references
                                        </Guide>
                                        <ReferenceList>
                                        {this.renderRefs()}
                                        {this.state.repository === null ?
                                                <AddButton  onClick = {(e) => this.openMenu(e)} ref = {addButton => this.addButton = addButton}>
                                                    <BiCube style = {{fontSize: "1.4rem", marginRight: "0.5rem"}}/>
                                                    <Title>Add references</Title>
                                                </AddButton> 
                                                :
                                                <FileReferenceMenu
                                                    form = {true}
                                                    setReferences = {this.state.references}
                                                    document = {{repository: this.state.repository}}
                                                    formAttachReference = {(ref) => this.attachRef(ref)}
                                                />
                                            }
                                        
                                        </ReferenceList>
                                        <Guide>
                                            <Circle color = {"#5352ed"}/>
                                            Add labels
                                        </Guide>
                                        <ReferenceList>
                                        {this.renderTags()}
                                            <LabelMenu
                                                attachTag = {(tag) => this.attachTag(tag)}//this.props.attachTag(requestId, tagId)}
                                                removeTag = {(tag) => this.removeTag(tag)}//this.props.removeTag(requestId, tagId)}
                                                setTags = {this.state.tags}//this.props.request.tags}
                                                marginTop = {"1rem"}
                                                form = {true}
                                            />
                                            
                                        </ReferenceList>
                                        <CreateButton onClick = {(e) => {this.props.createDocument(e, this.state)}}>
                                            Create
                                        </CreateButton>
                                    </>
                                }
                            </ModalContent>
                        </div>
                    </CSSTransition>
                </ModalBackground>
                }
            </>
        )
    }
}

export default CreationModal;

const Center = styled.div`
    width: 100%;
    height: 70rem;
    display: flex;
    align-items: center;
    justify-content: center;
`

const Tag = styled.div`
    font-size: 1.35rem;
    color: ${props => props.color};
    padding: 0.2rem 0.8rem;
    background-color: ${props => chroma(props.color).alpha(0.15)};
    border: 1px solid ${props => props.color};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.3rem;
	margin-right: 1.35rem;
    font-weight: 500;
    margin-bottom:1rem;
`

const CreateButton = styled.div`
    margin-top: auto;
    background-color: #363b49;
    display: inline-flex;
    font-size: 1.6rem;
    margin-bottom: 2rem;
    justify-content: center;
    align-items: center;
    padding: 1rem 2rem;
    width: 10rem;
    border-radius: 0.3rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    font-weight: 500;
    cursor: pointer;
`

const Circle = styled.div`
    border-radius: 50%;
    height: 0.9rem;
    width: 0.9rem;
    background-color: #19e5be;
    margin-right: 1rem;
    background-color: ${props => props.color};
`

const Guide = styled.div`
    color: 172a4e;
    font-size: 1.6rem;
    font-weight: 500;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    height: 2rem;
`

const Location = styled.div`
    background-color: #f1f5f8;
    padding: 0.5rem 2rem;
    border-radius: 0.4rem;
    font-weight: 500;
    font-size: 1.7rem;
    display: inline-flex;
    align-items: center;
    margin-bottom: 4rem;
`

const Provider = styled.div`
    background-color: #363b49;
    padding: 1rem 2rem;
    border-radius: 0.4rem;
    font-weight: 500;
    font-size: 1.7rem;
    display: inline-flex;
    align-items: center;
    margin-bottom: 4rem;
    &:hover {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    cursor: pointer;
`


const Title = styled.div`
    font-weight: 500;
`


const Reference = styled.div`
    background-color: ${chroma("#5B75E6").alpha(0.08)};
    /*color: ${chroma("#5B75E6").alpha(0.9)};*/
    border-radius: 0.2rem;
    font-size: 1.3rem;
    padding: 0.4rem 1rem;
    margin-right: 1rem;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    
`

const AddButton = styled.div`
    background-color: #363b49;
    /*color: ${chroma("#5B75E6").alpha(0.9)};*/
    border-radius: 0.2rem;
    font-size: 1.3rem;
    padding: 0.4rem 1rem;
    margin-right: 1rem;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    &:hover {
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    opacity: 0.5;
`

const Reference2 = styled.div`
    background-color: ${chroma("#1E90FF").alpha(0.08)};
    /*color: ${chroma("#1E90FF").alpha(0.9)};*/
    border-radius: 0.2rem;
    font-size: 1.3rem;
    padding: 0.4rem 1rem;
    margin-right: 1rem;
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
`

const ReferenceList = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 3rem;
`

const SourceInput = styled.input`
    height: 3.5rem;
    border: 1px solid #5B75E6;
    background-color: #ACB9F4;
    border-radius: 0.3rem;
    padding-left: 1rem;
    padding-right: 1rem;
    width: 100%;
    margin-bottom: 4rem;
    color:#2e4fe0;
    font-size: 1.6rem;
    &::placeholder{
        color:#2e4fe0;
    }
    font-weight: 500;
    outline: none;
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
    height: 10rem;
    display: flex;
    align-items: center;
    
`

const ModalContent = styled.div`
    background-color: #2B2F3A;
    margin: 7vh auto; /* 15% from the top and centered */
    
    width: 85vw; /* Could be more or less, depending on screen size */
    min-height: 50rem;
    border-radius: 0.2rem;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px;
    display: flex;
    flex-direction: column;
    max-width: 70rem;
    border-radius: 0.3rem;
    color: white;
    padding: 0 4rem;
    max-height: 80rem;
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
`