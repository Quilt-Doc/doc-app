import React from 'react';

//styles 
import styled from "styled-components"
import 'react-slidedown/lib/slidedown.css'

//images
import doc_icon from '../../../images/doc-file.svg';

//components
import {SlideDown} from 'react-slidedown'

//react-router
import { Link, withRouter } from 'react-router-dom';

//actions
import { addSelected, deleteSelected } from '../../../actions/Selected_Actions';
import { retrieveReferences } from '../../../actions/Reference_Actions';

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
        return {'fontSize': "2rem", 'color': '#19E5BE', 'display': this.state.check_box_check_display}
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
        let {repositoryID, workspaceID} = this.props.match.params
        let preURL = `/workspaces/${workspaceID}/repository/${repositoryID}`;
            if (item.kind === 'dir') {
                return `${preURL}/dir/${item._id}`
            }
            return `${preURL}/code/${item._id}`
    }


    render() {
        return (
                <>
                {/*<StyledLink to = {() => this.renderDirectoryLink(this.props.item)}>*/}
                <ListItem>
                    <Check_Box_Border onClick = {(e) => {this.turnCheckOn(e, this.props.item)}}>
                        <Check_Box border_color = {this.state.check_box_border_color}>
                            <ion-icon style={this.renderCheck()} name="checkmark-outline"></ion-icon>
                        </Check_Box>
                    </Check_Box_Border>

                    <ion-icon style={{'color': '#172A4E', 'fontSize': '1.7rem', 'marginRight': "1.5rem"}} name={this.props.type}></ion-icon>
                    <ItemName>{this.props.item.name}</ItemName>
                    <ProgressContainer>
                        <ProgressBar>
                            {/*<ProgressPart backgroundColor = { }/>*/}
                            <ProgressPart backgroundColor = {'#19E5BE' } width = {'25%'}/>
                            <ProgressPart backgroundColor = {'#ff4757'} width = {'75%'}/>
                        </ProgressBar>
                        <ProgressDescription>

                        </ProgressDescription>
                    </ProgressContainer>
                    <Statistic>
                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="cube-outline"></ion-icon>
                        <Count>75</Count>
                    </Statistic>
                    <Statistic>
                        <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="pencil-outline"></ion-icon>
                        <Count>25</Count>
                    </Statistic>
                    <Statistic>
                    <ion-icon style={{'color': '#172A4E', 'fontSize': '1.8rem', 'marginRight': "0.3rem"}} name="cut-outline"></ion-icon>
                    <Count>30</Count>
                    </Statistic>
                    {(this.props.item.name === ".changeset" || this.props.item.name === "docs")  &&
                    <ViewDocumentButton onClick = {() => this.setState(prevState => ({closed: !prevState.closed}))}>
                        <ion-icon name="document-text-outline"></ion-icon>
                    </ViewDocumentButton>}
                </ListItem>
                {/*</StyledLink>*/}
                {this.props.item.name === "docs" &&
                <SlideDown className = {'my-dropdown-slidedown'} closed={this.state.closed}>

                
                    <DocumentContainer >
                        <DocumentItem>
                            <StyledIcon src = {doc_icon}/>
                            <DocumentItemText>
                                <ion-icon name="document-text-outline" style = {{fontSize: "1.5rem", 'marginRight': '0.8rem'}}></ion-icon>
                                Doxygen Callbac..
                            </DocumentItemText>
                        </DocumentItem>
                            
                        <DocumentItem>
                            <StyledIcon src = {doc_icon}/>
                            <DocumentItemText>
                                <ion-icon name="document-text-outline" style = {{fontSize: "1.5rem", 'marginRight': '0.8rem'}}></ion-icon>
                                Rendering Seman..
                            </DocumentItemText>
                        </DocumentItem>
                    </DocumentContainer>
                </SlideDown>
                }
                {this.props.item.name === ".changeset" &&
                <DocumentContainer>
                     <DocumentItem>
                        <StyledIcon src = {doc_icon}/>
                        <DocumentItemText>
                            <ion-icon name="document-text-outline" style = {{fontSize: "1.5rem", 'marginRight': '0.8rem'}}></ion-icon>
                            Code Coverage
                        </DocumentItemText>
                    </DocumentItem>
                        
                    <DocumentItem>
                        <StyledIcon src = {doc_icon}/>
                        <DocumentItemText>
                            <ion-icon name="document-text-outline" style = {{fontSize: "1.5rem", 'marginRight': '0.8rem'}}></ion-icon>
                            References
                        </DocumentItemText>
                    </DocumentItem>
                    <DocumentItem>
                        <StyledIcon src = {doc_icon}/>
                        <DocumentItemText>
                            <ion-icon name="document-text-outline" style = {{fontSize: "1.5rem", 'marginRight': '0.8rem'}}></ion-icon>
                           Document Hier..
                        </DocumentItemText>
                    </DocumentItem>
                </DocumentContainer>}
                </>
               )
    }


}

/*to = {this.renderDirectoryLink(this.props.item)}*/

const mapStateToProps = (state) => {
    return {
        selected : state.selected, 
    }
}

export default withRouter(connect(mapStateToProps, { addSelected, deleteSelected, retrieveReferences } )(DirectoryItem));

/*
const File_Line = styled.div`
    display: flex;
    
    align-items: center;
`*/

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
    margin-right: 4rem;
    display: flex;
    flex-direction: column;
    cursor: pointer;
`

const DocumentItemText = styled.div`
    margin-top: auto;
    margin-bottom: 0.3rem;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
`

const DocumentContainer = styled.div`
    padding-left: 2rem;
    padding-right: 2rem;
    height: 16rem;
    background-color: #F7F9FB;
    border-bottom: 1px solid #EDEFF1;
    z-index: 1;
    display: flex;
    align-items: center;
    transition: all 0.2s ease-in;
    height: ${props => props.height};
`

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
`

const StyledLink = styled(Link)`
    text-decoration: none;
  
    
`

const ListItem = styled.div`
    height: 4rem;
    padding-left: 1rem;
    padding-right: 2rem;
    transition: background-color 0.1s ease-in;
    
    &:hover {
        /*box-shadow: rgba(9, 30, 66, 0.31) 0px 0px 1px 0px, rgba(9, 30, 66, 0.25) 0px 8px 16px -6px;*/
       background-color: #F4F4F6; 
    }
    color: #172A4E;
    cursor: pointer;
    align-items: center;
    display: flex;
    font-size: 1.4rem;
    border-bottom: 1px solid #EDEFF1;
    z-index: 10;
`

const ItemName = styled.div`
    width: 25rem;
`

// PROGRESS


const ProgressContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 15rem;
    margin-right: 8rem;
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
    justify-content: center;
    margin-right: 2.5rem;
    font-size: 1.1rem;
    opacity: 0.6; 
    width: 4rem;
    transition: all 0.05s ease-in;
    &: hover {
        opacity: 1;
    }
    
`

const Count = styled.div`

`


const Check_Box_Border = styled.div`
    height: 4rem;
    width: 4rem;
    margin-right: 1rem;
    &:hover {
        background-color: #F4F4F6;
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
    background-color: white;
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