import React from 'react';
import styled from 'styled-components';
import chroma from 'chroma-js';

import {RiEdit2Line, RiCheckFill, RiCloseFill} from 'react-icons/ri';
import {CgOptions} from 'react-icons/cg';
import DocumentOptionsMenu from '../../../../menus/DocumentOptionsMenu';
import { AiOutlineExclamation, AiOutlinePullRequest } from 'react-icons/ai';
import { GoGitBranch } from 'react-icons/go';

//components
import LabelMenu from '../../../../menus/LabelMenu';

//actions
import { attachDocumentTag, removeDocumentTag } from '../../../../../actions/Document_Actions';

//react-redux
import { connect } from 'react-redux';

//react-router
import { withRouter } from 'react-router-dom';
import { APP_LIGHT_PRIMARY_COLOR } from '../../../../../styles/colors';
import { FiChevronDown } from 'react-icons/fi';


class MainToolbar extends React.Component {

    renderTags(){
        let colors = ['#5352ed', 
        '#ff4757', '#1e90ff', '#20bf6b', '#ff6348', '#e84393', '#1e3799', '#b71540', '#079992'
        ]
       
        colors = ['#5352ed', 
        '#ff4757', '#1e90ff']
        let labels = ['Backend', 'Utility', 'Semantic']
        //let labels = ['Backend', 'Utility', 'Semantic', 'InfoBank']
        /*
        return this.props.currentReference.tags.map(tag => {
            let color = tag.color < colors.length ? colors[tag.color] : 
                colors[tag.color - Math.floor(tag.color/colors.length) * colors.length];

            return <Tag color = {color} backgroundColor = {chroma(color).alpha(0.15)}>{tag.label}</Tag>
        })*/
        return colors.map((color, i) => {
            return <Tag color = {color} backgroundColor = {chroma(color).alpha(0.15)}>
                {labels[i]}
            </Tag>
        })
    } 

    renderPath(){
        const { document } = this.props;
        if (document) {
            let paths = this.props.document.path.split('/').slice(1);
            paths = paths.map(path => {
                let dashSplit = path.split('-');
                const joinedSplit = dashSplit.slice(0, dashSplit.length - 1).join('-');
                return joinedSplit ? joinedSplit : "Untitled";
            });

            if (paths.length > 3) {
                paths = [paths[0], '...', paths[paths.length - 2], paths[paths.length - 1]];
            }
            return paths.map((path, i) => {
                if (i == paths.length - 1) {
                    return (<PathSection>{path}</PathSection>);
                } else {
                    return (<><PathSection>{path}</PathSection><Slash>/</Slash></>);
                }
            })
        }
        return "";
    }

    renderStatus = () => {
        const { status } = this.props.document;
        switch (status) {
            case "valid":
                return  <Status color = {"#19e5be"}>
                            Valid
                        </Status>
            case "resolve":
                return <Status color = {"#6762df"}>
                            <AiOutlineExclamation
                                style = 
                                {{
                                    marginRight: "0.3rem",
                                    fontSize: "1.5rem"
                                }}
                            />
                            Resolve
                        </Status>
            case "invalid":
                return <Status color = {"#ca3e8c"}>
                            INVALID
                                {/*
                                <PullRequest>
                                    <PullRequestIcon>
                                        <AiOutlinePullRequest/>
                                    </PullRequestIcon>
                                    Advanced Search Support
                                </PullRequest>
                                */}
                        </Status>
            default:
                return  <Status color = {"#19e5be"}>
                            Valid
                        </Status>
        }
    }

    renderBranch = () => {
        return null;
        return (
            <PullRequest>
                <PullRequestIcon>
                    {/*
                    <AiOutlinePullRequest/>*/}
                    <GoGitBranch/>
                </PullRequestIcon>
                master
                <FiChevronDown
                    style = {{
                        marginLeft: "0.5rem",
                        marginRight: "0.3rem",
                        marginTop: "0.1rem",
                        fontSize: "1.2rem"
                    }}
                />
            </PullRequest>
        )
    }

    render(){
        const { document, match, attachDocumentTag, removeDocumentTag} = this.props
        const { workspaceId } = match.params;

        return(
            <>
                <Container id = {"documentMainToolbar"} documentModal = {this.props.documentModal}>
                        <Path>
                            {this.renderPath()}
                        </Path>
                        {this.renderStatus()}
                        {this.renderBranch()}
                        <Left>
                            <Button active = {this.props.write}
                                onClick = {this.props.setWrite}
                            >
                                <RiEdit2Line/>
                            </Button>
                            <LabelMenu 
                                editor = {true}
                                attachTag = {(tag) => {
                                    attachDocumentTag({workspaceId, 
                                        documentId: document._id, tagId: tag._id})}}
                                removeTag = {(tag) => {
                                    removeDocumentTag({workspaceId, 
                                        documentId: document._id, tagId: tag._id})}}
                                setTags = {document.tags}
                            />
                            <DocumentOptionsMenu 
                                document = {this.props.document}
                            />
                        </Left>
                </Container>
                
            </>
        )
    }
}

const mapStateToProps = () => {
    return {

    }
}

export default withRouter(connect(mapStateToProps, {
    attachDocumentTag, removeDocumentTag })(MainToolbar));

const PullRequestIcon = styled.div`
    display: flex;
    align-items: center;
    margin-right: 0.35rem;
    font-size: 1.55rem;
    margin-top: -0.1rem;
`

const PullRequest = styled.div`
    display: flex;
    align-items: center;
    margin-left: 2rem;
    background-color: ${APP_LIGHT_PRIMARY_COLOR};
   /* box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);*/
    border-radius: 0.4rem;
    font-weight: 500;
    padding: 0.7rem 1rem;
    font-size: 1.3rem;
`

const PathSection = styled.div`
    &:hover {
        text-decoration: underline;
        opacity: 1;
    }
    cursor: pointer;
    max-width: 15rem;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`

const Status = styled.div`
    display: inline-flex;
    background-color: ${props => chroma(props.color).alpha(0.13)};
    color: ${props => props.color};
    border: 1px solid ${props => props.color};
    font-weight: 500;
    border-radius: 0.3rem;
    font-size: 1.1rem;
    padding: 0rem 1rem;
    justify-content: center;
    align-items: center;
    width: 7rem;
    margin-left: 2rem;
    height: 2.3rem;
    text-transform: uppercase;
`

const Button = styled.div`
    &:last-of-type {
        margin-right: 0rem;
    }

    margin-right: 1.3rem;
   
    width: 3rem;
	height: 3rem;
    display: flex;
    font-size: 2.4rem;
    justify-content: center;
    align-items: center;
    position: relative;
    z-index: 0;
    border-radius: 0.3rem;
    &:hover {
        background-color:  ${props => props.active ? chroma("#6762df").alpha(0.2) : "#dae3ec;"};
    }
    background-color: ${props => props.active ? chroma("#6762df").alpha(0.2)  : ""};
    cursor: pointer;
`

const Slash = styled.div`
    margin-left: 1rem;
    margin-right: 1rem;
`

const Path = styled.div`
    font-size: 1.4rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    position: relative;
    z-index: 0;
    opacity: 0.8;
`

const Container = styled.div`
    display: flex;
    padding-left: 4rem;
    padding-right: 4rem;
    padding-top: 2rem;
    padding-bottom: 2rem;
    align-items: center;
    border-top-left-radius: 0.4rem;
    border-top-right-radius: 0.4rem;
`


const Tags = styled.div`
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;
    margin-top: 0.5rem;
    padding-left: 4rem;
    padding-right: 4rem;
`

const Circle = styled.div`

`


const Tag = styled.div`
    font-size: 1.2rem;
    color: ${props => props.color};
    padding: 0.1rem 0.7rem;
    background-color: ${props => chroma(props.color).alpha(0.13)};
    border: 1px solid ${props => chroma(props.color).alpha(0.6)};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.2rem;
	margin-right: 1.35rem;
    font-weight: 500;
    min-width: 3rem;
    min-height: 0.5rem;
    margin-bottom:1rem;
`


const Left = styled.div`
    margin-left: auto;
    display: flex; 
    align-items: center;
`