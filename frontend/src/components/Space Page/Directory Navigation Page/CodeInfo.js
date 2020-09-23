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
import { RiFileList2Fill, RiStackLine, RiCheckFill } from 'react-icons/ri';
import {BiHighlight} from 'react-icons/bi';
import {RiSlackLine, RiCheckboxCircleFill, RiGitRepositoryLine} from 'react-icons/ri';
import {BiCube, BiPurchaseTag} from 'react-icons/bi';
import {FaConfluence} from 'react-icons/fa';
import {FaTrello, FaJira} from 'react-icons/fa';
import {SiAsana, SiNotion} from 'react-icons/si';
import {IoIosSearch} from 'react-icons/io'
import {RiFilter2Line} from 'react-icons/ri';

import LabelMenu from '../../General/Menus/LabelMenu';
import { CgOptions } from 'react-icons/cg';
import { CSSTransition } from 'react-transition-group';
import { AiOutlineClockCircle } from 'react-icons/ai';

class CodeInfo extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            setOptions:false
        }
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
                        fontSize: "2rem",
                        color: '#2684FF'
                    }}/>
                    <Title2>{title && title !== "" ? title : "Untitled"}</Title2>
                    <Status>
                        <RiCheckFill 
                            style = 
                            {{
                                
                                marginRight: "0.3rem",
                                fontSize: "1.5rem"
                        
                            }}

                        />
                        Valid
                    </Status>
                    <Creator>
                        F
                    </Creator>
                    <CreationDate>
                        <AiOutlineClockCircle
                            style = {{marginRight: "0.5rem"}}
                        />
                        August 12, 2015
                    </CreationDate>
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

    renderHighlight = () => {
        return(
            <PageIcon 
                active = {this.props.selectionMode} 
                onClick = {(e) => this.props.toggleSelection()} 
                ref = {hiButton => this.hiButton = hiButton}>
                <BiHighlight style = {{marginRight: "0.5rem"}}/>
                <Title>Create Snippet</Title>
            </PageIcon>
        )
    }
    


    render(){
        let {setOptions} = this.state
        return(
            <>
                <CSSTransition
						in={setOptions}
						unmountOnExit
						enter = {true}
						exit = {true}
						timeout={150}
						classNames="editortoolbar"
					>
                    <PageToolbar>
                        <RepositoryMenu repoName = {this.props.currentRepository.fullName.split("/")[1]}/>
                        {this.props.codeview &&
                            this.renderHighlight()
                        }
                        {this.props.renderDocumentMenu()}
                        {this.props.renderLabelMenu()}
                    </PageToolbar>
                </CSSTransition>
                <MainToolbar>
                    <Button 
                        active = {setOptions}
                        onClick = {() => {this.setState({setOptions: !setOptions})}}
                    >
                        <CgOptions/>
                    </Button>
                </MainToolbar>
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


const Creator = styled.div`
    height: 2.5rem;
    width: 2.5rem;
    background-color: ${chroma('#1e90ff').alpha(0.2)};
    color:#1e90ff;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.3rem;
    font-size: 1.4rem;
    margin-left: auto;
    margin-top: -0.1rem;
    margin-right: 3rem;
`

const Container = styled.div`
    padding-left: 5rem;
    padding-right: 5rem;
`

const CreationDate = styled.div`
    display: inline-flex;
    align-items: center;
    background-color: #f5f7fa;
    height: 2.3rem;
    padding: 0rem 0.8rem;
    font-weight:500;
    border-radius: 0.3rem;
    color: #8996A8;
    font-size: 1.1rem;
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
        background-color:  ${props => props.active ? chroma("#5B75E6").alpha(0.2) : "#dae3ec;"};
    }
    background-color: ${props => props.active ? chroma("#5B75E6").alpha(0.2)  : ""};
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
        background-color:  ${props => props.active ? chroma('#5B75E6').alpha(0.2) : "#F4F4F6;"};
        
    }
    background-color: ${props => props.active ? chroma('#5B75E6').alpha(0.2) : ""};
    
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

const Title2 = styled.div`
    font-weight: 500;
    font-size: 1.35rem;
    width: 40%;
`



const Status = styled.div`
    display: inline-flex;
    background-color: ${chroma('#19e5be').alpha(0.15)};
    color: #19e5be;
    font-weight: 500;
    border-radius: 0.3rem;
    font-size: 1.3rem;
    padding: 0rem 1rem;
    align-items: center;
    margin-left: 2rem;
    height: 2rem;
    margin-top: -0rem;
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
    min-height: 4rem;
    max-height: 4rem;
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
/*

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
`*/
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
    padding-top: 2rem;
    margin-bottom: 2.3rem;

`



const Title = styled.div`
    font-size: 1.3rem;
    margin-right: 0.3rem;
    font-weight: 500;
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