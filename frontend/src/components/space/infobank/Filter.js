import React, { Component } from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//icons
import { RiCheckFill, RiFileFill } from 'react-icons/ri';

//components
import RepositoryMenu3 from '../../menus/RepositoryMenu3';
import { AiFillFolder } from 'react-icons/ai';
import LabelMenu from '../../menus/LabelMenu';
import FilterDocumentMenu from '../../menus/FilterDocumentMenu';
import { remove } from 'js-cookie';

/*
class Filter extends Component {
    constructor(props){
        super(props);

        this.state = {
            documentIsSelected: false,
            referenceIsSelected: false,

            repository: null,
            references: [], 
            tags: [], 
            documents: []
        }
    }

    renderReferenceMenu = () => {

        const { repository, references } = this.state;

        const attachRef = (ref) => {
            let refs = [...this.state.references];
            refs.push(ref);
            this.setState({references: refs});
        }

        const removeRef = (ref) => {
            let refs = [...this.state.references];
            refs = refs.filter((refer) => {return refer._id !== ref._id});
            this.setState({references: refs});
        }

        return (
            repository ? 
                < FileReferenceMenu 
                    form = {true}
                    setReferences = {references}
                    document = {{repository}}
                    formAttachReference = {attachRef}
                    formRemoveReference = {removeRef}
                /> :
                <AddButton>
                    <RiAddLine />
                </AddButton>
        )
    }


    renderRefs = () => {
        const { references } = this.state;

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

    renderLabelMenu = () => {

        const attachTag = (tag) => {
            let tags = [...this.state.tags];
            tags.push(tag);
            this.setState({tags})
        }

        const removeTag = (tagNew) => {
            let tags = [...this.state.tags];
            tags = tags.filter((tag) => {return tag._id !== tagNew._id})
            this.setState({tags})
        }

        const { tags } = this.state;

        return (
            <LabelMenu
                attachTag = {attachTag}
                removeTag = {removeTag}
                setTags = {tags}
                marginTop = {"1rem"}
                form = {true}
            />
        )
    }

    
    renderTags(){
        const { tags } = this.state;

        let colors = ['#5352ed', 
            '#ff4757', '#20bf6b','#1e90ff', '#ff6348', '#e84393', '#1e3799', '#b71540', '#079992'
        ]

        return tags.map(tag => {
            let color = tag.color < colors.length ? colors[tag.color] : 
                colors[tag.color - Math.floor(tag.color/colors.length) * colors.length];

            return <Tag color = {color} backgroundColor = {chroma(color).alpha(0.15)}>{tag.label}</Tag>
        })
    }

    renderDocumentMenu = () => {

        const attachDocument = (document) => {
            let documents = [...this.state.documents];
            documents.push(document);
            this.setState({documents});
        }

        const removeDocument = (document) => {
            let documents = [...this.state.documents];
            documents = documents.filter((doc) => {return doc._id !== document._id})
            this.setState({documents})
        }

        const { documents } = this.state;

        return (
            <FilterDocumentMenu
                attachDocument = {attachDocument}
                removeDocument = {removeDocument}
                setDocuments = {documents}
            />
        )

    }


    render(){
        const { documentIsSelected, referenceIsSelected, 
            repository, references, tags, documents } = this.state;
        return(
            <FilterContainer>
                <FilterHeader>Filter By</FilterHeader>
                <FilterBlock>
                    <SectionHeader>Type</SectionHeader>
                    <TypeButton color = {'#f27448'}>
                        Documents
                    </TypeButton>
                    <TypeButton color = {'#6762df'}>
                        References
                    </TypeButton>
                </FilterBlock>
                <FilterBlock>
                    <SectionHeader>Repository</SectionHeader>
                    <RepositoryMenu3/>
                </FilterBlock>
                <FilterBlock>
                    <SectionHeader>References</SectionHeader>
                    {this.renderReferenceMenu()}
                    {references.length > 0 ? <InfoList>{this.renderRefs()}</InfoList> : 
                        <Message>
                            {repository ? 
                                "No References" : 
                                "Select a repository to filter documents by reference"
                            }
                        </Message>
                    }
                </FilterBlock>
                <FilterBlock>
                    <SectionHeader>Documents</SectionHeader>
                    {this.renderDocumentMenu()}
                    {documents.length > 0 ? <InfoList>{this.renderDocs()}</InfoList> : 
                        <Message>
                            No Documents
                        </Message>
                    }
                </FilterBlock>
                <FilterBlock>
                    <SectionHeader>Labels</SectionHeader>
                    <List style = {{marginBottom: "3rem"}}>
                        {tags.length > 0 ? <InfoList>{this.renderTags()}</InfoList> : 
                            <Message>
                                No Labels
                            </Message>
                        }
                    </List>
                </FilterBlock>
                <FilterBlock>
                    <SectionHeader>Creator</SectionHeader>
                    
                </FilterBlock>
                <FilterBlock>
                    <SectionHeader>Status</SectionHeader>
                    
                </FilterBlock>
            </FilterContainer>
        )
    }
}

export default Filter;*/

const TypeButton = styled.div`
    background-color: ${props => chroma(props.color).alpha(0.2)};
    border-radius: 0.3rem;
    font-size: 1.1rem;
    padding: 0.7rem 1rem;
    display: inline-flex;
    color:  ${props => props.color};
    text-transform: uppercase;
    font-weight: 400;
    &:last-of-type {
        margin-top: 1rem;
    }
    justify-content: center;
    align-items: center;
    width: 9rem;
`


const FilterHeader = styled.div`
    color: #172A4e;
    font-weight: 500;
    font-size: 1.8rem;
    height: 3rem;
`

const FilterBlock = styled.div`
    display: flex;
    flex-direction: column;
`

const SectionHeader = styled.div`
    height: 2rem;
    font-weight: 500;
    font-size: 1.3rem;
    text-transform: uppercase;
    opacity: 0.7;
    margin-top: 2.5rem;
    margin-bottom: 1rem;
`   

const FilterContainer = styled.div`
    height: 70rem;
    width: 40rem;
    margin-right: 3rem;
    background-color: white;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 5px 10px -5px;
    border-radius: 0.7rem;
    padding: 3rem;
    display: flex;
    flex-direction: column;
`

const Form = styled.div`
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
`

const CheckBoxBorder = styled.div`
    min-height: 4rem;
    min-width: 4rem;
    margin-right: 0.5rem;
    &:hover {
        background-color: ${chroma("#6762df").alpha(0.1)};
    }
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border-radius: 50%;
`

const CheckBox = styled.div`
    height: 1.6rem;
    width: 1.6rem;
    background-color: ${props => props.backgroundColor};
    border: 2px solid ${props => props.borderColor};
    border-radius: 0.2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    margin-right: 1rem;
`

const CheckContainer = styled.div`
    display: flex;
    align-items: center;
    &:first-of-type {
        margin-bottom: 1.4rem;
    }
    font-size: 1.3rem;
    font-weight: 500;
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