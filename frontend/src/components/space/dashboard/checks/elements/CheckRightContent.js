import React, {Component} from 'react';
//styles
import styled from 'styled-components';
import chroma from 'chroma-js';

//components
import { AiFillFolder } from 'react-icons/ai';
import { RiCloseFill, RiFileFill, RiFileList2Fill, RiScissorsLine } from 'react-icons/ri';
import { FiPlus } from 'react-icons/fi';

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

    render(){
        return (
            <RightContent>
                {this.renderNewReferences()}
                {this.renderBrokenDocs()}
                {this.renderDepSnippets()}
            </RightContent>
        )
    }
}

export default CheckRightContent;

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
  /*  border: 1px solid #E0E4E7;*/
    padding: 1.7rem 2rem;
    padding-bottom: 3.5rem;
    border-radius: 0.4rem;
    width: 90%;
    margin-bottom: 2rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
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
    padding: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow-y: scroll;
`