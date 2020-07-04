import React from 'react';

//styles 
import styled from "styled-components"

//images
import doc_icon from '../../../images/paper.svg';

//react-router
import { Link } from 'react-router-dom';

//actions
import { addSelected, deleteSelected } from '../../../actions/Selected_Actions';

//misc
import { connect } from 'react-redux';

/*to = {this.renderDirectoryLink(directory.name)}*/
class DirectoryItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
           'fileItemBackgroundColor': '',
           'check_box_border_color': '#D7D7D7',
           'check_box_check_display': 'none'
           
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

    turnCheckOn = (item) => {
        console.log(this.props.selected)
        console.log("WE HERE")
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
        console.log(window.location.pathname)
        let urlItems = window.location.pathname.split('/').slice(3)
        console.log(urlItems)
        if (urlItems.slice(urlItems.length-1)[0] === '') {
            urlItems.pop()
        }
        urlItems.push(item.name)
        let finalURL = urlItems.join('/')
        if (item.kind === 'dir') {
            return `/repository/directory/${finalURL}`
        }
        return `/repository/codeview/${finalURL}`
    }
    /*
    let urlItems = window.location.pathname.split('/')
            if (urlItems.slice(urlItems.length-1)[0] === '') {
                urlItems.pop()
            }
            urlItems.push(item.name)
            let finalURL = urlItems.join('/')
            */

    

    render() {
        return (
                <ListItem>
                    <Check_Box_Border onClick = {() => {this.turnCheckOn(this.props.item)}}>
                        <Check_Box border_color = {this.state.check_box_border_color}>
                            <ion-icon style={this.renderCheck()} name="checkmark-outline"></ion-icon>
                        </Check_Box>
                    </Check_Box_Border>

                    <ion-icon style={{'color': '#172A4E', 'fontSize': '2.2rem', 'marginRight': "2rem"}} name="folder-sharp"></ion-icon>
                    <ItemName>apis</ItemName>
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
                </ListItem>
               )
    }

}

/*to = {this.renderDirectoryLink(this.props.item)}*/

const mapStateToProps = (state) => {
    return {
        selected : state.selected
    }
}

export default connect(mapStateToProps, { addSelected, deleteSelected } )(DirectoryItem);

/*
const File_Line = styled.div`
    display: flex;
    
    align-items: center;
`*/

const ListItem = styled.div`
    height: 4.5rem;
    padding-left: 2rem;
    padding-right: 2rem;
    transition: background-color 0.1s ease-in;
    &:hover {
        background-color: #F4F4F6; 
    }
    color: #172A4E;
    cursor: pointer;
    align-items: center;
    display: flex;
    font-size: 1.5rem;
`

const ItemName = styled.div`
    width: 16rem;
`

// PROGRESS


const ProgressContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 20rem;
    margin-right: 35rem;
`

const ProgressBar = styled.div`
    width: 23rem;
    height: 0.65rem;
    border-radius: 12rem;
    display: flex;
`

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
    width: 6rem;
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
    margin-right: 2rem;
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