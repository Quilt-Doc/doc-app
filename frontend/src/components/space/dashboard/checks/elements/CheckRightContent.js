import React, {Component} from 'react';
//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//components
import { AiFillFolder, AiOutlineCloseCircle } from 'react-icons/ai';
import { RiCloseFill, RiFileFill, RiFileList2Fill, RiScissorsLine } from 'react-icons/ri';
import { FiGitCommit, FiPlus } from 'react-icons/fi';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';

class CheckRightContent extends Component {

    renderNewReferences = () => {
        const { check: {addedReferences }} = this.props;

        if (addedReferences && addedReferences.length > 0) {
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
        } else {
            return null
        }
    }

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
    }

    renderDepSnippets = () => {
        const { check: { brokenSnippets }} = this.props;
        if (brokenSnippets.length > 0) {
            return (
                <Block>
                    <BlockHeader>
                        <Content>
                            <BlockTitle>Deprecated Snippets</BlockTitle>
                            <BlockSubtitle>Reselect or delete invalidated snippets.</BlockSubtitle>
                        </Content>
                        <Action color = {"#ff4757"}>
                            <RiCloseFill/> {brokenSnippets.length}
                        </Action>
                    </BlockHeader>
                    {brokenSnippets.map(snippet => {
                        const {start, code, reference: {name}} = snippet;
                        return(
                            <BrokenSnippet>
                                <RiScissorsLine style = {{
                                    width: "2rem",
                                    fontSize: "1.5rem",
                                    marginRight: "0.5rem"
                                }}/>
                                <Name>{name}</Name>
                                <SnippetInfo>{`Lines ${start + 1}-${start + code.length}`}</SnippetInfo>
                            </BrokenSnippet>
                        )
                    })}
                </Block>
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
        let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let item =  new Date(created)
        let dateString = `${months[item.getMonth()]} ${item.getDate()}, ${item.getFullYear()}`;
        return dateString
    }

    render(){
        const { check, user, color } = this.props;
        const { brokenDocuments, brokenSnippets, sha, checkUrl, commitMessage, created, githubId, pusher } = check;

        let selectedColor = this.selectColor(color);

        return (
            <RightContent>
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
            </RightContent>
        )
    }
}

export default CheckRightContent;

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
    font-size: 2.6rem;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    width: 30rem;
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
    min-height: 3rem;
    min-width: 3rem;
    max-height: 3rem;
    max-width: 3rem;
   /* background-color: ${chroma('#1e90ff').alpha(0.2)};
    color:#1e90ff;*/
    background-color: ${props => chroma(props.color).alpha(0.2)};
    color: ${props => props.color};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.6rem;
    margin-top: -0.1rem;
    border-radius: 0.3rem;
    font-weight: 500;
    margin-right: 1.5rem;
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
    border-radius: 0.6rem;
    display: flex;
    font-weight: 500;
    align-items: center;
    font-size: 1.25rem;
    padding: 0rem 1.5rem;
    border: 1px solid #172A4E;
    margin-bottom: 1rem;
    padding-left: 1rem;
`

const Name = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-weight: 500;
    width: ${props => props.width}rem;
    font-size: 1.25rem;
`

const SnippetInfo = styled.div`
    margin-left: auto;
`

const RightContent = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;

    overflow-y: scroll;
    margin-left: 3rem;
`