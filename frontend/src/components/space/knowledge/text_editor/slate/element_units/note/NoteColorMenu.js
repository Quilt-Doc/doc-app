import React, { Component } from 'react';
import { RiCheckFill } from 'react-icons/ri';

//styles
import styled from 'styled-components';
import { MENU_SHADOW } from '../../../../../../../styles/shadows';

class NoteColorMenu extends Component {

    handleOptionClick = (e, color) => {
        e.preventDefault();
        e.stopPropagation();

        const { changeColor } = this.props;
        changeColor(color)
    }
    
    renderOptions = () => {
        let colors = ["#ff4757", "#ff7f50", "#ffa502", "#19e5be", "#1e90ff", "#6762df"];

        let {elementColor } = this.props;

        if (!elementColor) elementColor = "#6762df"
        return colors.map((color) => {
            return (
                <Option 
                    onMouseDown = {e => this.handleOptionClick(e, color)} 
                    color = {color}
                >
                    {elementColor === color &&
                        <RiCheckFill
                            name="checkmark"
                            style = {{
                                fontSize: "1.6rem",
                                color: "white"
                            }}
                        />
                    }
                </Option>
            )
        })
    }
    /*{this.isColorActive(color) &&  <RiCheckFill
                                name="checkmark"
                                style = {{
                                    fontSize: "1.6rem",
                                    color: "white"
                                }}
                            />}*/

    render(){
        return (
            <>
                <ColorOptions ref = {node => this.node = node}>
                    {this.renderOptions()}
                </ColorOptions>
            </>
        )
    }
}

export default NoteColorMenu;


const ColorOptions = styled.div`
    border-radius: 0.4rem;
    box-shadow: ${MENU_SHADOW};
    color: #172A4e;
    display: flex;
    padding: 1.5rem;
    z-index: 2;
    background-color: white;
    cursor: default;
`

const Option = styled.div`
    margin-right: 1rem;
    border-radius: 0.3rem;
    background-color: ${props => props.color};
    min-width: 1.7rem;
    min-height: 1.7rem;
    &:last-of-type {
        margin-right: 0rem;
    }
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
`