import React from 'react';
import styled from 'styled-components';
import chroma from 'chroma-js';

import {RiEdit2Line, RiCheckFill, RiCloseFill} from 'react-icons/ri';
import {CgOptions} from 'react-icons/cg';
import DocumentOptionsMenu from '../../../../menus/DocumentOptionsMenu';
import { AiOutlineExclamation } from 'react-icons/ai';

//components
import LabelMenu from '../../../../menus/LabelMenu';

//actions
import { attachDocumentTag, removeDocumentTag } from '../../../../../actions/Document_Actions';

//react-redux
import { connect } from 'react-redux';

//react-router
import { withRouter } from 'react-router-dom';


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
                            <RiCheckFill 
                                style = 
                                {{
                                    marginRight: "0.3rem",
                                    fontSize: "1.5rem"
                                }}
                            />
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
                return <Status color = {"#ff4757"}>
                            <RiCloseFill
                                style = 
                                {{
                                    marginRight: "0.3rem",
                                    fontSize: "1.5rem"
                                }}
                            />
                            Invalid
                        </Status>
            default:
                return  <Status color = {"#19e5be"}>
                            <RiCheckFill 
                                style = 
                                {{
                                    marginRight: "0.3rem",
                                    fontSize: "1.5rem"
                                }}
                            />
                            Valid
                        </Status>
        }
    }

    render(){
        const { document, match, attachDocumentTag, removeDocumentTag} = this.props
        const { workspaceId } = match.params;

        return(
            <>
                <Container documentModal = {this.props.documentModal}>
                        <Path>
                            {this.renderPath()}
                        </Path>
                        {this.renderStatus()}
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

const PathSection = styled.div`
    &:hover {
        text-decoration: underline;
        opacity: 1;
    }
    cursor: pointer;
    opacity: 0.85;
    max-width: 15rem;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
`

const Status = styled.div`
    display: inline-flex;
    background-color: ${props => chroma(props.color).alpha(0.2)};
    color: ${props => props.color};
    border: 1px solid ${props => props.color};
    font-weight: 500;
    border-radius: 0.3rem;
    font-size: 1.3rem;
    padding: 0rem 1rem;
    align-items: center;
    margin-left: 2rem;
    height: 2rem;
    margin-top: -0rem;
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
    opacity: 0.85;
`

const Path = styled.div`
    font-size: 1.4rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    position: relative;
    z-index: 0;
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