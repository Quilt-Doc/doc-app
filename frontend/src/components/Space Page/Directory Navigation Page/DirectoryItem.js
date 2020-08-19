import React from 'react';

//styles 
import styled from "styled-components"
import 'react-slidedown/lib/slidedown.css'
import chroma from 'chroma-js';

//images
import doc_icon from '../../../images/doc-file.svg';

//history
import history from '../../../history';

//components
import {SlideDown} from 'react-slidedown'

//react-router
import { Link, withRouter } from 'react-router-dom';

//actions
import { addSelected, deleteSelected } from '../../../actions/Selected_Actions';
import { retrieveReferences } from '../../../actions/Reference_Actions';

//icons
import { RiScissorsLine } from 'react-icons/ri'
import {FiFileText, FiChevronsDown} from 'react-icons/fi'
import { MdViewDay } from 'react-icons/md';

//misc
import { connect } from 'react-redux';

/*to = {this.renderDirectoryLink(directory.name)}*/
class DirectoryItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
           'fileItemBackgroundColor': '',
           'check_box_border_color': '#D7D7D7',
           'check_box_check_display': 'none',
           'docHeight': '0rem',
           'itemHeight': '0rem',
           'closed': true
           
        }
    }

    componentDidMount() {
        if (this.props.item._id in this.props.selected){
            this.setState({
                'check_box_border_color': '#19E5BE',
                'check_box_check_display': ''
             })
        } else {
            this.setState({
                'check_box_border_color': '#D7D7D7',
                'check_box_check_display': 'none'
             })
        }
    }

    hoverFileItem = () => {
        this.setState({'fileItemBackgroundColor': '#F4F4F6'})
    }

    unhoverFileItem = () => {
        this.setState({'fileItemBackgroundColor': ''})
    }

    renderCheck = () => {
        let display = this.props.item._id in this.props.selected ? ''  : 'none'
        return {'fontSize': "2rem", 'color': 'white', display}
    }

    turnCheckOn = (e, item) => {
        e.stopPropagation()
        e.preventDefault()
        if (item._id in this.props.selected){
            this.props.deleteSelected(item)
            this.setState({
                'check_box_border_color': '#D7D7D7',
                'check_box_check_display': 'none'
             })
        } else {
            this.props.addSelected(item)
            this.setState({
                'check_box_border_color': '#19E5BE',
                'check_box_check_display': ''
             })
        }
    }

    renderDirectoryLink(item) {
        let {repositoryId, workspaceId} = this.props.match.params
        let preURL = `/workspaces/${workspaceId}/repository/${repositoryId}`;
            if (item.kind === 'dir') {
                return `${preURL}/dir/${item._id}`
            }
            return `${preURL}/code/${item._id}`
    }

    renderDocuments(){
        return this.props.documents.map((doc) => {
            return (
                    <DocumentItem onClick = {() => history.push(`?document=${doc._id}`)}>
                        <StyledIcon src = {doc_icon}/>
                        <DocumentItemText>
                            <ion-icon name="document-text-outline" style = {{fontSize: "1.5rem", 'marginRight': '0.8rem'}}></ion-icon>
                            <Title>{doc.title ? doc.title : "Untitled"}</Title>
                        </DocumentItemText>
                    </DocumentItem>
                )
        })
    }


    renderColor() {
        let x =  Math.round(Math.random() * 3)
      
        return x === 2 ? "#17cfad"  : x === 1 ? '#5A75E6' : '#FF6373';
    } 

    render() {
        let statusColor = this.renderColor()
        return (
                <>
                <StyledLink to = {() => this.renderDirectoryLink(this.props.item)}>
                    <Check_Box_Border onClick = {(e) => {this.turnCheckOn(e, this.props.item)}}>
                        <Check_Box 
                            border_color = {this.props.item._id in this.props.selected ? '#19E5BE'  : '#D7D7D7'}
                            backgroundColor =  {this.props.item._id in this.props.selected ? '#19E5BE'  : 'white'}
                        >
                            <ion-icon style={this.renderCheck()} name="checkmark-outline"></ion-icon>
                        </Check_Box>
                    </Check_Box_Border>

                    <ion-icon style={{'color': '#172A4E', 'fontSize': '1.7rem', 'min-width': "1.7rem", 'margin-right': "1rem"}} name={this.props.type}></ion-icon>
                    <ItemName>{this.props.item.name}</ItemName>
                    
                    
                  
                    <ProgressContainer>
                        
                        <Status color = {statusColor} >
                            {statusColor === "#17cfad" 
                                ? "Excellent" : 
                                statusColor === '#5A75E6' ? "Satisfactory" 
                                : 'Inadequate'}
                        </Status>
                       
                    </ProgressContainer>
                    <StatisticContainer>
                        <Statistic>
                            <FiFileText style={{'color': '#172A4E', 'fontSize': '1.55rem', 'marginRight': "0.6rem"}}/>
                            <Count>{Math.round(Math.random() * 50)}</Count>
                        </Statistic>
                        <Statistic>
                            <RiScissorsLine style={{'color': '#172A4E', 'fontSize': '1.55rem', 'marginRight': "0.6rem"}}/>
                            <Count>{Math.round(Math.random() * 50)}</Count>
                        </Statistic>
                    </StatisticContainer>
                    <ViewBorder active = {this.props.documents.length > 0}>
                        <FiChevronsDown/>
                    </ViewBorder>
                    
                </StyledLink>
                {this.props.documents.length > 0 &&
                    <SlideDown className = {'my-dropdown-slidedown'} closed={this.state.closed}>
                        <DocumentContainer >
                            {this.renderDocuments()}
                        </DocumentContainer>
                    </SlideDown>
                }
                
                </>
               )
    }


}

/*<ViewDocumentContainer>
                        {this.props.documents.length > 0 && 
                            <ViewDocumentButton 
                                onClick = {(e) => {e.stopPropagation(); e.preventDefault(); 
                                    this.setState(prevState => ({closed: !prevState.closed}))}}>
                                View Documents
                             </ViewDocumentButton>
                        }
                    </ViewDocumentContainer>*/
/*  <ListItem>
                        <Check_Box_Border onClick = {(e) => {this.turnCheckOn(e, this.props.item)}}>
                            <Check_Box border_color = {this.props.item._id in this.props.selected ? '#19E5BE'  : '#D7D7D7'}>
                                <ion-icon style={this.renderCheck()} name="checkmark-outline"></ion-icon>
                            </Check_Box>
                        </Check_Box_Border>

                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.7rem', 'marginRight': "1rem"}} name={this.props.type}></ion-icon>
                        <ItemName>{this.props.item.name}</ItemName>
                        <ProgressContainer>
                            View Documents
                        </ProgressContainer>
                        <Statistic>
                            <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.4rem"}} name="document-text-outline"></ion-icon>
                            <Count>{Math.round(Math.random() * 50)}</Count>
                        </Statistic>
                        <Statistic>
                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.4rem"}} name="cut-outline"></ion-icon>
                        <Count>{Math.round(Math.random() * 50)}</Count>
                        </Statistic>
                            {this.props.documents.length > 0  &&
                                <ViewDocumentButton onClick = {(e) => {e.stopPropagation(); e.preventDefault(); this.setState(prevState => ({closed: !prevState.closed}))}}>
                                    <ion-icon name="document-text-outline"></ion-icon>
                                </ViewDocumentButton>
                            }
                        <Status color = {this.renderColor()} />
                    </ListItem>*/

/*to = {this.renderDirectoryLink(this.props.item)}*/

const mapStateToProps = (state, ownProps) => {
    let documents = Object.values(state.documents).filter(doc => 
        {
            for (let i = 0; i < doc.references.length; i++){
                if (doc.references[i]._id === ownProps.item._id) {
                    return true
                }
            } return false
        }
    )

    return {
        selected : state.selected, 
        documents
    }
}

export default withRouter(connect(mapStateToProps, { addSelected, deleteSelected, retrieveReferences } )(DirectoryItem));

/*
const File_Line = styled.div`
    display: flex;
    
    align-items: center;
`*/

const ViewBorder = styled.div`
    font-size: 1.5rem;
    margin-left: 12rem;
    margin-right: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2.5rem;
    width: 2.5rem;
    background-color:#ebf0f5;
    border-radius: 0.3rem;
    opacity: ${props => props.active ? 1.2 : 0.3};
`

const Status = styled.div`
    border: 1px solid ${props => props.color};
    background-color: ${props => chroma(props.color).alpha(0.13)};
    border-radius: 0.35rem;
    display: flex;
    align-items: center;
    justify-content: center;
   
    color: ${props => props.color};
    padding: 0.4rem 0.6rem ;
    font-weight: 500;
    font-size: 1.15rem;
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
    /*border: 1px solid #DFDFDF;*/
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

const StatisticContainer = styled.div`
    display: flex;
    align-items: center;
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
    background-color: #F7F9FB;
    border-bottom: 1px solid #EDEFF1;
    display: flex;
    align-items: center;
    transition: all 0.2s ease-in;
    /*height: ${props => props.height};*/
    flex-wrap: wrap;
    overflow-y: scroll;
`

const ViewDocumentContainer = styled.div`
    display: flex;
    align-items: center;

    letter-spacing: 1;

    height: 4rem;
    align-items: center;
    flex: 1 1 18rem;
    justify-content: center;
`

const ViewDocumentButton = styled.div`
opacity: 0.6; 
&:hover {
    opacity: 1;
}
`
/*
const ViewDocumentButton = styled.div`
    font-size: 1.5rem;
    width: 2.7rem;
    height: 2.7rem;
    border-radius: 50%;
    color: #172A4E;
    border: 1px solid #19E5BE;
    margin-left: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 1px 1px 0px;
    background-color: white;
`*/
/*
const StyledLink = styled(Link)`
    text-decoration: none;
    border-bottom: 1px solid #EDEFF1;
    &:last-of-type {
        border-bottom: none;
    }
   min-width: 100rem;
`
*/
const StyledLink = styled(Link)`
    text-decoration: none;
    padding-right: 1rem;
    border-bottom: 1px solid #EDEFF1;
    &:last-of-type {
        border-bottom: none;
    }
    height: 4rem;
    padding-left: 0.25rem;
    transition: background-color 0.1s ease-in;
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
    flex: 1 1 15rem;
    font-weight: 400;
`

// PROGRESS


const ProgressContainer = styled.div`
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


const ProgressBar = styled.div`
    width: 16rem;
    height: 0.6rem;
    border-radius: 12rem;
    display: flex;

`
/*#FAFBFC*/
const ProgressPart = styled.div`
    background-color: ${props => props.backgroundColor};
    width: ${props => props.width};
    padding: 0.2rem;
`

const ProgressDescription = styled.div`

`

const Statistic = styled.div`
    display: flex;
    align-items: center;
    margin-right: 2.5rem;
    font-size: 1.1rem;
    width: 4rem;
    transition: all 0.05s ease-in;
    &: hover {
        opacity: 1;
    }
    
`

const Count = styled.div`

`


const Check_Box_Border = styled.div`
    min-height: 3.5rem;
    min-width: 3.5rem;
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

const Check_Box = styled.div`
    height: 1.6rem;
    width: 1.6rem;
    background-color: ${props => props.backgroundColor};
    border: 1.3px solid ${props => props.border_color};
    border-radius: 0.2rem;
    display: flex;
    justify-content: center;
    align-items: center;
    
    &:hover {

    }
`
/*
const File_Item = styled.div`
    
    height: 4rem;
    
    vertical-align: middle;
    display: flex;
    align-items: center;
    padding-right: 1rem;
    padding-left: 0.25rem;
    font-family: -apple-system,BlinkMacSystemFont, sans-serif !important;
    font-size: 1.6rem;
    color:  #172A4E;
    letter-spacing: 0.5px;
    
    border-top: 1px solid #EDEFF1;
    border-bottom: ${props => props.borderBottom};

    cursor: pointer;

    background-color: ${props => props.backgroundColor}
    
`

const Hover_File_Item = styled(Link)`
    text-decoration: none;
    color: #172A4E !important;
    &:focus, &:hover, &:visited, &:link, &:active {
        text-decoration: none;
    }
    display: flex;
    height: 4rem;
    align-items: center;
    padding-left: 1.4rem;
    width: 92rem;
    
`

const Filename = styled.div`

`

const Statistics = styled.div`
    display: flex;
   
    &:hover {
        border-bottom: 2px solid #5534FF;
    }

`

const StyledIcon = styled.img`
    width: ${props => props.width}rem;
`

const Document_Count = styled.div`
    font-size: 1.7rem;
    width: 3.5rem;
    color: ${props => props.color};
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: 0.4rem;
`*/