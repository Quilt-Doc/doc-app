import React from 'react';


//redux
import { connect } from 'react-redux';

//styles
import styled from "styled-components";

//images
import archive_icon from '../../../images/archive.svg';


class Bucket extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
           'dropdown_display': 'none'
        }
    }

    renderCount() {
        if (this.props.selected) {
            return String(this.props.selected.length)
        } else {
            return '0'
        }
    }

    renderDisplay() {
        if (this.renderCount() > 0){
            return '1'
        } else {
            return '0'
        }
    }
    render(){
        return (
            <NavbarButton display = {this.renderDisplay()}>
                
                <Count  >{this.renderCount()}</Count>
            </NavbarButton>
        )
    }
    
}


export default Bucket;

const NavbarButton = styled.div`
    padding: 1.2rem 1.5rem;
    height: 3.2rem;
    width: 3rem;
    border-radius: 25%;
    background-color: white;
    margin-top: 2rem;
    margin-left:20rem;
    font-size: 1.5rem;
    letter-spacing: 0.1rem;
    color:  #172A4E;
    cursor: pointer;
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
        
    }
    border: 1px solid #1BE5BE;
    transition: opacity 0.07s ease-in;
    opacity: ${props => props.display};
    
`

const StyledIcon2 = styled.img`
    width: 1.2rem;
    cursor: pointer;
    color: #19E5BE;
`

const Count = styled.div`
    font-size: 1.2rem;
    font-weight: 300;
    color: #19E5BE;
    
`