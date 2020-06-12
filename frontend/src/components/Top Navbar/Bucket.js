import React from 'react';


//redux
import { connect } from 'react-redux';

//styles
import styled from "styled-components";

//images
import archive_icon from '../../images/archive.svg';


class Bucket extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
           'dropdown_display': 'none'
        }
    }

    renderCount() {
        console.log("HERE BOI")
        console.log(this.props.selected)
        if (this.props.selected) {
            return String(this.props.selected.length)
        } else {
            return '0'
        }
    }

    render(){
        return (
            <Navbar_Button>
                <Styled_Icon2 src = {archive_icon}/>
                <Count>{this.renderCount()}</Count>
            </Navbar_Button>
        )
    }
    
}


const mapStateToProps = (state) => {
    return {
        selected : Object.values(state.selected)
    }
}

export default connect(mapStateToProps)(Bucket);

const Navbar_Button = styled.div`
    padding: 1.2rem 1.5rem;
   
    height: 7rem;
    width: 10rem;
    margin-left:12rem;
    font-size: 1.5rem;
    letter-spacing: 0.1rem;
    color:  #172A4E;
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
        background-color:   #F1F3F4; 
        border-radius: 4px;
    }
`

const Styled_Icon2 = styled.img`
    width: 2.5rem;
    cursor: pointer;
   
`

const Count = styled.div`
    font-size: 2.3rem;
    font-weight: bold;
    margin-top: 0.45rem;
    color: #19E5BE;
    margin-left: 1.7rem;
`