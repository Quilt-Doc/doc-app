import React from 'react';

//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//components
import RepositoryMenu from '../../General/Menus/RepositoryMenu';


//history
import history from '../../../history';

//router
import {withRouter} from 'react-router-dom';

//icons
import { FiFileText, FiChevronDown } from 'react-icons/fi';
import { RiFileList2Fill, RiStackLine } from 'react-icons/ri';
import {RiSlackLine, RiCheckboxCircleFill, RiGitRepositoryLine} from 'react-icons/ri';
import {BiCube, BiPurchaseTag} from 'react-icons/bi';
import {FaConfluence} from 'react-icons/fa';
import {FaTrello, FaJira} from 'react-icons/fa';
import {SiAsana, SiNotion} from 'react-icons/si';
import {IoIosSearch} from 'react-icons/io'
import {RiFilter2Line} from 'react-icons/ri';

import LabelMenu from '../../General/Menus/LabelMenu';

class CodeInfo extends React.Component {
    constructor(props){
        super(props);
    }


    renderDocuments(){
        return this.props.documents.map((doc, i) => {
            let title = doc.title
            return (
                <ListItem 
                    onClick = {() => history.push(`?document=${doc._id}`)}
                    active = {i%2 == 0 ? false : true} 
                >
                    <RiFileList2Fill  style = {{marginRight: "1rem",
                        color: '#2684FF'
                    }}/>
                    <Title2>{title && title !== "" ? title : "Untitled"}</Title2>
                    <Status>
                        <RiCheckboxCircleFill/>
                    </Status>
                    <Date>
                        Created by Faraz Sanal on April 20, 2021
                    </Date>
                </ListItem>
            )
        })
    }

    renderTags(){
        let colors = ['#5352ed', 
        '#ff4757', '#20bf6b','#1e90ff', '#ff6348', '#e84393', '#1e3799', '#b71540', '#079992'
        ]

        return this.props.currentReference.tags.map(tag => {
            let color = tag.color < colors.length ? colors[tag.color] : 
                colors[tag.color - Math.floor(tag.color/colors.length) * colors.length];

            return <Tag color = {color} backgroundColor = {chroma(color).alpha(0.15)}>{tag.label}</Tag>
        })
    }

    renderHeaderPath() {
        if (this.props.currentReference && this.props.currentReference.path !== "") {
            let splitPath = this.props.currentReference.path.split("/")
            return splitPath.map((sp, i) => {
                let reLocate = splitPath.slice(0, i + 1).join("/");
                return(<><Slash>/</Slash><RepositoryPath onClick = {() => {this.props.redirectPath(reLocate)}}>{sp}</RepositoryPath></>)
            })
        }
        return "";
    }

    renderRepositoryName(){
        return <RepositoryPath onClick = {() => {this.props.redirectPath("")}}>
            {this.props.currentRepository.fullName.split("/")[1]}
        </RepositoryPath>
    }


    render(){
        return(
            <>
                
                <PageToolbar>
                    <RepositoryMenu repoName = {this.props.currentRepository.fullName.split("/")[1]}/>
                    {this.props.renderDocumentMenu()}
                    {this.props.renderLabelMenu()}
                </PageToolbar>
                <Container>
                    <Header>
                        {this.renderRepositoryName()}
                        {this.renderHeaderPath()}
                    </Header>
                    
                    {this.props.currentReference.tags.length > 0 && 
                        <Tags>
                            {this.renderTags()}
                        </Tags>
                    }
                    <Info>
                        <Toolbar>
                            <RiStackLine style = {{fontSize: "1.8rem", marginRight: "0.7rem"}} />
                            Information
                        </Toolbar>
                        <ListView>
                            {this.props.documents.length > 0 ? this.renderDocuments() :
                                <EmptyMessage>No Information attached</EmptyMessage>
                            }
                        </ListView>
                    </Info>
                </Container>
                
            </>
        )
    }
}

export default withRouter(CodeInfo);

{/*
<ReferenceContainer>
                    {(this.props.documents && this.props.documents.length > 0) && this.renderDocuments()}
                </ReferenceContainer>

<Info>
                <Header>
                    <RepositoryMenu 
                        name = {this.props.currentRepository.fullName.split("/")[1]}
                    />
                    {this.renderHeaderPath()}
                </Header>
                <ReferenceContainer>
                    {this.props.currentReference && this.props.currentReference.tags && this.props.currentReference.tags.length > 0 ? 
                        this.renderTags() : <></>}
                </ReferenceContainer>
                <ReferenceContainer>
                    {(this.props.documents && this.props.documents.length > 0) && this.renderDocuments()}
                </ReferenceContainer>
                    </Info>*/}

const Container = styled.div`
    padding-left: 8rem;
    padding-right: 8rem;
`

const PageToolbar = styled.div`
    height: 4.5rem;
    display: flex;
    align-items: center;
    
    background-color:white;
    /*background-color: white;*/
    padding-left: 3rem;
    padding-right: 3rem;
    opacity: 1;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    position: sticky;
    top: 0;
`


const PageIcon = styled.div`
    margin-right: 1.5rem;
    display: flex;
    align-items: center;
    font-size: 1.5rem;
   
   /*color: white;*/
    /*background-color: #4c5367;*/
   /* opacity: 0.8;*/
   padding: 0.5rem 1rem;
    &:hover {
        background-color: #f7f9fb;
        
    }
    cursor: pointer;
    border-radius: 0.3rem;
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

const Date = styled.div`
    margin-left: auto;
    opacity: 1;
    font-size: 1.2rem;
    width: 25rem;
`

const Tags = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
`

const ListView = styled.div`
    display: flex;
    flex-direction: column;
    max-height: 14.5rem;
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

const Title2 = styled.div`
    font-weight: 500;
    font-size: 1.3rem;
    width: 40%;
`

const Status = styled.div`
    display: flex;
    align-items: center;

    text-transform: uppercase;
    color: #19e5be;
`

const Circle = styled.div`
    border-radius: 50%;
    background-color: #19e5be;
    height: 0.7rem;
    width: 0.7rem;
    margin-right: 1.5rem;
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

const ListItem = styled.div`
    display: flex;
    align-items: center;
    padding-left: 3rem;
    padding-right: 3rem;
    min-height: 3.5rem;
    max-height: 3.5rem;
    background-color: ${props => props.active ? chroma("#5B75E6").alpha(0.04) : ''};
    font-size: 1.5rem;
`


const ReferenceContainer = styled.div`
    /*margin-bottom: 2.7rem;*/
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    /*
    &:last-of-type {
        margin-bottom: 1.5rem;
    }*/
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


/*
const Header = styled.div`
    font-size: 1.5rem;
    color: #172A4E;
    margin-bottom: 2.7rem;
    display: flex;
    align-items: center;
`*/
const Header = styled.div`
    font-size: 2rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    padding-top: 6rem;
    margin-bottom: 2.3rem;

`



const Title = styled.div`
    font-size: 1.3rem;
    margin-right: 0.3rem;
`

const DocumentItem = styled.div`
    /*width: 15rem;*/
    
    border-radius: 0.4rem;
    /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;*/
    /*border: 0.1px solid #D7D7D7;*/
    /*border: 1px solid #E0E4E7;*/
    font-size: 1.25rem;
    margin-right: 1.8rem;
    display: flex;
    cursor: pointer;
    &:hover {
        color: #1E90FF;
    }
    font-weight: 500;
`