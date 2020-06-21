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
        if (this.props.item.sha in this.props.selected){
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
        if (item.sha in this.props.selected){
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
        
        if (item.type === 'dir') {
            console.log('DIR PATH: ', `/repository/${window.location.pathname.slice(12)}`);
            return `/repository/${window.location.pathname.slice(12) + item.name +'/'}`
        } else {
            // console.log('Item download url: ', item.download_url);
            let url_items = item.download_url.split('/').slice(3)
            let final_path = url_items.join('/') 
            return `/repository/codeview/${final_path}`
        }
        

    }

    

    render() {
        return (<File_Line>
                    <Check_Box_Border onClick = {() => {this.turnCheckOn(this.props.item)}}>
                        <Check_Box border_color = {this.state.check_box_border_color}>
                            <ion-icon style={this.renderCheck()} name="checkmark-outline"></ion-icon>
                        </Check_Box>
                    </Check_Box_Border>
                    <File_Item backgroundColor = {this.state.fileItemBackgroundColor}  borderBottom = {this.props.borderBottom}>
                        <Hover_File_Item  
                            onMouseEnter = {() => this.hoverFileItem()}
                            onMouseLeave = {() => this.unhoverFileItem()}
                            to = {this.renderDirectoryLink(this.props.item)}
                        >
                            <ion-icon style={{'marginRight': "1rem", 'fontSize': '2rem'}}  name={this.props.type}></ion-icon>
                            <Filename>{this.props.item.name}</Filename>
                        </Hover_File_Item >
                        <Statistics>
                            <StyledIcon width = {'2'}  src = {doc_icon}/>
                            <Document_Count color = {'#172A4E'}>0</Document_Count>
                        </Statistics>
                    </File_Item>
                </File_Line>)
    }

}


const mapStateToProps = (state) => {
    return {
        selected : state.selected
    }
}

export default connect(mapStateToProps, { addSelected, deleteSelected } )(DirectoryItem);


const File_Line = styled.div`
    display: flex;
    
    align-items: center;
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
`