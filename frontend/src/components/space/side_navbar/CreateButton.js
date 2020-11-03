import React from 'react';

//styles
import styled from 'styled-components';
import { SECONDARY_COLOR } from '../../../styles/colors';

//router
import history from '../../../history';

//icons
import { RiPencilLine } from 'react-icons/ri';
import { FiPlus } from 'react-icons/fi';

//button to create a new document
class CreateButton extends React.Component {
    constructor(props){
        super(props);
    }

    render(){
        return(
            <>
                <NavbarIcon onClick = {() => history.push(`?create_document=true`)} >
                    <FiPlus/>
                </NavbarIcon>
            </>
        )
    }
}


export default CreateButton;


const NavbarIcon = styled.div`
    border: 1px solid ${SECONDARY_COLOR};
    height: 4rem;
    width: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.7rem;
    cursor: pointer;
    font-size: 1.8rem;
    color: white;
    margin-left: 2.5rem;
    margin-bottom: 3rem;
    &:hover {
        background-color:#293142;
    }
    transition: background-color 0.1s ease-in;
`

/*
const NavbarIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 5.5rem;
    width: 100%;
    font-size: 2.1rem;
    font-weight: 500;
    background-color:${props => props.active ? '#464c5d' : '#3b404f'};
    cursor: pointer;
    &:hover {
        background-color:#464c5d;
    }
    transition: background-color 0.1s ease-in;
    border-bottom: 1px solid #4f5569;
    border-radius: 0.3rem;
    margin-bottom: 2.5rem;
    color: white;
`*/