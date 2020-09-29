import React, { Component } from 'react';
import PropTypes from 'prop-types';

//styles 
import styled from "styled-components"
import 'react-slidedown/lib/slidedown.css'
import chroma from 'chroma-js';

//history
import history from '../../../../history';

//components
import { SlideDown } from 'react-slidedown'

//react-router
import { Link, withRouter } from 'react-router-dom';

//selectors
import { makeGetReferenceDocuments } from '../../../../selectors';

//actions
import { addSelected, deleteSelected } from '../../../../actions/Selected_Actions';
import { retrieveReferences } from '../../../../actions/Reference_Actions';
import { retrieveDocuments } from '../../../../actions/Document_Actions';

//icons
import { RiScissorsLine, RiCheckFill, RiFileList2Line } from 'react-icons/ri';
import { FiChevronsDown, FiChevronsUp} from 'react-icons/fi';
import { RiFileLine } from 'react-icons/ri';
import { AiFillFolder } from 'react-icons/ai';

//misc
import { connect } from 'react-redux';

// individual directory item representing a single reference to click/navigate on
class DirectoryItem extends Component {
    constructor(props) {
        super(props);
        this.state = { closed: true };
    }


    renderCheck = () => {
        const { isSelected } = this.props;
        let display = isSelected ? ''  : 'none';
        return { fontSize: "2rem", color: 'white', display};
    }

    turnCheckOn = (e) => {
        e.stopPropagation();
        e.preventDefault();

        const { isSelected, deleteSelected, addSelected, item } = this.props;

        isSelected ? deleteSelected(item) : addSelected(item);
    }

    renderLink(item) {
        const {repositoryId, workspaceId} = this.props.match.params;
        let urlIdentifier = item.kind === 'dir' ? 'dir' : 'code';
        return `/workspaces/${workspaceId}/repository/${repositoryId}/${urlIdentifier}/${item._id}`;
    }

    renderDocuments(){
        const { documents } = this.props;
        return documents.map((doc) => {
            return (
                    <DocumentItem onClick = {() => history.push(`?document=${doc._id}`)}> {/*REPEATED COMPONENT MINIMAL DOCUMENT*/}
                        
                        <DocumentItemText>
                            <ion-icon name="document-text-outline" style = {{fontSize: "1.5rem", 'marginRight': '0.8rem'}}></ion-icon>
                            <Title>{doc.title ? doc.title : "Untitled"}</Title>
                        </DocumentItemText>
                    </DocumentItem>
                )
        })
    }

    // selects the color for the tagss depending on the tag color field (a number)
    selectColor = (tag) => {
        let colors = ['#5352ed', '#ff4757', '#20bf6b','#1e90ff', '#ff6348', 
            '#e84393', '#1e3799', '#b71540', '#079992'];

        return tag.color < colors.length ? colors[tag.color] : 
            colors[tag.color - Math.floor(tag.color/colors.length) * colors.length];
    }

    renderTags(){
        const { tags } = this.props.item;

        return tags.map(tag => 
            <Tag 
                color = {this.selectColor(tag)} 
                backgroundColor = {chroma(this.selectColor(tag)).alpha(0.15)}
            >
                {tag.label}
            </Tag>
        );
    }

    renderIcon = () => {
        const { kind } = this.props;
        return kind === 'file' ? 
            <RiFileLine 
                style={{
                    color: '#172A4E', 
                    fontSize: '1.6rem', 
                    minWidth: "1.7rem", 
                    marginRight: "1rem"
                }} 
            />
            : <AiFillFolder 
                style={{
                    color: '#172A4E', 
                    fontSize: '1.75rem', 
                    minWidth: "1.7rem", 
                    marginRight: "1rem"
                }}
             />
    }

    // retrieves documents (if needed) when opened
    showDocuments = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const { closed } = this.state;
        const { item, documents, retrieveDocuments, match } = this.props;
        const { workspaceId } = match.params;

        if (closed && documents.length === 0) {
            await retrieveDocuments({ workspaceId, referenceIds: [item._id], minimal: true });
        }

        this.setState({ closed: !closed })
    }

    render() {
        const { closed } = this.state;
        const { item, isSelected, documents } = this.props;
        const { name } = item;

        return (
            <>
                <StyledLink to = {() => this.renderLink(item)}>
                    <CheckBoxBorder onClick = {(e) => {this.turnCheckOn(e)}}>
                        <CheckBox 
                            borderColor = {isSelected ? '#19E5BE'  : '#D7D7D7'}
                            backgroundColor =  {isSelected ? '#19E5BE'  : 'white'}
                        >
                            <RiCheckFill style={this.renderCheck()} />
                        </CheckBox>
                    </CheckBoxBorder>
                    {this.renderIcon()}
                    <ItemName>{name}</ItemName>
                    <TagContainer>
                       {this.renderTags()}
                    </TagContainer>
                    <RightContainer>
                        <Statistic>
                            <RiFileList2Line style={{color: '#172A4E', fontSize: '1.55rem', marginRight: "0.6rem"}}/>
                            <Count>{Math.round(Math.random() * 50)}</Count>
                        </Statistic>
                        <Statistic>
                            <RiScissorsLine style={{color: '#172A4E', fontSize: '1.55rem', marginRight: "0.6rem"}}/>
                            <Count>{Math.round(Math.random() * 50)}</Count>
                        </Statistic>
                        <ViewBorder 
                            onClick = {(e) => this.showDocuments(e)}
                            active = { documents.length > 0 }
                        >
                            { closed ? <FiChevronsDown/> : <FiChevronsUp/> }
                        </ViewBorder>
                    </RightContainer>
                </StyledLink>
                {documents.length > 0 &&
                    <SlideDown className = {'my-dropdown-slidedown'} closed={closed}>
                        <DocumentContainer >
                            {this.renderDocuments()}
                        </DocumentContainer>
                    </SlideDown>
                }
            </>
        )
    }
}

const makeMapStateToProps = () => {
    // memoize extracting the documents of the current reference
    const getReferenceDocuments = makeGetReferenceDocuments();
    
    const mapStateToProps = (state, ownProps) => {
        let { item } = ownProps;
        let { selected, documents } = state;


        documents = getReferenceDocuments({documents, item});
        const isSelected = item._id in selected;

        return {
            documents,
            isSelected
        }
    }
    return mapStateToProps;
}

DirectoryItem.propTypes = {
    kind : PropTypes.string.isRequired,
    item : PropTypes.object.isRequired,
}


export default withRouter(connect(makeMapStateToProps, { addSelected, deleteSelected, 
    retrieveReferences, retrieveDocuments } )(DirectoryItem));

//Styled Components

const RightContainer = styled.div`
    margin-left: auto;
    display: flex;
    align-items: center;
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
`

const ViewBorder = styled.div`
    font-size: 1.5rem;
    margin-left: 2rem;
    margin-right: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2.5rem;
    width: 2.5rem;
    background-color:#ebf0f5;
    border-radius: 0.3rem;
    opacity: ${props => props.active ? 1.2 : 0};
    &:hover {
        box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    }
`

const StyledIcon = styled.img`
    width: 5rem;
    align-self: center;
    margin-top: 1.5rem;
    user-select: none;
`

const DocumentItem = styled.div`
    height: 12rem;
    width: 15rem;
    padding: 1rem;
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    margin-top: 2rem;
    margin-right: 4rem;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    &:hover {
        background-color: #F4F4F6; 
    }
`

const Title = styled.div`
    opacity: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    font-weight: 500;
`

const DocumentItemText = styled.div`
    margin-top: auto;
    margin-bottom: 0.3rem;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
`

const DocumentContainer = styled.div`
    padding-bottom: 2rem;
    padding-left: 2rem;
    padding-right: 2rem;
    /*height: 16rem;*/
    background-color: #F9FAFE;
    border-bottom: 1px solid #EDEFF1;
    display: flex;
    align-items: center;
    transition: all 0.2s ease-in;
    /*height: ${props => props.height};*/
    flex-wrap: wrap;
    overflow-y: scroll;
`

const StyledLink = styled(Link)`
    text-decoration: none;
    padding-right: 1rem;
    border-bottom: 1px solid #EDEFF1;
    &:last-of-type {
        border-bottom: none;
    }
    height: 4rem;
    padding-left: 0.25rem;
    transition: background-color 0.05s ease-in;
    &:hover {
        background-color: #F4F4F6;
    }
    color: #172A4E;
    cursor: pointer;
    align-items: center;
    display: flex; 
    font-size: 1.4rem;
`

const ItemName = styled.div`
    flex: 1 1 4rem;
    font-weight: 500;
`

const TagContainer = styled.div`
    display: flex;
    margin-right: 0rem;
    letter-spacing: 1;
    &:hover {
        opacity: 1;
    }
    height: 4rem;
    align-items: center;
    flex: 1 1 10rem;
`

const Statistic = styled.div`
    display: flex;
    align-items: center;
    margin-right: 2rem;
    font-size: 1.1rem;
    width: 4rem;
    transition: all 0.05s ease-in;
    &: hover {
        opacity: 1;
    }
`

const Count = styled.div`

`

const CheckBoxBorder = styled.div`
    min-height: 4rem;
    min-width: 4rem;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
    &:hover {
        background-color: ${chroma("#5B75E6").alpha(0.1)};
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
`