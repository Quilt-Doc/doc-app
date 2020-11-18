import React, {Component} from 'react';
//styles
import styled from 'styled-components';
import chroma from 'chroma-js';
import { LIGHT_SHADOW_1 } from '../../../../../styles/shadows';

//icons
import { AiFillFolder, AiOutlineCloseCircle, AiOutlineCodeSandbox, AiOutlineTool } from 'react-icons/ai';
import { RiCloseFill, RiEditBoxLine, RiFileEditLine, RiFileFill, RiFileList2Fill, RiFileList2Line, RiFileTextLine, RiPencilLine, RiScissorsLine, RiToolsLine } from 'react-icons/ri';
import { FiGitCommit, FiPlus } from 'react-icons/fi';
import { IoMdCheckmarkCircleOutline, IoIosCheckmark, IoIosCalendar } from 'react-icons/io';
import { BiGitCommit, BiLink } from 'react-icons/bi';

//components
import CheckDeprecatedDocument from './CheckDeprecatedDocument';

class CheckRightContent extends Component {

    renderNewReferences = () => {
        const { check: {addedReferences }} = this.props;

        if (addedReferences && addedReferences.length > 0) {
            return (
                <IssueContainer>
                    <Guide2>Undocumented Code</Guide2>
                    <InfoList>
                        {
                            addedReferences.map((ref) => {
                                return(
                                    <Reference>
                                        { ref.kind === "dir" ? <AiFillFolder style = {{marginRight: "0.5rem"}}/> :
                                            <RiFileFill style = {{width: "1rem", fontSize: "1.1rem" ,marginRight: "0.5rem"}}/>
                                        }
                                        <ReferenceTitle>{ref.name}</ReferenceTitle>
                                    </Reference>
                                )
                            })
                        }
                    </InfoList>
                </IssueContainer>
            )
            /*
            return (
                <Block>
                    <BlockHeader>
                        <Content>
                            <BlockTitle>Code References</BlockTitle>
                            <BlockSubtitle>Create new content from newly added code.</BlockSubtitle>
                        </Content>
                       <Action color = {"#19e5be"}>
                            <FiPlus/> {addedReferences.length}
                        </Action>
                    </BlockHeader>
                    <InfoList>
                        {
                            addedReferences.map((ref) => {
                                return(
                                    <Reference>
                                        { ref.kind === "dir" ? <AiFillFolder style = {{marginRight: "0.5rem"}}/> :
                                            <RiFileFill style = {{width: "1rem", fontSize: "1.1rem" ,marginRight: "0.5rem"}}/>
                                        }
                                        <ReferenceTitle>{ref.name}</ReferenceTitle>
                                    </Reference>
                                )
                            })
                        }
                    </InfoList>
                </Block>
            )
            */
        } else {
            return null
        }
    }

    /*
    renderBrokenDocs = () => {
        const { check: { brokenDocuments }} = this.props;
        if (brokenDocuments.length > 0) {
            return (
                <Block>
                    <BlockHeader>
                        <Content>
                            <BlockTitle>Broken Documents</BlockTitle>
                            <BlockSubtitle>Resolve deleted references on documents.</BlockSubtitle>
                        </Content>
                        <Action color = {"#ff4757"}>
                            <RiCloseFill/> {brokenDocuments.length}
                        </Action>
                    </BlockHeader>
                    <InfoList>
                        {
                            brokenDocuments.map(doc => {
                                return(
                                    <BrokenDocument>
                                        <RiFileList2Fill  style = {{
                                            color: '#2684FF',
                                            width: "2rem",
                                            fontSize: "1.6rem",
                                            marginRight: "0.5rem"
                                        }}/>
                                        {doc.title}
                                    </BrokenDocument>
                                )
                            })
                        } 
                    </InfoList>
                </Block>
            )
        } else {
            return null
        }
    }*/

    renderDepSnippets = () => {
        const { check: { brokenSnippets }} = this.props;
        
        const placeholders = [{
            name: "snippet_validator.js",
            start: "3",
            end: "5"
        }, {
            name: "scan_repos.js",
            start: "24",
            end: "38"
        }, {
            name: "semantic_plugin.py",
            start: "112",
            end: "168"
        }];

        if (brokenSnippets && brokenSnippets.length > 0) {
            return (
                <IssueContainer>
                <Guide2>Deprecated Snippets</Guide2>
                    {brokenSnippets.map((snippet, i) => {
                        //const {start, code, reference: {name}} = snippet;
                        //let end = start + code.length;
                        
                        const { name, start, end } = placeholders[i];

                        return(
                            <BrokenSnippet>
                                <RiScissorsLine style = {{
                                    width: "2rem",
                                    fontSize: "1.5rem",
                                    marginRight: "0.5rem"
                                }}/>
                                <Name>{name}</Name>
                                <SnippetInfo>{`Lines ${start + 1}-${end}`}</SnippetInfo>
                            </BrokenSnippet>
                        )
                    })}
                </IssueContainer>
            )
        }
    }

    renderStatus = (brokenDocuments, brokenSnippets) => {
        return (brokenDocuments.length === 0 && brokenSnippets.length === 0) ?
            <IoMdCheckmarkCircleOutline/> :
            <AiOutlineCloseCircle/>
    }
    
    selectColor = (index) => {
        let colors = ['#5352ed', '#ff4757', '#20bf6b','#1e90ff', '#ff6348', 
            '#e84393', '#1e3799', '#b71540', '#079992'];
    
        return index < colors.length ? colors[index] : 
            colors[index - Math.floor(index/colors.length) * colors.length];
    }
    
    getDateItem = (created) => {
        let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let item =  new Date(created)
        let dateString = `${months[item.getMonth()]} ${item.getDate()}, ${item.getFullYear()}`;
        return dateString
    }

    renderBrokenDocs = () => {
        const { check : {brokenDocuments}} = this.props;
        if (brokenDocuments && brokenDocuments.length > 0) {
            return (
                <IssueContainer>
                    <Guide2>Deprecated Documents</Guide2>
                    <BrokenContainer>
                        {brokenDocuments.map(doc => {
                            return <CheckDeprecatedDocument doc = {doc}/>
                        })}
                    </BrokenContainer>
                </IssueContainer>
            )
        }
        
    }

     /*
    return (
        <ImageContainer>
            <StyledImage src = {doc.image}/>
        </ImageContainer>
    )*/

    render(){
        const { check, user, color } = this.props;
        const { addedReferences, brokenDocuments, brokenSnippets, sha, checkUrl, commitMessage, created, githubId, pusher } = check;

        let selectedColor = this.selectColor(color);

        let finished = brokenDocuments.length === 0 && brokenSnippets.length === 0;
        return (
            <RightContent>
                <Container>
                    <Navbar>
                        <CompleteButton complete = {finished}>
                            <CheckIcon>
                                <IoIosCheckmark/>
                            </CheckIcon>
                            {finished ? "Completed" : "Mark Complete"}
                        </CompleteButton>
                        <LeftPart>
                            <ActionsContainer>
                                <ActionIcon fontSize = {"2.2rem"}>
                                    <RiFileEditLine/>
                                </ActionIcon>
                                <ActionIcon>
                                    <RiToolsLine/>
                                </ActionIcon>
                                <ActionIcon>
                                    <BiLink/>
                                </ActionIcon>
                            </ActionsContainer>
                        </LeftPart>
                    </Navbar>
                    <ContentContainer>
                        <Header>{commitMessage}</Header>
                        <StatsContainer>
                            {addedReferences.length > 0 &&
                                 <Stat color = {"#19e5be"}>
                                    <StatIcon>
                                        <AiOutlineCodeSandbox/>
                                    </StatIcon>
                                    <Count>
                                        {addedReferences.length}
                                    </Count>
                                </Stat>
                            }
                            {brokenDocuments.length > 0 && 
                                <Stat color = {"#ca3e8c"}>
                                    <StatIcon fontSize = {"1.55rem"}> 
                                        <RiFileTextLine/>
                                    </StatIcon>
                                    <Count>
                                        {brokenDocuments.length}
                                    </Count>
                                </Stat>
                            }
                            {brokenSnippets.length > 0 &&
                                <Stat color = {"#f27448"}>
                                    <StatIcon fontSize = {"1.53rem"}> 
                                        <RiScissorsLine/>
                                    </StatIcon>
                                    <Count>
                                        {brokenSnippets.length}
                                    </Count>
                                </Stat>
                            }
                            {false && 
                                <Stat color = {"#6762df"}>
                                    <StatIcon fontSize = {"1.55rem"}> 
                                        <RiFileTextLine/>
                                    </StatIcon>
                                    <Count>
                                        4
                                    </Count>
                                </Stat>
                            }  
                        </StatsContainer>
                        <InfoContainer>
                            <InfoStat>
                                <Guide>Developer</Guide>
                                <Creator color = {selectedColor}>{user.charAt(0)}</Creator>
                                <Name>{user}</Name>
                            </InfoStat>
                            <InfoStat>
                                <Guide>Commit Date</Guide>
                                <CreationDate>
                                   
                                    {this.getDateItem(created)}
                                </CreationDate>
                            </InfoStat>
                            <InfoStat>
                                <Guide>Commit SHA</Guide>
                                <CommitSha>
                                    {sha.slice(0, 7)}
                                </CommitSha>
                            </InfoStat>
                        </InfoContainer>
                        <DataContainer>
                                {this.renderNewReferences()}
                                {this.renderBrokenDocs()}
                                {this.renderDepSnippets()}
                        </DataContainer>
                    </ContentContainer>
                </Container>
                {/*
                    <Top>
                        <SubHeader>
                            <Commit>
                                    <FiGitCommit
                                        style = {{
                                            fontSize: "1.4rem",
                                            marginTop: "0.1rem",
                                            marginRight: "0.3rem",
                                        }}
                                    />
                                    {sha.slice(0, 7)}
                            </Commit>
                            <Status active = {(brokenDocuments.length === 0 && brokenSnippets.length === 0)}>
                                {this.renderStatus(brokenDocuments, brokenSnippets)}
                            </Status>
                        </SubHeader>
                        <Header>
                            {commitMessage}
                        </Header>
                        <Detail>
                            <Creator color = {selectedColor}>{user.charAt(0)}</Creator>
                            <DetailContent>
                            {`${user} committed on ${this.getDateItem(created)}.`}
                            </DetailContent>
                        </Detail>
                    </Top>
                    {this.renderNewReferences()}
                    {this.renderBrokenDocs()}
                    {this.renderDepSnippets()}
                */}
            </RightContent>
        )
    }
}

{/*
    <StatsContainer>
                                <Stat color = {"#19e5be"}>
                                    <StatIcon>
                                        <AiOutlineCodeSandbox/>
                                    </StatIcon>
                                    <Count>
                                        3
                                    </Count>
                                </Stat>
                                <Stat color = {"#ca3e8c"}>
                                    <StatIcon fontSize = {"1.55rem"}> 
                                        <RiFileTextLine/>
                                    </StatIcon>
                                    <Count>
                                        2
                                    </Count>
                                </Stat>
                                <Stat color = {"#f27448"}>
                                    <StatIcon fontSize = {"1.53rem"}> 
                                        <RiScissorsLine/>
                                    </StatIcon>
                                    <Count>
                                        2
                                    </Count>
                                </Stat>
                                <Stat color = {"#6762df"}>
                                    <StatIcon fontSize = {"1.55rem"}> 
                                        <RiFileTextLine/>
                                    </StatIcon>
                                    <Count>
                                        4
                                    </Count>
                                </Stat>
</StatsContainer>*/}

export default CheckRightContent;


const Title = styled.div`
    display: flex;
    font-weight: 500;
    font-size: 1.3rem;
    align-items: center;
`


const StyledIcon = styled.div`
    justify-content: center;
    align-items: center;
    display:flex;
    font-size: 1.65rem; 
    margin-right: 0.7rem;
`

const TitleText = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-weight: 500;
    width: 12rem;
    font-size: 1.3rem;
`

const ImageContainer = styled.div`
    height: 14rem;
    width: 14rem;
    overflow-y: hidden;
    border-radius: 0.5rem;
    padding-top: 1rem;
    background-color: white;
    box-shadow:  ${LIGHT_SHADOW_1};
    margin-right: 2rem;
    border: 1px solid #df8bb9; 
`

const StyledImage = styled.img`
    width: 12rem;
    object-fit: cover;
    object-position: center top;
    overflow-y: hidden;
    overflow-x: hidden;
    /*
    display: flex;
    justify-content: center;
    */
    margin-left: 1rem;
    margin-right: 1rem; 
    margin-top: 0rem;
`


const DataContainer = styled.div`
    margin-top: 4.5rem;
`

const CommitSha = styled.div`
    display: flex;
    align-items: center;
    font-size: 1.3rem;
    background-color: ${chroma('#2684FF').alpha(0.1)};
    border: 1px solid #2684FF;
    padding: 0.2rem 1.2rem; 
    border-radius: 0.4rem;
    font-weight: 500;
`

const InfoContainer = styled.div`
    margin-top: 4rem;
`   

const CreationDate = styled.div`
    display: flex;
    align-items: center;
    font-size: 1.3rem;

    font-weight: 500;
`

const CalendarIcon = styled.div`
    margin-right: 0.6rem;
    margin-top: 0.34rem;
    font-size: 1.65rem;
`

const CommitIcon = styled.div`
    font-size: 1.5rem;
    margin-right: 0.5rem;
   /* margin-top: 0.53rem;*/
    display: flex;
    align-items: center;

`

const InfoStat = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 2.3rem;
`

const Guide = styled.div`
    width: 13rem;
    font-size: 1.3rem;
    font-weight: 500;
`

const IssueContainer = styled.div`
    margin-bottom: 2.3rem;
`

const Guide2 = styled.div`
    font-size: 1.3rem;
    margin-bottom: 1.45rem;
    font-weight: 500;
`


const ContentContainer = styled.div`
    padding: 2rem 3rem;
    height: calc(85vh - 5.5rem - 3rem - 7.5rem);
    overflow-y: scroll;
`

const ActionIcon = styled.div`
    opacity: 0.8;
    margin-right: 0.5rem;
    border-radius: 0.4rem;
    cursor: pointer;
    height: 3.5rem;
    width: 3.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
        opacity: 1;
        background-color: #F3F4F7;
    }
    font-size: ${props => props.fontSize ? props.fontSize : "2.4rem"};
    transition: 0.3s all;
`

const ActionsContainer = styled.div`
    display: flex;
    align-items: center;
    height: 5.5rem;
`

const StatsContainer = styled.div`
    display: flex;
    align-items: center;
    height: 3rem;
`

const Stat = styled.div`
    height: 2.5rem;
    padding: 0rem 1rem;
    padding-left: 1rem;
    background-color: ${props => 
        props.color === "#19e5be" ? chroma(props.color).alpha(0.6) :
        chroma(props.color).alpha(0.4)
    };

    border-radius: 0.5rem;
    color: #172A4e;
    display: flex;
    align-items: center;
    margin-right: 1.3rem;
    &:last-of-type {
        margin-right: 0rem;
    }
`   

const StatIcon = styled.div`
    width: 2.3rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    font-size: ${props => props.fontSize ? props.fontSize : "1.9rem"};
`

const Count = styled.div`
    height: 2.5rem;
    display: flex;
    align-items: center;
    font-size: 1.25rem;
    font-weight: 500;
`

const LeftPart = styled.div`
    margin-left: auto;
    height: 5.5rem;
    display: flex;
    align-items: center;
`

const CompleteButton = styled.div`
    border-radius: 0.5rem;
    height: 2.9rem;
    padding: 0 1rem;
    border: 1px solid ${props => props.complete ? "#19e5be" : "#e0e4e7"};
    background-color: ${props => props.complete ? "#19e5be" : "white"};
    display: flex;
    align-items: center;
    font-size: 1.25rem;
    font-weight: 500;
    color: ${props => props.complete ? "white" : "#172A4e"};
`

const CheckIcon = styled.div`
    height: 3.5rem;
    font-size: 3rem;
    width: 2.5rem;
    display: flex;
    align-items: center;
`

const Status = styled.div`
    color: ${props => props.active ? '#19e5be' : '#ff4757'};
    font-size: 3rem;
    margin-left: auto;
    margin-top: 0.45rem;
`

const Commit = styled.div`
    font-size: 1.3rem;
    display: flex;
    align-items: center;
    opacity: 0.7;
    font-weight: 500;
`

const SubHeader = styled.div`
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
`

const Top = styled.div`
    border: 1px solid #e0e4e7;
    padding: 3rem 2rem;
    padding-top: 1.5rem;
    border-radius: 0.6rem;
    margin-bottom: 2.5rem;
`

const Header = styled.div`
    font-weight: 500;
    margin-bottom: 1.5rem;
    font-size: 2.9rem;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`

const Detail = styled.div`
    display: flex;
    align-items: center;
    font-size: 1.35rem;
    font-weight: 400;
    width: 100%;
`

const DetailContent = styled.div`
    display: flex;
    align-items: center;
    opacity: 0.7;
    line-height: 1.5;
`

const Creator = styled.div`
    min-height: 2.5rem;
    min-width: 2.5rem;
    max-height: 2.5rem;
    max-width: 2.5rem;
    background-color: ${props => chroma(props.color).alpha(0.15)};
    color: ${props => props.color};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.45rem;
    border-radius: 0.3rem;
    font-weight: 400;
    margin-right: 0.9rem;
`

const Name = styled.div`
    font-size: 1.3rem;
    font-weight: 500;
`

const Heavy = styled.em`
    font-weight: 500;
    margin-right: 0.5rem;
`

const Content = styled.div`
    display: flex;
    flex-direction: column;
`

const BlockSubtitle = styled.div`
    color: 172a4e;
    font-size: 1.5rem;
    font-weight: 400;
    margin-bottom: 1.3rem;
    height: 2rem;
    opacity: 0.5;
`

const BlockTitle = styled.div`
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

const ReferenceTitle = styled.div`
    color: #172A4e;
    font-weight: 500;
`

const InfoList = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: -1rem;
`

const BrokenContainer = styled.div`
    border-radius: 0.5rem;
    background-color: #f7f9fb;
    border: 1px solid #E0E4E7;
    padding: 2rem;
    display: flex;
    align-items: center;
    overflow-x: scroll;
    width: calc(0vw + 100%);
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

const BlockHeader = styled.div`
    font-size: 1.5rem;
    font-weight: 500;
    margin-bottom: 1.7rem;
    display: flex;
    align-items: center;
`

const Action = styled.div`
    background-color: ${props => chroma(props.color).alpha(0.15)};
    color: ${props => props.color};
    margin-left: auto;
    padding: 0.7rem 1.2rem;
    font-size: 1.5rem;
    border-radius: 1rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    border: 1px solid ${props => props.color};
    align-self: flex-start;
`


const Block = styled.div`
    background-color: white;
    border: 1px solid #E0E4E7;
    padding: 1.7rem 2rem;
    padding-bottom: 3.5rem;
    border-radius: 0.6rem;
    margin-bottom: 2rem;
    /*
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);*/
    width: 100%;
`

const BrokenDocument = styled.div`
    height: 2.8rem;
    border-radius: 0.3rem;
    font-weight: 500;
    align-items: center;
    font-size: 1.25rem;
    background-color: #f5f7fa;
    padding: 0rem 0.8rem;
    display: inline-flex;
    margin-right: 2rem;
    border: 1px solid #e0e4e7;
    margin-bottom: 1rem;
`

const BrokenSnippet = styled.div`
    height: 3.2rem;
    border-radius: 0.4rem;
    display: flex;
    font-weight: 500;
    align-items: center;
    font-size: 1.25rem;
    padding: 0rem 1.5rem;
    /*border: 1px solid #172A4E;*/
    margin-bottom: 1rem;
    padding-left: 1rem;
    background-color: ${chroma("#f27448").alpha(0.2)};
`

/*
const Name = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-weight: 500;
    width: ${props => props.width}rem;
    font-size: 1.25rem;
`*/

const SnippetInfo = styled.div`
    margin-left: auto;
`

const RightContent = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: #f7f9fb;
    overflow-y: scroll;
    margin-left: 3rem;
    border-top-left-radius: 0.4rem;
    padding-left: 3rem;
    padding-top: 3rem;
`

const Container = styled.div`
    background-color: white;
    height: 100%;
    width: 100%;
    border-top-left-radius: 0.7rem; 
    box-shadow: ${LIGHT_SHADOW_1};
`

const Navbar = styled.div`
    height: 5.5rem;
    border-bottom: 1px solid #e8ecee;
    display: flex;
    align-items: center;
    padding: 0rem 2rem;
`